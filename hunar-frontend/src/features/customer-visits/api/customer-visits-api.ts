import { http } from "@/lib/api-client";
import { toLocalDateString } from "@/lib/format";
import { VisitStatus } from "@/features/customer-visits/types";
import { getJobDetail } from "@/features/customer-jobs/api/customer-jobs-api";
import type {
  ScheduledVisit,
  CustomerVisitTrackingData,
  TimelineStepInfo,
  TrackingStageId,
} from "../types";

const FALLBACK_IMAGE = "";

/**
 * Fetch all customer visits / bookings
 */
export async function getCustomerVisits(): Promise<ScheduledVisit[]> {
  const res = await http.get<any>("/visits/my");
  const rows = Array.isArray(res)
    ? res
    : res && Array.isArray((res as { items?: unknown[] }).items)
      ? (res as { items: unknown[] }).items
      : null;
  if (!rows) {
    throw new Error("INVALID_VISITS_RESPONSE");
  }
  return rows.map((item: any) => transformBackendVisit(item));
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
    jobTitleUr: job.titleUr || "گھریلو مرمت اور معائنہ",
    category: job.category?.name || job.category || "General Service",
    subCategory: job.subCategory?.name || job.subCategory || "",
    subCategoryUr: job.subCategoryUr || "",
    status: mapVisitStatus(v.status),
    scheduledDate:
      v.scheduledDate || v.scheduledAt || toLocalDateString(),
    scheduledTimeSlot: v.scheduledTimeSlot || v.timeSlot || "",
    etaMinutes: Number(v.etaMinutes || v.estimatedArrivalMinutes || 0),
    remainingDistanceKm: Number(v.remainingDistanceKm || 0),
    securityPin: v.securityPin || v.pin,
    visitCharges: Number(v.offer?.visitCharge || v.visitCharge || v.lockedVisitCharge || 0),
    escrowAmount: Number(v.offer?.visitCharge || v.visitCharge || v.lockedVisitCharge || 0),
    customerAddress: job.address || v.customerAddress || "",
    customerArea: job.area || v.customerArea || "",
    customerAreaUr: job.areaUr || v.customerAreaUr || "",
    customerLat: Number(job.latitude || v.customerLat || 0),
    customerLng: Number(job.longitude || v.customerLng || 0),
    originLat: Number(v.originLat || 0),
    originLng: Number(v.originLng || 0),
    technician: {
      id: v.workerId || worker.id || "worker-unknown",
      name: worker.name || "Technician",
      nameUr: worker.name || "ٹیکنیشن",
      businessName: worker.businessName,
      businessNameUr: worker.businessName,
      avatarUrl: worker.avatarUrl || worker.avatar || "",
      phone: worker.phone || "",
      rating: Number(worker.rating || 0),
      totalReviews: Number(worker.totalReviews || 0),
      tradeCategory: worker.tradeCategory || "Technician",
      tradeCategoryUr: worker.tradeCategory || "ٹیکنیشن",
      hunarBadgeId: worker.hunarBadgeId || (worker.id ? `#OW-${worker.id.slice(0, 4).toUpperCase()}` : ""),
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
  switch (status?.toUpperCase()) {
    case "SCHEDULED":
      return "scheduled";
    case "EN_ROUTE":
    case "DISPATCHED":
      return "en_route";
    case "ARRIVED":
      return "arrived";
    case "STARTED":
      return "started";
    case "IN_PROGRESS":
      return "in_progress";
    case "COMPLETED":
      return "completed";
    case "CANCELLED":
      return "cancelled";
    case "APPROVED":
      return "approved";
    case "REVIEWED":
      return "reviewed";
    case "PAID":
      return "paid";
    default:
      return "scheduled";
  }
}

/**
 * Resolves the precise UI stage and timeline steps from backend job and visit statuses.
 * NEVER marks a stage completed unless confirmed by backend data.
 * NEVER shows future stages as active.
 */
export function resolveVisitTrackingStage(params: {
  jobStatus?: string;
  visitStatus?: string;
  isDoorstepPendingOtp?: boolean;
  hasInspectionSubmitted?: boolean;
  scheduledDate?: string | null;
  startedAt?: string | null;
  arrivedAt?: string | null;
  inspectionSubmittedAt?: string | null;
  completedAt?: string | null;
  hasValidWorkerCoordinates?: boolean;
}): {
  currentStageId: TrackingStageId;
  stageHeadline: string;
  stageHeadlineUr: string;
  stageExplanation: string;
  stageExplanationUr: string;
  nextStepText: string;
  nextStepTextUr: string;
  timelineSteps: TimelineStepInfo[];
  isMapVisible: boolean;
} {
  const normJobStatus = (params.jobStatus || "").toUpperCase();
  const normVisitStatus = (params.visitStatus || "").toUpperCase();
  const isPendingOtp = Boolean(params.isDoorstepPendingOtp);
  const isInspectionSubmitted = Boolean(params.hasInspectionSubmitted);

  // 1. Cancelled
  if (normJobStatus === "CANCELLED" || normVisitStatus === "CANCELLED") {
    return {
      currentStageId: "CANCELLED",
      stageHeadline: "Visit Cancelled",
      stageHeadlineUr: "وزٹ منسوخ کر دیا گیا ہے",
      stageExplanation: "This service request or visit has been cancelled.",
      stageExplanationUr: "یہ سروس بکنگ منسوخ کر دی گئی ہے۔",
      nextStepText: "You can post a new request anytime if you still need assistance.",
      nextStepTextUr: "اگر آپ کو دوبارہ سروس کی ضرورت ہو تو نیا آرڈر پوسٹ کر سکتے ہیں۔",
      timelineSteps: createTimelineSteps({
        activeStage: "CANCELLED",
        ...params,
      }),
      isMapVisible: false,
    };
  }

  // 2. Unassigned (job open or offers received)
  if (normJobStatus === "OPEN" || normJobStatus === "OFFERS_RECEIVED") {
    return {
      currentStageId: "UNASSIGNED",
      stageHeadline: "Technician Assignment Pending",
      stageHeadlineUr: "کاریگر کا تقرر زیر التواء ہے",
      stageExplanation: "Your request has been published. We are waiting to accept a verified technician's offer.",
      stageExplanationUr: "آپ کی درخواست شائع ہو چکی ہے اور کاریگروں کی پیشکشیں موصول ہو رہی ہیں۔",
      nextStepText: "Review incoming technician offers on your job page to confirm your visit.",
      nextStepTextUr: "اپنے وزٹ کی تصدیق کے لیے جاب پیج پر کاریگر کی پیشکش قبول کریں۔",
      timelineSteps: createTimelineSteps({
        activeStage: "UNASSIGNED",
        ...params,
      }),
      isMapVisible: false,
    };
  }

  // 3. Completed (Job completed, paid, or reviewed)
  if (["COMPLETED", "PAID", "REVIEWED"].includes(normJobStatus)) {
    return {
      currentStageId: "COMPLETED",
      stageHeadline: "Visit & Service Completed",
      stageHeadlineUr: "وزٹ اور سروس کامیابی سے مکمل ہو گئی ہے",
      stageExplanation: "The technician has completed the visit and service work.",
      stageExplanationUr: "کاریگر نے وزٹ اور سروس کا کام کامیابی سے مکمل کر دیا ہے۔",
      nextStepText: "Thank you for using Orderworker. Please leave a review to support your technician.",
      nextStepTextUr: "آرڈر ورکر استعمال کرنے کا شکریہ۔ کاریگر کے کام کا ریویو ضرور دیں۔",
      timelineSteps: createTimelineSteps({
        activeStage: "COMPLETED",
        ...params,
      }),
      isMapVisible: false,
    };
  }

  // 4. Inspection submitted
  if (normJobStatus === "INSPECTION_DONE" || isInspectionSubmitted) {
    return {
      currentStageId: "INSPECTION_DONE",
      stageHeadline: "Inspection Report Submitted",
      stageHeadlineUr: "معائنہ رپورٹ جمع کر دی گئی ہے",
      stageExplanation: "The technician has completed the on-site inspection and submitted their diagnostic findings.",
      stageExplanationUr: "کاریگر نے موقع پر معائنہ مکمل کر کے تشخیص رپورٹ جمع کر دی ہے۔",
      nextStepText: "Review the technician's diagnosis below.",
      nextStepTextUr: "نیچے کاریگر کی تشخیص اور رپورٹ دیکھیں۔",
      timelineSteps: createTimelineSteps({
        activeStage: "INSPECTION_DONE",
        ...params,
      }),
      isMapVisible: false,
    };
  }

  // 5. In-premises inspection in progress (Doorstep OTP verified, technician admitted)
  if (
    normJobStatus === "VISIT_COMPLETED" ||
    (normVisitStatus === "COMPLETED" && !isPendingOtp)
  ) {
    return {
      currentStageId: "IN_PREMISES",
      stageHeadline: "Technician Inside Premises — Inspection in Progress",
      stageHeadlineUr: "کاریگر احاطے کے اندر موجود ہے — معائنہ جاری ہے",
      stageExplanation: "The technician has arrived, identity verified, and is currently diagnosing the fault on-site.",
      stageExplanationUr: "کاریگر پہنچ چکا ہے، شناختی کوڈ کی تصدیق ہو گئی ہے اور اب وہ خرابی کا معائنہ کر رہا ہے۔",
      nextStepText: "The technician will inspect the issue and submit their diagnostic report.",
      nextStepTextUr: "کاریگر معائنہ مکمل کر کے اپنی تشخیصی رپورٹ پیش کرے گا۔",
      timelineSteps: createTimelineSteps({
        activeStage: "IN_PREMISES",
        ...params,
      }),
      isMapVisible: false,
    };
  }

  // 6. Arrived at Doorstep (OTP pending verification)
  if (isPendingOtp) {
    return {
      currentStageId: "ARRIVED",
      stageHeadline: "Technician Arrived at Doorstep",
      stageHeadlineUr: "کاریگر آپ کی دہلیز پر پہنچ چکا ہے!",
      stageExplanation: "The technician is outside your premises. Please verify the Doorstep PIN to grant entry.",
      stageExplanationUr: "کاریگر آپ کے پتے پر پہنچ چکا ہے۔ احاطے میں داخلے کی اجازت دینے کے لیے 4 ہندسوں کا دہلیز PIN درج کریں۔",
      nextStepText: "Enter the 4-digit Doorstep PIN provided by the technician to admit them inside.",
      nextStepTextUr: "کاریگر کی جانب سے دیا گیا 4 ہندسوں کا پن کوڈ درج کریں۔",
      timelineSteps: createTimelineSteps({
        activeStage: "ARRIVED",
        ...params,
      }),
      isMapVisible: false,
    };
  }

  // 7. En Route (technician heading to customer)
  if (
    normJobStatus === "VISIT_IN_PROGRESS" ||
    normVisitStatus === "IN_PROGRESS" ||
    normVisitStatus === "EN_ROUTE"
  ) {
    return {
      currentStageId: "EN_ROUTE",
      stageHeadline: "Technician Heading to Your Location",
      stageHeadlineUr: "کاریگر آپ کے پتے کی طرف روانہ ہے",
      stageExplanation: "The technician has started their trip and is en route to your service address.",
      stageExplanationUr: "کاریگر نے سفر شروع کر دیا ہے اور آپ کے پتے پر پہنچنے والا ہے۔",
      nextStepText: "Be prepared to receive the technician and verify their 4-digit Doorstep PIN upon arrival.",
      nextStepTextUr: "آمد پر کاریگر سے 4 ہندسوں کا تصدیقی پن کوڈ طلب کریں۔",
      timelineSteps: createTimelineSteps({
        activeStage: "EN_ROUTE",
        ...params,
      }),
      isMapVisible: Boolean(params.hasValidWorkerCoordinates),
    };
  }

  // 8. Scheduled & Confirmed (default for assigned workers before travel starts)
  return {
    currentStageId: "SCHEDULED",
    stageHeadline: "Visit Confirmed & Scheduled",
    stageHeadlineUr: "وزٹ کی تصدیق ہو گئی ہے اور شیڈول کر دیا گیا ہے",
    stageExplanation: "Your visit is confirmed. The technician will begin travel to your location at the scheduled time.",
    stageExplanationUr: "آپ کی بکنگ کی تصدیق ہو چکی ہے۔ کاریگر مقررہ وقت پر آپ کے پتے کے لیے روانہ ہوگا۔",
    nextStepText: "Live tracking will activate as soon as the technician begins traveling.",
    nextStepTextUr: "کاریگر کے سفر شروع کرتے ہی لائیو ٹریکنگ فعال ہو جائے گی۔",
    timelineSteps: createTimelineSteps({
      activeStage: "SCHEDULED",
      ...params,
    }),
    isMapVisible: false,
  };
}

function createTimelineSteps(params: {
  activeStage: TrackingStageId;
  scheduledDate?: string | null;
  startedAt?: string | null;
  arrivedAt?: string | null;
  inspectionSubmittedAt?: string | null;
  completedAt?: string | null;
}): TimelineStepInfo[] {
  const stageOrder: TrackingStageId[] = [
    "SCHEDULED",
    "EN_ROUTE",
    "ARRIVED",
    "IN_PREMISES",
    "COMPLETED",
  ];

  let currentIdx = -1;
  if (params.activeStage === "UNASSIGNED") {
    currentIdx = -1;
  } else if (params.activeStage === "SCHEDULED") {
    currentIdx = 0;
  } else if (params.activeStage === "EN_ROUTE") {
    currentIdx = 1;
  } else if (params.activeStage === "ARRIVED") {
    currentIdx = 2;
  } else if (params.activeStage === "IN_PREMISES") {
    currentIdx = 3;
  } else if (params.activeStage === "INSPECTION_DONE" || params.activeStage === "COMPLETED") {
    currentIdx = 4;
  }

  const stepConfigs = [
    {
      id: "step-scheduled",
      label: "Visit Scheduled",
      labelUr: "شیڈول وزٹ",
      description: "Confirmed with technician",
      descriptionUr: "کاریگر کے ساتھ تصدیق شدہ",
      timestamp: params.scheduledDate,
    },
    {
      id: "step-en-route",
      label: "Heading to Location",
      labelUr: "کاریگر روانہ",
      description: "Technician en route",
      descriptionUr: "کاریگر راستے میں ہے",
      timestamp: params.startedAt,
    },
    {
      id: "step-arrived",
      label: "Doorstep Arrival",
      labelUr: "دہلیز پر آمد",
      description: "Doorstep PIN verification",
      descriptionUr: "دہلیز پن کوڈ کی تصدیق",
      timestamp: params.arrivedAt,
    },
    {
      id: "step-inspection",
      label: "On-Site Inspection",
      labelUr: "آن سائٹ معائنہ",
      description: "Diagnosing fault on-site",
      descriptionUr: "موقع پر خرابی کی جانچ",
      timestamp: params.inspectionSubmittedAt,
    },
    {
      id: "step-completed",
      label: "Visit Completed",
      labelUr: "وزٹ مکمل",
      description: "Inspection & visit finished",
      descriptionUr: "معائنہ اور وزٹ مکمل",
      timestamp: params.completedAt,
    },
  ];

  return stepConfigs.map((step, idx) => {
    let status: "completed" | "current" | "upcoming" = "upcoming";

    if (params.activeStage === "COMPLETED") {
      status = "completed";
    } else if (currentIdx === -1) {
      status = idx === 0 ? "current" : "upcoming";
    } else if (idx < currentIdx) {
      status = "completed";
    } else if (idx === currentIdx) {
      status = "current";
    } else {
      status = "upcoming";
    }

    return {
      ...step,
      status,
      timestamp: status === "completed" || status === "current" ? step.timestamp : null,
    };
  });
}

/**
 * High-reliability fetcher for singular job tracking.
 * Queries /jobs/:jobId, /visits/:jobId, and /location/track/:jobId
 * to reconcile the authoritative visit state.
 */
export async function getCustomerJobVisitTracking(
  jobId: string,
  options?: {
    isDoorstepPendingOtp?: boolean;
    doorstepOtp?: string | null;
  }
): Promise<CustomerVisitTrackingData> {
  const [jobRes, visitRes, trackRes] = await Promise.allSettled([
    getJobDetail(jobId),
    http.get<any>(`/visits/${jobId}`),
    getWorkerLocationTrack(jobId),
  ]);

  if (jobRes.status === "rejected") {
    throw jobRes.reason;
  }

  const job = jobRes.value;
  const visit = visitRes.status === "fulfilled" && visitRes.value?.id ? visitRes.value : null;
  const tracks = trackRes.status === "fulfilled" && Array.isArray(trackRes.value) ? trackRes.value : [];
  const latestTrack = tracks.length > 0 ? tracks[tracks.length - 1] : null;

  // Derive genuine worker coordinates
  const rawWorkerLat = Number(
    latestTrack?.latitude ?? visit?.currentLat ?? visit?.worker?.currentLat ?? 0
  );
  const rawWorkerLng = Number(
    latestTrack?.longitude ?? visit?.currentLng ?? visit?.worker?.currentLng ?? 0
  );
  const hasValidWorkerCoords = rawWorkerLat !== 0 && rawWorkerLng !== 0;

  const workerLocation = hasValidWorkerCoords
    ? {
        latitude: rawWorkerLat,
        longitude: rawWorkerLng,
        recordedAt: latestTrack?.recordedAt,
      }
    : null;

  // Resolve customer address and coordinates
  const customerLat = Number(visit?.customerLat ?? (job as any).latitude ?? 0) || null;
  const customerLng = Number(visit?.customerLng ?? (job as any).longitude ?? 0) || null;
  const customerAddress = visit?.customerAddress || job.address || "";
  const customerArea = (job as any).area || "";

  // Resolve technician
  const workerObj = visit?.worker || (job as any).selectedWorker || null;
  const technician = workerObj
    ? {
        id: workerObj.id,
        name: workerObj.name || "Technician",
        nameUr: workerObj.name || "ٹیکنیشن",
        businessName: workerObj.businessName || "Professional Technician",
        businessNameUr: workerObj.businessNameUr || "پیشہ ور کاریگر",
        avatarUrl: workerObj.avatarUrl || workerObj.avatar || null,
        phone: workerObj.phone || null,
        rating: Number(workerObj.rating || 0),
        totalReviews: Number(workerObj.totalReviews || 0),
        tradeCategory: workerObj.tradeCategory || job.category || "Technician",
        tradeCategoryUr: workerObj.tradeCategoryUr || "ٹیکنیشن",
        hunarBadgeId: workerObj.id
          ? `#OW-${workerObj.id.slice(0, 4).toUpperCase()}`
          : "",
        isCnicVerified: Boolean(workerObj.isCnicVerified),
        vehicleModel: visit?.vehicleModel || "",
        vehiclePlate: visit?.vehiclePlate || "",
        isBiometricChecked: Boolean(visit?.isBiometricChecked),
        currentLat: rawWorkerLat,
        currentLng: rawWorkerLng,
        speedKmh: Number(visit?.speedKmh || 0),
      }
    : null;

  const rawJobStatus = (job as any).status || "";
  const rawVisitStatus = visit?.status || "";
  const hasInspectionSubmitted = Boolean(
    visit?.inspectionSubmittedAt || rawJobStatus === "INSPECTION_DONE"
  );

  const stageResult = resolveVisitTrackingStage({
    jobStatus: rawJobStatus,
    visitStatus: rawVisitStatus,
    isDoorstepPendingOtp: options?.isDoorstepPendingOtp,
    hasInspectionSubmitted,
    scheduledDate: visit?.scheduledDate || (job as any).preferredDate || null,
    startedAt: visit?.actualDate || null,
    arrivedAt: null,
    inspectionSubmittedAt: visit?.inspectionSubmittedAt || null,
    completedAt: (job as any).completedAt || null,
    hasValidWorkerCoordinates: hasValidWorkerCoords && customerLat !== null && customerLng !== null,
  });

  const inspectionData =
    hasInspectionSubmitted || stageResult.currentStageId === "IN_PREMISES"
      ? {
          diagnosis: visit?.diagnosis || null,
          repairPlan: visit?.repairPlan || null,
          repairEstimate: visit?.repairEstimate ? Number(visit.repairEstimate) : null,
          inspectionPhotos: Array.isArray(visit?.inspectionPhotos) ? visit.inspectionPhotos : [],
          estimatedRepairTimeMin: visit?.estimatedRepairTimeMin
            ? Number(visit.estimatedRepairTimeMin)
            : null,
          submittedAt: visit?.inspectionSubmittedAt || null,
        }
      : null;

  return {
    jobId: job.id,
    jobTitle: job.title,
    description: job.description,
    category: job.category,
    categoryUr: (job as any).categoryUr,
    jobStatus: rawJobStatus,
    visitStatus: rawVisitStatus,
    urgency: (job as any).urgency,
    currentStageId: stageResult.currentStageId,
    stageHeadline: stageResult.stageHeadline,
    stageHeadlineUr: stageResult.stageHeadlineUr,
    stageExplanation: stageResult.stageExplanation,
    stageExplanationUr: stageResult.stageExplanationUr,
    nextStepText: stageResult.nextStepText,
    nextStepTextUr: stageResult.nextStepTextUr,
    timelineSteps: stageResult.timelineSteps,
    scheduledDate: visit?.scheduledDate || (job as any).preferredDate || null,
    scheduledTimeSlot: visit?.scheduledTimeSlot || (job as any).preferredTimeSlot || null,
    actualDate: visit?.actualDate || null,
    visitCharges:
      Number(visit?.visitCharges || visit?.offer?.visitCharge || (job as any).lockedVisitCharge || (job as any).suggestedVisitCharge || 0) || null,
    customerAddress,
    customerArea,
    customerAreaUr: (job as any).areaUr,
    customerCity: (job as any).city,
    customerLat,
    customerLng,
    technician,
    workerLocation,
    isMapVisible: stageResult.isMapVisible,
    isDoorstepPendingOtp: Boolean(options?.isDoorstepPendingOtp),
    doorstepOtp: options?.doorstepOtp || null,
    inspection: inspectionData,
  };
}
