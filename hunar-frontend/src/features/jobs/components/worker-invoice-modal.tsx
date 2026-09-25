"use client";

import React from "react";
import { JobRequest } from "@/types/job";
import { formatRs } from "@/lib/design-tokens";
import {
  FileText,
  CheckCircle2,
  ShieldCheck,
  Printer,
  X,
} from "lucide-react";

interface WorkerInvoiceModalProps {
  job: JobRequest;
  onClose: () => void;
}

export function WorkerInvoiceModal({ job, onClose }: WorkerInvoiceModalProps) {
  const visitCharge = job.visitCharge ?? 500;
  const repairCharge = job.repairCharge ?? 1500;
  const grossTotal = visitCharge + repairCharge;
  const netEarnings = grossTotal;
  const invoiceNumber = job.invoiceNumber || `INV-2026-${job.id.slice(-4)}`;
  const warrantyDays = job.warrantyDays || 30;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl space-y-4 sm:space-y-6 animate-in fade-in zoom-in-95 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="size-9 sm:size-11 rounded-xl sm:rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0">
              <FileText className="size-5 sm:size-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] sm:text-xs font-mono font-bold text-[#0F8B8D]">
                  {invoiceNumber}
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
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200/80 text-[11px] sm:text-xs">
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
                ? new Date(job.completedAt).toLocaleDateString("en-PK", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "24 Oct 2026"}
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

            <div className="p-2.5 sm:p-3.5 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-slate-700">Total Value</span>
              <span className="font-bold text-slate-900">{formatRs(grossTotal)}</span>
            </div>

            <div className="p-3 sm:p-4 flex justify-between items-center bg-emerald-50/80 text-emerald-900">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                <span className="font-black text-xs sm:text-sm">Net Wallet Credit</span>
              </div>
              <span className="font-black text-base sm:text-lg text-emerald-800">
                {formatRs(netEarnings)}
              </span>
            </div>
          </div>
        </div>

        {/* Warranty Badge */}
        <div className="flex items-center gap-2.5 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-teal-50 border border-[#0F8B8D]/20 text-[11px] sm:text-xs">
          <ShieldCheck className="size-4 sm:size-5 text-[#0F8B8D] shrink-0" />
          <div className="text-slate-700 leading-relaxed">
            <strong className="text-[#0F8B8D] font-extrabold">{warrantyDays}-Day Guarantee: </strong>
            Customer is covered under WorkerFIX Pro protection warranty.
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
