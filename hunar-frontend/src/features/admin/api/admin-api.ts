import { http } from "@/lib/api-client";
import type { PageMeta, PageResult, PaginationQuery } from "@/types/pagination";
import type {
  AdminKpiStats,
  AuditLogEntry,
  CustomerUser,
  DisputeReport,
  JobDetailItem,
  LiveJobItem,
  PaymentTransaction,
  PlatformSettings,
  ServiceCategory,
  UserStatus,
  VerificationRequest,
  VerificationStatus,
  WorkerUser,
  WithdrawalRequest,
} from "@/types/admin";

interface BackendCategoryRow {
  id: string;
  name: string;
  nameUrdu: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

interface BackendJobRow {
  id: string;
  title: string;
  description: string | null;
  images: string[];
  status: string;
  urgency: string;
  city: string;
  area: string | null;
  suggestedVisitCharge: string | null;
  lockedVisitCharge: string | null;
  category: { id: string; name: string; nameUrdu: string };
  customer: { id: string; name: string | null; phone: string };
  worker: { id: string; name: string | null; phone: string } | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface BackendUserRow {
  id: string;
  phone: string;
  name: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  jobsCount: number;
  verificationStatus: string | null;
  experienceYears: number | null;
  skills: string[];
  isAvailable: boolean;
}

interface BackendVerificationRow {
  userId: string;
  name: string | null;
  phone: string;
  avatarUrl: string | null;
  verificationStatus: string;
  rejectionReason: string | null;
  adminNote: string | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  skills: { id: string; name: string; nameUrdu: string }[];
  experienceYears: number | null;
  bio: string | null;
  documents: { id: string; type: string; url: string }[];
}

interface BackendTransactionRow {
  id: string;
  type: string;
  amount: string;
  balanceAfter: string;
  referenceType: string;
  referenceId: string;
  note: string | null;
  worker: { id: string; name: string | null; phone: string };
  timestamp: string;
}

interface BackendWithdrawalRow {
  id: string;
  worker: { id: string; name: string | null; phone: string };
  amount: string;
  bankName?: string | null;
  accountNumber?: string | null;
  status: string;
  createdAt: string;
}

interface BackendDisputeRow {
  id: string;
  jobId: string;
  reporter: { id: string; name: string | null; phone: string };
  reporterRole: string;
  target: { id: string; name: string | null; phone: string };
  reason: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

function pageResult<T>(res: { data: T[]; meta: PageMeta }): PageResult<T> {
  return { items: res.data ?? [], meta: res.meta };
}

const jobStatusMap: Record<string, LiveJobItem["status"]> = {
  OPEN: "OPEN",
  OFFERS_RECEIVED: "OFFERS_RECEIVING",
  OFFER_ACCEPTED: "OFFERS_RECEIVING",
  WORKER_ASSIGNED: "IN_PROGRESS",
  VISIT_SCHEDULED: "IN_PROGRESS",
  VISIT_IN_PROGRESS: "IN_PROGRESS",
  INSPECTION_DONE: "IN_PROGRESS",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  PAID: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
};

function toLiveJobItem(j: BackendJobRow): LiveJobItem {
  return {
    id: j.id,
    title: j.title,
    category: j.category?.name ?? "Uncategorized",
    customerName: j.customer?.name ?? j.customer?.phone ?? "—",
    workerName: j.worker?.name ?? j.worker?.phone,
    amount: Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0),
    status: jobStatusMap[j.status] ?? "OPEN",
    city: j.city,
    createdAt: j.createdAt,
  };
}

function toJobDetailItem(j: BackendJobRow): JobDetailItem {
  return {
    ...toLiveJobItem(j),
    description: j.description ?? "",
    address: [j.area, j.city].filter(Boolean).join(", ") || "—",
    visitCharge: Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0),
    estimatedTotal: Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0),
    auditTrail: [
      {
        step: "Posted",
        actor: j.customer?.name ?? j.customer?.phone ?? "Customer",
        action: `Job "${j.title}" was created`,
        timestamp: j.createdAt,
      },
      ...(j.worker
        ? [
            {
              step: "Assigned",
              actor: j.worker.name ?? j.worker.phone,
              action: `Worker assigned at Rs. ${j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0}`,
              timestamp: j.completedAt ?? j.createdAt,
            },
          ]
        : []),
    ],
    cancelReason: j.cancelReason ?? undefined,
  };
}

const verificationStatusMap: Record<string, VerificationStatus> = {
  PENDING: "PENDING",
  APPROVED: "VERIFIED",
  REJECTED: "REJECTED",
  REQUEST_CHANGES: "CHANGES_REQUESTED",
  REVOKED: "REJECTED",
};

const userStatusMap: Record<string, UserStatus> = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
};

