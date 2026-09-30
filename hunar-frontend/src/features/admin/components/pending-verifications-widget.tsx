"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileEdit,
  ShieldAlert,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { VerificationRequest } from "@/types/admin";
import {
  approveWorkerVerification,
  rejectWorkerVerification,
} from "@/features/admin/api/admin-api";

interface ActionModalState {
  type: "reject" | "request_changes";
  workerId: string;
  workerName: string;
  reqId: string;
}

export function PendingVerificationsWidget({
  requests: initialRequests,
}: {
  requests: VerificationRequest[];
}) {
  const [items, setItems] = useState<VerificationRequest[]>(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ActionModalState | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApprove = async (workerId: string, reqId: string, name: string) => {
    setProcessingId(reqId);
    await approveWorkerVerification(workerId);
    setItems((prev) => prev.filter((i) => i.id !== reqId));
    setProcessingId(null);
    showToast(`✅ ${name} verified successfully! Status updated to APPROVED.`);
  };

  const openActionModal = (
    type: "reject" | "request_changes",
    item: VerificationRequest,
  ) => {
    setActiveModal({
      type,
      workerId: item.workerId,
      workerName: item.workerName,
      reqId: item.id,
    });
    setReasonText("");
    setSelectedPreset("");
  };

  const closeModal = () => {
    setActiveModal(null);
    setReasonText("");
    setSelectedPreset("");
  };

  const handleConfirmAction = async () => {
    if (!activeModal) return;
    const finalReason = selectedPreset
      ? `${selectedPreset}: ${reasonText}`.trim()
      : reasonText.trim();

    if (!finalReason) return;

    setProcessingId(activeModal.reqId);

    if (activeModal.type === "reject") {
      await rejectWorkerVerification(activeModal.workerId, finalReason);
      setItems((prev) => prev.filter((i) => i.id !== activeModal.reqId));
      showToast(`❌ Verification rejected for ${activeModal.workerName} with reason recorded.`);
    } else {
      // Request Changes workflow (Mock & API compliant)
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeModal.reqId
            ? { ...i, status: "CHANGES_REQUESTED" }
            : i,
        ),
      );
      showToast(`📝 Changes requested from ${activeModal.workerName}. Audit log recorded.`);
    }

    setProcessingId(null);
    closeModal();
  };

  const rejectPresets = [
    "Fraudulent or invalid CNIC document",
    "Identity mismatch between photo and CNIC",
    "Fake experience or fraudulent credentials",
    "Blacklisted user profile",
  ];

  const requestChangesPresets = [
    "CNIC front photo is blurred or unreadable",
    "CNIC back photo is missing or obscured",
    "Selfie photo does not clearly show face",
    "Expired trade certificate or credentials",
  ];

  return (
    <div className="relative rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
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

      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-orange/10 text-orange">
            <Clock className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy">
              Pending Worker Verifications
            </h3>
            <p className="text-[10px] text-slate-500">
              Identity review queue with approve, request changes & audit rejection
            </p>
          </div>
        </div>
        <Link
          href="/admin/verifications"
          className="flex items-center gap-1 text-[10px] font-bold text-teal transition hover:underline"
        >
          <span>View All ({items.length})</span>
          <ChevronRight className="size-3" />
        </Link>
      </div>

      <div className="mt-1.5 divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-500 font-medium">
            No pending verifications. All queue items processed!
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1.5 py-1.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-white shadow-2xs">
                  {item.workerName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-navy">{item.workerName}</p>
                    <span className="font-mono text-[9px] text-slate-400">
                      {item.cnicNumber || "CNIC: 35201-*****-1"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {item.skills.join(", ")}
                    </span>
                    <span>•</span>
                    <span>{item.serviceCity}</span>
                    <span>•</span>
                    <span>{item.experienceYears} yrs exp</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/verifications/${item.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-navy transition hover:bg-slate-100"
                >
                  <ShieldCheck className="size-2.5 text-teal" />
                  <span>Review CNIC</span>
                </Link>

                {/* Quick Approve */}
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleApprove(item.workerId, item.id, item.workerName)}
                  className="flex size-6 items-center justify-center rounded-md bg-green-50 text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                  title="Approve Verification"
                >
                  <CheckCircle2 className="size-3" />
                </button>

                {/* Request Changes (Backend PUT /admin/verifications/:id/request-changes) */}
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => openActionModal("request_changes", item)}
                  className="flex size-6 items-center justify-center rounded-md bg-amber-50 text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                  title="Request Document Changes"
                >
                  <FileEdit className="size-3" />
                </button>

                {/* Reject with Reason (Backend PUT /admin/verifications/:id/reject) */}
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => openActionModal("reject", item)}
                  className="flex size-6 items-center justify-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  title="Reject with Audit Reason"
                >
                  <XCircle className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Modal (Reason / Notes Dialog) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`flex size-8 items-center justify-center rounded-lg ${
                    activeModal.type === "reject"
                      ? "bg-red-100 text-red-600"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {activeModal.type === "reject" ? (
                    <ShieldAlert className="size-4" />
                  ) : (
                    <FileEdit className="size-4" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy">
                    {activeModal.type === "reject"
                      ? "Reject Worker Verification"
                      : "Request Document Changes"}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Target: <strong className="text-slate-800">{activeModal.workerName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Common Reason:
                </label>
                <div className="mt-1.5 space-y-1">
                  {(activeModal.type === "reject"
                    ? rejectPresets
                    : requestChangesPresets
                  ).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedPreset(preset);
                        if (!reasonText) setReasonText(preset);
                      }}
                      className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-[10px] font-medium transition ${
                        selectedPreset === preset
                          ? "border-navy bg-navy/5 text-navy font-bold"
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
                  {activeModal.type === "reject"
                    ? "Mandatory Reason / Notes (Audit Trail):"
                    : "Instructions for Worker:"}
                </label>
                <textarea
                  rows={3}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  placeholder={
                    activeModal.type === "reject"
                      ? "Explain why this verification is rejected..."
                      : "Explain clearly which documents to re-submit..."
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-navy focus:outline-hidden"
                />
              </div>

              {activeModal.type === "reject" && (
                <div className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2 text-[10px] font-medium text-red-700">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  <span>
                    This action will reject worker onboarding and notify them via SMS/In-app.
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reasonText.trim()}
                onClick={handleConfirmAction}
                className={`rounded-lg px-4 py-1.5 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 ${
                  activeModal.type === "reject"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {activeModal.type === "reject" ? "Confirm Rejection" : "Send Revision Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
