"use client";

import { useEffect, useState } from "react";
import { JobRequest, JobFeedFilters } from "@/types/job";
import { VisitOffer, CounterHistoryItem } from "@/types/offer";
import { InspectionReport } from "@/types/inspection";
import { getSocket } from "@/lib/socket";
import { mapJobToRequest } from "@/stores/worker-jobs-adapter";
import { listNearbyJobs, listWorkerJobs } from "@/services/worker/jobs.service";
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
import { http } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import type { Job } from "@/types/job";

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
}

const defaultFilters: JobFeedFilters = {
  category: "all",
  maxDistanceKm: 15,
  area: "Peshawar",
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
  workerArea: "Peshawar Urban Sector",
  hydrated: false,
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

  async hydrate() {
    if (globalState.hydrated) {
      return;
    }
    try {
      const [nearby, active, offers, wallet, profile] = await Promise.all([
        listNearbyJobs().catch(() => [] as Job[]),
        listWorkerJobs().catch(() => [] as Job[]),
        listMyOffers().catch(() => [] as VisitOffer[]),
        getWalletSummary().catch(() => null),
        getWorkerProfile().catch(() => null),
      ]);

      const seen = new Set<string>();
      const jobs: JobRequest[] = [];
      for (const job of [...nearby, ...active]) {
        if (seen.has(job.id)) continue;
        seen.add(job.id);
        jobs.push(mapJobToRequest(job));
      }

      const offersMap: Record<string, VisitOffer> = {};
      for (const offer of offers) {
        offersMap[offer.jobId] = offer;
        if (offer.jobId) visitIdByJob.set(offer.jobId, "");
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
      });

      await this.backfillResourceIds();
    } catch (err) {
      console.error("[workerStore] hydrate failed:", err);
      patch({ hydrated: true });
    }
  },

  async backfillResourceIds() {
    try {
      const repairs = await listMyRepairs({ limit: 100 }).catch(() => []);
      for (const r of repairs) {
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

    const newOffer: VisitOffer = {
      id: `off-${Date.now()}`,
      jobId,
      workerId: "worker-me",
      workerName: "Me",
      visitCharge,
      platformCommission: commission,
      workerNetEarnings: net,
      message,
      status: "sent",
      createdAt: new Date().toISOString(),
      currentRound: 1,
      maxRounds: 3,
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
    const visitId = visitIdByJob.get(jobId);
    if (visitId && !isMockMode()) {
      http.put(`/visits/${visitId}/start`).catch((err) => {
        console.error("[workerStore] start visit failed:", err);
      });
    }
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "visit_in_progress" as const } : j
      ),
    });
  },

  // Task 8b: I've Arrived -> visit_completed
  arriveAtSite(jobId: string): { success: boolean; error?: string; requiredHold?: number } {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const offer = globalState.offers[jobId];
    const visitCharge = offer?.agreedVisitCharge ?? offer?.visitCharge ?? job?.customerSuggestedPrice ?? 500;
    const requiredHold = Math.round(visitCharge * 0.1); // 10% platform commission

    // Check wallet balance
    if (globalState.walletBalance < requiredHold) {
      return {
        success: false,
        error: "Insufficient wallet balance. Please top up before arriving.",
        requiredHold,
      };
    }

    const visitId = visitIdByJob.get(jobId);
    if (visitId && !isMockMode()) {
      http.put(`/visits/${visitId}/arrived`).catch((err) => {
        console.error("[workerStore] arrive failed:", err);
      });
    }

    patch({
      walletHold: globalState.walletHold + requiredHold,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "visit_completed" as const } : j
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
        j.id === jobId ? { ...j, status: "inspection_submitted" as const } : j
      ),
    });

    const visitId = visitIdByJob.get(jobId);
    if (visitId && !isMockMode()) {
      http
        .put(`/visits/${visitId}/inspection`, {
          diagnosis: report.diagnosis,
          repairPlan: report.repairPlan,
          repairEstimate: report.repairPriceEstimate,
          inspectionPhotos: report.photos,
          estimatedRepairTimeMin: 60,
        })
        .catch((err) => {
          console.error("[workerStore] submit inspection failed:", err);
        });
      http
        .post(`/visits/${visitId}/estimate`, {
          description: report.diagnosis,
          amount: report.repairPriceEstimate,
          itemsBreakdown: { plan: report.repairPlan },
        })
        .then((repair) => {
          const r = repair as { id?: string; jobId?: string } | null;
          if (r?.id && r?.jobId) {
            repairIdByJob.set(r.jobId, r.id);
            visitIdByJob.set(r.jobId, visitId);
          }
        })
        .catch((err) => {
          console.error("[workerStore] create repair estimate failed:", err);
        });
    }

    return { success: true };
  },

  // Cancel Job (Active pre-visit)
  cancelJob(jobId: string, reason: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id === jobId ? { ...j, status: "cancelled" as const } : j
      ),
    });

    if (!isMockMode()) {
      cancelWorkerJob({ jobId, reason: "other", note: reason, stage: "before_visit" }).catch((err) => {
        console.error("[workerStore] cancel job failed:", err);
      });
    }
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
    if (repairId && !isMockMode()) {
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

  completeJob(jobId: string, repairCharge: number = 1500) {
    const job = globalState.jobs.find((j) => j.id === jobId);
    const offer = globalState.offers[jobId];
    const visitFee = offer?.agreedVisitCharge ?? offer?.visitCharge ?? job?.visitCharge ?? 500;
    const gross = visitFee + repairCharge;
    const commission = Math.round(gross * 0.1);
    const net = gross - commission;

    patch({
      walletBalance: globalState.walletBalance + net,
      jobs: globalState.jobs.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "completed" as const,
              repairCharge,
              visitCharge: visitFee,
              platformCommission: commission,
              workerNetEarnings: net,
              completedAt: new Date().toISOString(),
              invoiceNumber: `INV-2026-${jobId.slice(-4).toUpperCase()}`,
              warrantyDays: 30,
              customerReview: {
                rating: 5.0,
                comment: "Excellent service! The technician was very punctual and solved the issue quickly.",
                date: "Just now",
              },
            }
          : j
      ),
    });

    const repairId = repairIdByJob.get(jobId);
    if (repairId && !isMockMode()) {
      completeRepairApi(repairId).catch((err) => {
        console.error("[workerStore] complete repair failed:", err);
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