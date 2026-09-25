import { http } from "@/lib/api-client";
import type { CustomerJob, JobStatus, WorkerOffer, WorkerProfile } from "../types";

/**
 * Fetch all jobs for the logged-in customer, enriched with offers & selected worker.
 */
export async function getCustomerJobs(): Promise<CustomerJob[]> {
  const res = await http.get<{ items: any[]; meta?: unknown }>(
    "/jobs/customer?limit=100"
  );
  const rows = res?.items ?? [];
  const jobs = rows.map(transformListRow);

  await Promise.allSettled(
    jobs.map(async (job) => {
      try {
        const detail = await getJobDetail(job.id);
        Object.assign(job, detail);
      } catch (err) {
        console.warn(`[getCustomerJobs] Detail fetch failed for ${job.id}:`, err);
      }
    })
  );

  return jobs;
}

/**
 * Fetch detailed job information (including status, worker, location, and offers)
 */
export async function getJobDetail(jobId: string): Promise<CustomerJob> {
  const res = await http.get<any>(`/jobs/${jobId}`);
  if (!res || !res.id) {
    throw new Error(`JOB_NOT_FOUND: ${jobId}`);
  }
  return {
    id: res.id,
    title: res.title,
    category: res.category?.name || "General Service",
    subCategory: res.category?.name || "General Service",
    description: res.description || "",
    photos: res.images || [],
    voiceNoteUrl: res.voiceNoteUrl,
    address: res.address,
    area: res.area || "Peshawar",
    city: res.city || "Peshawar",
    scheduleType: res.urgency === "URGENT" ? "asap" : "scheduled",
    preferredDate: res.preferredVisitTime || res.createdAt || new Date().toISOString(),
    preferredTimeSlot: "9:00 AM - 1:00 PM",
    status: mapJobStatus(res.status),
    createdAt: res.createdAt || new Date().toISOString(),
    offers: (res.offers || []).map(transformBackendOffer),
    selectedOffer: res.selectedWorker
      ? transformBackendOffer({
          id: res.selectedWorkerId,
          jobId: res.id,
          worker: res.selectedWorker,
          visitCharge: Number(res.lockedVisitCharge ?? 350),
          message: res.offerMessage,
          createdAt: res.createdAt,
        })
      : undefined,
    securityPin: res.securityPin,
  };
}

/**
 * Fetch all bids/offers for a specific job
 */
export async function getJobOffers(jobId: string): Promise<WorkerOffer[]> {
  const res = await http.get<any[]>(`/jobs/${jobId}/offers`);
  if (!Array.isArray(res)) {
    throw new Error(`INVALID_OFFERS_RESPONSE: ${jobId}`);
  }
  return res.map(transformBackendOffer);
}

/**
 * Accept a worker's bid/offer (locks price and assigns visit)
 */
export async function acceptWorkerOffer(
  jobId: string,
  offerId: string
): Promise<{ success: boolean; visitId?: string }> {
  const res = await http.put<{ id?: string; visit?: { id: string } }>(
    `/jobs/${jobId}/offers/${offerId}/accept`,
    { scheduledTime: new Date().toISOString() }
  );
  return { success: true, visitId: res?.visit?.id || res?.id };
}

/**
 * Reject a worker's offer
 */
export async function rejectWorkerOffer(
  jobId: string,
  offerId: string
): Promise<{ success: boolean }> {
  await http.put(`/jobs/${jobId}/offers/${offerId}/reject`);
  return { success: true };
}

/**
 * Counter a worker's offer with a new proposed visit fee
 */
export async function counterWorkerOffer(
  jobId: string,
  offerId: string,
  counterPrice: number,
  message?: string
): Promise<{ success: boolean }> {
  await http.put(`/jobs/${jobId}/offers/${offerId}/counter`, {
    counterPrice,
    message,
  });
  return { success: true };
}

/**
 * Cancel an active customer job
 */
export async function cancelCustomerJob(
  jobId: string,
  reason?: string
): Promise<{ success: boolean }> {
  await http.put(`/jobs/${jobId}/cancel`, { reason });
  return { success: true };
}

