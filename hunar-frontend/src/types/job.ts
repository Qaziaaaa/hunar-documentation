export type JobCategory =
  | "Electrician"
  | "Plumber"
  | "AC Technician"
  | "Carpenter"
  | "Painter"
  | "Mechanic"
  | "Cleaning & Sanitary";

export type JobUrgency = "emergency" | "standard" | "flexible";

export type JobStatus =
  | "open"
  | "offer_sent"
  | "customer_viewing"
  | "counter_received"
  | "accepted"
  | "visit_in_progress"
  | "visit_completed"
  | "inspecting"
  | "inspection_submitted"
  | "repair_negotiating"
  | "repair_approved"
  | "repair_in_progress"
  | "repair_declined"
  | "completed"
  | "rejected"
  | "closed_assigned"
  | "cancelled";

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
  area: string; // e.g. "Hayatabad Phase 3, Peshawar"
  city: string; // "Peshawar"
  distanceKm: number; // e.g. 1.8
  fullAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface JobRequest {
  id: string;
  title: string;
  category: JobCategory;
  urgency: JobUrgency;
  problemSummary: string;
  description: string;
  location: JobLocation;
  postedAt: string; // ISO string or relative helper
  postedAgo: string; // "12 mins ago"
  preferredVisitWindow: {
    date: string; // "Today, 24 Oct"
    timeSlot: string; // "11:30 AM - 01:00 PM"
  };
  customerSuggestedPrice?: number; // Rs.
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

export interface JobFeedFilters {
  category: string; // "all" or specific JobCategory
  maxDistanceKm: number; // e.g. 5, 10, 20
  area: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy: "fresh_first" | "distance_nearest" | "price_highest";
  onlyWithoutOffers: boolean;
  hideFarJobs: boolean;
}
