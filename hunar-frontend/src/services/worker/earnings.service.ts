import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type { WalletSummary, WalletTransaction } from "@/types/finance";
import {
  mockWalletSummary,
  mockWalletTransactions,
} from "@/mocks/earnings.mock";

export async function getWalletSummary(): Promise<WalletSummary> {
  if (isMockMode()) {
    return { ...mockWalletSummary };
  }
  return http.get<WalletSummary>(`/wallet/summary`);
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  if (isMockMode()) {
    return [...mockWalletTransactions];
  }
  return http.get<WalletTransaction[]>(`/wallet/ledger`);
}

export const queryKeys = {
  summary: ["worker", "wallet", "summary"] as const,
  transactions: ["worker", "wallet", "transactions"] as const,
};