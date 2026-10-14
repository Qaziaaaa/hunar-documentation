import { http } from "@/lib/api-client";
import { extractTimeSlotFromVisitTime } from "@/lib/format";
import type { CustomerJob, JobStatus, WorkerOffer, WorkerProfile, WorkerReview } from "../types";

export interface GetCustomerJobsOptions {
  page?: number;
  limit?: number;
  status?: string;
}

/**
 * Fetch jobs for the logged-in customer incrementally, enriched on-demand with worker/offers.
 */
export async function getCustomerJobs(options?: GetCustomerJobsOptions | unknown): Promise<CustomerJob[]> {
  const isOptionsObject =
    typeof options === "object" &&
    options !== null &&
    ("page" in options || "limit" in options || "status" in options);
  const opts = isOptionsObject ? (options as GetCustomerJobsOptions) : undefined;
  const page = opts?.page ?? 1;
  const limit = opts?.limit ?? 20;
  const statusQuery = opts?.status ? `&status=${encodeURIComponent(opts.status)}` : "";
  const res = await http.get<unknown>(`/jobs/customer?page=${page}&limit=${limit}${statusQuery}`);
  const rows: unknown[] = Array.isArray(res)
    ? res
    : (res as { data?: unknown[]; items?: unknown[] })?.data ??
      (res as { items?: unknown[] })?.items ??
      [];

  return rows.map(transformListRow);
}

/**
 * Fetch detailed job information (including status, worker, location, and offers)
 */
export async function getJobDetail(jobId: string): Promise<CustomerJob> {
  const res = await http.get<any>(`/jobs/${jobId}`);
  if (!res || !res.id) {
    throw new Error(`JOB_NOT_FOUND: ${jobId}`);
  }
  const isAsap = res.urgency === "EMERGENCY" || res.urgency === "URGENT" || res.urgency === "HIGH";
  let offers: WorkerOffer[] = (res.offers || []).map(transformBackendOffer);
  if (offers.length === 0 && Number(res.offerCount ?? 0) > 0) {
    try {
      offers = await getJobOffers(jobId);
    } catch (err) {
      console.warn(`[getJobDetail] Offers fetch failed for ${jobId}:`, err);
    }
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
    area: res.area || "",
    city: res.city || "",
    scheduleType: isAsap ? "asap" : "scheduled",
    preferredDate: res.preferredVisitTime || res.createdAt || new Date().toISOString(),
    preferredTimeSlot:
      res.preferredTimeSlot ||
      res.timeSlot ||
      (isAsap ? "Immediate (Within 30–60 mins)" : extractTimeSlotFromVisitTime(res.preferredVisitTime)),
    status: mapJobStatus(res.status),
    createdAt: res.createdAt || new Date().toISOString(),
    offerCount: Number(res.offerCount ?? offers.length),
    offers,
    selectedOffer: res.selectedWorker
      ? transformBackendOffer({
          id: res.selectedWorkerId,
          jobId: res.id,
          worker: res.selectedWorker,
          visitCharge: Number(res.lockedVisitCharge ?? 0),
          message: res.offerMessage,
          createdAt: res.createdAt,
        })
      : undefined,
    securityPin: res.securityPin,
    suggestedVisitCharge: res.suggestedVisitCharge != null ? Number(res.suggestedVisitCharge) : undefined,
  };
}

/**
 * Fetch all bids/offers for a specific job
 */
