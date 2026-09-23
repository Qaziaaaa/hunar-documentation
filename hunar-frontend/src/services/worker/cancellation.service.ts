import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type {
  CancellationResult,
  CancellationStage,
  CancelJobInput,
} from "@/types/cancellation";
import { mockJobs, mockVisits } from "@/mocks/jobs.mock";

export async function getJobCancellationStage(
  jobId: string,
): Promise<{ stage: CancellationStage; arrivedAt?: string }> {
  if (isMockMode()) {
    const visit = mockVisits.find((v) => v.jobId === jobId);
    const arrived = visit?.status === "IN_PROGRESS" || visit?.actualDate != null;
    return simulateLatency({
      stage: arrived ? "after_arrival" : "before_visit",
      arrivedAt: arrived ? visit?.actualDate : undefined,
    });
  }
  const job = await http.get<{ id: string; status: string }>(`/jobs/${jobId}`);
  const beforeVisit = [
    "OPEN",
    "OFFERS_RECEIVED",
    "OFFER_ACCEPTED",
    "WORKER_ASSIGNED",
    "VISIT_SCHEDULED",
  ].includes(job.status);
  return {
    stage: beforeVisit ? "before_visit" : "after_arrival",
  };
}

export async function cancelWorkerJob(
  input: CancelJobInput,
): Promise<CancellationResult> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    const job = mockJobs.find((j) => j.id === input.jobId);
    if (job) {
      job.status = "CANCELLED";
      job.cancelReason =
        input.reason === "other"
          ? input.note ?? input.reason
          : input.reason;
      job.cancelledAt = new Date().toISOString();
    }
    return {
      jobId: input.jobId,
      status: "cancelled",
      message: "Job cancelled.",
      workerCharged: false,
    };
  }
  const body =
    input.reason === "other"
      ? { reason: input.note ?? "other" }
      : { reason: input.reason };
  await http.put(`/jobs/${input.jobId}/cancel`, body);
  return {
    jobId: input.jobId,
    status: "cancelled",
    message: "Job cancelled.",
    workerCharged: false,
  };
}

export const queryKeys = {
  stage: (jobId: string) =>
    ["worker", "cancellation", jobId] as const,
};