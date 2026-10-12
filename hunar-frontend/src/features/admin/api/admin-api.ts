import { apiClient, http } from "@/lib/api-client";
import type { PageMeta, PageResult, PaginationQuery } from "@/types/pagination";
import type {
  AdminKpiStats,
  AuditLogEntry,
  CustomerUser,
  DisputeReport,
  DistanceSlab,
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
import { MOCK_WORKERS, MOCK_CUSTOMERS } from "@/mocks/admin.mock";

interface BackendCategoryRow {
  id: string;
  name: string;
  nameUrdu?: string;
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
  address?: string;
  suggestedVisitCharge: string | null;
  lockedVisitCharge: string | null;
  category: { id: string; name: string; nameUrdu?: string };
  customer: { id: string; name: string | null; phone: string };
  selectedWorker?: { id: string; name: string | null; phone: string } | null;
  worker?: { id: string; name: string | null; phone: string } | null;
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
  workerProfile?: any;
  _count?: any;
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
  skills: { id?: string; name: string; nameUrdu?: string }[] | string[];
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
  workerId?: string;
  worker: { id: string; name: string | null; phone: string };
  amount: string;
  bankName?: string | null;
  accountNumber?: string | null;
  status: string;
  requestedAt?: string;
  createdAt: string;
}

interface BackendDisputeRow {
  id: string;
  jobId: string;
  reporter: { id: string; name: string | null; phone: string };
  reporterRole?: string;
  target?: { id: string; name: string | null; phone: string };
  respondent?: { id: string; name: string | null; phone: string };
  reason?: string;
  description?: string;
  status: string;
  resolutionNotes?: string | null;
  resolution?: string | null;
  createdAt: string;
  updatedAt: string;
}

function pageResult<T>(res: { data: T[]; meta?: PageMeta }): PageResult<T> {
  const items = Array.isArray(res) ? res : res?.data ?? [];
  const meta = (res as any)?.meta ?? { page: 1, limit: items.length, total: items.length, totalPages: 1 };
  return { items, meta };
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
  REVIEWED: "COMPLETED",
  CANCELLED: "CANCELLED",
  DISPUTED: "DISPUTED",
};

function toLiveJobItem(j: BackendJobRow): LiveJobItem {
  const workerObj = j.selectedWorker ?? j.worker;
  return {
    id: j.id,
    title: j.title,
    category: j.category?.name ?? "General",
    customerName: j.customer?.name ?? j.customer?.phone ?? "—",
    workerName: workerObj?.name ?? workerObj?.phone,
    amount: Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0),
    status: jobStatusMap[j.status] ?? "OPEN",
    city: j.city,
    createdAt: j.createdAt,
  };
}

function toJobDetailItem(raw: any): JobDetailItem {
  const j = raw.job ?? raw;
  const live = toLiveJobItem(j);
  const timeline: Array<{ at: string; type: string; detail: string }> = raw.timeline ?? [];
  
  const auditTrail = timeline.length > 0
    ? timeline.map((t) => ({
        step: t.type.replace(/_/g, " "),
        actor: "Timeline Event",
        action: t.detail,
        timestamp: new Date(t.at).toLocaleString(),
      }))
    : [
        {
          step: "Posted",
          actor: j.customer?.name ?? j.customer?.phone ?? "Customer",
          action: `Job "${j.title}" created`,
          timestamp: new Date(j.createdAt).toLocaleString(),
        },
      ];

  return {
    ...live,
    description: j.description ?? "",
    address: j.address || [j.area, j.city].filter(Boolean).join(", ") || "—",
    visitCharge: Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0),
    estimatedTotal: Number(j.lockedVisitCharge ?? j.suggestedVisitCharge ?? 0),
    auditTrail,
    cancelReason: j.cancelReason ?? undefined,
  };
}

