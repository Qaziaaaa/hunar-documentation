import type {
  CommissionRecord,
  EarningsSummary,
  EarningsTransaction,
} from "@/types/finance";
import { calculateCommission, formatRsExact } from "@/lib/money";
import { MOCK_WORKER_ID } from "./jobs.mock";
import { isoDaysAgo } from "./utils";

export const mockEarningsSummary: EarningsSummary = {
  totalEarned: 6450,
  totalCommission: 430,
  pendingCommission: 180,
  completedJobs: 6,
  totalJobs: 14,
};

export const mockTransactions: EarningsTransaction[] = [
  {
    id: "tx-001",
    jobId: "job-plumb-303",
    jobTitle: "Kitchen sink leaking",
    visitCharge: 300,
    repairCharge: 1200,
    commissionRate: 0.1,
    commission: formatTransactionCommission(300),
    commissionStatus: "PENDING",
    date: isoDaysAgo(9, 16),
  },
  {
    id: "tx-002",
    jobId: "job-fan-502",
    jobTitle: "Ceiling fan replacement",
    visitCharge: 350,
    repairCharge: 800,
    commissionRate: 0.1,
    commission: formatTransactionCommission(350),
    commissionStatus: "PENDING",
    date: isoDaysAgo(16, 17),
  },
  {
    id: "tx-003",
    jobId: "job-faucet-501",
    jobTitle: "Bathroom faucet install",
    visitCharge: 400,
    repairCharge: 950,
    commissionRate: 0.1,
    commission: formatTransactionCommission(400),
    commissionStatus: "RECEIVED",
    date: isoDaysAgo(24, 15),
  },
  {
    id: "tx-004",
    jobId: "job-carpet-500",
    jobTitle: "Carpentry shelf fix",
    visitCharge: 400,
    repairCharge: 600,
    commissionRate: 0.1,
    commission: formatTransactionCommission(400),
    commissionStatus: "VERIFIED",
    date: isoDaysAgo(33, 13),
    verifiedAt: isoDaysAgo(30, 11),
  },
  {
    id: "tx-005",
    jobId: "job-light-499",
    jobTitle: "Light fixture repair",
    visitCharge: 350,
    repairCharge: 500,
    commissionRate: 0.1,
    commission: formatTransactionCommission(350),
    commissionStatus: "VERIFIED",
    date: isoDaysAgo(41, 12),
    verifiedAt: isoDaysAgo(38, 9),
  },
];

export const mockCommissions: CommissionRecord[] = mockTransactions.map(
  (tx) => ({
    id: `commission-${tx.id}`,
    jobId: tx.jobId,
    workerId: MOCK_WORKER_ID,
    visitCharge: tx.visitCharge,
    commissionRate: tx.commissionRate,
    amount: tx.commission,
    status: tx.commissionStatus,
    screenshotUrl: undefined,
    paidAt: tx.commissionStatus === "RECEIVED" ? tx.date : undefined,
    verifiedAt: tx.verifiedAt,
    createdAt: tx.date,
  }),
);

function formatTransactionCommission(visitCharge: number): number {
  return Number(
    formatRsExact(calculateCommission(visitCharge)).replace(/[^\d.]/g, ""),
  );
}