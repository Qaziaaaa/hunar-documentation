"use client";

import { CheckCircle2, Clock, Edit3, XCircle } from "lucide-react";
import type { VerificationOutcome } from "../types";

export function StatusTesterBar({
  currentStatus,
  onSelectStatus,
}: {
  currentStatus: VerificationOutcome;
  onSelectStatus: (status: VerificationOutcome) => void;
}) {
  return (
    <div className="mb-4 rounded-2xl border border-teal/20 bg-slate-50/90 p-2 sm:p-2.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 px-1">
          <span className="flex size-2 rounded-full bg-teal animate-pulse" />
          <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-navy">
            Outcome Simulator (Preview 4 States):
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5">
          <button
            type="button"
            onClick={() => onSelectStatus("pending")}
            className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition-all ${
              currentStatus === "pending"
                ? "border border-orange bg-orange text-white shadow-2xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-orange/50 hover:bg-orange/5"
            }`}
          >
            <Clock className="size-3 shrink-0" />
            <span>Under Review</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatus("approved")}
            className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition-all ${
              currentStatus === "approved"
                ? "border border-teal bg-teal text-white shadow-2xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-teal/50 hover:bg-teal/5"
            }`}
          >
            <CheckCircle2 className="size-3 shrink-0" />
            <span>Approved</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatus("request_changes")}
            className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition-all ${
              currentStatus === "request_changes"
                ? "border border-orange bg-orange text-white shadow-2xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-orange/50 hover:bg-orange/5"
            }`}
          >
            <Edit3 className="size-3 shrink-0" />
            <span>Changes Requested</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectStatus("rejected")}
            className={`flex items-center justify-center gap-1 rounded-full px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition-all ${
              currentStatus === "rejected"
                ? "border border-error bg-error text-white shadow-2xs"
                : "border border-slate-200 bg-white text-slate-700 hover:border-error/50 hover:bg-error/5"
            }`}
          >
            <XCircle className="size-3 shrink-0" />
            <span>Rejected</span>
          </button>
        </div>
      </div>
    </div>
  );
}
