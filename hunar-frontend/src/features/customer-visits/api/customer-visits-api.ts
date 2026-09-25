import { http } from "@/lib/api-client";
import { VisitStatus } from "@/features/customer-visits/types";
import type { ScheduledVisit } from "../types";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80";

/**
 * Fetch all customer visits / bookings
 */
export async function getCustomerVisits(): Promise<ScheduledVisit[]> {
  const res = await http.get<any[]>("/visits/my");
  if (!Array.isArray(res)) {
    throw new Error("INVALID_VISITS_RESPONSE");
  }
  return res.map((item: any) => transformBackendVisit(item));
}

/**
 * Get visit details by visit ID
 */
export async function getVisitDetail(visitId: string): Promise<ScheduledVisit> {
  const res = await http.get<any>(`/visits/${visitId}`);
  if (!res || !res.id) {
    throw new Error(`VISIT_NOT_FOUND: ${visitId}`);
  }
  return transformBackendVisit(res);
}

/**
 * Fetch worker GPS track history and latest coordinates for a job
 */
export async function getWorkerLocationTrack(
  jobId: string
): Promise<{ latitude: number; longitude: number; recordedAt: string }[]> {
  const res = await http.get<any[]>(`/location/track/${jobId}`);
  if (!Array.isArray(res)) {
    throw new Error(`INVALID_TRACK_RESPONSE: ${jobId}`);
  }
  return res.map((item: any) => ({
    latitude: item.latitude,
    longitude: item.longitude,
    recordedAt: item.recordedAt,
  }));
}

function transformBackendVisit(v: any): ScheduledVisit {
  const worker = v.worker || {};
  const job = v.job || {};
  return {
    id: v.id,
    jobId: v.jobId || `job-${v.id}`,
    jobTitle: job.title || "Home Repair & Inspection",
    jobTitleUr: "گھریلو مرمت اور معائنہ",
    category: job.category?.name || "General Service",
    subCategory: "Emergency Repair",
    subCategoryUr: "ہنگامی مرمت",
    status: mapVisitStatus(v.status),
    scheduledDate:
      v.scheduledDate || v.scheduledAt || new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "11:30 AM - 12:30 PM",
    etaMinutes: Number(v.etaMinutes || v.estimatedArrivalMinutes || 0),
    remainingDistanceKm: Number(v.remainingDistanceKm || 0),
    securityPin: v.securityPin || v.pin,
    visitCharges: Number(v.offer?.visitCharge || v.visitCharge || v.lockedVisitCharge || 0),
    escrowAmount: Number(v.offer?.visitCharge || v.visitCharge || v.lockedVisitCharge || 0),
    customerAddress: job.address || "Peshawar",
    customerArea: job.area || "Peshawar",
    customerAreaUr: "پشاور",
    customerLat: Number(job.latitude || v.customerLat || 33.9944),
    customerLng: Number(job.longitude || v.customerLng || 71.4999),
    originLat: Number(v.originLat || 34.0045),
    originLng: Number(v.originLng || 71.477),
    technician: {
      id: v.workerId || worker.id || "worker-unknown",
      name: worker.name || "Technician",
      nameUr: worker.name || "ٹیکنیشن",
      businessName: worker.businessName,
      businessNameUr: worker.businessName,
      avatarUrl: worker.avatarUrl || worker.avatar || FALLBACK_IMAGE,
      phone: worker.phone || "",
      rating: Number(worker.rating || 0),
      totalReviews: Number(worker.totalReviews || 0),
      tradeCategory: worker.tradeCategory || "Technician",
      tradeCategoryUr: worker.tradeCategory || "ٹیکنیشن",
      hunarBadgeId: worker.hunarBadgeId || `#OW-${(worker.id || "0000").slice(0, 4).toUpperCase()}`,
      vehicleModel: v.vehicleModel,
      vehiclePlate: v.vehiclePlate,
      isCnicVerified: !!worker.isCnicVerified || !!v.isCnicVerified,
      isBiometricChecked: !!v.isBiometricChecked,
      currentLat: Number(v.currentLat || worker.currentLat || 0),
      currentLng: Number(v.currentLng || worker.currentLng || 0),
      speedKmh: Number(v.speedKmh || worker.speedKmh || 0),
    },
    currentStreetLandmark: v.currentStreetLandmark || "En route",
    currentStreetLandmarkUr: v.currentStreetLandmark || "روانہ",
    updatedAt: v.updatedAt || new Date().toISOString(),
    createdAt: v.createdAt || new Date().toISOString(),
  };
}

function mapVisitStatus(status?: string): VisitStatus {
  switch (status) {
    case "SCHEDULED":
    case "EN_ROUTE":
    case "ARRIVED":
    case "STARTED":
    case "IN_PROGRESS":
    case "COMPLETED":
    case "CANCELLED":
    case "APPROVED":
    case "REVIEWED":
    case "PAID":
      return status.toLowerCase() as VisitStatus;
    default:
      return (status || "en_route") as VisitStatus;
  }
}
