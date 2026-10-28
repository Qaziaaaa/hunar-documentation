"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
import { http, getStoredUser, getAccessToken, getRefreshToken } from "@/lib/api-client";
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

/** Case-insensitive whitespace-trimmed job ID matcher to avoid casing mismatches */
export function matchesJobId(targetId?: string | null, candidateId?: string | null): boolean {
  if (!targetId || !candidateId) return false;
  return targetId.toLowerCase().trim() === candidateId.toLowerCase().trim();
}

/** Case-insensitive VisitOffer dictionary lookup */
export function getOfferForJob(offers: Record<string, VisitOffer>, jobId?: string | null): VisitOffer | undefined {
  if (!jobId) return undefined;
  if (offers[jobId]) return offers[jobId];
  const norm = jobId.toLowerCase().trim();
  for (const [key, offer] of Object.entries(offers)) {
    if (key.toLowerCase().trim() === norm) return offer;
  }
  return undefined;
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
          j.id?.toLowerCase() === jobId?.toLowerCase()
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
          j.id?.toLowerCase() === jobId?.toLowerCase()
            ? {
                ...j,
                status: "repair_declined" as const,
                repairCharge: 0,
              }
            : j
        ),
      });
    } else if (newStatus === "VISIT_COMPLETED" || newStatus === "IN_PREMISES") {
      patch({
        jobs: globalState.jobs.map((j) =>
          j.id?.toLowerCase() === jobId?.toLowerCase()
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

  const handleVisitOtpVerified = (data: any) => {
    const jobId = data?.jobId;
    if (!jobId) return;
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id?.toLowerCase() === jobId?.toLowerCase()
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
  };

  const handleRepairApproved = (data: any) => {
    if (!data?.jobId) return;
    const targetJobId = data.jobId?.toLowerCase();
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id?.toLowerCase() === targetJobId
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
    const targetJobId = data.jobId?.toLowerCase();
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id?.toLowerCase() === targetJobId
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

  const handleOfferAccepted = (data: any) => {
    if (!data?.jobId) return;
    const { jobId, offerId, agreedPrice } = data;
    const existingOffer = getOfferForJob(globalState.offers, jobId);
    const agreed = agreedPrice ?? existingOffer?.visitCharge ?? 0;
    const commission = Math.round(agreed * 0.1);
    const net = agreed - commission;

    patch({
      offers: {
        ...globalState.offers,
        [jobId]: existingOffer
          ? {
              ...existingOffer,
              status: "accepted",
              agreedVisitCharge: agreed,
              visitCharge: agreed,
              platformCommission: commission,
              workerNetEarnings: net,
            }
          : {
              id: offerId || `off-${Date.now()}`,
              jobId,
              workerId: "worker-me",
              workerName: "Me",
              visitCharge: agreed,
              platformCommission: commission,
              workerNetEarnings: net,
              status: "accepted",
              createdAt: new Date().toISOString(),
              currentRound: 1,
              maxRounds: 3,
              counterHistory: [],
              agreedVisitCharge: agreed,
            },
      },
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id)
          ? {
              ...j,
              status: "accepted" as const,
              visitCharge: agreed,
            }
          : j
      ),
    });
    void workerStore.syncActiveJobs();
    void workerStore.backfillResourceIds();
  };

  const handleJobClosed = (data: any) => {
    if (!data?.jobId) return;
    const { jobId } = data;
    const existingOffer = getOfferForJob(globalState.offers, jobId);
    patch({
      offers: existingOffer
        ? {
            ...globalState.offers,
            [jobId]: { ...existingOffer, status: "closed_assigned" },
          }
        : globalState.offers,
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id) ? { ...j, status: "closed_assigned" as const } : j
      ),
    });
  };

  const handleJobOffer = (data: any) => {
    if (!data?.jobId) return;
    const { jobId, visitCharge, sender, notes } = data;
    if (sender === "CUSTOMER" || data.action === "COUNTER") {
      const offer = getOfferForJob(globalState.offers, jobId);
      if (offer) {
        const nextRound = offer.currentRound + 1;
        const updatedHistory: CounterHistoryItem[] = [
          ...offer.counterHistory,
          {
            round: nextRound,
            sender: "customer",
            amount: visitCharge,
            message: notes || `Customer counter offer of Rs. ${visitCharge}`,
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
              customerCounterAmount: visitCharge,
              customerCounterMessage: notes,
              counterHistory: updatedHistory,
            },
          },
          jobs: globalState.jobs.map((j) =>
            matchesJobId(jobId, j.id) ? { ...j, status: "counter_received" as const } : j
          ),
        });
      }
    }
  };

  const handleJobCancelled = (data: any) => {
    if (!data?.jobId) return;
    patch({
      jobs: globalState.jobs.map((j) =>
        matchesJobId(data.jobId, j.id) ? { ...j, status: "cancelled" as const } : j
      ),
    });
  };

  const handleJobNew = (data: any) => {
    const rawJob = data?.job || (data?.id ? data : null);
    if (!rawJob?.id) return;
    if (globalState.jobs.some((j) => matchesJobId(rawJob.id, j.id))) return;
    const newJob = mapJobToRequest(rawJob);
    patch({
      jobs: [newJob, ...globalState.jobs],
    });
  };

  socket.on("job:statusChanged", handleStatusChanged);
  socket.on("job:status:changed", handleStatusChanged);
  socket.on("job:offer:accepted", handleOfferAccepted);
  socket.on("job:offerAccepted", handleOfferAccepted);
  socket.on("job:closed", handleJobClosed);
  socket.on("job:offer", handleJobOffer);
  socket.on("job:cancelled", handleJobCancelled);
  socket.on("job:new", handleJobNew);
  socket.on("repair:approved", handleRepairApproved);
  socket.on("repair.approved", handleRepairApproved);
  socket.on("repair:rejected", handleRepairRejected);
  socket.on("repair.rejected", handleRepairRejected);
  socket.on("visit:otp:verified", handleVisitOtpVerified);
  socket.on("visit.otp.verified", handleVisitOtpVerified);
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