function toWorkerUser(w: BackendUserRow): WorkerUser {
  return {
    id: w.id,
    name: w.name ?? "Unnamed Worker",
    phone: w.phone,
    email: `${w.phone}@hunar.local`,
    avatarUrl: w.avatarUrl ?? undefined,
    skills: w.skills,
    verificationStatus: verificationStatusMap[w.verificationStatus ?? ""] ?? "PENDING",
    rating: 0,
    totalEarnings: 0,
    walletBalance: 0,
    isOnline: w.isAvailable,
    joinDate: w.createdAt,
    status: userStatusMap[w.isActive ? "ACTIVE" : "SUSPENDED"] ?? "ACTIVE",
    experienceYears: w.experienceYears ?? 0,
    serviceCity: "Peshawar",
  };
}

function toCustomerUser(c: BackendUserRow): CustomerUser {
  return {
    id: c.id,
    name: c.name ?? "Unnamed Customer",
    phone: c.phone,
    email: `${c.phone}@hunar.local`,
    avatarUrl: c.avatarUrl ?? undefined,
    joinDate: c.createdAt,
    jobsPosted: c.jobsCount,
    totalSpent: 0,
    ratingGiven: 0,
    status: userStatusMap[c.isActive ? "ACTIVE" : "SUSPENDED"] ?? "ACTIVE",
  };
}

function toVerificationRequest(v: BackendVerificationRow): VerificationRequest {
  const cnicFront = v.documents?.find((d: { type: string }) => d.type === "CNIC_FRONT");
  const cnicBack = v.documents?.find((d: { type: string }) => d.type === "CNIC_BACK");
  return {
    id: v.userId,
    workerId: v.userId,
    workerName: v.name ?? v.phone,
    workerPhone: v.phone,
    workerAvatar: v.avatarUrl ?? undefined,
    skills: (v.skills ?? []).map((s) => s.name),
    experienceYears: v.experienceYears ?? 0,
    serviceCity: "Peshawar",
    cnicNumber: "••••••••••••",
    cnicFrontUrl: cnicFront?.url ?? "",
    cnicBackUrl: cnicBack?.url ?? "",
    submittedAt: v.submittedAt ?? v.verifiedAt ?? new Date().toISOString(),
    status: verificationStatusMap[v.verificationStatus] ?? "PENDING",
    rejectionReason: v.rejectionReason ?? undefined,
  };
}

function toWithdrawalRequest(w: BackendWithdrawalRow): WithdrawalRequest {
  return {
    id: w.id,
    workerId: w.worker.id,
    workerName: w.worker.name ?? w.worker.phone,
    amount: Number(w.amount),
    bankName: w.bankName ?? "HBL",
    accountNumber: w.accountNumber ?? "••••••••",
    requestedAt: w.createdAt,
    status: (w.status as WithdrawalRequest["status"]) ?? "PENDING",
  };
}

function toDisputeReport(d: BackendDisputeRow): DisputeReport {
  return {
    id: d.id,
    jobId: d.jobId,
    reporterName: d.reporter?.name ?? d.reporter?.phone ?? "—",
    reporterRole: (d.reporterRole.toLowerCase() as DisputeReport["reporterRole"]) ?? "CUSTOMER",
    targetName: d.target?.name ?? d.target?.phone ?? "—",
    issueCategory: "General",
    description: d.reason,
    evidenceUrls: [],
    status: (d.status as DisputeReport["status"]) ?? "OPEN",
    createdAt: d.createdAt,
    resolutionNotes: d.resolutionNotes ?? undefined,
  };
}

function toServiceCategory(c: BackendCategoryRow): ServiceCategory {
  return {
    id: c.id,
    name: c.name,
    iconName: "Wrench",
    activeWorkersCount: 0,
    totalJobsCount: 0,
    isActive: c.isActive,
  };
}

