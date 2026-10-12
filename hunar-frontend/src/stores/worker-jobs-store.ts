"use client";

import { useEffect, useState } from "react";
import { JobRequest, JobFeedFilters } from "@/types/job";
import { VisitOffer, CounterHistoryItem } from "@/types/offer";
import { InspectionReport } from "@/types/inspection";
import { getSocket } from "@/lib/socket";
import { mapJobToRequest } from "@/stores/worker-jobs-adapter";
import { listNearbyJobs, listWorkerJobs, listWorkerHistoryJobs } from "@/services/worker/jobs.service";
import {
  listMyOffers,
  submitWorkerOffer,
  sendWorkerCounterOffer,
} from "@/services/worker/offers.service";
import {
  startRepair as startRepairApi,
  completeRepair as completeRepairApi,
  listMyRepairs,
} from "@/services/worker/repair.service";
import { cancelWorkerJob } from "@/services/worker/cancellation.service";
import { getWalletSummary } from "@/services/worker/earnings.service";
import { getWorkerProfile } from "@/services/worker/profile.service";
import { http, getStoredUser } from "@/lib/api-client";
import { parseDurationToMinutes } from "@/lib/duration";
import { getMaxNegotiationRounds } from "@/lib/negotiation";

export interface WorkerState {
  jobs: JobRequest[];
  offers: Record<string, VisitOffer>; // jobId -> VisitOffer
  inspectionReports: Record<string, InspectionReport>; // jobId -> InspectionReport
  filters: JobFeedFilters;
  workerOnline: boolean;
  walletBalance: number; // PKR (Rs.)
  walletHold: number; // Commission hold
  workerSkills: string[];
  workerArea: string;
  hydrated: boolean;
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
}

let socketListenersInitialized = false;

function initWorkerSocketListeners() {
  if (socketListenersInitialized) return;
  const socket = getSocket();
  if (!socket) return;
  socketListenersInitialized = true;

  const handleStatusChanged = (data: any) => {
    if (!data?.jobId) return;
    const jobId = data.jobId;
    const newStatus = data.newStatus;

    if (newStatus === "REPAIR_APPROVED") {
      patch({
        jobs: globalState.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "repair_approved" as const,
                repairCharge: data.repair?.lockedAmount ?? j.repairCharge,
              }
            : j
        ),
      });
    } else if (newStatus === "REPAIR_DECLINED" || newStatus === "REPAIR_REJECTED") {
      patch({
        jobs: globalState.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: "repair_declined" as const,
                repairCharge: 0,
              }
            : j
        ),
      });
    } else if (newStatus === "VISIT_COMPLETED") {
      patch({
        jobs: globalState.jobs.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status:
                  j.status === "inspecting" ||
                  j.status === "inspection_submitted" ||
                  j.status.startsWith("repair_") ||
                  j.status === "completed"
                    ? j.status
                    : ("inspecting" as const),
              }
            : j
        ),
      });
    }
  };

  const handleRepairApproved = (data: any) => {
    if (!data?.jobId) return;
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === data.jobId
          ? {
              ...j,
              status: "repair_approved" as const,
              repairCharge: data.lockedAmount ?? j.repairCharge,
            }
          : j
      ),
    });
  };

  const handleRepairRejected = (data: any) => {
    if (!data?.jobId) return;
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === data.jobId
          ? {
              ...j,
              status: "repair_declined" as const,
              repairCharge: 0,
            }
          : j
      ),
    });
  };

  const handleBalanceUpdated = (data: any) => {
    if (data && typeof data.balance === "number") {
      patch({
        walletBalance: data.balance,
        walletHold: typeof data.heldBalance === "number" ? data.heldBalance : globalState.walletHold,
      });
    }
  };

  socket.on("job:statusChanged", handleStatusChanged);
  socket.on("job:status:changed", handleStatusChanged);
  socket.on("repair:approved", handleRepairApproved);
  socket.on("repair.approved", handleRepairApproved);
  socket.on("repair:rejected", handleRepairRejected);
  socket.on("repair.rejected", handleRepairRejected);
  socket.on("wallet:balanceUpdated", handleBalanceUpdated);
  socket.on("wallet:balance:updated", handleBalanceUpdated);
}

