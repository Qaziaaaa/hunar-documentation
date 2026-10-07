import { http } from "@/lib/api-client";
import type {
  CancellationResult,
  CancellationStage,
  CancelJobInput,
} from "@/types/cancellation";

export async function getJobCancellationStage(
  jobId: string,
): Promise<{ stage: CancellationStage; arrivedAt?: string }> {
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