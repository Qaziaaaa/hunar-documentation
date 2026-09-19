import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type { Job, JobStatus } from "@/types/job";
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

export async function listWorkerJobs(): Promise<Job[]> {
  if (isMockMode()) {
    return simulateLatency([...mockJobs]);
  }
  return http.get<Job[]>(`/jobs/my`);
}

export async function listNearbyJobs(): Promise<Job[]> {
  if (isMockMode()) {
    return simulateLatency(
      mockJobs.filter((job) => isNearbyJob(job.status)),
    );
  }
  return http.get<Job[]>(`/jobs/available`);
}

export async function getWorkerJob(jobId: string): Promise<Job> {
  if (isMockMode()) {
    const job = mockJobs.find((j) => j.id === jobId);
    if (!job) throw new Error(`JOB_NOT_FOUND:${jobId}`);
    return simulateLatency({ ...job });
  }
  return http.get<Job>(`/jobs/${jobId}`);
}

export const queryKeys = {
  jobs: ["worker", "jobs"] as const,
  nearby: ["worker", "jobs", "nearby"] as const,
  job: (jobId: string) => ["worker", "jobs", jobId] as const,
};