const verificationStatusMap: Record<string, VerificationStatus> = {
  NOT_SUBMITTED: "PENDING",
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
  const profile = w.workerProfile;
  const rawVStatus = profile?.verificationStatus ?? w.verificationStatus ?? (w.isVerified ? "APPROVED" : "NOT_SUBMITTED");
  const rawSkills = profile?.skills && profile.skills.length > 0 ? profile.skills : (w.skills ?? []);
  const skillsList = rawSkills.map((s: any) =>
    typeof s === "object" && s !== null ? (s.name ?? String(s)) : String(s)
  );

  const earningsVal = (w as any).totalEarnings ?? profile?.totalEarnings ?? 0;
  const walletVal = (w as any).walletBalance ?? profile?.walletBalance ?? (w as any).wallet?.balance ?? 0;

  return {
    id: w.id,
    name: w.name || w.phone || "Worker",
    phone: w.phone || "",
    email: `${w.phone || w.id}@hunar.local`,
    avatarUrl: w.avatarUrl ?? undefined,
    skills: skillsList.length > 0 ? skillsList : ["Professional Worker"],
    verificationStatus: verificationStatusMap[rawVStatus] ?? "VERIFIED",
    rating: 5.0,
    totalEarnings: Number(earningsVal),
    walletBalance: Number(walletVal),
    isOnline: profile?.isAvailable ?? w.isAvailable ?? false,
    joinDate: w.createdAt ? new Date(w.createdAt).toISOString().split("T")[0] : "",
    status: w.isActive ? "ACTIVE" : "SUSPENDED",
    experienceYears: profile?.experienceYears ?? w.experienceYears ?? 0,
    serviceCity: "Peshawar",
  };
}

function toCustomerUser(c: BackendUserRow): CustomerUser {
  const jobsCount = c._count?.customerJobs ?? c.jobsCount ?? 0;
  return {
    id: c.id,
    name: c.name || c.phone || "Customer",
    phone: c.phone || "",
    email: `${c.phone || c.id}@hunar.local`,
    avatarUrl: c.avatarUrl ?? undefined,
    joinDate: c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "",
    jobsPosted: jobsCount,
    totalSpent: 0,
    ratingGiven: 5.0,
    status: c.isActive ? "ACTIVE" : "SUSPENDED",
  };
}

