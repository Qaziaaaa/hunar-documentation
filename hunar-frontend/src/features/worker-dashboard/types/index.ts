export type DashboardTab =
  | "dashboard"
  | "jobs"
  | "earnings"
  | "chat"
  | "profile";

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

export interface DashboardNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: "job" | "offer" | "commission" | "review" | "chat" | "verification";
  linkTab?: DashboardTab;
}
