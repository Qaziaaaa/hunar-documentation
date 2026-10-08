import { http, getAccessToken } from "@/lib/api-client";
import type { Job, JobStatus, JobUrgency } from "@/types/job";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import { mockJobs } from "@/mocks/jobs.mock";
import { getLocallyCreatedJobs } from "@/features/post-job/api/post-job-api";

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
  customer?: { id: string; name?: string | null; phone?: string | null };
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
    customerId: row.customerId ?? "",
    customer: row.customer && {
      id: row.customer.id,
      name: row.customer.name ?? undefined,
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
    distanceKm: row.distanceKm,
    offerCount: row.offerCount,
  };
}

export async function listWorkerJobs(): Promise<Job[]> {
  if (!getAccessToken()) {
    return [];
  }
  try {
    const res = await http.get<any>("/workers/me/jobs/active");
    const items: BackendJobRow[] = Array.isArray(res)
      ? res
      : (res as any)?.data ?? (res as any)?.items ?? [];
    return items.map(mapBackendJob);
  } catch (err: any) {
    if (err?.status === 401) return [];
    throw err;
  }
}

export async function listWorkerHistoryJobs(): Promise<Job[]> {
  if (!getAccessToken()) {
    return [];
  }
  try {
    const res = await http.get<any>("/workers/me/jobs/history");
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
  let list: Job[] = [];
  if (isMockMode()) {
    list = mockJobs.filter((job) => isNearbyJob(job.status));
  } else {
    const resolved = location ?? { lat: 33.98, lng: 71.43, radiusKm: 25 };
    const params = new URLSearchParams();
    params.set("lat", String(resolved.lat));
    params.set("lng", String(resolved.lng));
    params.set("radiusKm", String(resolved.radiusKm ?? 25));
    const res = await http.get<BackendPage<BackendJobRow> | BackendJobRow[]>(
      `/jobs/available?${params.toString()}`,
    );
    const items = Array.isArray(res) ? res : res.items;
    list = (items ?? []).map(mapBackendJob);
  }

  const localJobs = getLocallyCreatedJobs();
  const existingIds = new Set(list.map((j) => j.id));
  for (const lj of localJobs) {
    if (!existingIds.has(lj.id) && isNearbyJob(lj.status)) {
      list.unshift(lj);
    }
  }

  return isMockMode() ? simulateLatency(list) : list;
}

export async function getWorkerJob(jobId: string): Promise<Job> {
  const localJobs = getLocallyCreatedJobs();
  const local = localJobs.find((j) => j.id === jobId);
  if (local) return isMockMode() ? simulateLatency({ ...local }) : { ...local };

  if (isMockMode()) {
    const job = mockJobs.find((j) => j.id === jobId);
    if (!job) throw new Error(`JOB_NOT_FOUND:${jobId}`);
    return simulateLatency({ ...job });
  }

  try {
    return mapBackendJob(await http.get<BackendJobRow>(`/jobs/${jobId}`));
  } catch (e) {
    const fallback = mockJobs.find((j) => j.id === jobId);
    if (fallback) return fallback;
    throw e;
  }
}

export const queryKeys = {
  jobs: ["worker", "jobs"] as const,
  nearby: ["worker", "jobs", "nearby"] as const,
  job: (jobId: string) => ["worker", "jobs", jobId] as const,
};
