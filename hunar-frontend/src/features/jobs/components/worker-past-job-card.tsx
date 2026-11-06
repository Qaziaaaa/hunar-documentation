"use client";

import React, { useState } from "react";
import { JobRequest } from "@/types/job";
import { formatRs } from "@/lib/design-tokens";
import { formatDate } from "@/lib/format";
import dynamic from "next/dynamic";

const WorkerInvoiceModal = dynamic(
  () => import("./worker-invoice-modal").then((mod) => mod.WorkerInvoiceModal),
  { ssr: false }
);

const WorkerJobDetailsModal = dynamic(
  () => import("./worker-job-details-modal").then((mod) => mod.WorkerJobDetailsModal),
  { ssr: false }
);
import {
  CheckCircle2,
  Calendar,
  Star,
  FileText,
  MapPin,
  Eye,
} from "lucide-react";

import { useLocale } from "next-intl";

interface WorkerPastJobCardProps {
  job: JobRequest;
}

export function WorkerPastJobCard({ job }: WorkerPastJobCardProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const visitCharge = job.visitCharge ?? job.customerSuggestedPrice ?? 0;
  const repairCharge = job.repairCharge ?? 0;
  const hasRepair = repairCharge > 0;
  const grossTotal = hasRepair ? visitCharge + repairCharge : visitCharge;
  const platformCommission = job.platformCommission ?? Math.round(visitCharge * 0.1);
  const netEarnings = job.workerNetEarnings ?? (grossTotal - platformCommission);
  const cleanJobId = job.id?.replace(/^INV-/, "") || job.id;

  const review = job.customerReview;

  // Format real completed date
  const completedDateRaw = job.completedAt || (job as any).updatedAt || job.postedAt;
  const completedDateText = (() => {
    if (!completedDateRaw) return "Completed";
    const d = new Date(completedDateRaw);
    if (isNaN(d.getTime())) return formatDate(completedDateRaw);
    const now = new Date();
    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (isToday) return "Today";

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getFullYear() === yesterday.getFullYear() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getDate() === yesterday.getDate();
    if (isYesterday) return "Yesterday";

    return formatDate(completedDateRaw);
  })();

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3.5 sm:p-5 shadow-[0_12px_16px_-6px_rgba(18,59,93,0.14)] hover:shadow-[0_16px_22px_-6px_rgba(18,59,93,0.20)] transition-all space-y-3.5 flex flex-col justify-between w-full cursor-pointer group"
      >
        <div className="space-y-3">
          {/* Top Status & Invoice Header */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="size-3 text-emerald-600" />
                <span>Completed</span>
              </span>

              <span className="font-mono text-[10.5px] sm:text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                #{cleanJobId}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="size-3" />
              <span>{completedDateText}</span>
            </div>
          </div>

          {/* Job Title */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] font-bold text-[10px] uppercase tracking-wider border border-[#0F8B8D]/20">
                {job.category}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight group-hover:text-[#0F8B8D] transition-colors line-clamp-2">
              {job.title}
            </h3>
          </div>

          {/* Earnings Highlight Box */}
          <div className="bg-emerald-50/60 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-emerald-200/60 flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                  {hasRepair
                    ? (isUrdu ? "وزٹ + مرمت" : "Visit + Repair")
                    : (isUrdu ? "وزٹ چارجز" : "Visit Charge")}
                </span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${
                    hasRepair
                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {hasRepair
                    ? (isUrdu ? "مرمت مکمل" : "Repair Done")
                    : (isUrdu ? "صرف وزٹ" : "Visit Only")}
                </span>
              </div>
              <span className="text-base sm:text-xl font-black text-emerald-900">
                {formatRs(grossTotal)}
              </span>
            </div>
          </div>

          {/* Customer Review Snippet */}
          {review && review.rating ? (
            <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-3.5 border border-slate-100 space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3 ${
                        i < Math.floor(review.rating)
                          ? "text-[#F59E0B] fill-[#F59E0B]"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                  <span className="text-[11px] font-bold text-slate-700 ms-1">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px] sm:max-w-none">{job.customer.name}</span>
              </div>
              {review.tags && review.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1 pb-0.5">
                  {review.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}
              {review.comment ? (
                <p className="text-[11px] sm:text-xs text-slate-600 italic line-clamp-2">
                  &quot;{review.comment}&quot;
                </p>
              ) : null}
            </div>
          ) : null}

        </div>

        {/* Footer Actions */}
        <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowInvoice(true);
            }}
            className="py-1.5 sm:py-2 px-3 sm:px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FileText className="size-3.5 text-[#0F8B8D]" />
            <span>View Receipt</span>
          </button>
        </div>
      </div>

      {showDetails && (
        <WorkerJobDetailsModal
          job={job}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
        />
      )}

      {showInvoice && (
        <WorkerInvoiceModal job={job} onClose={() => setShowInvoice(false)} />
      )}
    </>
  );
}
