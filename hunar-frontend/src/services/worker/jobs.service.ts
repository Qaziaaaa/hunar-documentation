import { http, getAccessToken } from "@/lib/api-client";
import type { Job, JobStatus, JobUrgency } from "@/types/job";

const NEARBY_STATUSES = ["OPEN", "OFFERS_RECEIVED", "RECEIVING_OFFERS"];
const HISTORY_STATUSES = [
  "COMPLETED",
  "PAID",
  "REVIEWED",
  "CANCELLED",
];

export function isActiveJob(status: JobStatus | string): boolean {
  const upper = String(status).toUpperCase();
  return !HISTORY_STATUSES.includes(upper) && upper !== "DISPUTED";
}

export function isHistoryJob(status: JobStatus | string): boolean {
  return HISTORY_STATUSES.includes(String(status).toUpperCase());
}

export function isNearbyJob(status: JobStatus | string): boolean {
  const upper = String(status).toUpperCase();
  return NEARBY_STATUSES.includes(upper);
}

interface BackendJobRow {
  id: string;
  customerId?: string;
  categoryId: string;
  category?: { id: string; name: string } | null;
  categoryName?: string;
  title: string;
  description?: string | null;
  images?: string[];
  voiceNoteUrl?: string | null;
  latitude?: number;
  longitude?: number;
  address?: string | null;
  city?: string | null;
  area?: string | null;
  status: string;
  urgency?: string | null;
  suggestedVisitCharge?: number | null;
  lockedVisitCharge?: number | null;
  preferredVisitTime?: string | null;
  createdAt?: string;
  postedTime?: string;
  updatedAt?: string;
  distanceKm?: number;
  offerCount?: number;
  repairEstimate?: number | null;
  repairCharge?: number | null;
  nextVisit?: { id: string; status?: string | null; scheduledDate?: string | null } | null;
  visits?: { id: string; status?: string | null }[];
  customer?: {
    id: string;
    name?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    rating?: number | null;
    reviewCount?: number | null;
    totalOrders?: number | null;
    isVerified?: boolean | null;
  };
  completedAt?: string | null;
  customerReview?: {
    rating: number;
    comment: string;
    date: string;
  } | null;
  visitCharge?: number | null;
  platformCommission?: number | null;
  workerNetEarnings?: number | null;
}

interface BackendPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function mapBackendJob(row: BackendJobRow): Job {
  const createdAt = row.createdAt ?? row.postedTime ?? new Date().toISOString();
  return {
    id: row.id,
    customerId: row.customerId ?? row.customer?.id ?? "",
    customer: row.customer && {
      id: row.customer.id,
      name: row.customer.name ?? undefined,
      avatarUrl: row.customer.avatarUrl ?? undefined,
      rating: row.customer.rating != null ? Number(row.customer.rating) : undefined,
      reviewCount: row.customer.reviewCount != null ? Number(row.customer.reviewCount) : undefined,
      totalOrders: row.customer.totalOrders != null ? Number(row.customer.totalOrders) : undefined,
      isVerified: row.customer.isVerified ?? true,
    },
    categoryId: row.categoryId,
    category:
      row.category ??
      (row.categoryName ? { id: row.categoryId, name: row.categoryName } : undefined),
    title: row.title,
    description: row.description ?? undefined,
    images: row.images ?? [],
    voiceNoteUrl: row.voiceNoteUrl ?? undefined,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    address: row.address ?? "",
    city: row.city ?? "",
    area: row.area ?? undefined,
    status: row.status as JobStatus,
    urgency: row.urgency as JobUrgency,
    suggestedVisitCharge: row.suggestedVisitCharge ?? undefined,
    lockedVisitCharge: row.lockedVisitCharge ?? undefined,
    preferredVisitTime: row.preferredVisitTime ?? undefined,
    createdAt,
    updatedAt: row.updatedAt ?? createdAt,
    completedAt: row.completedAt ?? undefined,
    customerReview: row.customerReview ?? undefined,
    distanceKm: row.distanceKm,
    offerCount: row.offerCount,
    repairEstimate: row.repairEstimate != null ? Number(row.repairEstimate) : undefined,
    repairCharge: row.repairCharge != null ? Number(row.repairCharge) : (row.repairEstimate != null ? Number(row.repairEstimate) : undefined),
    visitCharge: row.visitCharge != null ? Number(row.visitCharge) : (row.lockedVisitCharge != null ? Number(row.lockedVisitCharge) : (row.suggestedVisitCharge != null ? Number(row.suggestedVisitCharge) : undefined)),
    platformCommission: row.platformCommission != null ? Number(row.platformCommission) : undefined,
    workerNetEarnings: row.workerNetEarnings != null ? Number(row.workerNetEarnings) : undefined,
    nextVisit: row.nextVisit ?? row.visits?.[0] ?? undefined,
    visitId: row.nextVisit?.id ?? row.visits?.[0]?.id ?? undefined,
  };
}

