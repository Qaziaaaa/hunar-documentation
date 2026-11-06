import { http } from "@/lib/api-client";
import {
  canWorkerAccept,
  canWorkerCounter,
  deriveNegotiationStatus,
  getMaxNegotiationRounds,
} from "@/lib/negotiation";
import type {
  NegotiationContext,
  Repair,
  RepairCounterInput,
  RepairEstimateInput,
  ScopeChangeRequestInput,
} from "@/types/repair";
import {
  loadRepairContext,
  type RepairContext,
} from "./repair.service";

export async function getNegotiationContext(
  jobId: string,
): Promise<NegotiationContext> {
  const ctx = await loadRepairContext(jobId);
  return buildNegotiationContext(ctx);
}

export async function submitEstimate(
  visitId: string,
  input: RepairEstimateInput,
): Promise<Repair> {
  return http.post<Repair>(`/visits/${visitId}/estimate`, input);
}

export async function acceptCounterOffer(
  repairId: string,
  amount?: number,
): Promise<Repair> {
  return http.put<Repair>(
    `/repairs/${repairId}/accept`,
    amount != null ? { amount } : undefined,
  );
}

export async function rejectCounterOffer(repairId: string): Promise<Repair> {
  return http.put<Repair>(`/repairs/${repairId}/reject`);
}

export async function sendCounterOffer(
  repairId: string,
  input: RepairCounterInput,
): Promise<Repair> {
  return http.put<Repair>(`/repairs/${repairId}/counter`, input);
}

export async function requestScopeChange(
  repairId: string,
  input: ScopeChangeRequestInput,
): Promise<Repair> {
  return http.post<Repair>(`/repairs/${repairId}/revision`, {
    amount: input.amount,
    reason: input.reason,
  });
}

export const queryKeys = {
  negotiation: (jobId: string) =>
    ["worker", "negotiation", jobId] as const,
};

function buildNegotiationContext(ctx: RepairContext): NegotiationContext {
  const { job, visit, repair } = ctx;
  const status = deriveNegotiationStatus(repair);
  const pendingRevision = repair.revisions.find(
    (r) => r.status === "PENDING_APPROVAL",
  );
  return {
    job,
    visit,
    repair,
    status,
    maxRounds: getMaxNegotiationRounds(),
    currentRound: repair.negotiationRound + 1,
    canCounter: canWorkerCounter(repair),
    canAccept: canWorkerAccept(repair),
    canReject: canWorkerAccept(repair),
    scopeChange: pendingRevision,
  };
}