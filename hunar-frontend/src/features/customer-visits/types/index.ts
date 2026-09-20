export type VisitStatus =
  | "dispatched"
  | "en_route"
  | "arrived"
  | "inspection_in_progress"
  | "completed"
  | "cancelled";

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
