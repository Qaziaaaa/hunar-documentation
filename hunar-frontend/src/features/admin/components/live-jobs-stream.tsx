"use client";

import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  X,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { LiveJobItem } from "@/types/admin";

interface CancelModalState {
  job: LiveJobItem;
}

export function LiveJobsStream({ jobs: initialJobs }: { jobs: LiveJobItem[] }) {
  const [jobs, setJobs] = useState<LiveJobItem[]>(initialJobs);
  const [activeModal, setActiveModal] = useState<CancelModalState | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const getStatusBadge = (status: LiveJobItem["status"]) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-teal/10 text-teal border-teal/20";
      case "OFFERS_RECEIVING":
        return "bg-orange/10 text-orange border-orange/20";
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "DISPUTED":
        return "bg-red-100 text-red-700 border-red-200";
      case "CANCELLED":
        return "bg-slate-100 text-slate-600 border-slate-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const handleOpenCancelModal = (job: LiveJobItem) => {
    setActiveModal({ job });
    setCancelReason("");
    setSelectedPreset("");
  };

  const handleConfirmCancel = () => {
    if (!activeModal) return;
    const finalReason = selectedPreset
      ? `${selectedPreset}: ${cancelReason}`.trim()
      : cancelReason.trim();

    if (!finalReason) return;

    // Update job status locally & mock compliant
    setJobs((prev) =>
      prev.map((j) =>
        j.id === activeModal.job.id ? { ...j, status: "CANCELLED" } : j,
      ),
    );

    showToast(`🚫 Job #${activeModal.job.id} forcefully cancelled. Audit record generated.`);
    setActiveModal(null);
    setCancelReason("");
    setSelectedPreset("");
  };

  const cancelPresets = [
    "Customer Unresponsive / Phone Switched Off",
    "Worker No-Show / Absent from Scheduled Visit",
    "On-site Pricing Disagreement between Parties",
    "Safety or Code of Conduct Violation",
    "Duplicate Job Request by Customer",
  ];

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="absolute top-2 right-2 left-2 z-20 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 shadow-xs animate-in fade-in slide-in-from-top-1">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-red-700/70 hover:text-red-700"
          >
            <X className="size-3" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-navy/10 text-navy">
            <Activity className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-navy">Live Jobs Stream</h3>
            <p className="text-[11px] text-slate-500">
              Real-time feed of active customer requests with administrative force-cancel
            </p>
          </div>
        </div>
        <Link
          href="/admin/jobs"
          className="flex items-center gap-1 text-[11px] font-bold text-teal transition hover:underline"
        >
          <span>All Jobs ({jobs.length})</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-slate-100 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-2 px-2">Job Title / Category</th>
              <th className="py-2 px-2">Customer</th>
              <th className="py-2 px-2">Assigned Worker</th>
              <th className="py-2 px-2">Amount</th>
              <th className="py-2 px-2">Status</th>
              <th className="py-2 px-2">Time</th>
              <th className="py-2 px-2 text-right">Administrative Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {jobs.map((job) => (
              <tr key={job.id} className="transition hover:bg-slate-50/80">
                <td className="py-2 px-2">
                  <div className="flex items-center gap-1.5">
                    <p className="font-extrabold text-navy">{job.title}</p>
                    <span className="font-mono text-[9px] text-slate-400">#{job.id}</span>
                  </div>
                  <p className="text-[9px] text-slate-400">
                    {job.category} • {job.city}
                  </p>
                </td>
                <td className="py-2 px-2 font-semibold text-slate-700">
                  {job.customerName}
                </td>
                <td className="py-2 px-2 text-slate-600">
                  {job.workerName || <span className="text-slate-400 italic">Unassigned</span>}
                </td>
                <td className="py-2 px-2 font-extrabold text-navy">
                  Rs. {job.amount.toLocaleString()}
                </td>
                <td className="py-2 px-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${getStatusBadge(
                      job.status,
                    )}`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-2 px-2 font-semibold text-slate-400 text-xs">
                  {job.createdAt}
                </td>
                <td className="py-2 px-2 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[9px] font-bold text-navy shadow-2xs hover:bg-slate-50"
                      title="Drill-down Job Details"
                    >
                      <ExternalLink className="size-2.5 text-teal" />
                      <span>Audit</span>
                    </Link>

                    {job.status !== "CANCELLED" && job.status !== "COMPLETED" && (
                      <button
                        type="button"
                        onClick={() => handleOpenCancelModal(job)}
                        className="inline-flex items-center gap-0.5 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600 shadow-2xs hover:bg-red-100"
                        title="Force Cancel Job (Admin Authority)"
                      >
                        <Ban className="size-2.5" />
                        <span>Force Cancel</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Force Cancel Modal (Backend PUT /admin/jobs/:id/cancel) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <ShieldAlert className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy">
                    Force Cancel Work Order
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Order: <strong className="text-slate-800">#{activeModal.job.id}</strong> — {activeModal.job.title}
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
                  <span>Customer: <strong>{activeModal.job.customerName}</strong></span>
                  <span>Worker: <strong>{activeModal.job.workerName || "None"}</strong></span>
                </div>
                <div className="mt-1 flex justify-between font-bold text-navy">
                  <span>Job Amount: Rs. {activeModal.job.amount.toLocaleString()}</span>
                  <span>Category: {activeModal.job.category}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Cancellation Reason:
                </label>
                <div className="mt-1.5 space-y-1">
                  {cancelPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset);
                        if (!cancelReason) setCancelReason(preset);
                      }}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-[10px] font-medium transition ${
                        selectedPreset === preset
                          ? "border-red-500 bg-red-50/50 text-red-700 font-bold"
                          : "border-slate-200 hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Mandatory Reason & Audit Notes:
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="State the factual reason for administrative cancellation..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-red-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2 text-[10px] font-medium text-red-700">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>
                  This administrative action releases escrow locks and terminates the work order.
                </span>
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
                disabled={!cancelReason.trim()}
                onClick={handleConfirmCancel}
                className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
              >
                Confirm Force Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