export interface GetWorkerJobsOptions {
  page?: number;
  limit?: number;
}

export async function listWorkerJobs(options?: GetWorkerJobsOptions | unknown): Promise<Job[]> {
  if (!getAccessToken()) {
    return [];
  }
  try {
    const params = new URLSearchParams();
    if (typeof options === "object" && options !== null) {
      if ("page" in options && typeof (options as any).page === "number") {
        params.set("page", String((options as any).page));
      }
      if ("limit" in options && typeof (options as any).limit === "number") {
        params.set("limit", String((options as any).limit));
      }
    }
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const res = await http.get<any>(`/workers/me/jobs/active${queryStr}`);
    const items: BackendJobRow[] = Array.isArray(res)
      ? res
      : (res as any)?.data ?? (res as any)?.items ?? [];
    return items.map(mapBackendJob);
  } catch (err: any) {
    if (err?.status === 401) return [];
    throw err;
  }
}

export async function listWorkerHistoryJobs(options?: GetWorkerJobsOptions | unknown): Promise<Job[]> {
  if (!getAccessToken()) {
    return [];
  }
  try {
    const params = new URLSearchParams();
    if (typeof options === "object" && options !== null) {
      if ("page" in options && typeof (options as any).page === "number") {
        params.set("page", String((options as any).page));
      }
      if ("limit" in options && typeof (options as any).limit === "number") {
        params.set("limit", String((options as any).limit));
      }
    }
    const queryStr = params.toString() ? `?${params.toString()}` : "";
    const res = await http.get<any>(`/workers/me/jobs/history${queryStr}`);
    const items: BackendJobRow[] = Array.isArray(res)
      ? res
      : (res as any)?.data ?? (res as any)?.items ?? [];
    return items.map(mapBackendJob);
  } catch (err: any) {
    if (err?.status === 401) return [];
    throw err;
  }
}

export async function listNearbyJobs(location?: {
  lat: number;
  lng: number;
  radiusKm?: number;
}): Promise<Job[]> {
  if (!getAccessToken()) {
    return [];
  }
  const resolved = location ?? { lat: 33.98, lng: 71.43, radiusKm: 25 };
  const params = new URLSearchParams();
  params.set("lat", String(resolved.lat));
  params.set("lng", String(resolved.lng));
  params.set("radiusKm", String(resolved.radiusKm ?? 25));
  const res = await http.get<BackendPage<BackendJobRow> | BackendJobRow[]>(
    `/jobs/available?${params.toString()}`,
  );
  const items: BackendJobRow[] = Array.isArray(res)
    ? res
    : (res as any)?.items ?? (res as any)?.data ?? [];
  return (items ?? []).map(mapBackendJob);
}

export async function getWorkerJob(jobId: string): Promise<Job> {
  return mapBackendJob(await http.get<BackendJobRow>(`/jobs/${jobId}`));
}

export const queryKeys = {
  jobs: ["worker", "jobs"] as const,
  nearby: ["worker", "jobs", "nearby"] as const,
  job: (jobId: string) => ["worker", "jobs", jobId] as const,
};
