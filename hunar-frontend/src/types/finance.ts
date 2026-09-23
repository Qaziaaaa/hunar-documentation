import type { JobReference } from "./job";

export type CommissionStatus = "PENDING" | "RECEIVED" | "VERIFIED";

export type ScreenshotStatus = CommissionStatus;

export interface CommissionRecord {
  id: string;
  jobId: string;
  workerId: string;
  visitCharge: number;
  commissionRate: number;
  amount: number;
  status: CommissionStatus;
  screenshotUrl?: string;
  paidAt?: string;
  verifiedAt?: string;
  note?: string;
  createdAt: string;
  job?: JobReference;
}

export interface EarningsTransaction {
  id: string;
  jobId: string;
  jobTitle: string;
  visitCharge: number;
  repairCharge: number;
  commissionRate: number;
  commission: number;
  commissionStatus: CommissionStatus;
  date: string;
  verifiedAt?: string;
}

export interface EarningsSummary {
  totalEarned: number;
  totalCommission: number;
  pendingCommission: number;
  completedJobs: number;
  totalJobs: number;
}

export type WalletTransactionType = "TOP_UP" | "DEDUCTION";

export interface WalletTransaction {
  id: string;
  type: WalletTransactionType;
  amount: number;
  date: string;
  displayDate: string;
  displayTime?: string;
  jobId?: string;
  jobTitle?: string;
  description?: string;
  resultingBalance?: number;
}

export interface WalletSummary {
  currentBalance: number;
  totalTopUps: number;
  totalDeductions: number;
  totalTransactions: number;
}