/**
 * Get public worker profile by ID
 */
export async function getWorkerPublicProfile(
  workerId: string
): Promise<WorkerProfile | null> {
  const res = await http.get<any>(`/users/worker/${workerId}`);
  return res ? transformBackendWorker(res) : null;
}

// ---------------------------------------------------------------------------
// Transformers
// ---------------------------------------------------------------------------

function mapJobStatus(status?: string): JobStatus {
  switch (status) {
    case "OPEN":
    case "OFFERS_RECEIVED":
      return "receiving_offers";
    case "WORKER_ASSIGNED":
      return "worker_selected";
    case "VISIT_SCHEDULED":
      return "visit_scheduled";
    case "VISIT_IN_PROGRESS":
    case "VISIT_COMPLETED":
    case "INSPECTION_DONE":
    case "REPAIR_NEGOTIATING":
    case "REPAIR_APPROVED":
    case "IN_PROGRESS":
      return "in_progress";
    case "COMPLETED":
    case "PAID":
    case "REVIEWED":
      return "completed";
    case "CANCELLED":
    case "EXPIRED":
    case "NO_SHOW":
      return "cancelled";
    default:
      return "receiving_offers";
  }
}

function transformListRow(row: any): CustomerJob {
  return {
    id: row.id,
    title: row.title,
    category: row.categoryName || "General Service",
    subCategory: row.categoryName || "General Service",
    description: "",
    photos: row.images || [],
    voiceNoteUrl: row.voiceNoteUrl,
    address: row.address,
    area: row.area || "Peshawar",
    city: row.city || "Peshawar",
    scheduleType: "scheduled",
    preferredDate: row.preferredVisitTime || row.createdAt || new Date().toISOString(),
    preferredTimeSlot: "9:00 AM - 1:00 PM",
    status: mapJobStatus(row.status),
    createdAt: row.createdAt || new Date().toISOString(),
    offers: [],
  };
}

function transformBackendWorker(worker: any): WorkerProfile {
  return {
    id: worker.id || "worker-unknown",
    name: worker.name || worker.fullName || "Worker",
    businessName: worker.businessName,
    avatarUrl:
      worker.avatarUrl ||
      worker.avatar ||
      "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    phone: worker.phone || worker.mobile || "",
    rating: Number(worker.rating || 0),
    totalReviews: Number(worker.totalReviews || worker.reviewCount || 0),
    jobSuccessRate: Number(worker.jobSuccessRate || 0),
    completedJobsCount: Number(worker.completedJobsCount || 0),
    responseTime: worker.responseTime || "< 15m",
    tradeCategory: worker.tradeCategory || worker.category?.name || "Technician",
    serviceArea: worker.serviceArea || worker.area || "Peshawar",
    experienceYears: Number(worker.experienceYears || worker.yearsOfExperience || 0),
    bio: worker.bio || worker.about || "",
    isCnicVerified: !!worker.isCnicVerified,
    isNadraCleared: !!worker.isNadraCleared,
    isPoliceCleared: !!worker.isPoliceCleared,
    hunarBadgeId: "#OW-" + (worker.hunarBadgeNumber || worker.userNumber || "0000"),
    expertiseTags: worker.skills || worker.expertiseTags || [],
    workProjects: [],
    reviews: [],
    ratingBreakdown: worker.ratingBreakdown || {
      fiveStar: 0,
      fourStar: 0,
      threeStar: 0,
      twoStar: 0,
      oneStar: 0,
    },
  };
}

function transformBackendOffer(offer: any): WorkerOffer {
  return {
    id: offer.id,
    jobId: offer.jobId,
    worker: transformBackendWorker(offer.worker || {}),
    visitFee: Number(offer.visitCharge || offer.counterPrice || 0),
    estimatedArrival: "Today",
    distanceKm: Number(offer.distanceKm || 0),
    createdAt: offer.createdAt || new Date().toISOString(),
    note: offer.message,
  };
}