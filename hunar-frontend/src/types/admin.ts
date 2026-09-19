export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "CHANGES_REQUESTED";

export type JobStatus =
  | "OPEN"
  | "OFFERS_RECEIVING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export interface AdminKpiStats {
  totalJobs: number;
  openJobs: number;
  activeJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  totalCustomers: number;
  newCustomersThisWeek: number;
  totalWorkers: number;
  verifiedWorkers: number;
  pendingWorkers: number;
  suspendedWorkers: number;
  totalRevenue: number;
  totalPaymentsProcessed: number;
  activeNowCount: number;
}

export interface CustomerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  joinDate: string;
  jobsPosted: number;
  totalSpent: number;
  ratingGiven: number;
  status: UserStatus;
  internalNotes?: string;
}

export interface WorkerUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatarUrl?: string;
  skills: string[];
  verificationStatus: VerificationStatus;
  rating: number;
  totalEarnings: number;
  walletBalance: number;
  isOnline: boolean;
  joinDate: string;
  status: UserStatus;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  experienceYears: number;
  bio?: string;
  serviceCity: string;
}

export interface VerificationRequest {
  id: string;
  workerId: string;
  workerName: string;
  workerPhone: string;
  workerAvatar?: string;
  skills: string[];
  experienceYears: number;
  serviceCity: string;
  cnicNumber: string;
  cnicFrontUrl: string;
  cnicBackUrl: string;
  submittedAt: string;
  status: VerificationStatus;
  rejectionReason?: string;
}

export interface LiveJobItem {
  id: string;
  title: string;
  category: string;
  customerName: string;
  workerName?: string;
  amount: number;
  status: JobStatus;
  city: string;
  createdAt: string;
}
