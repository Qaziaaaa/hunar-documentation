"use client";

import { useState } from "react";
import { Wallet, ArrowUpRight, Banknote, CheckCircle, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { WithdrawalRequest } from "@/types/admin";
import { processWithdrawalRequest } from "@/features/admin/api/admin-api";

export function WithdrawalRequestsWidget({ withdrawals: initialWithdrawals }: { withdrawals: WithdrawalRequest[] }) {
  const [items, setItems] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    await processWithdrawalRequest(id, "approve");
    setItems((prev) => prev.map((w) => (w.id === id ? { ...w, status: "PROCESSED" } : w)));
    setProcessingId(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
            <Wallet className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy">Worker Payout Clearances</h3>
            <p className="text-[10px] text-slate-500">
              Pending worker earnings bank withdrawals requiring admin release
            </p>
          </div>
        </div>
        <Link
          href="/admin/payments"
          className="flex items-center gap-1 text-[10px] font-bold text-teal transition hover:underline"
        >
          <span>All Payouts</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="mt-1.5 space-y-1.5">
        {items.map((wd) => (
          <div
            key={wd.id}
            className="flex flex-col gap-1.5 rounded-lg border border-slate-100 bg-slate-50/50 p-2 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-purple-100 text-purple-700 font-extrabold">
                <Banknote className="size-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <h4 className="text-xs font-extrabold text-navy">{wd.workerName}</h4>
                  <span className="font-mono text-[8px] font-bold text-slate-400">#{wd.id.toUpperCase()}</span>
                </div>
                <p className="text-[8px] text-slate-500 font-medium">
                  {wd.bankName} • Acc: <span className="font-mono">{wd.accountNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <div className="text-right">
                <p className="text-xs font-extrabold text-navy">Rs. {wd.amount.toLocaleString()}</p>
                <p className={`text-[8px] font-bold flex items-center justify-end gap-0.5 ${wd.status === "PROCESSED" ? "text-green-600" : "text-amber-600"}`}>
                  <Clock className="size-2" /> {wd.status}
                </p>
              </div>
              {wd.status !== "PROCESSED" && (
                <button
                  type="button"
                  disabled={processingId === wd.id}
                  onClick={() => handleApprove(wd.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-teal px-2 py-0.5 text-[9px] font-bold text-white shadow-2xs transition hover:bg-teal/90 disabled:opacity-50"
                >
                  <CheckCircle className="size-2.5" />
                  <span>Approve</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
