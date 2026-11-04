import { http } from "@/lib/api-client";
import { getMaxNegotiationRounds } from "@/lib/negotiation";
import type { VisitOffer } from "@/types/offer";

interface BackendOfferRow {
  id: string;
  jobId: string;
  job?: {
    id: string;
    title: string;
    area: string | null;
    city: string | null;
    status: string;
    createdAt: string;
    category?: { name?: string } | null;
  } | null;
  visitCharge: number;
  message: string | null;
  status: string;
  negotiationRound: number;
  maxNegotiationRounds?: number;
  minimumVisitFee?: number;
  createdAt: string;
  expiresAt?: string;
  serverTime?: string;
}

function mapBackendOffer(w: BackendOfferRow): VisitOffer {
  const visitCharge = Number(w.visitCharge);
  const commission = Math.round(visitCharge * 0.1);
  return {
    id: w.id,
    jobId: w.jobId,
    workerId: "worker-me",
    workerName: "Me",
    visitCharge,
    platformCommission: commission,
    workerNetEarnings: visitCharge - commission,
    message: w.message ?? undefined,
    status: (w.status === "ACCEPTED"
      ? "accepted"
      : w.status === "REJECTED"
        ? "rejected"
        : w.status === "COUNTERED"
          ? "counter_received"
          : "sent") as VisitOffer["status"],
    createdAt: w.createdAt,
    expiresAt: w.expiresAt,
    serverTime: w.serverTime,
    currentRound: w.negotiationRound + 1,
    maxRounds: w.maxNegotiationRounds ?? getMaxNegotiationRounds(),
    counterHistory: [
      {
        round: 1,
        sender: "worker",
        amount: visitCharge,
        message: w.message ?? "Visit offer submitted.",
        createdAt: w.createdAt,
      },
    ],
    agreedVisitCharge: w.status === "ACCEPTED" ? visitCharge : undefined,
  };
}

export async function listMyOffers(): Promise<VisitOffer[]> {
  const res = await http.get<{ data: BackendOfferRow[] }>("/offers/my?limit=100");
  return (res.data ?? []).map(mapBackendOffer);
}

export async function submitWorkerOffer(
  jobId: string,
  visitCharge: number,
  message?: string,
): Promise<VisitOffer> {
  const created = await http.post<BackendOfferRow>(`/jobs/${jobId}/offers`, {
    visitCharge,
    message,
    note: message,
  });
  return mapBackendOffer(created);
}

export async function sendWorkerCounterOffer(
  jobId: string,
  offerId: string,
  counterAmount: number,
  message?: string,
): Promise<void> {
  await http.put(`/jobs/${jobId}/offers/${offerId}/counter`, {
    visitCharge: counterAmount,
    counterAmount,
    counterPrice: counterAmount,
    message,
    note: message,
  });
}

export async function withdrawWorkerOffer(offerId: string): Promise<void> {
  await http.put(`/offers/${offerId}/withdraw`);
}