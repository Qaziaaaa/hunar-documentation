import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type { WalletSummary, WalletTransaction } from "@/types/finance";
import {
  mockWalletSummary,
  mockWalletTransactions,
} from "@/mocks/earnings.mock";

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

  return {
    id: entry.id,
    type: amount >= 0 ? "TOP_UP" : "DEDUCTION",
    amount: Math.abs(amount),
    date: entry.createdAt,
    displayDate: formattedDate,
    displayTime: formattedTime,
    jobId: entry.referenceId ?? undefined,
    description: entry.description ?? undefined,
    resultingBalance: Number(entry.balanceAfter),
  };
}

export async function getWalletSummary(): Promise<WalletSummary> {
  if (isMockMode()) {
    return simulateLatency({ ...mockWalletSummary });
  }
  const snapshot = await http.get<BackendWalletSnapshot>("/wallet/balance");
  return {
    currentBalance: Number(snapshot.totalBalance),
    totalTopUps: Number(snapshot.balance),
    totalDeductions: Number(snapshot.heldBalance),
    totalTransactions: 0,
  };
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  if (isMockMode()) {
    return simulateLatency([...mockWalletTransactions]);
  }
  const res = await http.get<BackendPage<BackendLedgerEntry> | BackendLedgerEntry[]>("/wallet/ledger");
  const items = Array.isArray(res) ? res : res.items;
  return (items ?? []).map(mapLedgerEntry);
}

export const queryKeys = {
  summary: ["worker", "wallet", "summary"] as const,
  transactions: ["worker", "wallet", "transactions"] as const,
};