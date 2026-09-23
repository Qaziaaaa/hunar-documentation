import { http } from "@/lib/api-client";
import {
  canWorkerAccept,
  canWorkerCounter,
  deriveNegotiationStatus,
  getMaxNegotiationRounds,
} from "@/lib/negotiation";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type {
  NegotiationContext,
  Repair,
  RepairCounterInput,
  RepairEstimateInput,
  ScopeChangeRequestInput,
} from "@/types/repair";
import { mockRepairs } from "@/mocks/repairs.mock";
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
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    const repair: Repair = {
      id: `repair-${Date.now()}`,
      visitId,
      jobId: "",
      workerId: "worker-demo-1",
      description: input.description,
      amount: input.amount,
      itemsBreakdown: input.itemsBreakdown,
      status: "PROPOSED",
      negotiationRound: 0,
      negotiationHistory: [
        {
          by: "worker",
          amount: input.amount,
          note: input.description,
          timestamp: new Date().toISOString(),
        },
      ],
      revisions: [],
      createdAt: new Date().toISOString(),
    };
    return repair;
  }
  return http.post<Repair>(`/visits/${visitId}/estimate`, input);
}

export async function acceptCounterOffer(
  repairId: string,
  amount?: number,
): Promise<Repair> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    return patchMockRepair(repairId, {
      status: "ACCEPTED",
      lockedAmount: amount ?? currentAmount(repairId),
      lockedAt: new Date().toISOString(),
    });
  }
  return http.put<Repair>(
    `/repairs/${repairId}/accept`,
    amount != null ? { amount } : undefined,
  );
}

export async function rejectCounterOffer(repairId: string): Promise<Repair> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    return patchMockRepair(repairId, { status: "REJECTED" });
  }
  return http.put<Repair>(`/repairs/${repairId}/reject`);
}

export async function sendCounterOffer(
  repairId: string,
  input: RepairCounterInput,
): Promise<Repair> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    const current = mockRepairs.find((r) => r.id === repairId);
    if (!current) throw new Error("REPAIR_NOT_FOUND");
    const nextRound = current.negotiationRound + 1;
    const nextHistory = [
      ...current.negotiationHistory,
      {
        by: "worker" as const,
        amount: input.amount,
        note: input.note,
        timestamp: new Date().toISOString(),
      },
    ];
    return patchMockRepair(repairId, {
      amount: input.amount,
      status: "COUNTERED",
      negotiationRound: nextRound,
      negotiationHistory: nextHistory,
    });
  }
  return http.put<Repair>(`/repairs/${repairId}/counter`, input);
}

export async function requestScopeChange(
  repairId: string,
  input: ScopeChangeRequestInput,
): Promise<Repair> {
  if (isMockMode()) {
    await simulateLatency(undefined, 600, 1200);
    const current = mockRepairs.find((r) => r.id === repairId);
    if (!current) throw new Error("REPAIR_NOT_FOUND");
    const revision = {
      id: `revision-${Date.now()}`,
      repairId,
      proposedAmount: input.amount,
      reason: input.reason,
      status: "PENDING_APPROVAL" as const,
      requestedBy: "worker-demo-1",
      createdAt: new Date().toISOString(),
    };
    return patchMockRepair(repairId, {
      revisions: [...current.revisions, revision],
    });
  }
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

function currentAmount(repairId: string): number {
  const current = mockRepairs.find((r) => r.id === repairId);
  if (!current) throw new Error("REPAIR_NOT_FOUND");
  return current.amount;
}