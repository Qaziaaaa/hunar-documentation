import type { JobReference, Visit } from "./job";

export type RepairStatus = "PROPOSED" | "COUNTERED" | "ACCEPTED" | "REJECTED";

export type RepairRevisionStatus = "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type NegotiationActor = "worker" | "customer";

export type NegotiationStatus =
  | "estimate_submitted"
  | "customer_reviewing"
  | "customer_countered"
  | "worker_countered"
  | "accepted"
  | "rejected"
  | "locked"
  | "scope_change_requested"
  | "scope_change_pending"
  | "scope_change_approved"
  | "scope_change_rejected";

export interface NegotiationEntry {
  by: NegotiationActor;
  amount: number;
  note?: string;
  timestamp: string;
}

export interface RepairEstimateInput {
  description: string;
  amount: number;
  itemsBreakdown?: Record<string, unknown>;
}

export interface RepairCounterInput {
  amount: number;
  note?: string;
}

export interface ScopeChangeRequestInput {
  repairId: string;
  amount: number;
  reason: string;
}

export interface RepairRevision {
  id: string;
  repairId: string;
  proposedAmount: number;
  reason: string;
  status: RepairRevisionStatus;
  requestedBy: string;
  createdAt: string;
  decidedAt?: string;
}

export interface Repair {
  id: string;
  visitId: string;
  jobId: string;
  workerId: string;
  description: string;
  amount: number;
  itemsBreakdown?: Record<string, unknown>;
  status: RepairStatus;
  negotiationRound: number;
  negotiationHistory: NegotiationEntry[];
  lockedAmount?: number;
  lockedAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  job?: JobReference;
  visit?: Visit;
  revisions: RepairRevision[];
}

export interface NegotiationContext {
  job: JobReference;
  visit?: Visit;
  repair: Repair;
  status: NegotiationStatus;
  maxRounds: number;
  currentRound: number;
  canCounter: boolean;
  canAccept: boolean;
  canReject: boolean;
  scopeChange?: RepairRevision;
}