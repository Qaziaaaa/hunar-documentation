"use client";

import { AlertTriangle, ArrowUpRight, ShieldAlert, CheckCircle, FileText } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { DisputeReport } from "@/types/admin";

export function DisputesQueueWidget({ disputes }: { disputes: DisputeReport[] }) {
  const getDisputeBadge = (status: DisputeReport["status"]) => {
    switch (status) {
      case "OPEN":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "UNDER_REVIEW":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "RESOLVED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
            <ShieldAlert className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-navy">Active Disputes & Complaints</h3>
            <p className="text-[11px] text-slate-500">
              Escalated tickets requiring operational resolution & mediation
            </p>
          </div>
        </div>
        <Link
          href="/admin/disputes"
          className="flex items-center gap-1 text-[11px] font-bold text-teal transition hover:underline"
        >
          <span>Disputes Queue</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        {disputes.length === 0 ? (
          <div className="py-4 text-center text-xs font-semibold text-slate-400">
            No active disputes found. Marketplace operational health is normal!
          </div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition hover:bg-slate-50 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-navy">#{dispute.id.toUpperCase()}</span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${getDisputeBadge(
                      dispute.status
                    )}`}
                  >
                    {dispute.status.replace("_", " ")}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    Job #{dispute.jobId}
                  </span>
                </div>
                <h4 className="text-xs font-extrabold text-slate-800">
                  {dispute.issueCategory}
                </h4>
                <p className="line-clamp-1 text-[10px] text-slate-500">
                  {dispute.description}
                </p>
                <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                  <span>Reporter: <strong className="text-slate-700">{dispute.reporterName} ({dispute.reporterRole})</strong></span>
                  <span>•</span>
                  <span>Target: <strong className="text-slate-700">{dispute.targetName}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end md:self-auto">
                <Link
                  href={`/admin/disputes`}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-navy shadow-xs transition hover:bg-slate-100"
                >
                  <FileText className="size-3 text-teal" />
                  <span>Review Ticket</span>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
