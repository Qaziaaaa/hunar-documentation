import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type { PageResult } from "@/types/pagination";
import type { Repair } from "@/types/repair";
import type { Job, Visit } from "@/types/job";
import { mockVisits, mockJobs } from "@/mocks/jobs.mock";
import { mockRepairs } from "@/mocks/repairs.mock";

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
  if (isMockMode()) {
    const job = mockJobs.find((j) => j.id === jobId) ?? errorJobNotFound(jobId);
    const repair =
      mockRepairs.find((r) => r.jobId === jobId) ??
      errorRepairNotFound(jobId);
    const visit = mockVisits.find((v) => v.jobId === jobId);
    return simulateLatency({ job, visit, repair });
  }

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
  if (isMockMode()) {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    return simulateLatency(mockRepairs);
  }
  const page = await http.get<PageResult<Repair>>(
    `/repairs/my?limit=${query.limit ?? 50}`,
  );
  return page.items;
}

export async function startRepair(repairId: string): Promise<Repair> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    return patchMockRepair(repairId, {
      startedAt: new Date().toISOString(),
    });
  }
  return http.put<Repair>(`/repairs/${repairId}/start`);
}

export async function completeRepair(repairId: string): Promise<Repair> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    return patchMockRepair(repairId, {
      completedAt: new Date().toISOString(),
    });
  }
  return http.put<Repair>(`/repairs/${repairId}/complete`);
}

export const queryKeys = {
  repairs: ["worker", "repairs"] as const,
  repairByJob: (jobId: string) =>
    ["worker", "repairs", "by-job", jobId] as const,
};

function patchMockRepair(
  repairId: string,
  patch: Partial<Repair>,
): Repair {
  const index = mockRepairs.findIndex((r) => r.id === repairId);
  if (index < 0) throw new Error("REPAIR_NOT_FOUND");
  const updated = { ...mockRepairs[index], ...patch };
  mockRepairs[index] = updated;
  return updated;
}

function errorJobNotFound(jobId: string): never {
  throw new Error(`JOB_NOT_FOUND:${jobId}`);
}

function errorRepairNotFound(jobId: string): never {
  throw new Error(`REPAIR_NOT_FOUND_FOR_JOB:${jobId}`);
}