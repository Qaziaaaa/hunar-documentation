import type {
  NegotiationActor,
  NegotiationEntry,
  NegotiationStatus,
  Repair,
} from "@/types/repair";
import { HUNAR_CONFIG } from "./config";

export function getMaxNegotiationRounds(): number {
  const configured = Number(process.env.NEXT_PUBLIC_MAX_NEGOTIATION_ROUNDS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : HUNAR_CONFIG.defaultMaxNegotiationRounds;
}

export function lastNegotiationActor(
  repair: Repair,
): NegotiationActor | undefined {
  const history = Array.isArray(repair.negotiationHistory)
    ? repair.negotiationHistory
    : [];
  return history.length > 0 ? history[history.length - 1]?.by : undefined;
}

export function lastNegotiationEntry(repair: Repair): NegotiationEntry | undefined {
  const history = Array.isArray(repair.negotiationHistory)
    ? repair.negotiationHistory
    : [];
  return history.length > 0 ? history[history.length - 1] : undefined;
}

export function deriveNegotiationStatus(repair: Repair): NegotiationStatus {
  const pendingRevision = Array.isArray(repair.revisions)
    ? repair.revisions.find((r) => r.status === "PENDING_APPROVAL")
    : undefined;
  const approvedRevision = Array.isArray(repair.revisions)
    ? repair.revisions.find((r) => r.status === "APPROVED")
    : undefined;
  const rejectedRevision = Array.isArray(repair.revisions)
    ? repair.revisions.find((r) => r.status === "REJECTED")
    : undefined;

  if (pendingRevision) {
    return "scope_change_pending";
  }
  if (approvedRevision) {
    return "scope_change_approved";
  }
  if (rejectedRevision) {
    return "scope_change_rejected";
  }
  if (repair.status === "ACCEPTED") {
    return repair.lockedAmount != null ? "locked" : "accepted";
  }
  if (repair.status === "REJECTED") {
    return "rejected";
  }
  const last = lastNegotiationActor(repair);
  if (last === "customer") {
    return "customer_countered";
  }
  if (last === "worker") {
    return "worker_countered";
  }
  return "estimate_submitted";
}

export function canWorkerCounter(repair: Repair): boolean {
  if (repair.status !== "PROPOSED" && repair.status !== "COUNTERED") {
    return false;
  }
  if (repair.negotiationRound >= getMaxNegotiationRounds()) {
    return false;
  }
  const last = lastNegotiationActor(repair);
  return last === "customer" || last === undefined || last === "worker";
}

export function canWorkerAccept(repair: Repair): boolean {
  if (repair.status !== "PROPOSED" && repair.status !== "COUNTERED") {
    return false;
  }
  return lastNegotiationActor(repair) === "customer";
}

export function roundsRemaining(repair: Repair): number {
  const used = repair.negotiationRound;
  return Math.max(getMaxNegotiationRounds() - used, 0);
}