import { apiClient, http } from "@/lib/api-client";
import type { PageMeta, PageResult, PaginationQuery } from "@/types/pagination";
import type {
  AdminKpiStats,
  AdminNotification,
  AuditLogEntry,
  CustomerUser,
  DisputeReport,
  JobDetailItem,
  JobsFunnelReport,
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
  email?: string | null;
  serviceAreas?: string[];
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
  rating?: number;
  suspendedUntil?: string | null;
  suspensionReason?: string | null;
  suspensionType?: "PERMANENT" | "TEMPORARY" | null;
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
  serviceAreas?: { label: string; address?: string | null }[];
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
  respondentRole?: string;
  type?: string;
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

  // Real timeline events only — no synthesized "Posted" row when the backend
  // has no events for this job (the jobs detail page shows an empty state).
  const auditTrail = timeline.map((t) => ({
    step: t.type.replace(/_/g, " "),
    actor: "Timeline Event",
    action: t.detail,
    timestamp: new Date(t.at).toLocaleString(),
  }));

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

const LEDGER_STATUS_MAP: Record<string, PaymentTransaction["status"]> = {
  COMMISSION_HELD: "ESCROW_HELD",
};

let commissionRatePromise: Promise<number> | null = null;

function getCommissionRate(): Promise<number> {
  if (!commissionRatePromise) {
    // Real setting or nothing: a failed settings fetch must NOT be papered over
    // with an invented 10% — callers surface the error instead. The promise is
    // cleared on failure so the next call retries.
    commissionRatePromise = adminApi
      .getSettings()
      .then((s) => {
        const rate = Number(s.commissionRate);
        if (!Number.isFinite(rate) || rate < 0) {
          throw new Error("Commission rate unavailable (settings fetch failed).");
        }
        return rate > 1 ? rate / 100 : rate;
      })
      .catch((err) => {
        commissionRatePromise = null;
        throw err;
      });
  }
  return commissionRatePromise;
}

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
    email: w.email ?? "",
    avatarUrl: w.avatarUrl ?? undefined,
    skills: skillsList,
    verificationStatus: verificationStatusMap[rawVStatus] ?? "PENDING",
    rating: 0,
    totalEarnings: Number(earningsVal),
    walletBalance: Number(walletVal),
    isOnline: profile?.isAvailable ?? w.isAvailable ?? false,
    joinDate: w.createdAt ? new Date(w.createdAt).toISOString().split("T")[0] : "",
    status: w.isActive ? "ACTIVE" : "SUSPENDED",
    experienceYears: profile?.experienceYears ?? w.experienceYears ?? 0,
    serviceCity: w.serviceAreas?.[0] ?? "",
    suspendedUntil: w.suspendedUntil ?? null,
    suspensionReason: w.suspensionReason ?? null,
    suspensionType: w.suspensionType ?? null,
  };
}

function toCustomerUser(c: BackendUserRow): CustomerUser {
  const jobsCount = c._count?.customerJobs ?? c.jobsCount ?? 0;
  return {
    id: c.id,
    name: c.name || c.phone || "Customer",
    phone: c.phone || "",
    email: c.email ?? "",
    avatarUrl: c.avatarUrl ?? undefined,
    joinDate: c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : "",
    jobsPosted: jobsCount,
    totalSpent: Number((c as any).totalSpent ?? 0),
    ratingGiven: Number((c as any).ratingGiven ?? 0),
    status: c.isActive ? "ACTIVE" : "SUSPENDED",
    suspendedUntil: c.suspendedUntil ?? null,
    suspensionReason: c.suspensionReason ?? null,
    suspensionType: c.suspensionType ?? null,
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
    serviceCity: v.serviceAreas?.[0]?.label ?? "",
    // Schema stores CNIC as document photos only — never a masked fake number.
    cnicNumber: "—",
    cnicFrontUrl: cnicFront?.url ?? "",
    cnicBackUrl: cnicBack?.url ?? "",
    submittedAt: v.submittedAt ?? v.verifiedAt ?? "",
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
    bankName: w.bankName ?? "—",
    accountNumber: w.accountNumber ?? "—",
    requestedAt: w.requestedAt ?? w.createdAt,
    status: (w.status as WithdrawalRequest["status"]) ?? "PENDING",
  };
}

