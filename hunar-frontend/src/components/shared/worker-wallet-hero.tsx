"use client";

import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatRs, formatRsExact } from "@/lib/money";

interface WorkerWalletHeroProps {
  walletBalance: number;
  totalTopUps?: number;
  totalDeductions?: number;
}

export function WorkerWalletHero({
  walletBalance,
  totalTopUps = 2000,
  totalDeductions = 450,
}: WorkerWalletHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-[#164770] to-teal/90 p-6 sm:p-8 text-white shadow-lg">
      {/* Background Glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full bg-teal/20 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Balance Area */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="border-white/20 bg-white/10 text-white backdrop-blur-md px-3 py-1 font-medium text-xs"
            >
              <Wallet className="mr-1.5 size-3.5 text-teal" aria-hidden="true" />
              HUNAR Worker Wallet
            </Badge>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-300 font-medium">
              Current Wallet Balance
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                {formatRsExact(walletBalance)}
              </span>
              <span className="text-xs font-medium text-slate-300">PKR</span>
            </div>
          </div>
        </div>

        {/* Quick Stats: Top-ups & Deductions */}
        <div className="flex flex-wrap sm:flex-col gap-3 min-w-[200px]">
          <div className="flex-1 sm:flex-initial rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
                <ArrowDownLeft className="size-4" />
              </span>
              <span className="text-xs font-medium text-slate-200">Total Top-Ups</span>
            </div>
            <span className="text-sm font-bold text-emerald-300">
              +{formatRs(totalTopUps)}
            </span>
          </div>

          <div className="flex-1 sm:flex-initial rounded-xl bg-white/10 backdrop-blur-md p-3 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500/20 text-orange-300">
                <ArrowUpRight className="size-4" />
              </span>
              <span className="text-xs font-medium text-slate-200">Total Deductions</span>
            </div>
            <span className="text-sm font-bold text-orange-300">
              -{formatRs(totalDeductions)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
