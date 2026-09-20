export type JobStatus =
  | "receiving_offers"
  | "worker_selected"
  | "visit_scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface WorkerReview {
  id: string;
  customerName: string;
  customerArea: string;
  rating: number;
  date: string;
  comment: string;
}

export interface WorkerWorkProject {
  id: string;
  title: string;
  location: string;
  imageUrl: string;
}

export interface WorkerProfile {
  id: string;
  name: string;
  businessName?: string;
  avatarUrl: string;
  phone: string;
  rating: number;
  totalReviews: number;
  jobSuccessRate: number; // e.g. 98%
  completedJobsCount: number;
  responseTime: string; // e.g. "< 15m"
  tradeCategory: string;
  serviceArea: string;
  experienceYears: number;
  bio: string;
  isCnicVerified: boolean;
  isNadraCleared: boolean;
  isPoliceCleared: boolean;
  hunarBadgeId: string; // e.g. "#HN-4821"
  expertiseTags: string[];
  workProjects: WorkerWorkProject[];
  reviews: WorkerReview[];
  ratingBreakdown: {
    fiveStar: number; // percentage
    fourStar: number;
    threeStar: number;
    twoStar: number;
    oneStar: number;
  };
}

export interface WorkerOffer {
  id: string;
  jobId: string;
  worker: WorkerProfile;
  visitFee: number;
  estimatedArrival: string; // e.g. "Today, 2:30 PM (25 mins)"
  distanceKm: number;
  createdAt: string;
  note?: string;
}

export interface CustomerJob {
  id: string;
  title: string;
  category: string;
  subCategory: string;
  description: string;
  photos: string[];
  voiceNoteUrl?: string;
  voiceNoteDuration?: number;
  address: string;
  area: string;
  city: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  scheduleType: "asap" | "scheduled";
  preferredDate: string;
  preferredTimeSlot: string;
  status: JobStatus;
  createdAt: string;
  offers: WorkerOffer[];
  selectedOffer?: WorkerOffer;
  securityPin?: string; // 4-digit doorstep code, e.g. "6492"
}

export interface JobEvidencePhoto {
  id: string;
  type: "before" | "after";
  title: string;
  description: string;
  timestamp: string;
  imageUrl: string;
}

export interface ItemizedBillEntry {
  id: string;
  title: string;
  description: string;
  amount: number;
}

export interface JobCompletionData {
  jobId: string;
  jobNumber: string;
  serviceTitle: string;
  worker: WorkerProfile;
  completedAt: string;
  address: string;
  evidencePhotos: JobEvidencePhoto[];
  technicianReport: string;
  technicalSpecsNote?: string;
  warrantyDays: number;
  billingItems: ItemizedBillEntry[];
  totalAmount: number;
}
