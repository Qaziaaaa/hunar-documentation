"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Banknote,
  CheckCircle,
  Clock,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { WithdrawalRequest } from "@/types/admin";
import { processWithdrawalRequest } from "@/features/admin/api/admin-api";

interface RejectModalState {
  withdrawal: WithdrawalRequest;
}

export function WithdrawalRequestsWidget({
  withdrawals: initialWithdrawals,
}: {
  withdrawals: WithdrawalRequest[];
}) {
  const [items, setItems] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = async (id: string, name: string, amount: number) => {
    setProcessingId(id);
    await processWithdrawalRequest(id, "approve");
    setItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: "PROCESSED" } : w)),
    );
    setProcessingId(null);
    showToast(`💰 Payout of Rs. ${amount.toLocaleString()} approved for ${name}`);
  };

  const handleOpenReject = (wd: WithdrawalRequest) => {
    setRejectModal({ withdrawal: wd });
    setRejectNote("");
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    setProcessingId(rejectModal.withdrawal.id);
    await processWithdrawalRequest(rejectModal.withdrawal.id, "reject", rejectNote);
    setItems((prev) =>
      prev.map((w) =>
        w.id === rejectModal.withdrawal.id
          ? { ...w, status: "REJECTED" }
          : w,
      ),
    );
    setProcessingId(null);
    showToast(
      `❌ Payout request #${rejectModal.withdrawal.id} rejected. Funds restored to worker balance.`,
    );
    setRejectModal(null);
    setRejectNote("");
  };

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="absolute top-2 right-2 left-2 z-20 flex items-center justify-between rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-[11px] font-bold text-purple-700 shadow-xs animate-in fade-in slide-in-from-top-1">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-purple-700/70 hover:text-purple-700"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
            <Wallet className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy">Worker Payout Clearances</h3>
            <p className="text-[10px] text-slate-500">
              Pending worker bank transfers requiring admin verification & authorization
            </p>
          </div>
        </div>
        <Link
          href="/admin/payments"
          className="flex items-center gap-1 text-[10px] font-bold text-teal transition hover:underline"
        >
          <span>All Payouts ({items.length})</span>
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
                  <span className="font-mono text-[8px] font-bold text-slate-400">
                    #{wd.id.toUpperCase()}
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 font-medium">
                  {wd.bankName} • Acc: <span className="font-mono">{wd.accountNumber}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="text-right">
                <p className="text-xs font-extrabold text-navy">Rs. {wd.amount.toLocaleString()}</p>
                <p
                  className={`text-[8px] font-bold flex items-center justify-end gap-0.5 ${
                    wd.status === "PROCESSED"
                      ? "text-green-600"
                      : wd.status === "REJECTED"
                        ? "text-red-600"
                        : "text-amber-600"
                  }`}
                >
                  <Clock className="size-2" /> {wd.status}
                </p>
              </div>

              {wd.status !== "PROCESSED" && wd.status !== "REJECTED" && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={processingId === wd.id}
                    onClick={() => handleApprove(wd.id, wd.workerName, wd.amount)}
                    className="inline-flex items-center gap-0.5 rounded-md bg-teal px-2 py-0.5 text-[9px] font-bold text-white shadow-2xs transition hover:bg-teal/90 disabled:opacity-50"
                  >
                    <CheckCircle className="size-2.5" />
                    <span>Release</span>
                  </button>
                  <button
                    type="button"
                    disabled={processingId === wd.id}
                    onClick={() => handleOpenReject(wd)}
                    className="inline-flex items-center gap-0.5 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 shadow-2xs transition hover:bg-red-100 disabled:opacity-50"
                    title="Reject Payout"
                  >
                    <XCircle className="size-2.5" />
                    <span>Decline</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Decline Payout Modal (Backend PUT /admin/withdrawals/:id/process action: 'reject') */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <XCircle className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy">Decline Payout Request</h3>
                  <p className="text-[10px] text-slate-500">
                    Worker: <strong className="text-slate-800">{rejectModal.withdrawal.workerName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-[10px] text-slate-600">
                <p>Amount: <strong>Rs. {rejectModal.withdrawal.amount.toLocaleString()}</strong></p>
                <p>Bank: {rejectModal.withdrawal.bankName} ({rejectModal.withdrawal.accountNumber})</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Decline Reason / Admin Note:
                </label>
                <textarea
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Account title mismatch or invalid IBAN..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[10px] font-medium text-amber-800">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>Funds will be restored back to worker&apos;s available wallet balance.</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectNote.trim()}
                onClick={handleConfirmReject}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
