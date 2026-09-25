"use client";

import React, { useState } from "react";
import { JobRequest } from "@/types/job";
import { formatRs } from "@/lib/design-tokens";
import { WorkerInvoiceModal } from "./worker-invoice-modal";
import { WorkerJobDetailsModal } from "./worker-job-details-modal";
import {
  CheckCircle2,
  Calendar,
  Star,
  ShieldCheck,
  FileText,
  MapPin,
  Eye,
} from "lucide-react";

interface WorkerPastJobCardProps {
  job: JobRequest;
}

export function WorkerPastJobCard({ job }: WorkerPastJobCardProps) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const visitCharge = job.visitCharge ?? 500;
  const repairCharge = job.repairCharge ?? 1500;
  const grossTotal = visitCharge + repairCharge;
  const netEarnings = grossTotal;
  const warrantyDays = job.warrantyDays || 30;
  const invoiceNumber = job.invoiceNumber || `INV-2026-${job.id.slice(-4)}`;

  const review = job.customerReview || {
    rating: 5,
    comment: "Excellent service and high professionalism! Solved the problem quickly.",
    date: "Completed recently",
  };

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
                {invoiceNumber}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Calendar className="size-3" />
              <span>{job.preferredVisitWindow.date}</span>
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
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Total Earned &amp; Settled
              </span>
              <span className="text-base sm:text-xl font-black text-emerald-900">
                {formatRs(netEarnings)}
              </span>
            </div>

            <div className="text-right text-[10px] sm:text-[11px] text-emerald-700 font-bold shrink-0">
              <span className="px-2.5 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[10px]">
                Paid to Wallet
              </span>
            </div>
          </div>

          {/* Customer Review Snippet */}
          {review && (
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
              <p className="text-[11px] sm:text-xs text-slate-600 italic line-clamp-2">
                &quot;{review.comment}&quot;
              </p>
            </div>
          )}

          {/* Warranty Badge */}
          <div className="flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-semibold text-teal-700">
            <ShieldCheck className="size-3.5 text-[#0F8B8D] shrink-0" />
            <span>{warrantyDays}-Day Customer Guarantee Active</span>
          </div>
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
