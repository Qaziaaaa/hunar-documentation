"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { adminApi } from "@/features/admin/api/admin-api";
import { Link } from "@/i18n/navigation";
import type { JobDetailItem } from "@/types/admin";
import {
  AlertCircle,
  ArrowLeft,
  Ban,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
  const [job, setJob] = useState<JobDetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    void params.then((p) => {
      if (cancelled) return;
      setResolvedParams(p);
      setLoading(true);
      adminApi
        .getJobDetail(p.id)
        .then((detail) => {
          if (!cancelled) setJob(detail);
        })
        .catch(() => {
          if (!cancelled) setJob(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
      <AdminShell>
        <div className="p-8 text-center">
          <p className="text-base font-bold text-navy">Loading job audit record...</p>
        </div>
      </AdminShell>
    );
  }

  if (!job) {
    return (
      <AdminShell>
        <div className="p-8 text-center">
          <p className="text-base font-bold text-navy">Job Audit Record Not Found</p>
          <Link href="/admin/jobs" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal">
            <ArrowLeft className="size-4" /> Back to Jobs
          </Link>
        </div>
      </AdminShell>
    );
  }

  const handleForceCancel = () => {
    setJob((prev) =>
      prev
        ? {
            ...prev,
            status: "CANCELLED",
            cancelReason: cancelReason || "Cancelled by Admin intervention",
          }
        : prev
    );
    if (resolvedParams) {
      void adminApi.cancelJob(resolvedParams.id, cancelReason).catch(() => undefined);
    }
    setShowCancelModal(false);
  };

  return (
    <AdminShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/admin/jobs" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy">
          <ArrowLeft className="size-4" /> Back to Jobs Monitoring
        </Link>

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                <Briefcase className="size-3.5" /> Job Audit Drill-Down
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-navy">
                {job.status}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-navy">{job.title}</h1>
            <p className="text-xs text-slate-500">ID: {job.id} • Category: {job.category}</p>
          </div>

          {job.status !== "CANCELLED" && job.status !== "COMPLETED" ? (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700"
            >
              <Ban className="size-4" /> Force Cancel Job
            </button>
          ) : null}
        </div>

        {/* Job Details Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm">
              Work Order Details
            </h3>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Customer</p>
              <p className="font-bold text-navy">{job.customerName}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Assigned Worker</p>
              <p className="font-bold text-teal">{job.workerName || "Unassigned"}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Location Address</p>
              <p className="font-medium text-slate-700 flex items-center gap-1">
                <MapPin className="size-3.5 text-slate-400 shrink-0" /> {job.address}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm">
              Financial Breakdown
            </h3>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Visit Inspection Charge:</span>
              <span className="font-bold text-navy">Rs. {job.visitCharge}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Estimated Total Work:</span>
              <span className="font-extrabold text-teal">Rs. {job.estimatedTotal}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
              <span className="font-bold text-navy">Platform Escrow Status:</span>
              <span className="font-black text-green-600">Secured</span>
            </div>
          </div>
        </div>

        {/* Audit Trail Timeline (Task 25) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-navy border-b border-slate-100 pb-3">
            Full Audit History Trail
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {job.auditTrail.map((step, idx) => (
              <div key={idx} className="relative">
                <span className="absolute -left-[31px] top-0.5 flex size-4 items-center justify-center rounded-full bg-teal text-white ring-4 ring-white">
                  <CheckCircle2 className="size-3" />
                </span>
                <div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-navy">{step.step}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-teal">{step.actor}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400">{step.timestamp}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 font-medium">{step.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel Modal (Task 26) */}
        {showCancelModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="size-6 shrink-0" />
                <h3 className="text-lg font-extrabold text-navy">Force Cancel Job</h3>
              </div>
              <p className="mt-2 text-xs text-slate-600">
                Cancellation will refund customer visit deposit and notify worker.
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter cancellation reason..."
                className="mt-4 h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal"
              />
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCancelModal(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">
                  Cancel
                </button>
                <button type="button" onClick={handleForceCancel} className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-md">
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AdminShell>
  );
}
