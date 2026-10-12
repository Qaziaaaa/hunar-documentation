import { http, getAccessToken } from "@/lib/api-client";
import { unwrapRows } from "@/lib/unwrap-rows";
import type { WalletSummary, WalletTransaction } from "@/types/finance";

interface BackendWalletSnapshot {
  userId: string;
  balance: number;
  heldBalance: number;
  totalBalance: number;
}

interface BackendLedgerEntry {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  referenceType?: string | null;
  referenceId?: string | null;
  description?: string | null;
  note?: string | null;
  createdAt: string;
}

interface BackendPage<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function mapLedgerEntry(entry: BackendLedgerEntry): WalletTransaction {
  const amount = Number(entry.amount);
  const date = new Date(entry.createdAt);
  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const formattedTime = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const isDeduction = amount < 0 || entry.type?.includes("DEDUCT") || entry.type?.includes("HELD");

  return {
    id: entry.id,
    type: isDeduction ? "DEDUCTION" : "TOP_UP",
    amount: Math.abs(amount),
    date: entry.createdAt,
    displayDate: formattedDate,
    displayTime: formattedTime,
    jobId: entry.referenceId ?? undefined,
    description: entry.description ?? entry.note ?? (isDeduction ? "Platform Commission" : "Admin Wallet Top-Up"),
    resultingBalance: Number(entry.balanceAfter),
  };
}

export async function getWalletSummary(): Promise<WalletSummary> {
  if (!getAccessToken()) {
    throw new Error("Authentication required to view wallet summary");
  }
  const [snapshot, earnings] = await Promise.all([
    http.get<BackendWalletSnapshot>("/wallet/balance"),
    http.get<WorkerEarningsData>("/workers/me/earnings"),
  ]);
  return {
    currentBalance: Number(snapshot.balance),
    totalTopUps: Number(earnings.topupsCredited ?? 0),
    totalDeductions: Number(earnings.commissionsPaid + earnings.commissionsHeld),
    totalTransactions: earnings.records?.length ?? 0,
  };
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  if (!getAccessToken()) {
    return [];
  }
  try {
    const res = await http.get<BackendPage<BackendLedgerEntry> | BackendLedgerEntry[]>("/wallet/ledger");
    const items: BackendLedgerEntry[] = unwrapRows(res);
    return (items ?? []).map(mapLedgerEntry);
  } catch (err: any) {
    if (err?.status === 401) {
      return [];
    }
    throw err;
  }
}

export interface WorkerEarningRecordDto {
  id: string;
  jobId: string;
  jobTitle: string;
  category: string;
  categoryUrdu?: string;
  amount: number;
  grossAmount?: number;
  commission?: number;
  netAmount?: number;
  date: string;
  status: string;
}

export interface WorkerEarningsData {
  grossEarnings: number;
  commissionsPaid: number;
  commissionsHeld: number;
  commissionsReversed: number;
  netEarnings: number;
  topupsCredited: number;
  balance: number;
  heldBalance: number;
  totalBalance: number;
  completedJobsCount: number;
  records: WorkerEarningRecordDto[];
}

export async function getWorkerEarnings(): Promise<WorkerEarningsData> {
  if (!getAccessToken()) {
    throw new Error("Authentication required to view worker earnings");
  }
  return await http.get<WorkerEarningsData>("/workers/me/earnings");
}

export const queryKeys = {
  summary: ["worker", "wallet", "summary"] as const,
  transactions: ["worker", "wallet", "transactions"] as const,
  earnings: ["worker", "earnings"] as const,
};