function toVerificationRequest(v: BackendVerificationRow): VerificationRequest {
  const cnicFront = v.documents?.find((d) => d.type === "CNIC_FRONT");
  const cnicBack = v.documents?.find((d) => d.type === "CNIC_BACK");
  const skillsList = Array.isArray(v.skills)
    ? v.skills.map((s) => (typeof s === "string" ? s : s.name))
    : [];

  return {
    id: v.userId,
    workerId: v.userId,
    workerName: v.name ?? v.phone,
    workerPhone: v.phone,
    workerAvatar: v.avatarUrl ?? undefined,
    skills: skillsList,
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
  const workerObj = w.worker ?? { id: w.workerId, name: "Worker", phone: "" };
  return {
    id: w.id,
    workerId: workerObj.id,
    workerName: workerObj.name ?? workerObj.phone ?? "Worker",
    amount: Number(w.amount),
    bankName: w.bankName ?? "JazzCash / EasyPaisa / Bank",
    accountNumber: w.accountNumber ?? "••••••••",
    requestedAt: w.requestedAt ?? w.createdAt,
    status: (w.status as WithdrawalRequest["status"]) ?? "PENDING",
  };
}

function toDisputeReport(d: BackendDisputeRow): DisputeReport {
  const reporterObj = d.reporter ?? { name: "Reporter", phone: "" };
  const targetObj = d.respondent ?? d.target ?? { name: "Respondent", phone: "" };
  return {
    id: d.id,
    jobId: d.jobId,
    reporterName: reporterObj.name ?? reporterObj.phone ?? "—",
    reporterRole: ((d.reporterRole ?? "CUSTOMER").toLowerCase() as DisputeReport["reporterRole"]) ?? "CUSTOMER",
    targetName: targetObj.name ?? targetObj.phone ?? "—",
    issueCategory: "General",
    description: d.description ?? d.reason ?? "No details provided",
    evidenceUrls: [],
    status: (d.status as DisputeReport["status"]) ?? "OPEN",
    createdAt: d.createdAt,
    resolutionNotes: d.resolutionNotes ?? d.resolution ?? undefined,
  };
}

const DEFAULT_DISTANCE_SLABS: DistanceSlab[] = [
  { minKm: 0, maxKm: 2, charge: 100, label: "0–2 KM" },
  { minKm: 2, maxKm: 5, charge: 200, label: "2–5 KM" },
  { minKm: 5, maxKm: 8, charge: 300, label: "5–8 KM" },
  { minKm: 8, maxKm: 12, charge: 400, label: "8–12 KM" },
  { minKm: 12, maxKm: 15, charge: 500, label: "12–15 KM" },
  { minKm: 15, maxKm: null, charge: null, requiresApproval: true, label: "15+ KM" },
];

function toServiceCategory(c: any): ServiceCategory {
  return {
    id: c.id,
    name: c.name,
    iconName: "Wrench",
    activeWorkersCount: 0,
    totalJobsCount: 0,
    isActive: c.isActive,
    distanceSlabs: (c.distanceSlabs && Array.isArray(c.distanceSlabs) && c.distanceSlabs.length > 0) ? c.distanceSlabs : DEFAULT_DISTANCE_SLABS,
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
    // B4: no more zero-filled fallback — callers render a real failure state.
    return http.get<AdminKpiStats>("/admin/kpis");
  },

  async listJobs(query: PaginationQuery = {}): Promise<PageResult<LiveJobItem>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(Math.min(query.limit ?? 50, 50)),
    });
    const res = await http.get<{ data: BackendJobRow[]; meta: PageMeta }>(
      `/admin/jobs?${params.toString()}`,
    );
    const items = (res?.data ?? (Array.isArray(res) ? res : [])).map(toLiveJobItem);
    const meta = res?.meta ?? { page: 1, limit: 50, total: items.length, totalPages: 1 };
    meta.total = items.length;
    return { items, meta };
  },

  async getJobDetail(jobId: string): Promise<JobDetailItem> {
    const raw = await http.get<any>(`/admin/jobs/${jobId}`);
    return toJobDetailItem(raw);
  },

  async cancelJob(jobId: string, reason: string) {
    return http.put(`/admin/jobs/${jobId}/cancel`, { reason });
  },

  async listWorkers(query: PaginationQuery = {}): Promise<PageResult<WorkerUser>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(Math.min(query.limit ?? 50, 50)),
    });
    const res = await http.get<{ data: BackendUserRow[]; meta: PageMeta }>(
      `/admin/workers?${params.toString()}`,
    );
    const items = (res?.data ?? (Array.isArray(res) ? res : [])).map(toWorkerUser);
    const meta = res?.meta ?? { page: 1, limit: 50, total: items.length, totalPages: 1 };
    meta.total = items.length;
    return { items, meta };
  },

  async listCustomers(query: PaginationQuery = {}): Promise<PageResult<CustomerUser>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(Math.min(query.limit ?? 50, 50)),
    });
    const res = await http.get<{ data: BackendUserRow[]; meta: PageMeta }>(
      `/admin/customers?${params.toString()}`,
    );
    const items = (res?.data ?? (Array.isArray(res) ? res : [])).map(toCustomerUser);
    const meta = res?.meta ?? { page: 1, limit: 50, total: items.length, totalPages: 1 };
    meta.total = items.length;
    return { items, meta };
  },

  async getWorkerDetail(workerId: string): Promise<any> {
    try {
      const res = await http.get<any>(`/admin/workers/${workerId}`);
      if (res && res.profile) {
        return {
          ...toWorkerUser({
            ...res.profile,
            skills: res.profile.skills?.map((s: any) => typeof s === "object" ? s.name : s) ?? [],
          }),
          bio: res.profile.bio,
          documents: res.documents ?? [],
          jobs: res.jobs ?? [],
          stats: res.stats ?? {},
          earnings: res.earnings ?? { total: 0 },
        };
      }
      return res;
    } catch (e) {
      console.warn(`Failed to fetch worker detail for ${workerId}`, e);
      throw e;
    }
  },

  async getCustomerDetail(customerId: string): Promise<any> {
    try {
      const res = await http.get<any>(`/admin/customers/${customerId}`);
      if (res && res.profile) {
        return {
          ...toCustomerUser(res.profile),
          jobs: res.jobs ?? [],
          stats: res.stats ?? {},
          payments: res.payments ?? [],
        };
      }
      return res;
    } catch (e) {
      console.warn(`Failed to fetch customer detail for ${customerId}`, e);
      throw e;
    }
  },

  async suspendWorker(workerId: string, reason?: string) {
    return http.put(`/admin/workers/${workerId}/suspend`, { reason: reason || "Suspended by admin" });
  },

  async reactivateWorker(workerId: string) {
    return http.put(`/admin/workers/${workerId}/reactivate`);
  },

  async suspendCustomer(customerId: string, reason?: string) {
    return http.put(`/admin/customers/${customerId}/suspend`, { reason: reason || "Suspended by admin" });
  },

  async reactivateCustomer(customerId: string) {
    return http.put(`/admin/customers/${customerId}/reactivate`);
  },

  async listVerifications(status: string | null = null): Promise<VerificationRequest[]> {
    const suffix = status ? (status === "PENDING" ? "pending" : `?status=${status}`) : "";
    const res = await http.get<any>(`/admin/verifications/${suffix}`.replace(/\/\?/, "?"));
    const rows: BackendVerificationRow[] = Array.isArray(res) ? res : (res?.data ?? []);
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
      "/admin/transactions?limit=50",
    );
    const rows = res?.data ?? (Array.isArray(res) ? res : []);
    return rows.map((t: any) => {
      const amount = Math.abs(Number(t.amount || 0));
      const commission = Math.round(amount * 0.10);
      const netPayout = amount - commission;
      const custName = t.customer?.name ?? t.customer?.phone ?? "Customer";
      const wrkName = t.worker?.name ?? t.worker?.phone ?? "Worker";

      return {
        id: t.id,
        jobId: t.referenceId || t.jobId || t.id.substring(0, 8),
        customerName: custName,
        workerName: wrkName,
        amount,
        commission,
        netPayout,
        paymentMethod: t.referenceType || "Direct Payout",
        status: "SUCCESS" as const,
        timestamp: t.timestamp || t.createdAt || new Date().toISOString(),
      };
    });
  },

  async listWithdrawals(): Promise<WithdrawalRequest[]> {
    const res = await http.get<{ data: BackendWithdrawalRow[]; meta: PageMeta }>(
      "/admin/withdrawals?limit=50",
    );
    const rows = res?.data ?? (Array.isArray(res) ? res : []);
    return rows.map(toWithdrawalRequest);
  },

  async processWithdrawal(id: string, action: "approve" | "reject", note?: string) {
    return http.put(`/admin/withdrawals/${id}/process`, { action, note });
  },

  async listVisits(query: PaginationQuery = {}): Promise<PageResult<any>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(Math.min(query.limit ?? 50, 50)),
    });
    const res = await http.get<{ data: any[]; meta: PageMeta }>(
      `/admin/visits?${params.toString()}`,
    );
    const items = res?.data ?? (Array.isArray(res) ? res : []);
    return { items, meta: res?.meta ?? { page: 1, limit: items.length, total: items.length, totalPages: 1 } };
  },

  async getVisitDetail(id: string) {
    return http.get<any>(`/admin/visits/${id}`);
  },

  async listReviews(query: PaginationQuery = {}): Promise<PageResult<any>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(Math.min(query.limit ?? 50, 50)),
    });
    const res = await http.get<{ data: any[]; meta: PageMeta }>(
      `/admin/reviews?${params.toString()}`,
    );
    const items = res?.data ?? (Array.isArray(res) ? res : []);
    return { items, meta: res?.meta ?? { page: 1, limit: items.length, total: items.length, totalPages: 1 } };
  },

  async toggleReviewVisibility(reviewId: string, isVisible?: boolean) {
    return http.put(`/admin/reviews/${reviewId}/visibility`, { isVisible });
  },

  async listDisputes(): Promise<DisputeReport[]> {
    const res = await http.get<{ data: BackendDisputeRow[]; meta: PageMeta }>(
      "/admin/disputes?limit=50",
    );
    const rows = res?.data ?? (Array.isArray(res) ? res : []);
    return rows.map(toDisputeReport);
  },

  async getDisputeDetail(disputeId: string): Promise<DisputeReport> {
    const row = await http.get<BackendDisputeRow>(`/admin/disputes/${disputeId}`);
    return toDisputeReport(row);
  },

  async resolveDispute(disputeId: string, action: string, resolution?: string) {
    return http.put(`/admin/disputes/${disputeId}/resolve`, { action, resolution });
  },

  async listCategories(): Promise<ServiceCategory[]> {
    const res = await http.get<any>("/admin/categories");
    const rows: BackendCategoryRow[] = Array.isArray(res) ? res : (res?.data ?? []);
    return rows.map(toServiceCategory);
  },

  async createCategory(name: string): Promise<ServiceCategory> {
    const created = await http.post<BackendCategoryRow>("/admin/categories", { name });
    return toServiceCategory(created);
  },

  async toggleCategory(id: string, active: boolean) {
    return http.put(`/admin/categories/${id}/deactivate`);
  },

  async updateCategory(id: string, name: string) {
    return http.put(`/admin/categories/${id}`, { name });
  },

  async updateCategoryDistanceSlabs(id: string, distanceSlabs: any[]): Promise<ServiceCategory> {
    const updated = await http.put<any>(`/admin/categories/${id}`, { distanceSlabs });
    return toServiceCategory(updated);
  },

  async getSettings(): Promise<PlatformSettings> {
    const s = await http.get<Record<string, string>>("/admin/settings");
    return {
      // B2: legacy seed key is 'commission_rate'; canonical writes use 'commissionRate'.
      commissionRate: Number(s.commissionRate ?? s.commission_rate ?? "0.10"),
      defaultSearchRadiusKm: Number(s.serviceRadiusKm ?? 10),
      maxActiveOffersPerWorker: 1,
      requireManualVerification: true,
      maintenanceMode: false,
    };
  },

  async saveSettings(s: PlatformSettings) {
    return http.put("/admin/settings", {
      commissionRate: s.commissionRate,
      serviceRadiusKm: String(s.defaultSearchRadiusKm),
    });
  },

  async listAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await http.get<{ data: any[]; meta: PageMeta }>(
      "/admin/audit?limit=50",
    );
    const rows = res?.data ?? (Array.isArray(res) ? res : []);
    return rows.map((log) => {
      let detailsStr = log.reason ?? "";
      let metaObj = log.metadata;

      if (typeof detailsStr === "string" && (detailsStr.startsWith("{") || detailsStr.startsWith("["))) {
        try {
          metaObj = JSON.parse(detailsStr);
        } catch {}
      }

      let formattedDetails = "";
      if (metaObj && typeof metaObj === "object") {
        if (metaObj.to && metaObj.from) {
          const fromName = metaObj.from?.name ?? "Category";
          const toName = metaObj.to?.name ?? "Updated Category";
          formattedDetails = `Category renamed from "${fromName}" to "${toName}"`;
        } else if (metaObj.name) {
          formattedDetails = `Category updated: "${metaObj.name}"`;
        } else if (metaObj.verificationStatus) {
          formattedDetails = `Worker verification set to ${metaObj.verificationStatus}`;
        } else if (metaObj.reason) {
          formattedDetails = String(metaObj.reason);
        } else if (metaObj.status) {
          formattedDetails = `Status changed to ${metaObj.status}`;
        } else {
          formattedDetails = log.action ? log.action.replace(/_/g, " ") : "Admin Action";
        }
      } else if (detailsStr && detailsStr !== "{}" && !detailsStr.startsWith("{")) {
        formattedDetails = detailsStr;
      } else {
        formattedDetails = log.action ? log.action.replace(/_/g, " ") : "Admin Action";
      }

      const typeMap: Record<string, string> = {
        SERVICE_CATEGORY: "Category",
        WORKER: "Worker",
        CUSTOMER: "Customer",
        JOB: "Job",
        PAYMENT: "Payment",
        USER: "User",
      };
      const label = log.targetType ? (typeMap[log.targetType] ?? log.targetType.replace(/_/g, " ")) : "System";
      const shortId = log.targetId ? (log.targetId.length > 8 ? log.targetId.substring(0, 8) : log.targetId) : "";
      const formattedTarget = shortId ? `${label} (${shortId})` : label;

      return {
        id: log.id,
        adminName: log.actorRole ?? "ADMIN",
        actionType: log.action ?? "ACTION",
        targetResource: formattedTarget,
        details: formattedDetails,
        timestamp: log.createdAt,
      };
    });
  },
};
// Read paths below used to swallow API errors and serve MOCK_*/zero data — the
// admin dashboard (client component since perf-sprint chunk 7) must show real
// failure states instead of invented numbers. Errors now propagate so callers
// show real failure states instead of invented numbers.
// Write paths keep their boolean contract (false = surfaced failure).

