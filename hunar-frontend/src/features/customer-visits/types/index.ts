export type VisitStatus =
  | "dispatched"
  | "en_route"
  | "arrived"
  | "inspection_in_progress"
  | "completed"
  | "cancelled"
  | "scheduled"
  | "started"
  | "in_progress"
  | "approved"
  | "reviewed"
  | "paid";

export interface TechnicianInfo {
  id: string;
  name: string;
  nameUr?: string;
  businessName: string;
  businessNameUr?: string;
  avatarUrl: string;
  phone: string;
  rating: number;
  totalReviews: number;
  tradeCategory: string;
  tradeCategoryUr?: string;
  hunarBadgeId: string;
  vehicleModel: string;
  vehiclePlate: string;
  isCnicVerified: boolean;
  isBiometricChecked: boolean;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
}

export interface ScheduledVisit {
  id: string;
  jobId: string;
  jobTitle: string;
  jobTitleUr?: string;
  category: string;
  subCategory: string;
  subCategoryUr?: string;
  status: VisitStatus;
  scheduledDate: string;
  scheduledTimeSlot: string;
  etaMinutes: number;
  remainingDistanceKm: number;
  securityPin: string;
  visitCharges?: number;
  escrowAmount: number;
  customerAddress: string;
  customerArea: string;
  customerAreaUr?: string;
  customerLat: number;
  customerLng: number;
  originLat: number;
  originLng: number;
  originName?: string;
  originNameUr?: string;
  technician: TechnicianInfo;
  currentStreetLandmark: string;
  currentStreetLandmarkUr?: string;
  updatedAt: string;
  createdAt: string;
  workDescription?: string;
  workDescriptionUr?: string;
  photos?: string[];
  warrantyDays?: number;
}

export type TrackingStageId =
  | "UNASSIGNED"
  | "SCHEDULED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PREMISES"
  | "INSPECTION_DONE"
  | "COMPLETED"
  | "CANCELLED"
  | "UNKNOWN";

export interface TimelineStepInfo {
  id: string;
  label: string;
  labelUr: string;
  description: string;
  descriptionUr: string;
  status: "completed" | "current" | "upcoming";
  timestamp?: string | null;
}

export interface CustomerVisitTrackingData {
  jobId: string;
  jobTitle: string;
  jobTitleUr?: string;
  description?: string;
  category: string;
  categoryUr?: string;
  jobStatus: string;
  visitStatus?: string;
  urgency?: string;
  currentStageId: TrackingStageId;
  stageHeadline: string;
  stageHeadlineUr: string;
  stageExplanation: string;
  stageExplanationUr: string;
  nextStepText: string;
  nextStepTextUr: string;
  timelineSteps: TimelineStepInfo[];
  scheduledDate: string | null;
  scheduledTimeSlot: string | null;
  actualDate: string | null;
  visitCharges: number | null;
  customerAddress: string;
  customerArea: string;
  customerAreaUr?: string;
  customerCity?: string;
  customerLat: number | null;
  customerLng: number | null;
  technician: TechnicianInfo | null;
  workerLocation: {
    latitude: number;
    longitude: number;
    recordedAt?: string;
  } | null;
  isMapVisible: boolean;
  isDoorstepPendingOtp: boolean;
  doorstepOtp?: string | null;
  inspection: {
    diagnosis: string | null;
    repairPlan: string | null;
    repairEstimate: number | null;
    inspectionPhotos: string[];
    estimatedRepairTimeMin: number | null;
    submittedAt: string | null;
  } | null;
}