function toDisputeReport(d: BackendDisputeRow): DisputeReport {
  const reporterObj = d.reporter ?? { id: "", name: "Reporter", phone: "" };
  const targetObj = d.respondent ?? d.target ?? { id: "", name: "Respondent", phone: "" };
  return {
    id: d.id,
    jobId: d.jobId,
    reporterId: reporterObj.id,
    reporterName: reporterObj.name ?? reporterObj.phone ?? "—",
    reporterRole: (d.reporterRole ? (d.reporterRole === "WORKER" ? "WORKER" : "CUSTOMER") : "CUSTOMER") as DisputeReport["reporterRole"],
    targetName: targetObj.name ?? targetObj.phone ?? "—",
    respondentId: targetObj.id || undefined,
    respondentRole: d.respondentRole ? (d.respondentRole === "WORKER" ? "WORKER" : "CUSTOMER") : undefined,
    issueCategory: d.type ?? "General",
    description: d.description ?? d.reason ?? "No details provided",
    evidenceUrls: [],
    status: (d.status as DisputeReport["status"]) ?? "OPEN",
    createdAt: d.createdAt,
    resolutionNotes: d.resolutionNotes ?? d.resolution ?? undefined,
  };
}

function toServiceCategory(c: any): ServiceCategory {
  return {
    id: c.id,
    name: c.name,
    iconName: "Wrench",
    activeWorkersCount: Number(c.activeWorkersCount ?? 0),
    totalJobsCount: Number(c.totalJobsCount ?? 0),
    isActive: c.isActive,
    // Real slabs only — categories without configured charges show an empty
    // state in the editor instead of invented Rs. 100–500 pricing.
    distanceSlabs: Array.isArray(c.distanceSlabs) ? c.distanceSlabs : [],
  };
}