const defaultFilters: JobFeedFilters = {
  category: "all",
  maxDistanceKm: 15,
  area: "all",
  sortBy: "fresh_first",
  onlyWithoutOffers: false,
  hideFarJobs: false,
};

let globalState: WorkerState = {
  jobs: [],
  offers: {},
  inspectionReports: {},
  filters: defaultFilters,
  workerOnline: true,
  walletBalance: 0,
  walletHold: 0,
  workerSkills: [],
  workerArea: "",
  hydrated: false,
  status: "idle",
  error: null,
};

const visitIdByJob = new Map<string, string>();
const repairIdByJob = new Map<string, string>();

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function patch(state: Partial<WorkerState>) {
  globalState = { ...globalState, ...state };
  notify();
}

export const workerStore = {
  getState() {
    return globalState;
  },

  async hydrate(options: { force?: boolean } = {}) {
    if (globalState.hydrated && !options.force) {
      return;
    }
    patch({ status: "loading", error: null });
    try {
      const settled = await Promise.allSettled([
        listNearbyJobs(),
        listWorkerJobs(),
        listWorkerHistoryJobs(),
        listMyOffers(),
        getWalletSummary(),
        getWorkerProfile(),
      ]);

      const [nearbyRes, activeRes, historyRes, offersRes, walletRes, profileRes] =
        settled;
      // Only the job-side calls gate the feed; wallet/profile failures are
      // best-effort here (their dedicated pages surface their own errors).
      const rejection = [nearbyRes, activeRes, historyRes, offersRes].find(
        (r) => r.status === "rejected"
      ) as PromiseRejectedResult | undefined;

      const nearby = nearbyRes.status === "fulfilled" ? nearbyRes.value : [];
      const active = activeRes.status === "fulfilled" ? activeRes.value : [];
      const history = historyRes.status === "fulfilled" ? historyRes.value : [];
      const offers = offersRes.status === "fulfilled" ? offersRes.value : [];
      const wallet = walletRes.status === "fulfilled" ? walletRes.value : null;
      const profile = profileRes.status === "fulfilled" ? profileRes.value : null;

      const seen = new Set<string>();
      const jobs: JobRequest[] = [];
      for (const job of [...nearby, ...active, ...history]) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);
        if ((job as any).nextVisit?.id) {
          visitIdByJob.set(job.id, (job as any).nextVisit.id);
        }
        jobs.push(mapJobToRequest(job));
      }

      const offersMap: Record<string, VisitOffer> = {};
      for (const offer of offers) {
        offersMap[offer.jobId] = offer;
        if (offer.jobId && !visitIdByJob.get(offer.jobId)) {
          visitIdByJob.set(offer.jobId, (offer as any).visitId || "");
        }
      }

      const workerSkills = profile?.skills ?? [];
      const workerArea = profile?.serviceAreas?.[0] ?? globalState.workerArea;

      patch({
        jobs,
        offers: offersMap,
        walletBalance: wallet ? Math.max(wallet.currentBalance, 0) : globalState.walletBalance,
        walletHold: wallet ? Math.max(wallet.totalDeductions, 0) : globalState.walletHold,
        workerSkills,
        workerArea,
        hydrated: true,
        status: rejection ? "error" : "ready",
        error: rejection
          ? rejection.reason instanceof Error && rejection.reason.message
            ? rejection.reason.message
            : "Could not load your jobs. Please try again."
          : null,
      });

      await this.backfillResourceIds();
      initWorkerSocketListeners();
    } catch (err) {
      console.error("[workerStore] hydrate failed:", err);
      patch({
        hydrated: true,
        status: "error",
        error:
          err instanceof Error && err.message
            ? err.message
            : "Could not load your jobs. Please try again.",
      });
    }
  },

  async backfillResourceIds() {
    try {
      const repairs = await listMyRepairs({ limit: 100 }).catch(() => []);
      const repairList = Array.isArray(repairs) ? repairs : [];
      for (const r of repairList) {
        repairIdByJob.set(r.jobId, r.id);
        if (r.visitId) visitIdByJob.set(r.jobId, r.visitId);
      }
      for (const job of globalState.jobs) {
        if (!visitIdByJob.has(job.id)) {
          try {
            const detail = await http.get<{
              id: string;
              visits?: { id: string }[];
            }>(`/jobs/${job.id}`).catch(() => null);
            if (detail?.visits?.[0]) {
              visitIdByJob.set(job.id, detail.visits[0].id);
            }
          } catch {
            // no visit yet for this job
          }
        }
      }
    } catch (err) {
      console.error("[workerStore] backfill resource ids failed:", err);
    }
  },

  setFilter(update: Partial<JobFeedFilters>) {
    patch({
      filters: { ...globalState.filters, ...update },
    });
  },

  resetFilters() {
    patch({ filters: defaultFilters });
  },

  toggleOnline() {
    patch({ workerOnline: !globalState.workerOnline });
  },

  setWalletBalance(amount: number) {
    patch({ walletBalance: amount });
  },

  // Task 4 & Rule: One offer per job
  sendVisitOffer(jobId: string, visitCharge: number, message?: string): { success: boolean; error?: string } {
    if (globalState.offers[jobId]) {
      return {
        success: false,
        error: "You have already sent an offer for this job. Only ONE offer per job is permitted.",
      };
    }

    const commission = Math.round(visitCharge * 0.1); // 10% platform commission
    const net = visitCharge - commission;

    const user = getStoredUser();
    const workerId = user?.id || "worker-me";
    const workerName = user?.name || "Technician";

    const newOffer: VisitOffer = {
      id: `off-${Date.now()}`,
      jobId,
      workerId,
      workerName,
      visitCharge,
      platformCommission: commission,
      workerNetEarnings: net,
      message,
      status: "sent",
      createdAt: new Date().toISOString(),
      currentRound: 1,
      maxRounds: getMaxNegotiationRounds(),
      counterHistory: [
        {
          round: 1,
          sender: "worker",
          amount: visitCharge,
          message: message ?? "Visit offer submitted.",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    patch({
      offers: { ...globalState.offers, [jobId]: newOffer },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "offer_sent" as const, totalOffers: j.totalOffers + 1 } : j
      ),
    });

    submitWorkerOffer(jobId, visitCharge, message)
      .then((serverOffer) => {
        patch({
          offers: { ...globalState.offers, [jobId]: serverOffer },
        });
      })
      .catch((err) => {
        console.error("[workerStore] send offer failed:", err);
      });

    const s = getSocket();
    s?.emit("job:offer:submit", { jobId, visitCharge, message });

    return { success: true };
  },

  // Task 6: Accept customer's counter offer
  acceptCounterOffer(jobId: string): boolean {
    const offer = globalState.offers[jobId];
    if (!offer || !offer.customerCounterAmount) return false;

    const agreedPrice = offer.customerCounterAmount;
    const commission = Math.round(agreedPrice * 0.1);
    const net = agreedPrice - commission;

    const updatedOffer: VisitOffer = {
      ...offer,
      visitCharge: agreedPrice,
      platformCommission: commission,
      workerNetEarnings: net,
      agreedVisitCharge: agreedPrice,
      status: "accepted",
      counterHistory: [
        ...offer.counterHistory,
        {
          round: offer.currentRound,
          sender: "worker",
          amount: agreedPrice,
          message: `Agreed to customer counter offer of Rs. ${agreedPrice}. Price locked.`,
          createdAt: new Date().toISOString(),
        },
      ],
    };

    patch({
      offers: { ...globalState.offers, [jobId]: updatedOffer },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "accepted" as const } : j
      ),
    });

    sendWorkerCounterOffer(jobId, offer.id, agreedPrice, `Agreed to ${agreedPrice}`)
      .catch((err) => console.error("[workerStore] accept counter failed:", err));

    return true;
  },

  // Task 6: Send worker counter-offer (Bounded Rounds: max 3)
  sendWorkerCounter(jobId: string, counterAmount: number, message?: string): { success: boolean; error?: string } {
    const offer = globalState.offers[jobId];
    if (!offer) return { success: false, error: "Offer not found" };

    if (offer.currentRound >= offer.maxRounds) {
      return {
        success: false,
        error: `Maximum negotiation rounds (${offer.maxRounds}) reached. No further counters allowed.`,
      };
    }

    const nextRound = offer.currentRound + 1;
    const commission = Math.round(counterAmount * 0.1);
    const net = counterAmount - commission;

    const updatedHistory: CounterHistoryItem[] = [
      ...offer.counterHistory,
      {
        round: nextRound,
        sender: "worker",
        amount: counterAmount,
        message: message ?? `Worker countered with Rs. ${counterAmount}`,
        createdAt: new Date().toISOString(),
      },
    ];

    const updatedOffer: VisitOffer = {
      ...offer,
      visitCharge: counterAmount,
      platformCommission: commission,
      workerNetEarnings: net,
      currentRound: nextRound,
      status: "sent",
      counterHistory: updatedHistory,
      customerCounterAmount: undefined,
      customerCounterMessage: undefined,
    };

    patch({
      offers: { ...globalState.offers, [jobId]: updatedOffer },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "offer_sent" as const } : j
      ),
    });

    sendWorkerCounterOffer(jobId, offer.id, counterAmount, message)
      .catch((err) => console.error("[workerStore] counter offer failed:", err));

    return { success: true };
  },

  // Task 8a: Start Visit -> visit_in_progress
  startVisit(jobId: string) {
    const current = globalState.jobs.find((j) => j.id === jobId);
    if (current && current.status === "visit_in_progress") {
      return;
    }
    const visitId = visitIdByJob.get(jobId);
    const url = visitId ? `/visits/${visitId}/start` : `/jobs/${jobId}/start`;
    http.put(url).catch((err) => {
      console.error("[workerStore] start visit failed:", err);
    });
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "visit_in_progress" as const } : j
      ),
    });
  },

  // Task 8b: Arrival Doorstep action -> generates real OTP & notifies customer
  async arriveAtDoorstep(jobId: string): Promise<{
    success: boolean;
    otp?: string;
    visitId?: string;
    arrivedAt?: number;
    error?: string;
  }> {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const visitCharge =
      (job as any)?.agreedVisitCharge ??
      job?.visitCharge ??
      (job as any)?.lockedVisitCharge ??
      job?.customerSuggestedPrice ??
      (job as any)?.suggestedVisitCharge ??
      0;
    const requiredHold = Math.round(visitCharge * 0.1);

    if (globalState.walletBalance < requiredHold) {
      return {
        success: false,
        error: `Insufficient wallet balance. Minimum Rs. ${requiredHold} commission hold required.`,
      };
    }

    try {
      const visitId = visitIdByJob.get(jobId);
      const url = visitId ? `/visits/${visitId}/arrived` : `/jobs/${jobId}/arrived`;
      let res;
      try {
        res = await http.put<{
          success: boolean;
          otp: string;
          visitId: string;
          jobId: string;
          arrivedAt: number;
        }>(url);
      } catch (firstErr: any) {
        // Fallback to /visits/:id/arrived with jobId
        const fallbackUrl = url.startsWith('/jobs')
          ? `/visits/${jobId}/arrived`
          : `/jobs/${jobId}/arrived`;
        res = await http.put<{
          success: boolean;
          otp: string;
          visitId: string;
          jobId: string;
          arrivedAt: number;
        }>(fallbackUrl);
      }

      const otp = (res as any)?.otp || (res as any)?.data?.otp;
      const visitIdRet = (res as any)?.visitId || (res as any)?.data?.visitId;
      const arrivedAtRet = (res as any)?.arrivedAt || (res as any)?.data?.arrivedAt || Date.now();
      const isSuccess = (res as any)?.success ?? Boolean(otp);

      if (otp || isSuccess) {
        if (visitIdRet) {
          visitIdByJob.set(jobId, visitIdRet);
        }
        patch({
          walletHold: globalState.walletHold + requiredHold,
          jobs: globalState.jobs.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  status:
                    j.status === "visit_completed" ||
                    j.status === "inspecting" ||
                    j.status === "inspection_submitted" ||
                    j.status.startsWith("repair_") ||
                    j.status === "completed"
                      ? j.status
                      : ("visit_in_progress" as const),
                  arrivedAt: arrivedAtRet,
                  activeArrivalOtp: otp,
                }
              : j
          ),
        });
        return {
          success: true,
          otp,
          visitId: visitIdRet,
          arrivedAt: arrivedAtRet,
        };
      }
      return { success: false, error: "No OTP received from backend" };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Arrival request failed";
      return { success: false, error: msg };
    }
  },

  // Task 8b: I've Arrived -> visit_completed
  arriveAtSite(jobId: string): { success: boolean; error?: string; requiredHold?: number } {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const visitCharge =
      (job as any)?.agreedVisitCharge ??
      job?.visitCharge ??
      (job as any)?.lockedVisitCharge ??
      job?.customerSuggestedPrice ??
      (job as any)?.suggestedVisitCharge ??
      0;
    const requiredHold = Math.round(visitCharge * 0.1); // 10% platform commission

    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status:
                j.status === "inspecting" ||
                j.status === "inspection_submitted" ||
                j.status.startsWith("repair_") ||
                j.status === "completed"
                  ? j.status
                  : ("visit_completed" as const),
            }
          : j
      ),
    });
    return { success: true, requiredHold };
  },

  // Task 8c: Start Inspection -> inspecting
  startInspection(jobId: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "inspecting" as const } : j
      ),
    });
  },

  // Task 8d: Submit Inspection -> 5 required fields
  submitInspection(
    jobId: string,
    report: Omit<InspectionReport, "jobId" | "submittedAt">
  ): { success: boolean; error?: string } {
    if (!report.diagnosis?.trim()) {
      return { success: false, error: "Diagnosis is required." };
    }
    if (!report.repairPlan?.trim()) {
      return { success: false, error: "Repair plan is required." };
    }
    if (!report.repairPriceEstimate || report.repairPriceEstimate <= 0) {
      return { success: false, error: "A valid repair price estimate (Rs.) is required." };
    }
    if (!report.photos || report.photos.length === 0) {
      return { success: false, error: "At least one inspection photo is required as evidence." };
    }
    if (!report.estimatedRepairTime?.trim()) {
      return { success: false, error: "Estimated repair time is required." };
    }

    const fullReport: InspectionReport = {
      jobId,
      ...report,
      submittedAt: new Date().toISOString(),
    };

    patch({
      inspectionReports: { ...globalState.inspectionReports, [jobId]: fullReport },
      jobs: globalState.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "inspection_submitted" as const,
              repairCharge: report.repairPriceEstimate,
            }
          : j
      ),
    });

    const getOrFetchVisitId = async () => {
      const vId = visitIdByJob.get(jobId);
      if (vId) return vId;
      const detail = await http.get<{ id: string; visits?: { id: string }[] }>(`/jobs/${jobId}`).catch(() => null);
      const fetchedId = detail?.visits?.[0]?.id;
      if (fetchedId) {
        visitIdByJob.set(jobId, fetchedId);
      }
      return fetchedId;
    };

    getOrFetchVisitId().then(async (vId) => {
      const targetId = vId || jobId;
      try {
        await http.put(`/visits/${targetId}/inspection`, {
          diagnosis: report.diagnosis,
          repairPlan: report.repairPlan,
          repairEstimate: report.repairPriceEstimate,
          inspectionPhotos: report.photos,
          estimatedRepairTimeMin: parseDurationToMinutes(report.estimatedRepairTime),
        });

        const repair = await http.post(`/visits/${targetId}/estimate`, {
          description: report.diagnosis,
          amount: report.repairPriceEstimate,
          itemsBreakdown: { plan: report.repairPlan },
        }).catch((err) => {
          console.warn("[workerStore] create repair estimate:", err);
          return null;
        });

        const r = repair as { id?: string; jobId?: string; amount?: number } | null;
        if (r?.id && r?.jobId) {
          repairIdByJob.set(r.jobId, r.id);
          if (vId) {
            visitIdByJob.set(r.jobId, vId);
          }
          patch({
            jobs: globalState.jobs.map((j) =>
              j.id === jobId
                ? {
                    ...j,
                    status: "repair_negotiating" as const,
                    repairCharge: report.repairPriceEstimate,
                  }
                : j
            ),
          });
        }
      } catch (err) {
        console.error("[workerStore] submit inspection failed:", err);
      }
    });

    return { success: true };
  },

  // Cancel Job (Active pre-visit)
  cancelJob(jobId: string, reason: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "cancelled" as const } : j
      ),
    });

    cancelWorkerJob({ jobId, reason: "other", note: reason, stage: "before_visit" }).catch((err) => {
      console.error("[workerStore] cancel job failed:", err);
    });
  },

  // Simulation: Another worker assigned (Real-time Socket.IO trigger)
  simulateClosedAssigned(jobId: string) {
    const offer = globalState.offers[jobId];
    if (offer) {
      patch({
        offers: { ...globalState.offers, [jobId]: { ...offer, status: "closed_assigned" } },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "closed_assigned" as const } : j
        ),
      });
    }
  },

  // Simulation: Customer viewing offer
  simulateCustomerViewing(jobId: string) {
    const offer = globalState.offers[jobId];
    if (offer && offer.status === "sent") {
      patch({
        offers: { ...globalState.offers, [jobId]: { ...offer, status: "viewing" } },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "customer_viewing" as const } : j
        ),
      });
    }
  },

  // Simulation: Customer sent counter
  simulateCustomerCounter(jobId: string, counterAmount: number, message: string) {
    const offer = globalState.offers[jobId];
    if (offer) {
      const nextRound = offer.currentRound + 1;
      const updatedHistory: CounterHistoryItem[] = [
        ...offer.counterHistory,
        {
          round: nextRound,
          sender: "customer",
          amount: counterAmount,
          message,
          createdAt: new Date().toISOString(),
        },
      ];

      patch({
        offers: {
          ...globalState.offers,
          [jobId]: {
            ...offer,
            currentRound: nextRound,
            status: "counter_received",
            customerCounterAmount: counterAmount,
            customerCounterMessage: message,
            counterHistory: updatedHistory,
          },
        },
        jobs: globalState.jobs.map((j) =>
          j.id === jobId ? { ...j, status: "counter_received" as const } : j
        ),
      });
    }
  },

  approveRepair(jobId: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "repair_approved" as const } : j
      ),
    });
  },

  declineRepair(jobId: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "repair_declined" as const } : j
      ),
    });
  },

  startRepair(jobId: string) {
    const repairId = repairIdByJob.get(jobId);
    if (repairId) {
      startRepairApi(repairId).catch((err) => {
        console.error("[workerStore] start repair failed:", err);
      });
    }
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "repair_in_progress" as const } : j
      ),
    });
  },

  completeJob(jobId: string, repairCharge: number = 0) {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const offer = globalState.offers[jobId];
    const visitFee = offer?.agreedVisitCharge ?? offer?.visitCharge ?? job?.visitCharge ?? (job as any)?.suggestedVisitCharge ?? 0;
    const isDeclined = job?.status === "repair_declined" || repairCharge === 0;
    const finalRepairCharge = isDeclined ? 0 : Math.max(0, repairCharge);
    const gross = visitFee + finalRepairCharge;
    const commission = Math.round(visitFee * 0.1); // 10% of Visit Fee only
    const net = gross - commission;

    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "completed" as const,
              repairCharge: finalRepairCharge,
              visitCharge: visitFee,
              platformCommission: commission,
              workerNetEarnings: net,
              completedAt: new Date().toISOString(),
              invoiceNumber: `INV-${jobId}`,
              warrantyDays: isDeclined ? 0 : (j.warrantyDays ?? 5),
            }
          : j
      ),
    });

    // 1. Call backend API to mark job COMPLETED and credit earnings
    http.put(`/jobs/${jobId}/complete`).then(() => {
      // Refresh wallet summary to get real backend balance
      void getWalletSummary().then((summary) => {
        if (summary) {
          patch({
            walletBalance: summary.currentBalance,
            walletHold: summary.totalDeductions,
          });
        }
      });
    }).catch((err) => {
      console.error("[workerStore] complete job failed:", err);
    });

    // 2. Complete active repair if repair was registered and accepted
    const repairId = repairIdByJob.get(jobId);
    if (repairId && finalRepairCharge > 0) {
      startRepairApi(repairId)
        .catch(() => {})
        .finally(() => {
          completeRepairApi(repairId).catch((err) => {
            console.error("[workerStore] complete repair failed:", err);
          });
        });
    }
  },

  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

// React Hook for consuming the store
export function useWorkerJobs() {
  const [state, setState] = useState<WorkerState>(workerStore.getState());

  useEffect(() => {
    workerStore.hydrate();
    return workerStore.subscribe(() => {
      setState(workerStore.getState());
    });
  }, []);

  return state;
}