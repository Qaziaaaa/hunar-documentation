"use client";

import { useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock,
  Heart,
  ShieldCheck,
  Star,
  Trophy,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { LiveJobItem, VerificationRequest, WorkerUser } from "@/types/admin";
import {
  approveWorkerVerification,
  rejectWorkerVerification,
} from "@/features/admin/api/admin-api";

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: "bg-teal",
  OFFERS_RECEIVING: "bg-orange",
  COMPLETED: "bg-emerald-500",
  DISPUTED: "bg-red-500",
  CANCELLED: "bg-slate-400",
  OPEN: "bg-blue-500",
};

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: "In Progress",
  OFFERS_RECEIVING: "Offers",
  COMPLETED: "Completed",
  DISPUTED: "Disputed",
  CANCELLED: "Cancelled",
  OPEN: "Open",
};

export function DashboardRightPanel({
  jobs: initialJobs,
  verifications: initialVerifications,
  topWorkers,
}: {
  jobs: LiveJobItem[];
  verifications: VerificationRequest[];
  topWorkers: WorkerUser[];
}) {
  const [activeTab, setActiveTab] = useState<"active" | "all">("active");
  const [verifications, setVerifications] = useState<VerificationRequest[]>(
    initialVerifications.slice(0, 4),
  );
  const [processingId, setProcessingId] = useState<string | null>(null);

  const displayJobs =
    activeTab === "active"
      ? initialJobs.filter((j) => j.status === "IN_PROGRESS" || j.status === "OFFERS_RECEIVING" || j.status === "OPEN").slice(0, 3)
      : initialJobs.slice(0, 3);

  const currentWorker = verifications[0];

  const handleApprove = async (workerId: string, reqId: string) => {
    setProcessingId(reqId);
    try {
      await approveWorkerVerification(workerId);
      setVerifications((prev) => prev.filter((i) => i.id !== reqId));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (workerId: string, reqId: string) => {
    setProcessingId(reqId);
    try {
      await rejectWorkerVerification(workerId, "Rejected via dashboard quick review");
      setVerifications((prev) => prev.filter((i) => i.id !== reqId));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* ── CARD 1: ACTIVE JOBS (Glasswindow Reference Style) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        {/* Top Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab("active")}
              className={`pb-1 text-xs font-bold transition border-b-2 ${
                activeTab === "active"
                  ? "border-teal text-teal"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              Active Jobs
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`pb-1 text-xs font-bold transition border-b-2 ${
                activeTab === "all"
                  ? "border-teal text-teal"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              All Jobs
            </button>
          </div>
          <Link
            href="/admin/jobs"
            className="flex items-center gap-0.5 text-[10px] font-bold text-teal hover:underline"
          >
            See all
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {/* Subheader */}
        <div className="flex items-center gap-1.5 py-2">
          <Activity className="size-3 text-teal" />
          <p className="text-[10px] font-semibold text-slate-400">
            Real-time customer requests & status
          </p>
        </div>

        {/* Jobs List (3 items) */}
        <div className="flex flex-col gap-2">
          {displayJobs.map((job) => (
            <div
              key={job.id}
              className="flex gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 transition hover:bg-slate-50 hover:border-slate-200"
            >
              {/* Colored left indicator stripe */}
              <div
                className={`w-[3px] rounded-full shrink-0 self-stretch ${
                  STATUS_COLORS[job.status] ?? "bg-slate-300"
                }`}
              />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                {/* Row 1: time + status badge */}
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] font-medium text-slate-400">
                    {job.createdAt}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-extrabold text-white ${
                      STATUS_COLORS[job.status] ?? "bg-slate-400"
                    }`}
                  >
                    {STATUS_LABEL[job.status] ?? job.status}
                  </span>
                </div>

                {/* Row 2: Job title */}
                <p className="truncate text-[11px] font-bold text-navy leading-tight">
                  {job.title}
                </p>

                {/* Row 3: City & Category */}
                <p className="text-[9px] text-slate-400 truncate">
                  {job.city} • {job.category}
                </p>

                {/* Row 4: Customer + Amount */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[9px] font-medium text-slate-500 truncate">
                    {job.customerName}
                  </span>
                  <span className="text-[11px] font-black text-navy shrink-0">
                    Rs. {job.amount.toLocaleString()}
                    <span className="text-[8px] font-semibold text-slate-400"> /Fixed</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <Link
            href="/admin/jobs"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/80 py-2 text-[10px] font-bold text-navy hover:bg-slate-100 transition"
          >
            <Briefcase className="size-3 text-teal" />
            Manage All Jobs
            <ArrowUpRight className="size-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ── CARD 1.5: TOP VERIFIED PROFESSIONALS (A–Z sorted) ── */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <div className="flex size-6 items-center justify-center rounded-lg bg-amber-500/10">
              <Trophy className="size-3.5 text-amber-600" />
            </div>
            <span className="text-xs font-bold text-navy">Top Verified Professionals</span>
          </div>
          <Link
            href="/admin/users/workers"
            className="flex items-center gap-0.5 text-[10px] font-bold text-teal hover:underline"
          >
            All Jobs
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {/* Workers List A–Z */}
        <div className="mt-2.5 flex flex-col gap-2">
          {topWorkers.slice(0, 3).map((worker) => (
            <div
              key={worker.id}
              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2 transition hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Avatar */}
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-navy text-[10px] font-black text-white shadow-xs">
                  {worker.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-extrabold text-navy">
                    {worker.name}
                  </p>
                  <p className="text-[9px] text-slate-400 truncate">
                    {worker.skills[0]} • {worker.serviceCity}
                  </p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="flex items-center justify-end gap-0.5">
                  <Star className="size-2.5 fill-amber-400 text-amber-400" />
                  <span className="text-[11px] font-black text-navy">{worker.rating}</span>
                </div>
                <p className="text-[9px] text-slate-400 font-semibold">
                  Rs. {worker.totalEarnings.toLocaleString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <Link
            href="/admin/users/workers"
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200/80 py-2 text-[10px] font-bold text-navy hover:bg-slate-100 transition"
          >
            <Trophy className="size-3 text-amber-500" />
            View All Workers
            <ArrowUpRight className="size-3 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ── CARD 2: PENDING WORKER VERIFICATION (Glasswindow Reference Card) ── */}
      <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-orange" />
            <span className="text-xs font-bold text-navy">Worker Verification</span>
            {verifications.length > 0 && (
              <span className="inline-flex size-4 items-center justify-center rounded-full bg-orange text-[9px] font-extrabold text-white">
                {verifications.length}
              </span>
            )}
          </div>
          <Link
            href="/admin/verifications"
            className="flex items-center gap-0.5 text-[10px] font-bold text-teal hover:underline"
          >
            View all
            <ChevronRight className="size-3" />
          </Link>
        </div>

        {/* Worker profile content */}
        <div className="flex-1 flex flex-col">
        {currentWorker ? (
          <div className="pt-3 space-y-2.5">
            {/* Worker Avatar & Name Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-black text-white shadow-xs">
                  {currentWorker.workerName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-extrabold text-navy">
                    {currentWorker.workerName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {currentWorker.skills?.[0] ?? "Technician"} • {currentWorker.serviceCity}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="text-slate-300 hover:text-teal transition p-1"
                title="Save worker"
              >
                <Heart className="size-3.5" />
              </button>
            </div>

            {/* Spec details table (Glasswindow style) */}
            <div className="space-y-1 rounded-xl bg-slate-50/80 border border-slate-100 p-2.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Code</span>
                <span className="font-bold text-navy">
                  :#{currentWorker.id.slice(0, 6).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Experience</span>
                <span className="font-bold text-navy">
                  :{String(currentWorker.experienceYears).padStart(2, "0")} Years
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">Willing to relocate</span>
                <span className="font-bold text-teal">:Yes</span>
              </div>
            </div>

            {/* Action Buttons: Decline & Accept */}
            <div className="grid grid-cols-2 gap-2 pt-0.5">
              <button
                type="button"
                disabled={processingId === currentWorker.id}
                onClick={() => handleReject(currentWorker.workerId, currentWorker.id)}
                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-[10px] font-bold text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition disabled:opacity-50"
              >
                <XCircle className="size-3" />
                Decline
              </button>
              <button
                type="button"
                disabled={processingId === currentWorker.id}
                onClick={() => handleApprove(currentWorker.workerId, currentWorker.id)}
                className="flex items-center justify-center gap-1 rounded-xl bg-teal py-2 text-[10px] font-bold text-white shadow-xs shadow-teal/20 hover:bg-teal/90 transition disabled:opacity-50"
              >
                <CheckCircle2 className="size-3" />
                Accept
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
            <ShieldCheck className="size-8 text-teal/40" />
            <p className="mt-1.5 text-xs font-bold text-navy">Queue Clear!</p>
            <p className="text-[10px] text-slate-400">All pending verifications processed</p>
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-100">
          <Link
            href="/admin/verifications"
            className="flex w-full items-center justify-center gap-1 rounded-xl bg-slate-50 border border-slate-200/80 py-2 text-[10px] font-bold text-navy hover:bg-slate-100 transition"
          >
            <ShieldCheck className="size-3 text-orange" />
            Full Verification Queue
            <ChevronRight className="size-3 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
