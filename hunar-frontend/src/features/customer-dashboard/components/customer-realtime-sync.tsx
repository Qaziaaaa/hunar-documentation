"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import { connectSocket, disconnectSocket } from "@/lib/socket";
import { SOCKET_EVENTS } from "@/lib/socket-events";
import { arrivalService } from "@/features/jobs/services/arrival-verification-service";
import { customerQuoteService } from "@/features/customer-jobs/services/customer-quote-service";

const REFRESH_EVENTS = [
  SOCKET_EVENTS.jobOffer,
  SOCKET_EVENTS.jobOfferAccepted,
  SOCKET_EVENTS.jobStatusChanged,
  SOCKET_EVENTS.jobClosed,
  SOCKET_EVENTS.jobCancelled,
] as const;

/**
 * Keeps the customer portal in sync with backend realtime events:
 * connects the socket on mount, handles worker arrival OTP popups,
 * repair quote approval popups, and invalidates queries on changes.
 */
export function CustomerRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isMockMode() || !getAccessToken()) return;
    const socket = connectSocket();
    if (!socket) return;

    // Check backend on mount for any pending repair quote
    void customerQuoteService.checkBackendPendingQuote();

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["customer"] });
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
          visitCharge: Number(data.visitCharge || 300),
          totalAmount: Number(data.totalAmount || (Number(data.visitCharge || 300) + Number(data.amount || 0))),
          status: "PROPOSED",
          createdAt: data.createdAt,
        });
      }
      refresh();
    };

    const handleRepairDecided = () => {
      customerQuoteService.clearQuoteSession();
      refresh();
    };

    const handleJobStatusChanged = (data: any) => {
      if (data?.repairQuote) {
        handleRepairProposed(data.repairQuote);
      } else if (data?.newStatus === "REPAIR_APPROVED" || data?.newStatus === "REPAIR_DECLINED" || data?.newStatus === "COMPLETED") {
        customerQuoteService.clearQuoteSession();
      }
      refresh();
    };

    for (const event of REFRESH_EVENTS) {
      socket.on(event, refresh);
    }
    socket.on(SOCKET_EVENTS.jobStatusChanged, handleJobStatusChanged);
    socket.on("job:statusChanged", handleJobStatusChanged);
    socket.on("visit:arrived", handleVisitArrived);
    socket.on("visit.arrived", handleVisitArrived);
    socket.on("repair:proposed", handleRepairProposed);
    socket.on("repair.proposed", handleRepairProposed);
    socket.on("repair:approved", handleRepairDecided);
    socket.on("repair.approved", handleRepairDecided);
    socket.on("repair:rejected", handleRepairDecided);
    socket.on("repair.rejected", handleRepairDecided);

    return () => {
      for (const event of REFRESH_EVENTS) {
        socket.off(event, refresh);
      }
      socket.off(SOCKET_EVENTS.jobStatusChanged, handleJobStatusChanged);
      socket.off("job:statusChanged", handleJobStatusChanged);
      socket.off("visit:arrived", handleVisitArrived);
      socket.off("visit.arrived", handleVisitArrived);
      socket.off("repair:proposed", handleRepairProposed);
      socket.off("repair.proposed", handleRepairProposed);
      socket.off("repair:approved", handleRepairDecided);
      socket.off("repair.approved", handleRepairDecided);
      socket.off("repair:rejected", handleRepairDecided);
      socket.off("repair.rejected", handleRepairDecided);
      disconnectSocket();
    };
  }, [queryClient]);

  return null;
}
