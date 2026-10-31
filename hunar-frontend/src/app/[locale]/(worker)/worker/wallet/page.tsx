"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { WalletTransactionHistory } from "@/components/shared/wallet-transaction-history";
import { WalletTopUpModal } from "@/components/shared/wallet-topup-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkerDashboardShell } from "@/features/worker-dashboard";
import { formatRsExact } from "@/lib/money";
import { getSocket } from "@/lib/socket";
import {
  getWalletSummary,
  getWalletTransactions,
  queryKeys,
} from "@/services/worker/earnings.service";

import { workerStore, useWorkerJobs } from "@/stores/worker-jobs-store";

export function WalletContent() {
  const { walletBalance } = useWorkerJobs();
  const setWalletBalance = workerStore.setWalletBalance;
  const [hydrated, setHydrated] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpNotice, setTopUpNotice] = useState(false);

  const summary = useQuery({
    queryKey: queryKeys.summary,
    queryFn: getWalletSummary,
  });

  const transactions = useQuery({
    queryKey: queryKeys.transactions,
    queryFn: getWalletTransactions,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => {
      void summary.refetch();
      void transactions.refetch();
    };
    socket.on("wallet:balanceUpdated", handleUpdate);
    socket.on("wallet:earnings:recorded", handleUpdate);
    socket.on("wallet:commission:held", handleUpdate);
    socket.on("wallet:commission:deducted", handleUpdate);
    return () => {
      socket.off("wallet:balanceUpdated", handleUpdate);
      socket.off("wallet:earnings:recorded", handleUpdate);
      socket.off("wallet:commission:held", handleUpdate);
      socket.off("wallet:commission:deducted", handleUpdate);
    };
  }, [summary, transactions]);

  if (summary.isLoading || transactions.isLoading) {
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

  if (!summary.data || !transactions.data) {
    return <LoadingState label="Loading wallet details..." />;
  }

  const walletSummaryData = summary.data;
  const transactionsData = transactions.data;
  const currentBalance = walletSummaryData?.currentBalance ?? walletBalance ?? 0;

  return (
    <div className="space-y-6">
      {/* Clean Current Balance Card */}
      <div className="rounded-xl border border-teal/20 bg-teal/5 p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
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
          <button
            type="button"
            onClick={() => {
              setIsTopUpOpen(true);
              setTopUpNotice(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal hover:bg-teal/90 text-white px-4 py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            Top Up Wallet
          </button>
        </div>

        {topUpNotice && (
          <div className="flex items-center justify-between rounded-lg bg-white/95 border border-teal/20 p-2.5 text-xs font-semibold text-teal-900 animate-in fade-in">
            <span>Contact admin for top up</span>
            <button
              type="button"
              onClick={() => setTopUpNotice(false)}
              className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Date-Grouped Transaction History */}
      <Card className="border-border/80 bg-white shadow-xs">
        <CardHeader className="pb-3 border-b border-border/60">
          <CardTitle className="text-base font-bold text-navy flex items-center justify-between">
            <span>Transaction History</span>
            <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 border border-slate-200/90 px-3 py-0.5 text-xs font-semibold shadow-2xs">
              {transactionsData.length} Records
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <WalletTransactionHistory transactions={transactionsData} />
        </CardContent>
      </Card>
      <WalletTopUpModal open={isTopUpOpen} onOpenChange={setIsTopUpOpen} />
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
