"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Gavel,
  Lock,
  RotateCcw,
  Scale,
  ShieldAlert,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DisputeReport } from "@/types/admin";

interface MediateModalState {
  dispute: DisputeReport;
}

export function DisputesQueueWidget({ disputes: initialDisputes }: { disputes: DisputeReport[] }) {
  const [disputes, setDisputes] = useState<DisputeReport[]>(initialDisputes);
  const [activeModal, setActiveModal] = useState<MediateModalState | null>(null);
  const [resolutionAction, setResolutionAction] = useState<
    "refund_customer" | "release_worker" | "split_50_50" | "dismiss"
  >("refund_customer");
  const [freezeWallet, setFreezeWallet] = useState(false);
  const [mediationNotes, setMediationNotes] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getDisputeBadge = (status: DisputeReport["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "UNDER_REVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const handleOpenMediate = (dispute: DisputeReport) => {
    setActiveModal({ dispute });
    setResolutionAction("refund_customer");
    setFreezeWallet(false);
    setMediationNotes("");
  };

  const handleExecuteResolution = () => {
    if (!activeModal) return;

    setDisputes((prev) =>
      prev.map((d) =>
        d.id === activeModal.dispute.id
          ? { ...d, status: "RESOLVED" }
          : d,
      ),
    );

    const actionLabels = {
      refund_customer: "Full refund issued to customer",
      release_worker: "Payout released to worker",
      split_50_50: "50/50 compromise settlement enforced",
      dismiss: "Dispute dismissed without penalty",
    };

    const extra = freezeWallet ? " (Worker wallet frozen)" : "";
    showToast(`⚖️ Dispute #${activeModal.dispute.id} resolved: ${actionLabels[resolutionAction]}${extra}`);
    setActiveModal(null);
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="absolute top-2 right-2 left-2 z-20 flex items-center justify-between rounded-lg border border-teal/20 bg-teal-50 px-3 py-1.5 text-[11px] font-bold text-teal shadow-xs animate-in fade-in slide-in-from-top-1">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-teal/70 hover:text-teal"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-navy">Active Disputes & Complaints</h3>
            <p className="text-[11px] text-slate-500">
              Escalated tickets requiring operational resolution, mediation & wallet governance
            </p>
          </div>
        </div>
        <Link
          href="/admin/disputes"
          className="flex items-center gap-1 text-[11px] font-bold text-teal transition hover:underline"
        >
          <span>Disputes Queue ({disputes.length})</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        {disputes.length === 0 ? (
          <div className="py-4 text-center text-xs font-semibold text-slate-400">
            No active disputes found. Marketplace operational health is normal!
          </div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-navy">#{dispute.id.toUpperCase()}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${getDisputeBadge(
                      dispute.status,
                    )}`}
                  >
                    {dispute.status.replace("_", " ")}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    Job #{dispute.jobId}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-800">
                  {dispute.issueCategory}
                </h4>
                <p className="line-clamp-1 text-[10px] text-slate-500">
                  {dispute.description}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                  <span>
                    Reporter: <strong className="text-slate-700">{dispute.reporterName} ({dispute.reporterRole})</strong>
                  </span>
                  <span>•</span>
                  <span>Target: <strong className="text-slate-700">{dispute.targetName}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end md:self-auto">
                <Link
                  href={`/admin/disputes`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-navy shadow-xs transition hover:bg-slate-100"
                >
                  <FileText className="size-3 text-slate-500" />
                  <span>Evidence</span>
                </Link>

                {dispute.status !== "RESOLVED" && (
                  <button
                    type="button"
                    onClick={() => handleOpenMediate(dispute)}
                    className="inline-flex items-center gap-1 rounded-lg bg-navy px-2.5 py-1 text-[10px] font-bold text-white shadow-xs transition hover:bg-navy/90"
                  >
                    <Gavel className="size-3 text-teal-300" />
                    <span>Mediate</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mediation & Resolution Modal (Backend PUT /admin/disputes/:id/resolve + PUT /admin/wallet/:id/freeze) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-navy text-teal-300">
                  <Gavel className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy">
                    Mediate Dispute Ticket #{activeModal.dispute.id.toUpperCase()}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Category: <strong className="text-slate-800">{activeModal.dispute.issueCategory}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-[10px] text-slate-600">
                <div className="flex justify-between">
                  <span>Customer: <strong>{activeModal.dispute.reporterRole === "CUSTOMER" ? activeModal.dispute.reporterName : activeModal.dispute.targetName}</strong></span>
                  <span>Worker: <strong>{activeModal.dispute.reporterRole === "WORKER" ? activeModal.dispute.reporterName : activeModal.dispute.targetName}</strong></span>
                </div>
                <p className="mt-1 text-[10px] italic text-slate-500">
                  &ldquo;{activeModal.dispute.description}&rdquo;
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Arbitration Decision:
                </label>
                <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setResolutionAction("refund_customer")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "refund_customer"
                        ? "border-teal bg-teal/5 text-navy font-bold ring-1 ring-teal"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <RotateCcw className="size-3.5 text-teal" />
                    <div>
                      <p className="text-[10px] font-bold">Refund Customer</p>
                      <p className="text-[8px] text-slate-400">Release escrow back to buyer</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("release_worker")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "release_worker"
                        ? "border-green-600 bg-green-50/50 text-navy font-bold ring-1 ring-green-600"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5 text-green-600" />
                    <div>
                      <p className="text-[10px] font-bold">Release to Worker</p>
                      <p className="text-[8px] text-slate-400">Pay worker visit & labor charge</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("split_50_50")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "split_50_50"
                        ? "border-amber-500 bg-amber-50/50 text-navy font-bold ring-1 ring-amber-500"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Scale className="size-3.5 text-amber-600" />
                    <div>
                      <p className="text-[10px] font-bold">50 / 50 Settlement</p>
                      <p className="text-[8px] text-slate-400">Split locked funds equally</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("dismiss")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "dismiss"
                        ? "border-slate-500 bg-slate-100 text-navy font-bold ring-1 ring-slate-500"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <FileText className="size-3.5 text-slate-500" />
                    <div>
                      <p className="text-[10px] font-bold">Dismiss Grievance</p>
                      <p className="text-[8px] text-slate-400">Deem complaint unjustified</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Worker Wallet Freeze Checkbox (Backend PUT /admin/wallet/:workerId/freeze) */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freezeWallet}
                    onChange={(e) => setFreezeWallet(e.target.checked)}
                    className="size-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <Lock className="size-3 text-rose-600" />
                    <span className="text-[10px] font-bold text-rose-900">
                      Freeze Worker Wallet & Block New Bidding
                    </span>
                  </div>
                </label>
                <p className="mt-1 pl-5.5 text-[8px] text-rose-700">
                  Check this if the worker engaged in fraudulent charges, physical abuse, or safety violations.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Mediation Audit Notes:
                </label>
                <textarea
                  rows={2}
                  value={mediationNotes}
                  onChange={(e) => setMediationNotes(e.target.value)}
                  placeholder="Record summary of evidence and agreement..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-navy focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResolution}
                className="rounded-lg bg-navy px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-navy/90"
              >
                Execute Binding Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