const WORKER_JOBS_SESSION_KEY = "hunar_worker_store_jobs";

function loadInitialWorkerJobs(): JobRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(WORKER_JOBS_SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [];
}

const initialCachedJobs = loadInitialWorkerJobs();

let globalState: WorkerState = {
  jobs: initialCachedJobs,
  offers: {},
  inspectionReports: {},
  filters: defaultFilters,
  workerOnline: true,
  walletBalance: 0,
  walletHold: 0,
  workerSkills: [],
  workerArea: "",
  hydrated: initialCachedJobs.length > 0,
  status: initialCachedJobs.length > 0 ? "ready" : "idle",
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

export const JOB_STATUS_RANK: Record<string, number> = {
  open: 0,
  counter_received: 1,
  offers_received: 1,
  accepted: 2,
  visit_scheduled: 2,
  visit_in_progress: 3,
  visit_completed: 4,
  inspecting: 5,
  inspection_submitted: 6,
  repair_negotiating: 7,
  repair_approved: 8,
  repair_declined: 8,
  repair_in_progress: 9,
  completed: 10,
  cancelled: 11,
};

export const workerStore = {
  getState() {
    return globalState;
  },

  updateJobStatus(jobId: string, status: any, repairCharge?: number) {
    patch({
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id)
          ? {
              ...j,
              status,
              ...(repairCharge !== undefined ? { repairCharge } : {}),
            }
          : j
      ),
    });
  },

  upsertJob(job: JobRequest) {
    const normId = job.id?.toLowerCase();
    const existing = globalState.jobs.find((j) => j.id?.toLowerCase() === normId);
    if (existing) {
      const existingRank = JOB_STATUS_RANK[existing.status] ?? 0;
      const incomingRank = JOB_STATUS_RANK[job.status] ?? 0;
      const finalStatus = incomingRank >= existingRank ? job.status : existing.status;
      patch({
        jobs: globalState.jobs.map((j) =>
          j.id?.toLowerCase() === normId
            ? {
                ...j,
                ...job,
                status: finalStatus,
                ...(finalStatus === existing.status && existing.repairCharge != null
                  ? { repairCharge: existing.repairCharge }
                  : {}),
              }
            : j
        ),
      });
    } else {
      patch({
        jobs: [job, ...globalState.jobs],
      });
    }
  },

  async syncActiveJobs() {
    try {
      const activeJobs = await listWorkerJobs();
      if (!Array.isArray(activeJobs)) return;

      const activeMapped: JobRequest[] = [];
      const activeIds = new Set<string>();

      for (const raw of activeJobs) {
        if (!raw?.id) continue;
        activeIds.add(raw.id.toLowerCase());
        const visitId =
          (raw as any).nextVisit?.id ||
          (raw as any).visits?.[0]?.id ||
          (raw as any).visitId;
        if (visitId) {
          visitIdByJob.set(raw.id, visitId);
          visitIdByJob.set(raw.id.toLowerCase(), visitId);
        }
        const mapped = mapJobToRequest(raw);
        const existing = globalState.jobs.find(
          (j) => j.id?.toLowerCase() === raw.id?.toLowerCase()
        );
        if (existing) {
          const existingRank = JOB_STATUS_RANK[existing.status] ?? 0;
          const mappedRank = JOB_STATUS_RANK[mapped.status] ?? 0;
          if (existingRank > mappedRank) {
            mapped.status = existing.status;
            if (existing.repairCharge != null) {
              mapped.repairCharge = existing.repairCharge;
            }
          }
        }
        activeMapped.push(mapped);
      }

      // Merge: replace active jobs with fresh server active jobs, keeping nearby/history that aren't in activeIds
      const nonActiveJobs = globalState.jobs.filter((j) => {
        const norm = j.id?.toLowerCase();
        if (activeIds.has(norm)) return false;
        const isLocalActive =
          j.status === "accepted" ||
          j.status === "visit_in_progress" ||
          j.status === "visit_completed" ||
          j.status === "inspecting" ||
          j.status === "inspection_submitted" ||
          j.status === "repair_negotiating" ||
          j.status === "repair_approved" ||
          j.status === "repair_in_progress" ||
          j.status === "repair_declined";
        return !isLocalActive;
      });

      const updatedJobs = [...activeMapped, ...nonActiveJobs];
      patch({
        jobs: updatedJobs,
        hydrated: true,
        status: "ready",
      });

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(WORKER_JOBS_SESSION_KEY, JSON.stringify(updatedJobs.slice(0, 50)));
        } catch {}
      }
    } catch (err) {
      console.warn("[workerStore] syncActiveJobs failed:", err);
    }
  },

  async hydrate(options: { force?: boolean } = {}) {
    if (globalState.hydrated && !options.force && globalState.jobs.length > 0) {
      // Re-validate in background without wiping UI or showing spinners
      void this.performHydration(true);
      return;
    }
    await this.performHydration(false);
  },

  async performHydration(isBackgroundSync: boolean = false) {
    if (!isBackgroundSync && !globalState.hydrated) {
      patch({ status: "loading", error: null });
    }
    const hasWorkerAuth = Boolean(getAccessToken("WORKER") || getRefreshToken("WORKER"));
    if (!hasWorkerAuth) {
      patch({ hydrated: true, status: "ready" });
      return;
    }
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
        const visitId =
          (job as any).nextVisit?.id ||
          (job as any).visits?.[0]?.id ||
          (job as any).visitId;
        if (visitId) {
          visitIdByJob.set(job.id, visitId);
        }
        const mapped = mapJobToRequest(job);
        const existing = globalState.jobs.find(
          (j) => j.id?.toLowerCase() === job.id?.toLowerCase()
        );
        if (existing) {
          const existingRank = JOB_STATUS_RANK[existing.status] ?? 0;
          const mappedRank = JOB_STATUS_RANK[mapped.status] ?? 0;
          if (existingRank > mappedRank) {
            mapped.status = existing.status;
            if (existing.repairCharge != null) {
              mapped.repairCharge = existing.repairCharge;
            }
          }
        }
        jobs.push(mapped);
      }

      // Only preserve un-synced in-flight jobs if the active jobs call failed
      if (activeRes.status === "rejected") {
        for (const existing of globalState.jobs) {
          if (!seen.has(existing.id) && existing.status !== "completed" && existing.status !== "cancelled") {
            seen.add(existing.id);
            jobs.push(existing);
          }
        }
      }

      const offersMap: Record<string, VisitOffer> = {};
      for (const offer of offers) {
        offersMap[offer.jobId] = offer;
        if (offer.jobId && !visitIdByJob.get(offer.jobId)) {
          const offerVisitId = (offer as any).visitId || (offer as any).nextVisit?.id;
          if (offerVisitId) {
            visitIdByJob.set(offer.jobId, offerVisitId);
          }
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

      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(WORKER_JOBS_SESSION_KEY, JSON.stringify(jobs.slice(0, 50)));
        } catch {}
      }

      // Non-blocking backfill: runs in background so UI renders immediately
      void this.backfillResourceIds();
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

      // Only inspect active jobs requiring visits that do not already have one
      const jobsNeedingVisits = globalState.jobs.filter(
        (job) =>
          !visitIdByJob.has(job.id) &&
          (job.status === "accepted" ||
            job.status === "visit_in_progress" ||
            job.status === "inspecting" ||
            job.status.startsWith("repair_"))
      );

      if (jobsNeedingVisits.length === 0) return;

      // Parallel batch query capped to maximum 6 active jobs simultaneously
      await Promise.allSettled(
        jobsNeedingVisits.slice(0, 6).map(async (job) => {
          try {
            const detail = await http.get<{
              id: string;
              visits?: { id: string }[];
            }>(`/jobs/${job.id}`).catch(() => null);
            if (detail?.visits?.[0]?.id) {
              visitIdByJob.set(job.id, detail.visits[0].id);
            }
          } catch {
            // best-effort
          }
        })
      );
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

    // Wallet guard: a worker with a zero balance cannot offer. The backend
    // re-validates the live database balance on submit and is the authority.
    if (globalState.walletBalance <= 0) {
      return {
        success: false,
        error:
          "Your wallet balance is insufficient to submit an offer. Please top up your wallet to continue.",
      };
    }

    const previousStatus = globalState.jobs.find((j) => matchesJobId(jobId, j.id))?.status;
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
        matchesJobId(jobId, j.id) ? { ...j, status: "offer_sent" as const, totalOffers: j.totalOffers + 1 } : j
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
        // The server rejected the offer (e.g. zero wallet balance) — roll back
        // the optimistic state so a rejected offer is never shown as sent.
        const offers = { ...globalState.offers };
        delete offers[jobId];
        patch({
          offers,
          jobs: globalState.jobs.map((j) =>
            matchesJobId(jobId, j.id)
              ? {
                  ...j,
                  status: previousStatus ?? j.status,
                  totalOffers: Math.max(0, j.totalOffers - 1),
                }
              : j
          ),
        });
      });

    return { success: true };
  },

  recordOfferSent(serverOffer: VisitOffer, jobId: string) {
    patch({
      offers: { ...globalState.offers, [jobId]: serverOffer },
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id)
          ? {
              ...j,
              status: "offer_sent" as const,
              totalOffers: (j.totalOffers || 0) + 1,
            }
          : j
      ),
    });
  },

  // Task 6: Accept customer's counter offer
  acceptCounterOffer(jobId: string): boolean {
    const offer = getOfferForJob(globalState.offers, jobId);
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
        matchesJobId(jobId, j.id) ? { ...j, status: "accepted" as const } : j
      ),
    });

    sendWorkerCounterOffer(jobId, offer.id, agreedPrice, `Agreed to ${agreedPrice}`)
      .catch((err) => console.error("[workerStore] accept counter failed:", err));

    return true;
  },

  // Task 6: Send worker counter-offer (Bounded Rounds: max 3)
  sendWorkerCounter(jobId: string, counterAmount: number, message?: string): { success: boolean; error?: string } {
    const offer = getOfferForJob(globalState.offers, jobId);
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
        matchesJobId(jobId, j.id) ? { ...j, status: "offer_sent" as const } : j
      ),
    });

    sendWorkerCounterOffer(jobId, offer.id, counterAmount, message)
      .catch((err) => console.error("[workerStore] counter offer failed:", err));

    return { success: true };
  },

  // Task 8a: Start Visit -> visit_in_progress
  startVisit(jobId: string) {
    const normId = jobId?.toLowerCase();
    const current = globalState.jobs.find((j) => j.id?.toLowerCase() === normId);
    if (
      current &&
      (current.status === "visit_in_progress" ||
        current.status === "visit_completed" ||
        current.status === "inspecting" ||
        current.status === "inspection_submitted" ||
        current.status.startsWith("repair_") ||
        current.status === "completed")
    ) {
      return;
    }
    const visitId = visitIdByJob.get(jobId) || visitIdByJob.get(normId);
    const url = visitId ? `/visits/${visitId}/start` : `/jobs/${jobId}/start`;
    http.put(url).catch((err) => {
      console.error("[workerStore] start visit failed:", err);
    });
    patch({
      jobs: globalState.jobs.map((j) =>
        j.id?.toLowerCase() === normId ? { ...j, status: "visit_in_progress" as const } : j
      ),
    });
  },

  // Task 8b: Arrival Doorstep action -> generates real OTP & notifies customer
  async arriveAtDoorstep(jobId: string, clientOtp?: string): Promise<{
    success: boolean;
    otp?: string;
    visitId?: string;
    arrivedAt?: number;
    error?: string;
  }> {
    const normId = jobId?.toLowerCase();
    const job = globalState.jobs.find((j) => j.id?.toLowerCase() === normId);
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
      const visitId =
        visitIdByJob.get(jobId) ||
        visitIdByJob.get(normId) ||
        (job as any)?.visitId ||
        (job as any)?.nextVisit?.id;
      const targetId = visitId || jobId;
      const res = await http.put<{
        success: boolean;
        otp: string;
        visitId: string;
        jobId: string;
        arrivedAt: number;
      }>(`/visits/${targetId}/arrived`, clientOtp ? { otp: clientOtp } : undefined);

      const otp = (res as any)?.otp || (res as any)?.data?.otp;
      const visitIdRet = (res as any)?.visitId || (res as any)?.data?.visitId;
      const arrivedAtRet = (res as any)?.arrivedAt || (res as any)?.data?.arrivedAt || Date.now();
      const isSuccess = (res as any)?.success ?? Boolean(otp);

      if (otp || isSuccess) {
        if (visitIdRet) {
          visitIdByJob.set(jobId, visitIdRet);
          visitIdByJob.set(normId, visitIdRet);
        }
        patch({
          walletHold: globalState.walletHold + requiredHold,
          jobs: globalState.jobs.map((j) =>
            j.id?.toLowerCase() === normId
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
    const normId = jobId?.toLowerCase();
    const job = globalState.jobs.find((j) => j.id?.toLowerCase() === normId);
    const visitCharge =
      (job as any)?.agreedVisitCharge ??
      job?.visitCharge ??
      (job as any)?.lockedVisitCharge ??
      job?.customerSuggestedPrice ??
      (job as any)?.suggestedVisitCharge ??
      0;
    const requiredHold = Math.round(visitCharge * 0.1); // 10% platform commission

    const exists = globalState.jobs.some((j) => j.id?.toLowerCase() === normId);
    patch({
      jobs: exists
        ? globalState.jobs.map((j) =>
            j.id?.toLowerCase() === normId
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
          )
        : job
        ? [{ ...job, status: "visit_completed" as const }, ...globalState.jobs]
        : globalState.jobs,
    });
    return { success: true, requiredHold };
  },

  // Task 8c: Start Inspection -> inspecting
  startInspection(jobId: string) {
    const normId = jobId?.toLowerCase();
    const exists = globalState.jobs.some((j) => j.id?.toLowerCase() === normId);
    const job = globalState.jobs.find((j) => j.id?.toLowerCase() === normId);
    patch({
      jobs: exists
        ? globalState.jobs.map((j) =>
            j.id?.toLowerCase() === normId ? { ...j, status: "inspecting" as const } : j
          )
        : job
        ? [{ ...job, status: "inspecting" as const }, ...globalState.jobs]
        : globalState.jobs,
    });
  },

  registerVisitId(jobId: string, visitId: string) {
    if (jobId && visitId) {
      visitIdByJob.set(jobId, visitId);
      visitIdByJob.set(jobId.toLowerCase(), visitId);
    }
  },

  // Task 8d: Submit Inspection -> 5 required fields
  async submitInspection(
    jobId: string,
    report: Omit<InspectionReport, "jobId" | "submittedAt">
  ): Promise<{ success: boolean; error?: string }> {
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
        j.id?.toLowerCase() === jobId?.toLowerCase()
          ? {
              ...j,
              status: "inspection_submitted" as const,
              repairCharge: report.repairPriceEstimate,
            }
          : j
      ),
    });

    const targetId = visitIdByJob.get(jobId) || visitIdByJob.get(jobId?.toLowerCase()) || jobId;
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
      });

      const r = repair as { id?: string; jobId?: string; amount?: number } | null;
      if (r?.id && r?.jobId) {
        repairIdByJob.set(r.jobId, r.id);
        repairIdByJob.set(r.jobId.toLowerCase(), r.id);
        if (targetId) {
          visitIdByJob.set(r.jobId, targetId);
          visitIdByJob.set(r.jobId.toLowerCase(), targetId);
        }
      }
      patch({
        jobs: globalState.jobs.map((j) =>
          j.id?.toLowerCase() === jobId?.toLowerCase()
            ? {
                ...j,
                status: "repair_negotiating" as const,
                repairCharge: report.repairPriceEstimate,
              }
            : j
        ),
      });
      return { success: true };
    } catch (err: any) {
      console.error("[workerStore] submit inspection failed:", err);
      return {
        success: false,
        error: err?.response?.data?.message || err?.message || "Failed to submit inspection and quotation.",
      };
    }
  },

  // Cancel Job (Active pre-visit)
  cancelJob(jobId: string, reason: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id) ? { ...j, status: "cancelled" as const } : j
      ),
    });

    cancelWorkerJob({ jobId, reason: "other", note: reason, stage: "before_visit" }).catch((err) => {
      console.error("[workerStore] cancel job failed:", err);
    });
  },

  approveRepair(jobId: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id) ? { ...j, status: "repair_approved" as const } : j
      ),
    });
  },

  declineRepair(jobId: string) {
    patch({
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id) ? { ...j, status: "repair_declined" as const } : j
      ),
    });
  },

  startRepair(jobId: string) {
    const repairId = repairIdByJob.get(jobId) || repairIdByJob.get(jobId?.toLowerCase());
    if (repairId) {
      startRepairApi(repairId).catch((err) => {
        console.error("[workerStore] start repair failed:", err);
      });
    }
    patch({
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id) ? { ...j, status: "repair_in_progress" as const } : j
      ),
    });
  },

  completeJob(jobId: string, repairCharge: number = 0) {
    const job = globalState.jobs.find((j) => matchesJobId(jobId, j.id));
    const offer = getOfferForJob(globalState.offers, jobId);
    const visitFee = offer?.agreedVisitCharge ?? offer?.visitCharge ?? job?.visitCharge ?? (job as any)?.suggestedVisitCharge ?? 0;
    const isDeclined = job?.status === "repair_declined" || repairCharge === 0;
    const finalRepairCharge = isDeclined ? 0 : Math.max(0, repairCharge);
    const gross = visitFee + finalRepairCharge;
    const commission = Math.round(visitFee * 0.1); // 10% of Visit Fee only
    const net = gross - commission;

    patch({
      jobs: globalState.jobs.map((j) =>
        matchesJobId(jobId, j.id)
          ? {
              ...j,
              status: "completed" as const,
              repairCharge: finalRepairCharge,
              visitCharge: visitFee,
              platformCommission: commission,
              workerNetEarnings: net,
              completedAt: new Date().toISOString(),
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
    const repairId = repairIdByJob.get(jobId) || repairIdByJob.get(jobId?.toLowerCase());
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

const SERVER_WORKER_STATE: WorkerState = {
  jobs: [],
  offers: {},
  inspectionReports: {},
  filters: defaultFilters,
  workerOnline: false,
  walletBalance: 0,
  walletHold: 0,
  workerSkills: [],
  workerArea: "",
  hydrated: false,
  status: "idle",
  error: null,
};

// React Hook for consuming the store with hydration-safe external store subscription
export function useWorkerJobs(): WorkerState {
  useEffect(() => {
    workerStore.hydrate();
  }, []);

  return useSyncExternalStore(
    (notify) => workerStore.subscribe(notify),
    () => workerStore.getState(),
    () => SERVER_WORKER_STATE
  );
}