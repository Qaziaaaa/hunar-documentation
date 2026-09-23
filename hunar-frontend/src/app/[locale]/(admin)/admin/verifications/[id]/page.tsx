"use client";

import { use, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { Link, useRouter } from "@/i18n/navigation";
import { MOCK_VERIFICATIONS } from "@/mocks/admin.mock";
import type { VerificationRequest } from "@/types/admin";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileCheck2,
  MapPin,
  ShieldCheck,
  User,
  Wrench,
  XCircle,
} from "lucide-react";

export default function VerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [request, setRequest] = useState<VerificationRequest | undefined>(
    MOCK_VERIFICATIONS.find((v) => v.id === resolvedParams.id) || MOCK_VERIFICATIONS[0]
  );
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [reasonInput, setReasonInput] = useState("");

  if (!request) {
    return (
      <AdminShell>
        <div className="p-8 text-center">
          <p className="text-base font-bold text-navy">Verification Request Not Found</p>
          <Link
            href="/admin/verifications"
            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal"
          >
            <ArrowLeft className="size-4" /> Back to Verification Queue
          </Link>
        </div>
      </AdminShell>
    );
  }

  const handleApprove = () => {
    setRequest((prev) => (prev ? { ...prev, status: "VERIFIED" } : prev));
    setTimeout(() => {
      router.push("/admin/verifications");
    }, 1000);
  };

  const handleRejectConfirm = () => {
    setRequest((prev) =>
      prev
        ? {
            ...prev,
            status: "REJECTED",
            rejectionReason: reasonInput || "Identity documents failed verification rules.",
          }
        : prev
    );
    setShowRejectModal(false);
  };

  const handleChangesConfirm = () => {
    setRequest((prev) =>
      prev
        ? {
            ...prev,
            status: "CHANGES_REQUESTED",
            rejectionReason: reasonInput || "Please re-upload clearer photos of your CNIC.",
          }
        : prev
    );
    setShowChangesModal(false);
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Back Link */}
        <Link
          href="/admin/verifications"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy"
        >
          <ArrowLeft className="size-4" /> Back to Verification Queue
        </Link>

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-navy text-2xl font-bold text-white shadow-md shadow-navy/20">
              {request.workerName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-navy">
                  {request.workerName}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                    request.status === "VERIFIED"
                      ? "border-teal/20 bg-teal/10 text-teal"
                      : request.status === "PENDING"
                      ? "border-orange/20 bg-orange/10 text-orange"
                      : "border-red-200 bg-red-100 text-red-700"
                  }`}
                >
                  <ShieldCheck className="size-3" />
                  {request.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Application ID: {request.id} • Phone: {request.workerPhone}
              </p>
            </div>
          </div>

          {/* Decision Action Buttons (Task 23) */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowChangesModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-orange/30 bg-orange/10 px-4 py-2.5 text-xs font-bold text-orange transition hover:bg-orange/20"
            >
              <AlertCircle className="size-4" />
              <span>Request Changes</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRejectModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              <XCircle className="size-4" />
              <span>Reject Submission</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              className="inline-flex items-center gap-1.5 rounded-xl bg-teal px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-teal/25 transition hover:bg-teal-600"
            >
              <CheckCircle2 className="size-4" />
              <span>Approve & Grant Badge</span>
            </button>
          </div>
        </div>

        {/* Worker Identity & Skills Info */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
              <User className="size-4 text-teal" /> Worker Details
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Full Name
                </p>
                <p className="font-extrabold text-navy">{request.workerName}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  CNIC Identity Number
                </p>
                <p className="font-mono font-extrabold text-teal">
                  {request.cnicNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Service City
                </p>
                <p className="font-semibold text-slate-700">
                  {request.serviceCity}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
              <Wrench className="size-4 text-teal" /> Trade & Experience
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Declared Skills
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {request.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-md bg-teal/10 px-2.5 py-1 text-[11px] font-bold text-teal"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Experience
                </p>
                <p className="font-bold text-navy">
                  {request.experienceYears} Years Professional Practice
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase text-slate-400">
              <Calendar className="size-4 text-teal" /> Submission Info
            </div>
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Date Submitted
                </p>
                <p className="font-semibold text-slate-700">
                  {new Date(request.submittedAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">
                  Audit Status
                </p>
                <p className="font-extrabold text-navy">{request.status}</p>
              </div>
            </div>
          </div>
        </div>

        {/* CNIC Document Inspection Panels (Task 22) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileCheck2 className="size-5 text-teal" />
            <h3 className="text-base font-extrabold text-navy">
              CNIC Document Images Audit
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* CNIC Front */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy">
                CNIC Front Side Photo
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2">
                <img
                  src={request.cnicFrontUrl}
                  alt="CNIC Front Document"
                  className="h-64 w-full object-cover rounded-xl shadow-inner"
                />
              </div>
            </div>

            {/* CNIC Back */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-navy">
                CNIC Back Side Photo
              </p>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2">
                <img
                  src={request.cnicBackUrl}
                  alt="CNIC Back Document"
                  className="h-64 w-full object-cover rounded-xl shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reject Reason Modal */}
        {showRejectModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-extrabold text-navy">
                Reject Worker Application
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                State the reason for rejecting this verification request.
              </p>

              <textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Enter rejection reason..."
                className="mt-4 h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectConfirm}
                  className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-md"
                >
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Request Changes Modal */}
        {showChangesModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-extrabold text-navy">
                Request Changes from Worker
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Specify what needs to be updated (e.g., clearer photos, valid CNIC expiry).
              </p>

              <textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Enter instructions for worker..."
                className="mt-4 h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowChangesModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleChangesConfirm}
                  className="rounded-xl bg-orange px-5 py-2 text-xs font-bold text-white shadow-md"
                >
                  Send Change Request
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