// Exported async helpers used by Server Components & Hooks
export async function fetchAdminKpis(): Promise<AdminKpiStats> {
  return adminApi.getKpis();
}

export async function fetchPendingVerifications(): Promise<VerificationRequest[]> {
  return adminApi.listVerifications("PENDING");
}

export async function approveWorkerVerification(userId: string): Promise<boolean> {
  try {
    await adminApi.decideVerification(userId, "APPROVED");
    return true;
  } catch {
    return false;
  }
}

export async function rejectWorkerVerification(userId: string, reason: string): Promise<boolean> {
  try {
    await adminApi.decideVerification(userId, "REJECTED", reason);
    return true;
  } catch {
    return false;
  }
}

export async function fetchRecentTransactions(): Promise<PaymentTransaction[]> {
  return adminApi.listTransactions();
}

export async function fetchWithdrawalRequests(): Promise<WithdrawalRequest[]> {
  return adminApi.listWithdrawals();
}

export async function processWithdrawalRequest(
  id: string,
  action: "approve" | "reject",
  note?: string,
): Promise<boolean> {
  try {
    await adminApi.processWithdrawal(id, action, note);
    return true;
  } catch {
    return false;
  }
}

export async function fetchDisputesQueue(): Promise<DisputeReport[]> {
  return adminApi.listDisputes();
}

export async function resolveDispute(
  id: string,
  action: "resolve" | "dismiss" | "escalate",
  resolutionNotes?: string,
): Promise<boolean> {
  try {
    await adminApi.resolveDispute(id, action, resolutionNotes);
    return true;
  } catch {
    return false;
  }
}

export async function fetchLiveJobsStream(): Promise<LiveJobItem[]> {
  const res = await adminApi.listJobs({ limit: 50 });
  return res.items;
}

export async function fetchAuditLogsFeed(): Promise<AuditLogEntry[]> {
  return adminApi.listAuditLogs();
}

export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  return adminApi.getSettings();
}

export async function updatePlatformSettings(
  settings: Partial<PlatformSettings>,
): Promise<boolean> {
  try {
    await adminApi.saveSettings(settings as PlatformSettings);
    return true;
  } catch {
    return false;
  }
}

export async function fetchTopWorkers(): Promise<WorkerUser[]> {
  const res = await adminApi.listWorkers({ limit: 50 });
  return res.items;
}

export async function fetchCustomers(): Promise<CustomerUser[]> {
  const res = await adminApi.listCustomers({ limit: 50 });
  return res.items;
}
