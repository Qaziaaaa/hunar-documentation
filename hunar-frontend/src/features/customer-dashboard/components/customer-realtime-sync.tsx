"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/api-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import { arrivalService } from "@/features/jobs/services/arrival-verification-service";
import { customerQuoteService } from "@/features/customer-jobs/services/customer-quote-service";
import { transformBackendOffer } from "@/features/customer-jobs/api/customer-jobs-api";

const REFRESH_EVENTS = [
  SOCKET_EVENTS.jobOfferAccepted,
  "job:offer:accepted",
  "job.offer.accepted",
  SOCKET_EVENTS.jobClosed,
  "job:closed",
  SOCKET_EVENTS.jobCancelled,
  "job:cancelled",
  "job:new",
  "job.new",
  "job:created",
  "job.created",
  "notification:new",
  "notification.new",
] as const;

const OFFER_EVENTS = [
  SOCKET_EVENTS.jobOffer,
  "job:offer",
  "job.offer",
  "offer:submitted",
  "offer.submitted",
] as const;

/**
 * Keeps the customer portal in sync with backend realtime events:
 * connects the socket on mount, handles worker arrival OTP popups,
 * repair quote approval popups, and invalidates queries on changes.
 */
export function CustomerRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!getAccessToken()) return;
    const socket = connectSocket();
    if (!socket) return;

    // Check backend on mount for any pending repair quote or arrival session
    void customerQuoteService.checkBackendPendingQuote();
    void arrivalService.checkBackendPendingArrival();

    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;
    const refresh = () => {
      if (refreshTimeout) clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(() => {
        void queryClient.invalidateQueries({ queryKey: ["customer"] });
        void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
        void queryClient.invalidateQueries({ queryKey: ["customer", "notifications"] });
      }, 250);
    };

    const handleVisitArrived = (data: any) => {
      if (data && (data.visitId || data.jobId)) {
        arrivalService.startArrivalSession({
          jobId: data.jobId,
          visitId: data.visitId,
          otp: data.otp || "",
          workerName: data.workerName || "Worker",
          workerPhone: data.workerPhone,
          customerName: data.customerName,
          customerAddress: data.customerAddress,
        });
      }
      refresh();
    };

    const handleRepairProposed = (data: any) => {
      if (data && (data.repairId || data.jobId)) {
        customerQuoteService.startQuoteSession({
          repairId: data.repairId || data.id,
          jobId: data.jobId,
          visitId: data.visitId,
          workerId: data.workerId,
          workerName: data.workerName || "Technician",
          workerPhone: data.workerPhone,
          workerAvatar: data.workerAvatar,
          jobTitle: data.jobTitle || "Service Inspection",
          jobAddress: data.jobAddress,
          description: data.description || "Repair as inspected on site",
          amount: Number(data.amount || 0),
          visitCharge: Number(data.visitCharge || 0),
          totalAmount: Number(data.totalAmount || (Number(data.visitCharge || 0) + Number(data.amount || 0))),
          status: "PROPOSED",
          createdAt: data.createdAt,
        });
      }
      refresh();
    };

    const handleOtpVerified = (data: any) => {
      if (data?.jobId) {
        arrivalService.verifyOtpSuccess({ jobId: data.jobId });
      } else {
        arrivalService.clearArrivalSession();
      }
      refresh();
    };

    const handleRepairDecision = () => {
      customerQuoteService.clearQuoteSession();
      refresh();
    };

    const handleJobStatusChanged = (data: any) => {
      if (data?.arrivalPending) {
        arrivalService.startArrivalSession({
          jobId: data.jobId,
          visitId: data.visitId,
          otp: data.otp || "",
          workerName: data.workerName || "Worker",
        });
      } else if (data?.repairQuote) {
        handleRepairProposed(data.repairQuote);
      } else if (
        data?.newStatus === "REPAIR_APPROVED" ||
        data?.newStatus === "REPAIR_DECLINED" ||
        data?.newStatus === "COMPLETED" ||
        data?.newStatus === "VISIT_COMPLETED"
      ) {
        customerQuoteService.clearQuoteSession();
        if (data?.newStatus === "VISIT_COMPLETED" || data?.newStatus === "COMPLETED") {
          arrivalService.clearArrivalSession();
        }
      }
      refresh();
    };

    const handleJobOffer = (data: any) => {
      if (!data) return;
      const jobId = data.jobId;
      const incomingOffer = data.offer;

      if (jobId && incomingOffer) {
        try {
          const transformed = transformBackendOffer(incomingOffer);

          // 1. Immediately update specific job details cache ["customer", "job", jobId]
          queryClient.setQueryData(["customer", "job", jobId], (old: any) => {
            if (!old) return old;
            const currentOffers: any[] = old.offers || [];
            if (currentOffers.some((o: any) => o.id === transformed.id)) {
              return old;
            }
            return {
              ...old,
              status: "receiving_offers",
              offerCount: (old.offerCount ?? currentOffers.length) + 1,
              offers: [transformed, ...currentOffers],
            };
          });

          // 2. Immediately update customer jobs list queries ["customer", "jobs"]
          let matchedJob = false;
          queryClient.setQueriesData({ queryKey: ["customer", "jobs"] }, (old: any) => {
            if (!old) return old;
            const patchList = (items: any[]) =>
              items.map((j: any) => {
                if (j.id === jobId) {
                  matchedJob = true;
                  const currentOffers: any[] = j.offers || [];
                  const exists = currentOffers.some((o: any) => o.id === transformed.id);
                  return {
                    ...j,
                    status: "receiving_offers",
                    offerCount: (j.offerCount ?? currentOffers.length) + (exists ? 0 : 1),
                    offers: exists ? currentOffers : [transformed, ...currentOffers],
                  };
                }
                return j;
              });

            if (Array.isArray(old)) {
              return patchList(old);
            } else if (old && Array.isArray(old.data)) {
              return { ...old, data: patchList(old.data) };
            }
            return old;
          });

          // If this job was newly posted and not yet in the cached list, refetch the customer list immediately
          if (!matchedJob) {
            void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
          }
        } catch (err) {
          console.warn("[CustomerRealtimeSync] offer cache update failed:", err);
          refresh();
          return;
        }
      } else {
        refresh();
      }

      // Refresh notification badge in background
      void queryClient.invalidateQueries({ queryKey: ["customer", "notifications"] });
    };

    for (const event of REFRESH_EVENTS) {
      socket.on(event, refresh);
    }
    for (const event of OFFER_EVENTS) {
      socket.on(event, handleJobOffer);
    }
    socket.on(SOCKET_EVENTS.jobStatusChanged, handleJobStatusChanged);
    socket.on("job:statusChanged", handleJobStatusChanged);
    socket.on("visit:arrived", handleVisitArrived);
    socket.on("visit.arrived", handleVisitArrived);
    socket.on("visit:otp:verified", handleOtpVerified);
    socket.on("visit.otp.verified", handleOtpVerified);
    socket.on("repair:proposed", handleRepairProposed);
    socket.on("repair.proposed", handleRepairProposed);
    socket.on("repair:approved", handleRepairDecision);
    socket.on("repair.approved", handleRepairDecision);
    socket.on("repair:rejected", handleRepairDecision);
    socket.on("repair.rejected", handleRepairDecision);

    return () => {
      for (const event of REFRESH_EVENTS) {
        socket.off(event, refresh);
      }
      for (const event of OFFER_EVENTS) {
        socket.off(event, handleJobOffer);
      }
      socket.off(SOCKET_EVENTS.jobStatusChanged, handleJobStatusChanged);
      socket.off("job:statusChanged", handleJobStatusChanged);
      socket.off("visit:arrived", handleVisitArrived);
      socket.off("visit.arrived", handleVisitArrived);
      socket.off("visit:otp:verified", handleOtpVerified);
      socket.off("visit.otp.verified", handleOtpVerified);
      socket.off("repair:proposed", handleRepairProposed);
      socket.off("repair.proposed", handleRepairProposed);
      socket.off("repair:approved", handleRepairDecision);
      socket.off("repair.approved", handleRepairDecision);
      socket.off("repair:rejected", handleRepairDecision);
      socket.off("repair.rejected", handleRepairDecision);
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      disconnectSocket();
    };
  }, [queryClient]);

  return null;
}
