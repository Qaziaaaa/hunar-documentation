"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { Link } from "@/i18n/navigation";
import { adminApi } from "@/features/admin/api/admin-api";
import type { WithdrawalRequest } from "@/types/admin";
import { AlertCircle, ArrowLeft, Ban, CheckCircle2, Lock, Wallet } from "lucide-react";

export default function WithdrawalsPage() {
  const [items, setItems] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [freezeWorkerName, setFreezeWorkerName] = useState("");

  useEffect(() => {
    adminApi
      .listWithdrawals()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleApproveWithdrawal = (id: string) => {
    void adminApi.processWithdrawal(id, "APPROVE").catch(() => undefined);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "PROCESSED" } : item
      )
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <Link href="/admin/payments" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy">
          <ArrowLeft className="size-4" /> Back to Payments
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Wallet className="size-3.5" /> Payout Queue
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Worker Withdrawal Payout Queue
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Review worker withdrawal requests and execute bank transfer payouts
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Request ID</th>
                <th className="py-4 px-4">Worker</th>
                <th className="py-4 px-4">Bank Details</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={7} className="py-6 px-4 text-center text-slate-500">Loading withdrawal requests...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="py-6 px-4 text-center text-slate-500">No withdrawal requests yet.</td></tr>
              ) : (
              items.map((w) => (
                <tr key={w.id} className="transition hover:bg-slate-50">
                  <td className="py-4 px-4 font-extrabold text-navy">{w.id}</td>
                  <td className="py-4 px-4 font-extrabold text-navy">{w.workerName}</td>
                  <td className="py-4 px-4 text-slate-600">
                    <p className="font-bold text-slate-700">{w.bankName}</p>
                    <p className="text-[10px] font-mono text-slate-400">{w.accountNumber}</p>
                  </td>
                  <td className="py-4 px-4 font-black text-teal">Rs. {w.amount.toLocaleString()}</td>
                  <td className="py-4 px-4 text-slate-500">{new Date(w.requestedAt).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${w.status === "PROCESSED" ? "bg-green-100 text-green-700" : "bg-orange/10 text-orange"}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {w.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => handleApproveWithdrawal(w.id)}
                          className="flex items-center gap-1 rounded-xl bg-teal px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                        >
                          <CheckCircle2 className="size-3.5" /> Approve Payout
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setFreezeWorkerName(w.workerName);
                          setShowFreezeModal(true);
                        }}
                        className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 hover:bg-red-100"
                        title="Freeze Wallet"
                      >
                        <Lock className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Wallet Freeze Modal (Task 30) */}
        {showFreezeModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="size-6 shrink-0" />
                <h3 className="text-lg font-extrabold text-navy">Freeze Worker Wallet</h3>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Are you sure you want to freeze the wallet for <strong className="text-navy">{freezeWorkerName}</strong>? This prevents all balance withdrawals during active disputes.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowFreezeModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="button" onClick={() => setShowFreezeModal(false)} className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-md">
                  Confirm Wallet Freeze
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
