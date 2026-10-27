export type DashboardTab =
  | "dashboard"
  | "jobs"
  | "earnings"
  | "wallet"
  | "notifications"
  | "chat"
  | "profile"
  | "reviews"
  | "settings";

export interface WorkerDashboardProfile {
  id: string;
  workerId: string;
  fullName: string;
  phone: string;
  avatarUrl?: string;
  isVerified: boolean;
  isOnline: boolean;
  rating: number;
  reviewCount: number;
  activeJobsCount: number;
  completedJobsCount: number;
  totalEarnings: number;
  totalCommissionPaid: number;
  pendingCommission: number;
  walletBalance: number;
  experienceYears: number;
  bio: string;
  skills: string[];
  serviceAreas: string[];
  city: string;
}

export interface CustomerBrief {
  firstName: string;
  fullName?: string;
  avatarUrl: string;
  rating: number;
  reviewCount?: number;
  totalOrders: number;
  isVerified?: boolean;
  memberSince?: string;
}

export interface VoiceNote {
  durationFormatted?: string;
  durationSeconds?: number;
  waveformPattern?: number[];
  audioUrl?: string;
}

export type JobRequestCategory =
  | "Electrician"
  | "Plumber"
  | "AC Technician"
  | "Carpenter"
  | "Painter"
  | "Home Cleaner"
  | "Mason / Mistri"
  | "Pest Control"
  | "Handyman"
  | "Solar Technician"
  | "Appliance Repair"
  | "Mechanic"
  | "Welder"
  | "CCTV & Security"
  | "Gardener"
  | "Movers & Packers"
  | (string & {});

export interface JobRequest {
  id: string;
  category: JobRequestCategory;
  categoryId?: string;
  rawCategory?: string;
  subCategory?: string;
  title: string;
  description: string;
  distance: string;
  locationArea: string;
  uploadedTime: string;
  postedTimestamp?: number;
  suggestedVisitCharge?: number;
  preferredTiming?: string;
  status: "OPEN" | "URGENT" | "OFFER_SENT" | "ASSIGNED";
  customer: CustomerBrief;
  images: string[];
  voiceNote?: VoiceNote;
}

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "job" | "offer" | "commission" | "review" | "chat" | "verification";
  linkTab?: DashboardTab;
}
