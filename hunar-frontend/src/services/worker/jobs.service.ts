import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type { Job, JobStatus, JobUrgency } from "@/types/job";
import { mockJobs } from "@/mocks/jobs.mock";

const NEARBY_STATUSES: JobStatus[] = ["OPEN", "OFFERS_RECEIVED"];
const HISTORY_STATUSES: JobStatus[] = [
  "COMPLETED",
  "PAID",
  "REVIEWED",
  "CANCELLED",
];

export function isActiveJob(status: JobStatus): boolean {
  return !HISTORY_STATUSES.includes(status) && status !== "DISPUTED";
}

export function isHistoryJob(status: JobStatus): boolean {
  return HISTORY_STATUSES.includes(status);
}

export function isNearbyJob(status: JobStatus): boolean {
  return NEARBY_STATUSES.includes(status);
}

interface BackendJobRow {
  id: string;
  customerId: string;
  categoryId: string;
  category?: { id: string; name: string } | null;
  title: string;
  description?: string | null;
  images?: string[];
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
  createdAt: string;
  updatedAt?: string;
  customer?: { id: string; name?: string | null; phone?: string | null };
}

interface BackendPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function mapBackendJob(row: BackendJobRow): Job {
  return {
    id: row.id,
    customerId: row.customerId,
    customer: row.customer && {
      id: row.customer.id,
      name: row.customer.name ?? undefined,
    },
    categoryId: row.categoryId,
    category: row.category ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    images: row.images ?? [],
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt ?? row.createdAt,
  };
}

export async function listWorkerJobs(): Promise<Job[]> {
  if (isMockMode()) {
    return simulateLatency([...mockJobs]);
  }
  const res = await http.get<BackendPage<BackendJobRow> | BackendJobRow[]>("/workers/me/jobs/active");
  const items = Array.isArray(res) ? res : res.items;
  return (items ?? []).map(mapBackendJob);
}

export async function listNearbyJobs(): Promise<Job[]> {
  if (isMockMode()) {
    return simulateLatency(
      mockJobs.filter((job) => isNearbyJob(job.status)),
    );
  }
  const res = await http.get<BackendPage<BackendJobRow> | BackendJobRow[]>("/jobs/available");
  const items = Array.isArray(res) ? res : res.items;
  return (items ?? []).map(mapBackendJob);
}

export async function getWorkerJob(jobId: string): Promise<Job> {
  if (isMockMode()) {
    const job = mockJobs.find((j) => j.id === jobId);
    if (!job) throw new Error(`JOB_NOT_FOUND:${jobId}`);
    return simulateLatency({ ...job });
  }
  return mapBackendJob(await http.get<BackendJobRow>(`/jobs/${jobId}`));
}

export const queryKeys = {
  jobs: ["worker", "jobs"] as const,
  nearby: ["worker", "jobs", "nearby"] as const,
  job: (jobId: string) => ["worker", "jobs", jobId] as const,
};
