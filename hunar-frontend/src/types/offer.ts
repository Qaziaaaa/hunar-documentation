export type OfferLifecycleStatus =
  | "sent"
  | "viewing"
  | "counter_received"
  | "accepted"
  | "rejected"
  | "closed_assigned";

export interface CounterHistoryItem {
  round: number;
  sender: "worker" | "customer";
  amount: number;
  message?: string;
  createdAt: string;
}

export interface VisitOffer {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  visitCharge: number; // in PKR (Rs.)
  platformCommission: number; // 10% of visitCharge
  workerNetEarnings: number; // visitCharge - platformCommission
  message?: string;
  status: OfferLifecycleStatus;
  createdAt: string;
  currentRound: number;
  maxRounds: number; // default: 3 rounds
  counterHistory: CounterHistoryItem[];
  customerCounterAmount?: number;
  customerCounterMessage?: string;
  agreedVisitCharge?: number;
}