function toAuditLogEntry(log: any): AuditLogEntry {
  let detailsStr = log.reason ?? "";
  let metaObj = log.metadata;

  if (typeof detailsStr === "string" && (detailsStr.startsWith("{") || detailsStr.startsWith("["))) {
    try {
      metaObj = JSON.parse(detailsStr);
    } catch {}
  }

  let formattedDetails = "";
  if (metaObj && typeof metaObj === "object") {
    if ("from" in metaObj && "to" in metaObj) {
      // Generic before → after (settings values, category renames, etc.).
      const fmt = (v: unknown) => {
        if (v === null || v === undefined) return "—";
        if (typeof v === "object") return (v as { name?: string }).name ?? JSON.stringify(v);
        return String(v);
      };
      formattedDetails = `${fmt(metaObj.from)} → ${fmt(metaObj.to)}`;
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
    PLATFORM_SETTING: "Setting",
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
}

export interface SuspendUserPayload {
  type: "PERMANENT" | "TEMPORARY";
  reason: string;
  violationType?: string;
  description: string;
  duration?:
    | "2_HOURS"
    | "6_HOURS"
    | "12_HOURS"
    | "1_DAY"
    | "3_DAYS"
    | "1_WEEK"
    | "2_WEEKS"
    | "1_MONTH";
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

  async getUnreadNotificationCount(): Promise<number> {
    try {
      const res = await http.get<{ meta?: PageMeta }>("/admin/notifications?isRead=false&limit=1");
      return res?.meta?.total ?? (Array.isArray(res) ? res.length : 0);
    } catch {
      return 0;
    }
  },

  async listNotifications(query: {
    isRead?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<PageResult<AdminNotification>> {
    const params = new URLSearchParams({ limit: String(query.limit ?? 50) });
    if (query.page) params.set("page", String(query.page));
    if (query.isRead !== undefined) params.set("isRead", String(query.isRead));
    const res = await http.get<{ data: AdminNotification[]; meta?: PageMeta }>(
      `/admin/notifications?${params.toString()}`,
    );
    return pageResult(res);
  },

  async markNotificationsRead(notificationIds: string[]): Promise<void> {
    if (notificationIds.length === 0) return;
    await http.put("/admin/notifications/read", { notificationIds });
  },

  async getJobsFunnelReport(
    range: { from?: string; to?: string } = {},
  ): Promise<JobsFunnelReport> {
    const params = new URLSearchParams();
    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);
    const qs = params.toString();
    return http.get<JobsFunnelReport>(
      `/admin/reports/jobs-funnel${qs ? `?${qs}` : ""}`,
    );
  },

  async getPendingVerificationCount(): Promise<number> {
    try {
      const res = await http.get<any>("/admin/verifications/pending");
      if (Array.isArray(res)) return res.length;
      return res?.data?.length ?? res?.meta?.total ?? 0;
    } catch {
      return 0;
    }
  },

  async getHealth(): Promise<{ status: string; db: string; redis: string }> {
    return http.get<{ status: string; db: string; redis: string }>("/health");
  },

  async freezeWallet(workerId: string, frozen: boolean, reason: string) {
    if (frozen) {
      return http.put(`/admin/wallet/${workerId}/freeze`, { reason });
    }
    return http.put(`/admin/wallet/${workerId}/unfreeze`);
  },

  async listJobs(query: PaginationQuery & { since?: string } = {}): Promise<PageResult<LiveJobItem>> {
    const params = new URLSearchParams({
      page: String(query.page ?? 1),
      limit: String(Math.min(query.limit ?? 50, 50)),
    });
    if (query.since) params.set("since", query.since);
    const res = await http.get<{ data: BackendJobRow[]; meta: PageMeta }>(
      `/admin/jobs?${params.toString()}`,
    );
    const items = (res?.data ?? (Array.isArray(res) ? res : [])).map(toLiveJobItem);
    const meta = res?.meta ?? { page: 1, limit: 50, total: items.length, totalPages: 1 };
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
    const items = (res?.data ?? (Array.isArray(res) ? res : [])).map((row) => ({
      ...toWorkerUser(row),
      rating: row.rating ?? 0,
    }));
    const meta = res?.meta ?? { page: 1, limit: 50, total: items.length, totalPages: 1 };
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
          rating: Number(res.stats?.ratingAverage ?? 0),
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
  async suspendWorker(workerId: string, payload: string | SuspendUserPayload) {
    const body =
      typeof payload === "string"
        ? { reason: payload, description: payload, type: "PERMANENT" }
        : payload;
    return http.put(`/admin/workers/${workerId}/suspend`, body);
  },

  async reactivateWorker(workerId: string) {
    return http.put(`/admin/workers/${workerId}/reactivate`);
  },

  async suspendCustomer(customerId: string, payload: string | SuspendUserPayload) {
    const body =
      typeof payload === "string"
        ? { reason: payload, description: payload, type: "PERMANENT" }
        : payload;
    return http.put(`/admin/customers/${customerId}/suspend`, body);
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
    const rate = await getCommissionRate();
    return rows.map((t: any) => {
      const amount = Math.abs(Number(t.amount || 0));
      const commission = Math.round(amount * rate);
      const netPayout = amount - commission;
      const owner = t.worker?.name ?? t.worker?.phone ?? "";
      const refType: string = t.referenceType ?? "";
      const isJob = refType.toLowerCase() === "job";
      const typeLabel = refType
        ? refType.charAt(0).toUpperCase() + refType.slice(1).toLowerCase()
        : "Wallet";

      return {
        id: t.id,
        jobId: isJob && t.referenceId ? t.referenceId : t.id.substring(0, 8),
        customerName: "—",
        workerName: owner || "—",
        amount,
        commission,
        netPayout,
        paymentMethod: typeLabel,
        status: LEDGER_STATUS_MAP[t.type] ?? "SUCCESS",
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
    return http.put(`/admin/categories/${id}/${active ? "activate" : "deactivate"}`);
  },

  async updateCategory(id: string, name: string) {
    return http.put(`/admin/categories/${id}`, { name });
  },

  async updateCategoryDistanceSlabs(id: string, distanceSlabs: any[]): Promise<ServiceCategory> {
    const updated = await http.put<any>(`/admin/categories/${id}`, { distanceSlabs });
    return toServiceCategory(updated);
  },

  async getSettings(): Promise<PlatformSettings> {
    // http.get returns the { success, data } envelope — unwrap before reading keys.
    const res = await http.get<Record<string, string> | { data: Record<string, string> }>(
      "/admin/settings",
    );
    const s: Record<string, string> =
      res && typeof res === "object" && "data" in res && res.data && typeof res.data === "object"
        ? res.data
        : (res as Record<string, string>) ?? {};
    const rate = Number(s.commissionRate ?? s.commission_rate ?? "0.10");
    const radius = Number(s.serviceRadiusKm ?? "10");
    const maxOffers = Number(s.maxActiveOffersPerWorker ?? "1");
    const maxNegative = Number(s.walletMaxNegativeBalance ?? "-500");
    return {
      // B2: legacy seed key is 'commission_rate'; canonical writes use 'commissionRate'.
      commissionRate: Number.isFinite(rate) ? rate : 0.1,
      defaultSearchRadiusKm: Number.isFinite(radius) && radius > 0 ? radius : 10,
      maxActiveOffersPerWorker:
        Number.isFinite(maxOffers) && maxOffers >= 1 ? Math.floor(maxOffers) : 1,
      walletMaxNegativeBalance: Number.isFinite(maxNegative)
        ? Math.round(maxNegative)
        : -500,
    };
  },

  async saveSettings(s: PlatformSettings) {
    // Bust the cached commission-rate promise so payments pages refetch it.
    commissionRatePromise = null;
    return http.put("/admin/settings", {
      commissionRate: s.commissionRate,
      serviceRadiusKm: String(s.defaultSearchRadiusKm),
      maxActiveOffersPerWorker: s.maxActiveOffersPerWorker,
      walletMaxNegativeBalance: s.walletMaxNegativeBalance,
    });
  },

  async listAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await http.get<{ data: any[]; meta: PageMeta }>(
      "/admin/audit?limit=50",
    );
    const rows = res?.data ?? (Array.isArray(res) ? res : []);
    return rows.map(toAuditLogEntry);
  },

  // Live dashboard: KPIs + lean workforce in one short-TTL-cached round trip.
  async getDashboardOverview(): Promise<{
    kpis: AdminKpiStats;
    workers: WorkerUser[];
  }> {
    const res = await http.get<{
      kpis: AdminKpiStats;
      workers?: Array<Partial<BackendUserRow> & { rating?: number }>;
    }>("/admin/dashboard/overview");
    const workers = (res?.workers ?? []).map((row) => ({
      ...toWorkerUser(row as BackendUserRow),
      rating: row.rating ?? 0,
    }));
    return { kpis: res.kpis, workers };
  },

  // Live dashboard: the four activity-table feeds in one request.
  async getDashboardActivity(): Promise<{
    withdrawals: WithdrawalRequest[];
    disputes: DisputeReport[];
    auditLogs: AuditLogEntry[];
    verifications: VerificationRequest[];
  }> {
    const res = await http.get<{
      withdrawals?: any[];
      disputes?: any[];
      auditLogs?: any[];
      verifications?: any[];
    }>("/admin/dashboard/activity");
    return {
      withdrawals: (res?.withdrawals ?? []).map(toWithdrawalRequest),
      disputes: (res?.disputes ?? []).map(toDisputeReport),
      auditLogs: (res?.auditLogs ?? []).map(toAuditLogEntry),
      verifications: (res?.verifications ?? []).map(toVerificationRequest),
    };
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

export async function fetchDashboardOverview(): Promise<{
  kpis: AdminKpiStats;
  workers: WorkerUser[];
}> {
  return adminApi.getDashboardOverview();
}

export async function fetchDashboardActivity(): Promise<{
  withdrawals: WithdrawalRequest[];
  disputes: DisputeReport[];
  auditLogs: AuditLogEntry[];
  verifications: VerificationRequest[];
}> {
  return adminApi.getDashboardActivity();
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

export async function fetchCommissionRate(): Promise<number> {
  return getCommissionRate();
}

export async function fetchCustomers(): Promise<CustomerUser[]> {
  const res = await adminApi.listCustomers({ limit: 50 });
  return res.items;
}
