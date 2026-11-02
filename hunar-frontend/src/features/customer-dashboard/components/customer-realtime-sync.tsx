"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/api-client";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import { arrivalService } from "@/features/jobs/services/arrival-verification-service";
import { customerQuoteService } from "@/features/customer-jobs/services/customer-quote-service";
import { customerReviewService } from "@/features/customer-jobs/services/customer-review-service";
import { transformBackendOffer } from "@/features/customer-jobs/api/customer-jobs-api";

const REFRESH_EVENTS = [
  SOCKET_EVENTS.jobOfferAccepted,
  "job:offer:accepted",
  "job.offer.accepted",
  "job:offer:rejected",
  "job:offerRejected",
  "job:offer:declined",
  "job:offerDeclined",
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

    // Check backend on mount for any pending repair quote, arrival session, or unreviewed completed job
    void customerQuoteService.checkBackendPendingQuote();
    void arrivalService.checkBackendPendingArrival();
    void customerReviewService.checkPendingCompletedJobs();

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
      if (data && (data.visitId || data.jobId || data.job?.id)) {
        arrivalService.startArrivalSession({
          jobId: data.jobId || data.job?.id,
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
      arrivalService.clearArrivalSession();
      refresh();
    };

    const handleRepairDecision = () => {
      customerQuoteService.clearQuoteSession();
      refresh();
    };

    const handleJobCancelled = (data: any) => {
      const current = arrivalService.getSession();
      if (!data?.jobId || !current?.jobId || current.jobId === data.jobId || current.visitId === data?.visitId) {
        arrivalService.clearArrivalSession();
      }
      customerQuoteService.clearQuoteSession();
      refresh();
    };

    const handleJobStatusChanged = (data: any) => {
      if (data?.arrivalPending) {
        arrivalService.startArrivalSession({
          jobId: data.jobId || data.job?.id,
          visitId: data.visitId,
          otp: data.otp || "",
          workerName: data.workerName || "Worker",
        });
      } else if (data?.repairQuote) {
        handleRepairProposed(data.repairQuote);
      } else if (
        data?.newStatus === "REPAIR_APPROVED" ||
        data?.newStatus === "REPAIR_DECLINED" ||
        data?.newStatus === "REPAIR_NEGOTIATING" ||
        data?.newStatus === "INSPECTION_DONE" ||
        data?.newStatus === "IN_PROGRESS" ||
        data?.newStatus === "COMPLETED" ||
        data?.newStatus === "VISIT_COMPLETED" ||
        data?.newStatus === "CANCELLED"
      ) {
        customerQuoteService.clearQuoteSession();
        arrivalService.clearArrivalSession();
      }

      // Worker completed the job -> prompt customer review popup
      const normStatus = String(data?.newStatus || data?.status || "").toUpperCase();
      if (normStatus === "COMPLETED") {
        const targetJobId = data?.jobId || data?.id || data?.job?.id;
        if (targetJobId) {
          void customerReviewService.promptReviewByJobId(targetJobId, { force: true });
        }
      }

      refresh();
    };

    const handleJobCompleted = (data: any) => {
      const targetJobId = data?.jobId || data?.id || data?.job?.id;
      if (targetJobId) {
        customerQuoteService.clearQuoteSession();
        arrivalService.clearArrivalSession();
        void customerReviewService.promptReviewByJobId(targetJobId, { force: true });
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
          transformed.isDeclined = false;

          // 1. Immediately update specific job details cache ["customer", "job", jobId]
          queryClient.setQueryData(["customer", "job", jobId], (old: any) => {
            if (!old) return old;
            const currentOffers: any[] = old.offers || [];
            const exists = currentOffers.some(
              (o: any) => o.id === transformed.id || (o.worker?.id && o.worker.id === transformed.worker?.id)
            );
            const nextOffers = exists
              ? currentOffers.map((o: any) =>
                  o.id === transformed.id || (o.worker?.id && o.worker.id === transformed.worker?.id)
                    ? { ...transformed, isDeclined: false }
                    : o
                )
              : [transformed, ...currentOffers];
            return {
              ...old,
              status: "receiving_offers",
              offerCount: exists ? (old.offerCount ?? currentOffers.length) : (old.offerCount ?? currentOffers.length) + 1,
              offers: nextOffers,
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
                  const exists = currentOffers.some(
                    (o: any) => o.id === transformed.id || (o.worker?.id && o.worker.id === transformed.worker?.id)
                  );
                  const nextOffers = exists
                    ? currentOffers.map((o: any) =>
                        o.id === transformed.id || (o.worker?.id && o.worker.id === transformed.worker?.id)
                          ? { ...transformed, isDeclined: false }
                          : o
                      )
                    : [transformed, ...currentOffers];
                  return {
                    ...j,
                    status: "receiving_offers",
                    offerCount: exists ? (j.offerCount ?? currentOffers.length) : (j.offerCount ?? currentOffers.length) + 1,
                    offers: nextOffers,
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

          // Invalidate to ensure background query consistency
          refresh();
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
    socket.on("job:status:changed", handleJobStatusChanged);
    socket.on("job:completed", handleJobCompleted);
    socket.on("job.completed", handleJobCompleted);
    socket.on("job:cancelled", handleJobCancelled);
    socket.on("job.cancelled", handleJobCancelled);
    socket.on("visit:cancelled", handleJobCancelled);
    socket.on("visit.cancelled", handleJobCancelled);
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
      socket.off("job:status:changed", handleJobStatusChanged);
      socket.off("job:completed", handleJobCompleted);
      socket.off("job.completed", handleJobCompleted);
      socket.off("job:cancelled", handleJobCancelled);
      socket.off("job.cancelled", handleJobCancelled);
      socket.off("visit:cancelled", handleJobCancelled);
      socket.off("visit.cancelled", handleJobCancelled);
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