export const adminApi = {
  async login(email: string, password: string) {
    return http.post<{
      accessToken: string;
      refreshToken?: string;
      user: { id: string; name?: string; email: string; role: "ADMIN" };
    }>("/auth/admin/login", { email, password });
  },

  async getKpis(): Promise<AdminKpiStats> {
    return http.get<AdminKpiStats>("/admin/kpis");
  },

  async listJobs(query: PaginationQuery = {}): Promise<PageResult<LiveJobItem>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 50),
    });
    const res = await http.get<{ data: BackendJobRow[]; meta: PageMeta }>(
      `/admin/jobs?${params.toString()}`,
    );
    return pageResult<LiveJobItem>({
      data: (res.data ?? []).map(toLiveJobItem),
      meta: res.meta,
    });
  },

  async getJobDetail(jobId: string): Promise<JobDetailItem> {
    const row = await http.get<BackendJobRow>(`/admin/jobs/${jobId}`);
    return toJobDetailItem(row);
  },

  async cancelJob(jobId: string, reason: string) {
    return http.put(`/admin/jobs/${jobId}/cancel`, { reason });
  },

  async listWorkers(query: PaginationQuery = {}): Promise<PageResult<WorkerUser>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 100),
    });
    const res = await http.get<{ data: BackendUserRow[]; meta: PageMeta }>(
      `/admin/workers?${params.toString()}`,
    );
    return pageResult<WorkerUser>({
      data: (res.data ?? []).map(toWorkerUser),
      meta: res.meta,
    });
  },

  async listCustomers(query: PaginationQuery = {}): Promise<PageResult<CustomerUser>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(query.limit ?? 100),
    });
    const res = await http.get<{ data: BackendUserRow[]; meta: PageMeta }>(
      `/admin/customers?${params.toString()}`,
    );
    return pageResult<CustomerUser>({
      data: (res.data ?? []).map(toCustomerUser),
      meta: res.meta,
    });
  },

  async suspendWorker(workerId: string) {
    return http.put(`/admin/workers/${workerId}/status`, { isActive: false });
  },

  async reactivateWorker(workerId: string) {
    return http.put(`/admin/workers/${workerId}/status`, { isActive: true });
  },

  async suspendCustomer(customerId: string, reason?: string) {
    return http.put(`/admin/customers/${customerId}/status`, { isActive: false, reason });
  },

  async reactivateCustomer(customerId: string) {
    return http.put(`/admin/customers/${customerId}/status`, { isActive: true });
  },

  async listVerifications(status: string | null = null): Promise<VerificationRequest[]> {
    const suffix = status ? (status === "PENDING" ? "pending" : `?status=${status}`) : "";
    const rows = await http.get<BackendVerificationRow[]>(`/admin/verifications/${suffix}`.replace(/\/\?/, "?"));
    return rows.map(toVerificationRequest);
  },

  async getVerificationDetail(userId: string): Promise<VerificationRequest> {
    const row = await http.get<BackendVerificationRow>(`/admin/verifications/${userId}`);
    return toVerificationRequest(row);
  },

  async decideVerification(userId: string, decision: string, reason?: string) {
    return http.put(`/admin/verifications/${userId}`, { decision, note: reason });
  },

  async listTransactions(): Promise<PaymentTransaction[]> {
    const res = await http.get<{ data: BackendTransactionRow[]; meta: PageMeta }>(
      "/admin/transactions?limit=100",
    );
    return (res.data ?? []).map((t) => ({
      id: t.id,
      jobId: t.referenceId,
      customerName: "—",
      workerName: t.worker?.name ?? t.worker?.phone ?? "—",
      amount: Number(t.amount),
      commission: 0,
      netPayout: Number(t.balanceAfter ?? t.amount ?? 0),
      paymentMethod: t.referenceType,
      status: "SUCCESS" as const,
      timestamp: t.timestamp,
    }));
  },

  async listWithdrawals(): Promise<WithdrawalRequest[]> {
    const res = await http.get<{ data: BackendWithdrawalRow[]; meta: PageMeta }>(
      "/admin/withdrawals?limit=100",
    );
    return (res.data ?? []).map(toWithdrawalRequest);
  },

  async processWithdrawal(id: string, decision: string) {
    return http.put(`/admin/withdrawals/${id}/process`, { decision });
  },

  async listDisputes(): Promise<DisputeReport[]> {
    const res = await http.get<{ data: BackendDisputeRow[]; meta: PageMeta }>(
      "/admin/disputes?limit=100",
    );
    return (res.data ?? []).map(toDisputeReport);
  },

  async getDisputeDetail(disputeId: string): Promise<DisputeReport> {
    const row = await http.get<BackendDisputeRow>(`/admin/disputes/${disputeId}`);
    return toDisputeReport(row);
  },

  async resolveDispute(disputeId: string, decision: string, notes?: string) {
    return http.put(`/admin/disputes/${disputeId}/resolve`, { decision, notes });
  },

  async listCategories(): Promise<ServiceCategory[]> {
    const rows = await http.get<BackendCategoryRow[]>("/admin/categories");
    return rows.map(toServiceCategory);
  },

  async createCategory(name: string): Promise<ServiceCategory> {
    const created = await http.post<BackendCategoryRow>("/admin/categories", { name });
    return toServiceCategory(created);
  },

  async toggleCategory(id: string, active: boolean) {
    return http.put(`/admin/categories/${id}`, { name: undefined, isActive: active });
  },

  async updateCategory(id: string, name: string) {
    return http.put(`/admin/categories/${id}`, { name });
  },

  async getSettings(): Promise<PlatformSettings> {
    const s = await http.get<{ commission_rate: string }>("/admin/settings");
    return {
      commissionRate: Number(s.commission_rate ?? "0.10"),
      defaultSearchRadiusKm: 10,
      maxActiveOffersPerWorker: 1,
      requireManualVerification: true,
      maintenanceMode: false,
    };
  },

  async saveSettings(s: PlatformSettings) {
    return http.put("/admin/settings", {
      commission_rate: String(s.commissionRate),
    });
  },

  async listAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await http.get<{ data: AuditLogEntry[]; meta: PageMeta }>(
      "/admin/audit?limit=100",
    );
    return (res.data ?? []).map((log) => ({
      id: log.id,
      adminName: log.adminName ?? "System",
      actionType: log.actionType ?? log.details ?? "ACTION",
      targetResource: log.targetResource ?? "—",
      details: log.details ?? "",
      timestamp: log.timestamp,
    }));
  },
};