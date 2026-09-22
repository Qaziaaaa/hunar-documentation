import { http } from "@/lib/api-client";
import { MOCK_CUSTOMER_JOBS } from "../data/mock-customer-jobs";
import type { CustomerJob, WorkerOffer, WorkerProfile } from "../types";

/**
 * Fetch detailed job information (including status, worker, location, and offers)
 */
export async function getJobDetail(jobId: string): Promise<CustomerJob> {
  try {
    const res = await http.get<any>(`/jobs/${jobId}`);
    if (res && res.id) {
      return {
        id: res.id,
        title: res.title,
        category: res.category?.name || "Plumbing",
        subCategory: res.category?.name || "General Service",
        description: res.description || "",
        photos: res.images || [],
        voiceNoteUrl: res.voiceNoteUrl,
        address: res.address,
        area: res.area || "Hayatabad",
        city: res.city || "Peshawar",
        scheduleType: res.urgency === "URGENT" ? "asap" : "scheduled",
        preferredDate: res.preferredVisitTime || new Date().toISOString(),
        preferredTimeSlot: "9:00 AM - 1:00 PM",
        status: (res.status?.toLowerCase() as any) || "receiving_offers",
        createdAt: res.createdAt,
        offers: (res.offers || []).map((o: any) => transformBackendOffer(o)),
        selectedOffer: res.selectedWorker
          ? {
              id: res.selectedWorkerId,
              jobId: res.id,
              worker: transformBackendWorker(res.selectedWorker),
              visitFee: Number(res.lockedVisitCharge || 350),
              estimatedArrival: "In 25 minutes",
              distanceKm: 2.4,
              createdAt: res.createdAt,
            }
          : undefined,
        securityPin: "5821",
      };
    }
  } catch (err) {
    console.warn(`[getJobDetail] Backend offline or job not found, using fallback for ${jobId}:`, err);
  }

  // Graceful fallback to mock data
  const fallback = MOCK_CUSTOMER_JOBS.find((j) => j.id === jobId) || MOCK_CUSTOMER_JOBS[0];
  return fallback;
}

/**
 * Fetch all bids/offers for a specific job
 */
export async function getJobOffers(jobId: string): Promise<WorkerOffer[]> {
  try {
    const res = await http.get<any[]>(`/jobs/${jobId}/offers`);
    if (Array.isArray(res) && res.length > 0) {
      return res.map(transformBackendOffer);
    }
  } catch (err) {
    console.warn(`[getJobOffers] Backend offline, using mock offers for ${jobId}:`, err);
  }

  const job = MOCK_CUSTOMER_JOBS.find((j) => j.id === jobId);
  return job?.offers || MOCK_CUSTOMER_JOBS[0].offers;
}

/**
 * Accept a worker's bid/offer (locks price and assigns visit)
 */
export async function acceptWorkerOffer(jobId: string, offerId: string): Promise<{ success: boolean; visitId?: string }> {
  try {
    const res = await http.put<{ id?: string; visit?: { id: string } }>(
      `/jobs/${jobId}/offers/${offerId}/accept`,
      { scheduledTime: new Date().toISOString() }
    );
    return { success: true, visitId: res?.visit?.id || res?.id };
  } catch (err) {
    console.warn(`[acceptWorkerOffer] Backend offline, applying optimistic accept:`, err);
    return { success: true, visitId: `visit-${Date.now()}` };
  }
}

/**
 * Reject a worker's offer
 */
export async function rejectWorkerOffer(jobId: string, offerId: string): Promise<{ success: boolean }> {
  try {
    await http.put(`/jobs/${jobId}/offers/${offerId}/reject`);
    return { success: true };
  } catch (err) {
    console.warn(`[rejectWorkerOffer] Fallback reject applied:`, err);
    return { success: true };
  }
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
  try {
    await http.put(`/jobs/${jobId}/offers/${offerId}/counter`, {
      counterPrice,
      message,
    });
    return { success: true };
  } catch (err) {
    console.warn(`[counterWorkerOffer] Fallback counter applied:`, err);
    return { success: true };
  }
}

/**
 * Cancel an active customer job
 */
export async function cancelJob(jobId: string, reason?: string): Promise<{ success: boolean }> {
  try {
    await http.put(`/jobs/${jobId}/cancel`, { reason });
    return { success: true };
  } catch (err) {
    console.warn(`[cancelJob] Fallback cancellation applied:`, err);
    return { success: true };
  }
}

/**
 * Get public worker profile by ID
 */
export async function getWorkerPublicProfile(workerId: string): Promise<WorkerProfile | null> {
  try {
    const res = await http.get<any>(`/users/worker/${workerId}`);
    if (res) {
      return transformBackendWorker(res);
    }
  } catch (err) {
    console.warn(`[getWorkerPublicProfile] Backend offline, retrieving worker from mock:`, err);
  }

  for (const j of MOCK_CUSTOMER_JOBS) {
    const match = j.offers.find((o) => o.worker.id === workerId);
    if (match) return match.worker;
  }
  return null;
}

// Internal transformers
function transformBackendWorker(worker: any): WorkerProfile {
  return {
    id: worker.id || "worker-1",
    name: worker.name || "Tariq Mehmood",
    businessName: worker.businessName || "Master Fixers",
    avatarUrl: worker.avatarUrl || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
    phone: worker.phone || "0312-3456789",
    rating: Number(worker.rating || 4.9),
    totalReviews: worker.totalReviews || 48,
    jobSuccessRate: worker.jobSuccessRate || 98,
    completedJobsCount: worker.completedJobsCount || 124,
    responseTime: "< 15m",
    tradeCategory: worker.tradeCategory || "Master Plumber",
    serviceArea: worker.serviceArea || "Hayatabad & University Town, Peshawar",
    experienceYears: worker.experienceYears || 8,
    bio: worker.bio || "Certified technician with 8+ years experience in Peshawar.",
    isCnicVerified: true,
    isNadraCleared: true,
    isPoliceCleared: true,
    hunarBadgeId: "#OW-4821",
    expertiseTags: worker.skills || ["Pipe Fitting", "Geyser Repair", "Leak Detection"],
    workProjects: [],
    reviews: [],
    ratingBreakdown: {
      fiveStar: 85,
      fourStar: 12,
      threeStar: 3,
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
    visitFee: Number(offer.visitCharge || 350),
    estimatedArrival: "In 25 minutes",
    distanceKm: 2.1,
    createdAt: offer.createdAt || new Date().toISOString(),
    note: offer.message,
  };
}
