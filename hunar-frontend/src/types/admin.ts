export type UserStatus = "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "CHANGES_REQUESTED";

export type JobStatus =
  | "OPEN"
  | "OFFERS_RECEIVING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED" | "ESCALATED";

export type WithdrawalStatus = "PENDING" | "PROCESSED" | "FAILED" | "REJECTED";

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
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  suspensionType?: "PERMANENT" | "TEMPORARY" | null;
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
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  suspensionType?: "PERMANENT" | "TEMPORARY" | null;
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

export interface JobAuditStep {
  step: string;
  actor: string;
  action: string;
  timestamp: string;
  notes?: string;
}

export interface JobDetailItem extends LiveJobItem {
  description: string;
  address: string;
  visitCharge: number;
  estimatedTotal: number;
  auditTrail: JobAuditStep[];
  cancelReason?: string;
}

export interface PaymentTransaction {
  id: string;
  jobId: string;
  customerName: string;
  workerName: string;
  amount: number;
  commission: number;
  netPayout: number;
  paymentMethod: string;
  status: "SUCCESS" | "ESCROW_HELD" | "REFUNDED";
  timestamp: string;
}

export interface WithdrawalRequest {
  id: string;
  workerId: string;
  workerName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  requestedAt: string;
  status: WithdrawalStatus;
}

export interface DisputeReport {
  id: string;
  jobId: string;
  reporterId?: string;
  reporterName: string;
  reporterRole: "CUSTOMER" | "WORKER";
  targetName: string;
  respondentId?: string;
  respondentRole?: "CUSTOMER" | "WORKER";
  issueCategory: string;
  description: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  createdAt: string;
  resolutionNotes?: string;
}

export interface DistanceSlab {
  minKm: number;
  maxKm: number | null;
  charge: number | null;
  label: string;
  requiresApproval?: boolean;
}

export interface ServiceCategory {
  id: string;
  name: string;
  nameUrdu?: string | null;
  imageUrl?: string | null;
  iconName: string;
  activeWorkersCount: number;
  totalJobsCount: number;
  isActive: boolean;
  sortOrder?: number;
  defaultVisitCharge?: number | null;
  distanceSlabs?: DistanceSlab[];
}

export interface CategoryFormValues {
  name: string;
  nameUrdu?: string;
  imageUrl?: string;
  sortOrder?: number;
  defaultVisitCharge?: number;
}

export interface PlatformSettings {
  commissionRate: number;
  defaultSearchRadiusKm: number;
  maxActiveOffersPerWorker: number;
  walletMaxNegativeBalance: number;
}

export interface AuditLogEntry {
  id: string;
  adminName: string;
  actionType: string;
  targetResource: string;
  details: string;
  timestamp: string;
}

export interface AdminNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface JobsFunnelReport {
  type: string;
  period: { from: string; to: string };
  data: {
    posted: number;
    offersReceived: number;
    accepted: number;
    completed: number;
    cancelled: number;
    conversionRate: string;
  };
}

export interface CityItem {
  id: string;
  name: string;
  nameUrdu?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  areasCount: number;
  workersCount: number;
  ordersCount: number;
  areas?: Array<{ id: string; name: string; nameUrdu?: string | null; isActive: boolean }>;
}

export interface AreaItem {
  id: string;
  name: string;
  nameUrdu?: string | null;
  cityId: string;
  cityName: string;
  city?: { id: string; name: string; nameUrdu?: string | null; isActive: boolean };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  workersCount: number;
  ordersCount: number;
}

