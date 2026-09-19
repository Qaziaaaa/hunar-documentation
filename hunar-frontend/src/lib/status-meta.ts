import type { CommissionStatus } from "@/types/finance";
import type { JobStatus, VisitStatus } from "@/types/job";
import type { NegotiationStatus, RepairStatus } from "@/types/repair";

export type Tone =
  | "neutral"
  | "navy"
  | "teal"
  | "orange"
  | "success"
  | "danger";

export type RepairExecutionStatus =
  | "repair_not_started"
  | "repair_in_progress"
  | "completed"
  | "customer_confirmation_pending"
  | "customer_confirmed";

export interface ToneMapping {
  tone: Tone;
}

export function toneForText(
  tone: Tone,
  foreground: string,
): string {
  return `${foreground}`;
}

export const BADGE_TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  navy: "bg-navy/10 text-navy",
  teal: "bg-teal/10 text-teal",
  orange: "bg-orange/10 text-orange",
  success: "bg-success/10 text-success",
  danger: "bg-error/10 text-error",
};

export const DOT_TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  navy: "bg-navy",
  teal: "bg-teal",
  orange: "bg-orange",
  success: "bg-success",
  danger: "bg-error",
};

const JOB_STATUS_TONE: Record<JobStatus, Tone> = {
  OPEN: "navy",
  OFFERS_RECEIVED: "navy",
  OFFER_ACCEPTED: "teal",
  WORKER_ASSIGNED: "teal",
  VISIT_SCHEDULED: "teal",
  VISIT_IN_PROGRESS: "navy",
  VISIT_COMPLETED: "teal",
  INSPECTION_DONE: "teal",
  REPAIR_NEGOTIATING: "orange",
  REPAIR_APPROVED: "teal",
  IN_PROGRESS: "navy",
  COMPLETED: "success",
  PAID: "success",
  REVIEWED: "success",
  CANCELLED: "danger",
  DISPUTED: "danger",
};

const VISIT_STATUS_TONE: Record<VisitStatus, Tone> = {
  SCHEDULED: "teal",
  IN_PROGRESS: "navy",
  COMPLETED: "success",
  CANCELLED: "danger",
  NO_SHOW: "danger",
};

const REPAIR_STATUS_TONE: Record<RepairStatus, Tone> = {
  PROPOSED: "orange",
  COUNTERED: "orange",
  ACCEPTED: "success",
  REJECTED: "danger",
};

const NEGOTIATION_STATUS_TONE: Record<NegotiationStatus, Tone> = {
  estimate_submitted: "orange",
  customer_reviewing: "orange",
  customer_countered: "orange",
  worker_countered: "orange",
  accepted: "success",
  rejected: "danger",
  locked: "success",
  scope_change_requested: "orange",
  scope_change_pending: "orange",
  scope_change_approved: "success",
  scope_change_rejected: "danger",
};

const COMMISSION_STATUS_TONE: Record<CommissionStatus, Tone> = {
  PENDING: "orange",
  RECEIVED: "navy",
  VERIFIED: "success",
};

const REPAIR_EXECUTION_TONE: Record<RepairExecutionStatus, Tone> = {
  repair_not_started: "neutral",
  repair_in_progress: "navy",
  completed: "success",
  customer_confirmation_pending: "orange",
  customer_confirmed: "success",
};

export function jobStatusTone(status: JobStatus): Tone {
  return JOB_STATUS_TONE[status] ?? "neutral";
}

export function visitStatusTone(status: VisitStatus): Tone {
  return VISIT_STATUS_TONE[status] ?? "neutral";
}

export function repairStatusTone(status: RepairStatus): Tone {
  return REPAIR_STATUS_TONE[status] ?? "neutral";
}

export function negotiationStatusTone(status: NegotiationStatus): Tone {
  return NEGOTIATION_STATUS_TONE[status] ?? "neutral";
}

export function commissionStatusTone(status: CommissionStatus): Tone {
  return COMMISSION_STATUS_TONE[status] ?? "neutral";
}

export function repairExecutionTone(
  status: RepairExecutionStatus,
): Tone {
  return REPAIR_EXECUTION_TONE[status] ?? "neutral";
}

export function deriveRepairExecutionStatus(
  repair: {
    status: RepairStatus;
    startedAt?: string;
    completedAt?: string;
  },
  customerConfirmed?: boolean,
): RepairExecutionStatus {
  if (repair.completedAt) {
    return customerConfirmed ? "customer_confirmed" : "customer_confirmation_pending";
  }
  if (repair.startedAt) {
    return "repair_in_progress";
  }
  return "repair_not_started";
}