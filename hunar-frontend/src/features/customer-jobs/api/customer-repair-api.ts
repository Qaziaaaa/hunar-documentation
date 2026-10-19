import { http } from "@/lib/api-client";
import type { JobCompletionData } from "../types";

export interface ReviewSubmissionPayload {
  rating: number; // 1 to 5
  comment?: string;
  punctualityRating?: number;
  qualityRating?: number;
  behaviorRating?: number;
}

const FALLBACK_IMAGE = "";

/**
 * Fetch repair inspection, parts estimate, and final invoice breakdown
 */
export async function getJobRepairInvoice(jobId: string, repairDeclined?: boolean): Promise<JobCompletionData> {
  const res = await http.get<any>(`/repairs/${jobId}`);
  if (!res || (!res.id && !res.jobId)) {
    throw new Error(`REPAIR_NOT_FOUND: ${jobId}`);
  }
  const worker = res.worker || res.job?.worker || {};
  const isDeclined = repairDeclined || res.status === "REJECTED" || res.status === "DECLINED";
  const visitCharge = Number(res.visitCharge ?? res.job?.visitCharges ?? 0);
  const payableRepair = isDeclined ? 0 : Number(res.payableRepairAmount ?? res.laborCost ?? 0);
  const partsCharge = isDeclined ? 0 : Number(res.partsCost ?? 0);

  return {
    jobId: res.jobId || jobId,
    jobNumber: `#${res.jobNumber || res.id || jobId}`,
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
      responseTime: worker.responseTime || "",
      tradeCategory: worker.tradeCategory || worker.category?.name || "Technician",
      serviceArea: worker.serviceArea || "",
      experienceYears: Number(worker.experienceYears || 0),
      bio: worker.bio || "",
      isCnicVerified: !!worker.isCnicVerified,
      isNadraCleared: !!worker.isNadraCleared,
      isPoliceCleared: !!worker.isPoliceCleared,
      hunarBadgeId: worker.hunarBadgeNumber ? `#OW-${worker.hunarBadgeNumber}` : "",
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
    address: res.job?.address || "",
    evidencePhotos: (res.inspectionPhotos || []).map((img: string | { url?: string }, idx: number) => ({
      id: `ev-${idx}`,
      type: idx % 2 === 0 ? "before" : "after",
      title: idx % 2 === 0 ? "Issue Diagnosis" : "Completed Repair",
      description: "Verified onsite by technician",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      imageUrl: typeof img === "string" ? img : img?.url || FALLBACK_IMAGE,
    })),
    technicianReport: res.diagnosis || res.repairPlan || "Service completed as diagnosed.",
    technicalSpecsNote: isDeclined ? "Repair Declined by Customer" : "Inspected & Verified",
    warrantyDays: isDeclined ? 0 : 5,
    billingItems: isDeclined
      ? [
          {
            id: "b-visit",
            title: "Standard Visit & Diagnostic Fee",
            description: "Initial diagnostic inspection (Repair Declined)",
            amount: visitCharge,
          },
        ]
      : [
          {
            id: "b-visit",
            title: "Standard Visit & Diagnostic Fee",
            description: "Initial diagnostic inspection",
            amount: visitCharge,
          },
          ...(payableRepair > 0
            ? [
                {
                  id: "b-labor",
                  title: "Technician Craftsmanship & Labor",
                  description: "Approved technical repair labor",
                  amount: payableRepair,
                },
              ]
            : []),
          ...(partsCharge > 0
            ? [
                {
                  id: "b-parts",
                  title: "Replacement Hardware & Parts",
                  description: "Installed genuine replacement parts",
                  amount: partsCharge,
                },
              ]
            : []),
        ],
    totalAmount: isDeclined
      ? visitCharge
      : Number(res.totalAmount ?? (visitCharge + payableRepair + partsCharge)),
  };
}

/**
 * Customer accepts repair estimate / invoice
 */
export async function acceptRepairEstimate(
  repairId?: string,
  jobId?: string,
  paymentMethod: string = "cash"
): Promise<{ success: boolean; id?: string }> {
  if (repairId) {
    try {
      const res = await http.put<{ id?: string }>(`/repairs/${repairId}/accept`, { paymentMethod });
      return { success: true, ...(res ? { id: res.id } : {}) };
    } catch (err) {
      if (jobId) {
        const res = await http.put<{ id?: string }>(`/jobs/${jobId}/repair/approve`, { paymentMethod });
        return { success: true, ...(res ? { id: res.id } : {}) };
      }
      throw err;
    }
  } else if (jobId) {
    const res = await http.put<{ id?: string }>(`/jobs/${jobId}/repair/approve`, { paymentMethod });
    return { success: true, ...(res ? { id: res.id } : {}) };
  }
  throw new Error("Missing repairId or jobId to accept repair estimate");
}

/**
 * Customer rejects repair estimate
 */
export async function rejectRepairEstimate(
  repairId?: string,
  jobId?: string
): Promise<{ success: boolean }> {
  if (repairId) {
    try {
      await http.put(`/repairs/${repairId}/reject`);
      return { success: true };
    } catch (err) {
      if (jobId) {
        await http.put(`/jobs/${jobId}/repair/reject`);
        return { success: true };
      }
      throw err;
    }
  } else if (jobId) {
    await http.put(`/jobs/${jobId}/repair/reject`);
    return { success: true };
  }
  throw new Error("Missing repairId or jobId to reject repair estimate");
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
  const body: Record<string, any> = {
    rating: payload.rating,
  };
  if (payload.comment && payload.comment.trim().length > 0) {
    body.comment = payload.comment.trim();
  }
  const res = await http.post<{ id?: string }>(`/jobs/${jobId}/review`, body);
  return { success: true, reviewId: res?.id };
}

export interface ProcessPaymentPayload {
  jobId: string;
  method: "COD" | "WALLET" | "CARD" | "MOBILE_WALLET";
  amount?: number;
  gateway?: "STRIPE" | "JAZZCASH" | "EASYPAISA";
  note?: string;
}

/**
 * Process/record a payment for a completed job via POST /payments
 */
export async function processJobPayment(
  payload: ProcessPaymentPayload
): Promise<{ success: boolean; paymentId?: string; status?: string }> {
  const res = await http.post<{ paymentId?: string; status?: string; idempotent?: boolean }>(
    "/payments",
    payload
  );
  return { success: true, paymentId: res?.paymentId, status: res?.status };
}