import { http } from "@/lib/api-client";
import type { PageResult } from "@/types/pagination";
import type { Repair } from "@/types/repair";
import type { Job, Visit } from "@/types/job";

export interface RepairContext {
  job: Job;
  visit?: Visit;
  repair: Repair;
}

export interface RepairQuery {
  page?: number;
  limit?: number;
  status?: Repair["status"];
}

export async function loadRepairContext(
  jobId: string,
): Promise<RepairContext> {
  const job = await http.get<Job>(`/jobs/${jobId}`);
  const page = await http.get<PageResult<Repair>>(`/repairs/my?limit=100`);
  const repair =
    page.items.find((r) => r.jobId === jobId) ??
    errorRepairNotFound(jobId);
  let visit: Visit | undefined;
  try {
    visit = await http.get<Visit>(`/visits/${repair.visitId}`);
  } catch {
    // Visit may already be embedded in the repair payload.
  }
  return { job, visit, repair };
}

export async function listMyRepairs(query: RepairQuery = {}): Promise<Repair[]> {
  const page = await http.get<PageResult<Repair>>(
    `/repairs/my?limit=${query.limit ?? 50}`,
  );
  return page?.items ?? [];
}

export async function startRepair(repairId: string): Promise<Repair> {
  return http.put<Repair>(`/repairs/${repairId}/start`);
}

export async function completeRepair(repairId: string): Promise<Repair> {
  return http.put<Repair>(`/repairs/${repairId}/complete`);
}

export const queryKeys = {
  repairs: ["worker", "repairs"] as const,
  repairByJob: (jobId: string) =>
    ["worker", "repairs", "by-job", jobId] as const,
};

function errorRepairNotFound(jobId: string): never {
  throw new Error(`REPAIR_NOT_FOUND_FOR_JOB:${jobId}`);
}