"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { WalletTransactionHistory } from "@/components/shared/wallet-transaction-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerDashboardShell } from "@/features/worker-dashboard";
import { formatRsExact } from "@/lib/money";
import {
  getWalletSummary,
  getWalletTransactions,
  queryKeys,
} from "@/services/worker/earnings.service";
import { useWorkerJobs } from "@/stores/worker-jobs-store";

function WalletContent() {
  const { walletBalance } = useWorkerJobs();

  const summary = useQuery({
    queryKey: queryKeys.summary,
    queryFn: getWalletSummary,
  });

  const transactions = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: getWalletTransactions,
  });

  if (summary.isPending || transactions.isPending) {
    return <LoadingState label="Loading wallet details..." />;
  }

  if (summary.isError || transactions.isError) {
    return (
      <ErrorState
        title="Unable to load wallet"
        description="Please check your network connection and try again."
        onRetry={() => {
          void summary.refetch();
          void transactions.refetch();
        }}
      />
    );
  }

  const walletSummaryData = summary.data;
  const transactionsData = transactions.data;
  const currentBalance = walletBalance ?? walletSummaryData.currentBalance;

  return (
    <div className="space-y-6">
      {/* Clean Current Balance Card */}
      <div className="flex items-center justify-between rounded-xl border border-teal/20 bg-teal/5 p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-teal text-white shadow-xs">
            <Wallet className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Balance
            </p>
            <p className="text-2xl sm:text-3xl font-extrabold text-navy">
              {formatRsExact(currentBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Date-Grouped Transaction History */}
      <Card className="border-border shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold text-navy flex items-center justify-between">
            <span>Transaction History</span>
            <span className="text-xs font-normal text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
              {transactionsData.length} Records
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <WalletTransactionHistory transactions={transactionsData} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function WorkerWalletPage() {
  return (
    <WorkerDashboardShell initialTab="wallet">
      <WalletContent />
    </WorkerDashboardShell>
  );
}