export async function getJobOffers(jobId: string): Promise<WorkerOffer[]> {
  const res = await http.get<any[]>(`/jobs/${jobId}/offers`);
  if (!Array.isArray(res)) {
    return [];
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
  try {
    const res = await http.get<any>(`/workers/${workerId}`);
    return res ? transformBackendWorker(res) : null;
  } catch {
    try {
      const res = await http.get<any>(`/users/worker/${workerId}`);
      return res ? transformBackendWorker(res) : null;
    } catch (err) {
      console.warn(`[getWorkerPublicProfile] Failed for ${workerId}:`, err);
      return null;
    }
  }
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
      // Backend auto-creates a SCHEDULED visit row when the offer is accepted,
      // so from the customer's perspective the visit is already scheduled.
      return "visit_scheduled";
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
  const isAsap = row.urgency === "EMERGENCY" || row.urgency === "URGENT" || row.urgency === "HIGH";
  const offers: WorkerOffer[] = Array.isArray(row.offers)
    ? row.offers.map(transformBackendOffer)
    : [];
  return {
    id: row.id,
    title: row.title,
    category: row.categoryName || row.category?.name || "General Service",
    subCategory: row.categoryName || row.category?.name || "General Service",
    description: row.description || "",
    photos: row.images || [],
    voiceNoteUrl: row.voiceNoteUrl,
    address: row.address,
    area: row.area || "",
    city: row.city || "",
    scheduleType: isAsap ? "asap" : "scheduled",
    preferredDate: row.preferredVisitTime || row.createdAt || new Date().toISOString(),
    preferredTimeSlot:
      row.preferredTimeSlot ||
      row.timeSlot ||
      (isAsap ? "Immediate (Within 30–60 mins)" : extractTimeSlotFromVisitTime(row.preferredVisitTime)),
    status: mapJobStatus(row.status),
    createdAt: row.createdAt || new Date().toISOString(),
    offerCount: Number(row.offerCount ?? offers.length),
    offers,
    selectedOffer: row.selectedWorker
      ? transformBackendOffer({
          id: row.selectedWorkerId,
          jobId: row.id,
          worker: row.selectedWorker,
          visitCharge: Number(row.lockedVisitCharge ?? 0),
          createdAt: row.createdAt,
        })
      : undefined,
    suggestedVisitCharge: row.suggestedVisitCharge != null ? Number(row.suggestedVisitCharge) : undefined,
  };
}

function transformBackendWorker(worker: any): WorkerProfile {
  const rawSkills: string[] = Array.isArray(worker.skillNames) && worker.skillNames.length > 0
    ? worker.skillNames
    : Array.isArray(worker.skills)
    ? worker.skills
        .map((s: any) => (typeof s === "string" ? s : s.name || s.nameUrdu || ""))
        .filter(Boolean)
    : Array.isArray(worker.expertiseTags)
    ? worker.expertiseTags
    : [];

  const skillsList: string[] = rawSkills.filter(
    (s) => !s.startsWith("seed-category-") && !/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s)
  );

  const rawReviews = Array.isArray(worker.reviews) ? worker.reviews : [];
  const reviews: WorkerReview[] = rawReviews.map((r: any) => ({
    id: r.id || String(Math.random()),
    customerName: r.customerName || r.reviewer?.name || "Customer",
    customerArea: r.customerArea || r.job?.area || r.job?.city || "",
    rating: Number(r.rating || 0),
    date: r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ""),
    comment: r.comment || "",
  }));

  const ratingAvg =
    typeof worker.rating === "object" && worker.rating !== null
      ? Number(worker.rating.average ?? 0)
      : Number(worker.rating ?? worker.avgRating ?? 0);

  const totalReviewsCount =
    typeof worker.rating === "object" && worker.rating !== null
      ? Number(worker.rating.count ?? 0)
      : Number(worker.totalReviews ?? worker.reviewCount ?? worker.ratingCount ?? 0);

  const completedCount = Number(
    worker.completedJobsCount ?? worker.completedJobs ?? 0
  );

  const primaryArea =
    worker.serviceArea ||
    worker.primaryArea ||
    (Array.isArray(worker.serviceAreas) && worker.serviceAreas[0]?.label) ||
    (Array.isArray(worker.serviceAreas) && worker.serviceAreas[0]?.address) ||
    "";

  return {
    id: worker.id || "",
    name: worker.name || worker.fullName || "",
    businessName: worker.businessName,
    avatarUrl: worker.avatarUrl || worker.avatar || "",
    phone: worker.phone || worker.mobile || "",
    rating: ratingAvg,
    totalReviews: totalReviewsCount,
    jobSuccessRate: worker.jobSuccessRate != null ? Number(worker.jobSuccessRate) : null,
    completedJobsCount: completedCount,
    responseTime: worker.responseTime || "",
    tradeCategory:
      worker.tradeCategory ||
      worker.category?.name ||
      (skillsList[0] || ""),
    serviceArea: primaryArea,
    experienceYears: Number(worker.experienceYears || worker.yearsOfExperience || 0),
    bio: worker.bio || worker.about || "",
    isCnicVerified: Boolean(worker.isCnicVerified),
    isNadraCleared: Boolean(worker.isNadraCleared),
    isPoliceCleared: Boolean(worker.isPoliceCleared),
    hunarBadgeId: worker.hunarBadgeNumber
      ? `#OW-${worker.hunarBadgeNumber}`
      : worker.id
      ? `#OW-${worker.id.slice(0, 4).toUpperCase()}`
      : "",
    expertiseTags: skillsList,
    workProjects: Array.isArray(worker.workProjects) ? worker.workProjects : [],
    reviews,
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
    estimatedArrival: offer.estimatedArrival || "",
    distanceKm: Number(offer.distanceKm || 0),
    createdAt: offer.createdAt || new Date().toISOString(),
    note: offer.message,
  };
}