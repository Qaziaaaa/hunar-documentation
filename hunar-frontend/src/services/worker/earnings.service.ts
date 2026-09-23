import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import { calculateCommission } from "@/lib/money";
import type {
  CommissionRecord,
  EarningsSummary,
  EarningsTransaction,
  SubmitScreenshotInput,
} from "@/types/finance";
import type { PageResult } from "@/types/pagination";
import {
  mockCommissions,
  mockEarningsSummary,
  mockTransactions,
} from "@/mocks/earnings.mock";

export async function getEarningsSummary(): Promise<EarningsSummary> {
  if (isMockMode()) {
    return simulateLatency({ ...mockEarningsSummary });
  }
  return http.get<EarningsSummary>(`/earnings/summary`);
}

export async function getTransactions(): Promise<EarningsTransaction[]> {
  if (isMockMode()) {
    return simulateLatency([...mockTransactions]);
  }
  const page = await http.get<PageResult<CommissionRecord>>(
    `/commissions/my?limit=100`,
  );
  return page.items.map((record) => ({
    id: record.id,
    jobId: record.jobId,
    jobTitle: record.job?.title ?? record.jobId,
    visitCharge: Number(record.visitCharge),
    repairCharge: 0,
    commissionRate: Number(record.commissionRate),
    commission: Number(record.amount),
    commissionStatus: record.status,
    date: record.createdAt,
    verifiedAt: record.verifiedAt,
  }));
}

export async function getCommissions(): Promise<CommissionRecord[]> {
  if (isMockMode()) {
    return simulateLatency([...mockCommissions]);
  }
  const page = await http.get<PageResult<CommissionRecord>>(
    `/commissions/my?limit=100`,
  );
  return page.items;
}

export async function submitScreenshot(
  input: SubmitScreenshotInput,
): Promise<CommissionRecord> {
  if (isMockMode()) {
    await simulateLatency(undefined, 800, 1600);
    const index = mockCommissions.findIndex(
      (c) => c.id === input.commissionId,
    );
    if (index < 0) throw new Error("COMMISSION_NOT_FOUND");
    const updated: CommissionRecord = {
      ...mockCommissions[index],
      screenshotUrl: input.screenshotUrl,
      status: "RECEIVED",
      note: input.note,
    };
    mockCommissions[index] = updated;
    return updated;
  }
  return http.put<CommissionRecord>(
    `/commissions/${input.commissionId}/screenshot`,
    { screenshotUrl: input.screenshotUrl, note: input.note },
  );
}

export function commissionFor(visitCharge: number): number {
  return calculateCommission(visitCharge);
}

export const queryKeys = {
  summary: ["worker", "earnings", "summary"] as const,
  transactions: ["worker", "earnings", "transactions"] as const,
  commissions: ["worker", "earnings", "commissions"] as const,
};