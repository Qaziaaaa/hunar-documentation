"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { adminApi, fetchCommissionRate } from "@/features/admin/api/admin-api";
import type { PaymentTransaction } from "@/types/admin";
import { TableRowsSkeleton } from "@/features/admin/components/table-skeleton";
import { AlertCircle, Coins, CreditCard, DollarSign, Lock } from "lucide-react";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [kpis, setKpis] = useState<{ totalRevenue: number; totalPaymentsProcessed: number } | null>(null);
  const [commissionRate, setCommissionRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    Promise.all([adminApi.listTransactions(), adminApi.getKpis()])
      .then(([txns, kpiData]) => {
        setPayments(txns);
        setKpis({ totalRevenue: kpiData.totalRevenue, totalPaymentsProcessed: kpiData.totalPaymentsProcessed });
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load payments data"),
      )
      .finally(() => setLoading(false));
    fetchCommissionRate()
      .then(setCommissionRate)
      .catch(() => setCommissionRate(null));
  }, [reloadKey]);

  const pct =
    commissionRate != null ? Math.round(commissionRate * 100) : null;
  const kpiValue = (n?: number) =>
    loading ? "…" : kpis != null && n != null ? `Rs. ${n.toLocaleString()}` : "—";

  return (
<div className="space-y-6">
        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-red-500" />
              <span className="text-sm font-bold text-red-700">Payments data failed to load</span>
              <span className="text-xs font-medium text-red-600">{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setReloadKey((k) => k + 1);
              }}
              className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <CreditCard className="size-3.5" /> Platform Financial Oversight
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Payments & Commission Monitoring
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Track customer payments, platform commission revenue, and wallet ledger feeds
          </p>
        </div>

        {/* Commission Snapshot Row (Task 28) */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Platform Revenue{pct != null ? ` (${pct}%)` : ""}
              </span>
              <Coins className="size-5 text-teal" />
            </div>
            <p className="mt-2 text-3xl font-black text-navy">
              {kpiValue(kpis?.totalRevenue)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              {pct != null
                ? `${pct}% earned on visit fees`
                : "Commission rate unavailable"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Processed Volume
              </span>
              <DollarSign className="size-5 text-navy" />
            </div>
            <p className="mt-2 text-3xl font-black text-navy">
              {kpiValue(kpis?.totalPaymentsProcessed)}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Escrow &amp; payment total</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Worker Payout Queue
              </span>
              <Lock className="size-5 text-orange" />
            </div>
            <Link
              href="/admin/payments/withdrawals"
              className="mt-3 inline-flex items-center justify-center rounded-xl bg-navy py-2 text-xs font-bold text-white shadow-sm hover:bg-navy/90"
            >
              View Withdrawal Queue
            </Link>
          </div>
        </div>

        {/* Transactions Feed Table (Task 27) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 font-extrabold text-navy text-sm">
            Transactions & Escrow Feed
          </div>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Transaction ID</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Worker</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Platform Fee</th>
                <th className="py-4 px-4">Net Payout</th>
                <th className="py-4 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <TableRowsSkeleton colSpan={7} label="Loading transactions" />
              ) : payments.length === 0 ? (
                <tr><td colSpan={7} className="py-6 px-4 text-center text-slate-500">No transactions yet.</td></tr>
              ) : (
              payments.map((p) => (
                <tr key={p.id} className="transition hover:bg-slate-50">
                  <td className="py-4 px-4 font-extrabold text-navy">{p.id}</td>
                  <td className="py-4 px-4 font-semibold text-slate-700">{p.customerName}</td>
                  <td className="py-4 px-4 text-slate-600">{p.workerName}</td>
                  <td className="py-4 px-4 font-bold text-navy">Rs. {p.amount.toLocaleString()}</td>
                  <td className="py-4 px-4 font-extrabold text-teal">Rs. {p.commission.toLocaleString()}</td>
                  <td className="py-4 px-4 font-bold text-slate-700">Rs. {p.netPayout.toLocaleString()}</td>
                  <td className="py-4 px-4">
                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-bold text-green-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
);
}
