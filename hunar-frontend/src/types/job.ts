export type JobStatus =
  | "OPEN"
  | "OFFERS_RECEIVED"
  | "OFFER_ACCEPTED"
  | "WORKER_ASSIGNED"
  | "VISIT_SCHEDULED"
  | "VISIT_IN_PROGRESS"
  | "VISIT_COMPLETED"
  | "INSPECTION_DONE"
  | "REPAIR_NEGOTIATING"
  | "REPAIR_APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAID"
  | "REVIEWED"
  | "CANCELLED"
  | "DISPUTED"
  | "open"
  | "offer_sent"
  | "accepted"
  | "visit_in_progress"
  | "visit_completed"
  | "completed"
  | "customer_viewing"
  | "counter_received"
  | "inspecting"
  | "inspection_submitted"
  | "repair_negotiating"
  | "repair_approved"
  | "repair_in_progress"
  | "repair_declined"
  | "rejected"
  | "closed_assigned"
  | "cancelled";

export type VisitStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type JobCategoryName =
  | "Electrician"
  | "Plumber"
  | "AC Technician"
  | "Carpenter"
  | "Painter"
  | "Mechanic"
  | "Cleaning & Sanitary";

export type JobUrgency = "emergency" | "standard" | "flexible" | "LOW" | "NORMAL" | "HIGH" | "EMERGENCY";

export interface JobReference {
  id: string;
  title: string;
  status: JobStatus;
  city: string;
  area?: string;
}

export interface JobCategory {
  id: string;
  name: string;
}

export interface JobCustomer {
  id: string;
  name?: string;
  avatarUrl?: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  rating: number;
  totalReviews: number;
  avatarUrl?: string;
  area: string;
  isVerified: boolean;
}

export interface VoiceNoteAttachment {
  url: string;
  durationSeconds: number;
  waveform?: number[];
}

export interface JobLocation {
  area: string;
  city: string;
  distanceKm: number;
  fullAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface Job {
  id: string;
  customerId: string;
  customer?: JobCustomer;
  categoryId: string;
  category?: JobCategory;
  title: string;
  description?: string;
  images: string[];
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area?: string;
  status: JobStatus;
  urgency: JobUrgency;
  suggestedVisitCharge?: number;
  lockedVisitCharge?: number;
  preferredVisitTime?: string;
  cancelReason?: string;
  cancelledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobRequest {
  id: string;
  title: string;
  category: JobCategoryName;
  urgency: JobUrgency;
  problemSummary: string;
  description: string;
  location: JobLocation;
  postedAt: string;
  postedAgo: string;
  preferredVisitWindow: {
    date: string;
    timeSlot: string;
  };
  customerSuggestedPrice?: number;
  photos: string[];
  voiceNote?: VoiceNoteAttachment;
  customer: CustomerSummary;
  totalOffers: number;
  status: JobStatus;
  completedAt?: string;
  invoiceNumber?: string;
  customerReview?: {
    rating: number;
    comment: string;
    date: string;
  };
  visitCharge?: number;
  repairCharge?: number;
  platformCommission?: number;
  workerNetEarnings?: number;
  warrantyDays?: number;
  securityPin?: string;
  etaMinutes?: number;
}

export interface Visit {
  id: string;
  jobId: string;
  workerId: string;
  offerId: string;
  scheduledDate: string;
  actualDate?: string;
  status: VisitStatus;
  diagnosis?: string;
  repairPlan?: string;
  repairEstimate?: number;
  inspectionPhotos: string[];
  estimatedRepairTimeMin?: number;
  inspectionSubmittedAt?: string;
  createdAt: string;
}

export interface CreateVisitOfferInput {
  jobId: string;
  visitCharge: number;
  note?: string;
}

export interface JobFeedFilters {
  category: string;
  maxDistanceKm: number;
  area: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: "fresh_first" | "distance_nearest" | "price_highest";
  onlyWithoutOffers: boolean;
  hideFarJobs: boolean;
}
