import { http } from "@/lib/api-client";
import { MOCK_SCHEDULED_VISITS } from "../data/mock-customer-visits";
import type { ScheduledVisit } from "../types";

/**
 * Fetch all customer visits / bookings
 */
export async function getCustomerVisits(): Promise<ScheduledVisit[]> {
  try {
    const res = await http.get<any[]>("/visits/my");
    if (Array.isArray(res) && res.length > 0) {
      return res.map((item: any) => transformBackendVisit(item));
    }
  } catch (err) {
    console.warn("[getCustomerVisits] Backend offline, using mock visits:", err);
  }
  return MOCK_SCHEDULED_VISITS;
}

/**
 * Get visit details by visit ID
 */
export async function getVisitDetail(visitId: string): Promise<ScheduledVisit> {
  try {
    const res = await http.get<any>(`/visits/${visitId}`);
    if (res && res.id) {
      return transformBackendVisit(res);
    }
  } catch (err) {
    console.warn(`[getVisitDetail] Backend offline, using mock for ${visitId}:`, err);
  }

  const match = MOCK_SCHEDULED_VISITS.find((v) => v.id === visitId);
  return match || MOCK_SCHEDULED_VISITS[0];
}

/**
 * Fetch worker GPS track history and latest coordinates for a job
 */
export async function getWorkerLocationTrack(
  jobId: string
): Promise<{ latitude: number; longitude: number; recordedAt: string }[]> {
  try {
    const res = await http.get<any[]>(`/location/track/${jobId}`);
    if (Array.isArray(res) && res.length > 0) {
      return res.map((item: any) => ({
        latitude: item.latitude,
        longitude: item.longitude,
        recordedAt: item.recordedAt,
      }));
    }
  } catch (err) {
    console.warn(`[getWorkerLocationTrack] Backend offline for job ${jobId}, using simulated track:`, err);
  }

  // Simulated GPS track around Hayatabad, Peshawar
  return [
    { latitude: 33.9982, longitude: 71.4395, recordedAt: new Date().toISOString() },
  ];
}

function transformBackendVisit(v: any): ScheduledVisit {
  return {
    id: v.id,
    jobId: v.jobId || `job-${v.id}`,
    jobTitle: v.job?.title || "Home Repair & Inspection",
    jobTitleUr: "گھریلو مرمت اور معائنہ",
    category: v.job?.category?.name || "Plumbing",
    subCategory: "Emergency Repair",
    subCategoryUr: "ہنگامی مرمت",
    status: (v.status?.toLowerCase() as any) || "en_route",
    scheduledDate: v.scheduledDate || new Date().toISOString().split("T")[0],
    scheduledTimeSlot: "11:30 AM - 12:30 PM",
    etaMinutes: 12,
    remainingDistanceKm: 1.8,
    securityPin: "8492",
    visitCharges: Number(v.offer?.visitCharge || 350),
    escrowAmount: 350,
    customerAddress: v.job?.address || "House 42, Street 8, Phase 4, Hayatabad",
    customerArea: v.job?.area || "Hayatabad, Peshawar",
    customerAreaUr: "حیات آباد، پشاور",
    customerLat: Number(v.job?.latitude || 33.9982),
    customerLng: Number(v.job?.longitude || 71.4395),
    originLat: 34.0045,
    originLng: 71.477,
    technician: {
      id: v.workerId || "worker-1",
      name: v.worker?.name || "Kashif Afridi",
      nameUr: "کاشف آفریدی",
      businessName: "Afridi Quick Fixers",
      businessNameUr: "آفریدی کوئیک فکسرز",
      avatarUrl: v.worker?.avatarUrl || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
      phone: v.worker?.phone || "0300-1234567",
      rating: 4.9,
      totalReviews: 64,
      tradeCategory: "Licensed Plumber",
      tradeCategoryUr: "لائسنس یافتہ پلمبر",
      hunarBadgeId: "#HN-9021",
      vehicleModel: "Honda CD 70 (Red)",
      vehiclePlate: "PSH-8821",
      isCnicVerified: true,
      isBiometricChecked: true,
      currentLat: 34.0012,
      currentLng: 71.4421,
      speedKmh: 28,
    },
    currentStreetLandmark: "Passing Phase 3 Commercial Market",
    currentStreetLandmarkUr: "فیز 3 کمرشل مارکیٹ کے قریب",
    updatedAt: v.updatedAt || new Date().toISOString(),
    createdAt: v.createdAt || new Date().toISOString(),
  };
}
