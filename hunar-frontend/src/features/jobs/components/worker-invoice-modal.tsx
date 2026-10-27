"use client";

import React from "react";
import { JobRequest } from "@/types/job";
import { formatRs } from "@/lib/design-tokens";
import { formatDate } from "@/lib/format";
import {
  FileText,
  CheckCircle2,
  Printer,
  X,
} from "lucide-react";

interface WorkerInvoiceModalProps {
  job: JobRequest;
  onClose: () => void;
}

export function WorkerInvoiceModal({ job, onClose }: WorkerInvoiceModalProps) {
  const visitCharge = job.visitCharge ?? (job as any).lockedVisitCharge ?? 0;
  const repairCharge = job.repairCharge ?? 0;
  const grossTotal = visitCharge + repairCharge;
  const platformCommission = job.platformCommission ?? Math.round(grossTotal * 0.1);
  const netEarnings = job.workerNetEarnings ?? (grossTotal - platformCommission);
  const cleanJobId = job.id?.replace(/^INV-/, "") || job.id;
  const receiptReference = job.invoiceNumber && !job.invoiceNumber.startsWith("INV-")
    ? job.invoiceNumber
    : `Order #${cleanJobId}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto scrollbar-none no-scrollbar">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg lg:max-w-2xl w-full p-4 sm:p-7 lg:p-8 shadow-2xl space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto scrollbar-none no-scrollbar">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="size-9 sm:size-11 rounded-xl sm:rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0">
              <FileText className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-[#0F8B8D]">
                  {receiptReference}
                </span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 text-[9.5px] sm:text-[10px] font-bold border border-emerald-200">
                  PAID &amp; SETTLED
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-extrabold text-[#123B5D] mt-0.5 truncate">
                Work Order &amp; Receipt
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 bg-slate-50 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border border-slate-200/80 text-[11px] sm:text-xs">
          <div>
            <span className="text-slate-400 uppercase font-semibold text-[9.5px] sm:text-[10px] block">
              Customer
            </span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{job.customer.name}</p>
            <p className="text-slate-500 text-[10.5px] sm:text-[11px] truncate">{job.customer.phone}</p>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-semibold text-[9.5px] sm:text-[10px] block">
              Location
            </span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{job.location.area}</p>
            <p className="text-slate-500 text-[10.5px] sm:text-[11px] truncate">{job.location.city}</p>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-semibold text-[9.5px] sm:text-[10px] block">
              Service
            </span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">{job.category}</p>
          </div>

          <div>
            <span className="text-slate-400 uppercase font-semibold text-[9.5px] sm:text-[10px] block">
              Date Settled
            </span>
            <p className="font-bold text-slate-900 mt-0.5 truncate">
              {job.completedAt
                ? formatDate(job.completedAt)
                : (job as any).scheduledDate
                ? formatDate((job as any).scheduledDate)
                : "—"}
            </p>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="space-y-1.5 sm:space-y-2">
          <h4 className="text-[10px] sm:text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Earnings Breakdown
          </h4>

          <div className="border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden divide-y divide-slate-100 text-[11px] sm:text-xs">
            <div className="p-2.5 sm:p-3.5 flex justify-between items-center gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 truncate">Diagnostic Visit Fee</p>
                <p className="text-slate-500 text-[10px] sm:text-[11px] truncate">On-site fault diagnosis and testing</p>
              </div>
              <span className="font-bold text-slate-900 shrink-0">{formatRs(visitCharge)}</span>
            </div>

            {repairCharge > 0 && (
              <div className="p-2.5 sm:p-3.5 flex justify-between items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 truncate">Repair &amp; Parts Labor</p>
                  <p className="text-slate-500 text-[10px] sm:text-[11px] truncate">Approved repair execution</p>
                </div>
                <span className="font-bold text-slate-900 shrink-0">{formatRs(repairCharge)}</span>
              </div>
            )}

            <div className="p-3 sm:p-4 flex justify-between items-center bg-emerald-50/80 text-emerald-900">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span className="font-black text-xs sm:text-sm">Total Earning</span>
              </div>
              <span className="font-black text-base sm:text-lg text-emerald-800">
                {formatRs(grossTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-1 sm:pt-2">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="size-3.5" />
            <span>Print</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 sm:py-2.5 px-3 rounded-xl bg-[#123B5D] hover:bg-[#0E2E49] text-white text-xs font-bold transition-colors text-center"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
