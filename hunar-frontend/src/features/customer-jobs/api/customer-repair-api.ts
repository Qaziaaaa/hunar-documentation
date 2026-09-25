import { http } from "@/lib/api-client";
import type { JobCompletionData } from "../types";

export interface ReviewSubmissionPayload {
  rating: number; // 1 to 5
  comment: string;
  punctualityRating?: number;
  qualityRating?: number;
  behaviorRating?: number;
}

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";

/**
 * Fetch repair inspection, parts estimate, and final invoice breakdown
 */
export async function getJobRepairInvoice(jobId: string): Promise<JobCompletionData> {
  const res = await http.get<any>(`/repairs/${jobId}`);
  if (!res || (!res.id && !res.jobId)) {
    throw new Error(`REPAIR_NOT_FOUND: ${jobId}`);
  }
  const worker = res.worker || res.job?.worker || {};
  return {
    jobId: res.jobId || jobId,
    jobNumber: `#OW-${(res.jobNumber || res.id || jobId).slice(0, 6).toUpperCase()}`,
    serviceTitle: res.job?.title || "Repair and Restoration",
    worker: {
      id: worker.id || "worker-unknown",
      name: worker.name || "Technician",
      avatarUrl: worker.avatarUrl || worker.avatar || FALLBACK_IMAGE,
      phone: worker.phone || "",
      rating: Number(worker.rating || 0),
      totalReviews: Number(worker.totalReviews || 0),
      businessName: worker.businessName,
      jobSuccessRate: Number(worker.jobSuccessRate || 0),
      completedJobsCount: Number(worker.completedJobsCount || 0),
      responseTime: "< 15m",
      tradeCategory: worker.tradeCategory || worker.category?.name || "Technician",
      serviceArea: worker.serviceArea || "Peshawar",
      experienceYears: Number(worker.experienceYears || 0),
      bio: worker.bio || "",
      isCnicVerified: !!worker.isCnicVerified,
      isNadraCleared: !!worker.isNadraCleared,
      isPoliceCleared: !!worker.isPoliceCleared,
      hunarBadgeId: "#OW-0000",
      expertiseTags: worker.skills || [],
      workProjects: [],
      reviews: [],
      ratingBreakdown: {
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0,
      },
    },
    completedAt: res.completedAt || res.updatedAt || new Date().toLocaleString(),
    address: res.job?.address || "Peshawar",
    evidencePhotos: (res.inspectionPhotos || []).map((img: string | { url?: string }, idx: number) => ({
      id: `ev-${idx}`,
      type: idx % 2 === 0 ? "before" : "after",
      title: idx % 2 === 0 ? "Issue Diagnosis" : "Completed Repair",
      description: "Verified onsite by technician",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: typeof img === "string" ? img : img?.url || FALLBACK_IMAGE,
    })),
    technicianReport: res.diagnosis || res.repairPlan || "Service completed as diagnosed.",
    technicalSpecsNote: "Inspected & Verified",
    warrantyDays: 5,
    billingItems: [
      {
        id: "b-labor",
        title: "Technician Craftsmanship & Labor",
        description: "On-site diagnostic inspection and technical labor",
        amount: Number(res.laborCost || 0),
      },
      ...(res.partsCost ? [{ id: "b-parts", title: "Replacement Hardware & Parts", description: "Installed genuine replacement parts", amount: Number(res.partsCost) }] : []),
    ],
    totalAmount: Number(res.totalAmount || res.repairEstimate || 0),
  };
}

/**
 * Customer accepts repair estimate / invoice
 */
export async function acceptRepairEstimate(
  repairId: string,
  paymentMethod: string = "cash"
): Promise<{ success: boolean }> {
  const res = await http.put<{ id?: string }>(`/repairs/${repairId}/accept`, { paymentMethod });
  return { success: true, ...(res ? { id: res.id } : {}) };
}

/**
 * Customer rejects repair estimate
 */
export async function rejectRepairEstimate(repairId: string): Promise<{ success: boolean }> {
  await http.put(`/repairs/${repairId}/reject`);
  return { success: true };
}

/**
 * Customer counters repair estimate
 */
export async function counterRepairEstimate(
  repairId: string,
  counterAmount: number,
  notes?: string
): Promise<{ success: boolean }> {
  await http.put(`/repairs/${repairId}/counter`, {
    counterAmount,
    notes,
  });
  return { success: true };
}

/**
 * Submit customer review & rating for a completed job
 */
export async function submitJobReview(
  jobId: string,
  payload: ReviewSubmissionPayload
): Promise<{ success: boolean; reviewId?: string }> {
  const res = await http.post<{ id?: string }>(`/jobs/${jobId}/review`, {
    rating: payload.rating,
    comment: payload.comment,
    punctualityRating: payload.punctualityRating,
    qualityRating: payload.qualityRating,
    behaviorRating: payload.behaviorRating,
  });
  return { success: true, reviewId: res?.id };
}