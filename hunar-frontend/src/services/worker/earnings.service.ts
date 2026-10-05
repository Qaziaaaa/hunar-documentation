import { http, getAccessToken } from "@/lib/api-client";
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
    description: entry.description ?? entry.note ?? (isDeduction ? "Platform Commission" : "Job Earnings Credit"),
    resultingBalance: Number(entry.balanceAfter),
  };
}

export async function getWalletSummary(): Promise<WalletSummary> {
  if (isMockMode()) {
    return { ...mockWalletSummary };
  }
  if (!getAccessToken()) {
    return {
      currentBalance: 0,
      totalTopUps: 0,
      totalDeductions: 0,
      totalTransactions: 0,
    };
  }
  try {
    const snapshot = await http.get<BackendWalletSnapshot>("/wallet/balance");
    const earnings = await http.get<WorkerEarningsData>("/workers/me/earnings").catch(() => null);
    return {
      currentBalance: Number(snapshot.balance),
      totalTopUps: earnings ? Number(earnings.topupsCredited) : Number(snapshot.balance),
      totalDeductions: earnings ? Number(earnings.commissionsPaid + earnings.commissionsHeld) : Number(snapshot.heldBalance),
      totalTransactions: earnings ? earnings.records.length : 0,
    };
  } catch (err: any) {
    if (err?.status === 401) {
      return {
        currentBalance: 0,
        totalTopUps: 0,
        totalDeductions: 0,
        totalTransactions: 0,
      };
    }
    throw err;
  }
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  if (isMockMode()) {
    return [...mockWalletTransactions];
  }
  if (!getAccessToken()) {
    return [];
  }
  try {
    const res = await http.get<BackendPage<BackendLedgerEntry> | BackendLedgerEntry[]>("/wallet/ledger");
    const items = Array.isArray(res) ? res : res.items;
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
  if (isMockMode()) {
    return {
      grossEarnings: 24500,
      commissionsPaid: 2450,
      commissionsHeld: 0,
      commissionsReversed: 0,
      netEarnings: 22050,
      topupsCredited: 0,
      balance: 1550,
      heldBalance: 0,
      totalBalance: 1550,
      completedJobsCount: 0,
      records: [],
    };
  }
  if (!getAccessToken()) {
    return {
      grossEarnings: 0,
      commissionsPaid: 0,
      commissionsHeld: 0,
      commissionsReversed: 0,
      netEarnings: 0,
      topupsCredited: 0,
      balance: 0,
      heldBalance: 0,
      totalBalance: 0,
      completedJobsCount: 0,
      records: [],
    };
  }
  try {
    return await http.get<WorkerEarningsData>("/workers/me/earnings");
  } catch (err: any) {
    if (err?.status === 401) {
      return {
        grossEarnings: 0,
        commissionsPaid: 0,
        commissionsHeld: 0,
        commissionsReversed: 0,
        netEarnings: 0,
        topupsCredited: 0,
        balance: 0,
        heldBalance: 0,
        totalBalance: 0,
        completedJobsCount: 0,
        records: [],
      };
    }
    throw err;
  }
}

export const queryKeys = {
  summary: ["worker", "wallet", "summary"] as const,
  transactions: ["worker", "wallet", "transactions"] as const,
  earnings: ["worker", "earnings"] as const,
};