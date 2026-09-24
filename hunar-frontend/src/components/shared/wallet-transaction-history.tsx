"use client";

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, Briefcase, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRsExact } from "@/lib/money";
import type { WalletTransaction } from "@/types/finance";

interface WalletTransactionHistoryProps {
  transactions: WalletTransaction[];
}

export function WalletTransactionHistory({
  transactions,
}: WalletTransactionHistoryProps) {
  // Group transactions by displayDate
  const groupedTransactions = useMemo(() => {
    const map = new Map<string, WalletTransaction[]>();

    transactions.forEach((tx) => {
      const dateKey = tx.displayDate || "Recent Transactions";
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(tx);
    });

    return Array.from(map.entries());
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <Calendar className="mx-auto size-10 text-muted-foreground/50 mb-2" />
        <h4 className="text-sm font-semibold text-navy">No Transactions Yet</h4>
        <p className="text-xs text-muted-foreground mt-1">
          Your wallet top-ups and commission deductions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupedTransactions.map(([dateHeader, items]) => (
        <div key={dateHeader} className="space-y-3">
          {/* Date Section Header */}
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-navy/10 text-navy">
              <Calendar className="size-3.5" />
            </span>
            <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
              {dateHeader}
            </h3>
            <div className="h-px flex-1 bg-border/80" />
          </div>

          {/* Transactions List */}
          <ul className="space-y-2.5">
            {items.map((tx) => {
              const isTopUp = tx.type === "TOP_UP";
              return (
                <li
                  key={tx.id}
                  className="rounded-xl border border-border/70 bg-card p-4 shadow-xs transition-shadow hover:shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  {/* Left Column: Icon & Type Info */}
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl font-bold ${
                        isTopUp
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      }`}
                    >
                      {isTopUp ? (
                        <ArrowDownLeft className="size-5" />
                      ) : (
                        <ArrowUpRight className="size-5" />
                      )}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-navy">
                          {isTopUp ? "Top Up" : "Deduction"}
                        </span>

                        {/* Job ID Tag for Deductions */}
                        {tx.jobId ? (
                          <Badge
                            variant="secondary"
                            className="bg-navy/10 text-navy font-semibold text-[11px] px-2 py-0.5 border border-navy/20"
                          >
                            <Briefcase className="mr-1 size-3 text-teal" />
                            Job {tx.jobId}
                          </Badge>
                        ) : null}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {tx.description ?? (isTopUp ? "Wallet Credit" : "Commission Deducted")}
                        {tx.jobTitle ? ` — ${tx.jobTitle}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Amount & Resulting Balance */}
                  <div className="flex sm:flex-col justify-between sm:items-end items-center border-t sm:border-t-0 pt-2 sm:pt-0 border-border/50">
                    <span
                      className={`text-base font-extrabold ${
                        isTopUp ? "text-emerald-600" : "text-slate-900"
                      }`}
                    >
                      {isTopUp ? "+" : "-"}{formatRsExact(tx.amount)}
                    </span>

                    {tx.resultingBalance !== undefined ? (
                      <span className="text-[11px] font-medium text-slate-500">
                        Balance: <strong className="text-navy">{formatRsExact(tx.resultingBalance)}</strong>
                      </span>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
