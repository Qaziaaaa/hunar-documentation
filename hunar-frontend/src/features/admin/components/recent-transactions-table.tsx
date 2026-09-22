"use client";

import { CreditCard, ArrowUpRight, Receipt, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PaymentTransaction } from "@/types/admin";

export function RecentTransactionsTable({ transactions }: { transactions: PaymentTransaction[] }) {
  const getStatusBadge = (status: PaymentTransaction["status"]) => {
    switch (status) {
      case "SUCCESS":
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CheckCircle2 className="size-2" />,
          label: "Success",
        };
      case "ESCROW_HELD":
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <Clock className="size-2" />,
          label: "Escrow Held",
        };
      case "REFUNDED":
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200",
          icon: <RotateCcw className="size-2" />,
          label: "Refunded",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: null,
          label: status,
        };
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-teal/10 text-teal">
            <CreditCard className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy">Recent Financial Transactions</h3>
            <p className="text-[10px] text-slate-500">
              Live ledger of marketplace escrow payments, commissions, and worker payouts
            </p>
          </div>
        </div>
        <Link
          href="/admin/payments"
          className="flex items-center gap-1 text-[10px] font-bold text-teal transition hover:underline"
        >
          <span>Financial Ledger</span>
          <ArrowUpRight className="size-3" />
        </Link>
      </div>

      <div className="mt-1.5 overflow-x-auto">
        <table className="w-full text-left text-[10px]">
          <thead>
            <tr className="border-b border-slate-100 text-[8px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-1.5 px-2">Txn ID</th>
              <th className="py-1.5 px-2">Customer / Worker</th>
              <th className="py-1.5 px-2">Total Amount</th>
              <th className="py-1.5 px-2">Platform Fee (10%)</th>
              <th className="py-1.5 px-2">Net Worker Payout</th>
              <th className="py-1.5 px-2">Payment Method</th>
              <th className="py-1.5 px-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {transactions.map((txn) => {
              const badge = getStatusBadge(txn.status);
              return (
                <tr key={txn.id} className="transition hover:bg-slate-50/80">
                  <td className="py-1.5 px-2">
                    <span className="font-mono font-bold text-navy">{txn.id.toUpperCase()}</span>
                    <p className="text-[8px] text-slate-400">Job #{txn.jobId}</p>
                  </td>
                  <td className="py-1.5 px-2">
                    <p className="font-bold text-slate-800">{txn.customerName}</p>
                    <p className="text-[8px] text-slate-400">Worker: {txn.workerName}</p>
                  </td>
                  <td className="py-1.5 px-2 font-extrabold text-navy">
                    Rs. {txn.amount.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 font-semibold text-emerald-600">
                    +Rs. {txn.commission.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 font-semibold text-slate-600">
                    Rs. {txn.netPayout.toLocaleString()}
                  </td>
                  <td className="py-1.5 px-2 text-slate-500 font-medium">
                    <span className="inline-flex items-center gap-1 text-[9px]">
                      <Receipt className="size-2 text-slate-400" />
                      {txn.paymentMethod}
                    </span>
                  </td>
                  <td className="py-1.5 px-2">
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${badge.bg}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
