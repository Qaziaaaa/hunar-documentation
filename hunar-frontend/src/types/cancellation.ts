export type CancellationStage = "before_visit" | "after_arrival";

export type CancellationReason =
  | "customer_unavailable"
  | "unsafe_conditions"
  | "wrong_job_info"
  | "parts_unavailable"
  | "customer_requested"
  | "other";

export interface CancelJobInput {
  jobId: string;
  stage: CancellationStage;
  reason: CancellationReason;
  note?: string;
  arrivedAt?: string;
}

export interface CancellationResult {
  jobId: string;
  status: "cancelled";
  message: string;
  workerCharged: boolean;
}