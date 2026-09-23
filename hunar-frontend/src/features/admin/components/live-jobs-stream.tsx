"use client";

import { Activity, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { LiveJobItem } from "@/types/admin";

export function LiveJobsStream({ jobs }: { jobs: LiveJobItem[] }) {
  const getStatusBadge = (status: LiveJobItem["status"]) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-teal/10 text-teal border-teal/20";
      case "OFFERS_RECEIVING":
        return "bg-orange/10 text-orange border-orange/20";
      case "COMPLETED":
        return "bg-green-100 text-green-700 border-green-200";
      case "DISPUTED":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-navy/10 text-navy">
            <Activity className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-navy">Live Jobs Stream</h3>
            <p className="text-xs text-slate-500">
              Real-time feed of active customer requests & job updates
            </p>
          </div>
        </div>
        <Link
          href="/admin/jobs"
          className="flex items-center gap-1 text-xs font-bold text-teal transition hover:underline"
        >
          <span>All Jobs</span>
          <ArrowUpRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-2">Job Title / Category</th>
              <th className="py-3 px-2">Customer</th>
              <th className="py-3 px-2">Assigned Worker</th>
              <th className="py-3 px-2">Amount</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {jobs.map((job) => (
              <tr key={job.id} className="transition hover:bg-slate-50">
                <td className="py-3.5 px-2">
                  <p className="font-extrabold text-navy">{job.title}</p>
                  <p className="text-[10px] text-slate-400">
                    {job.category} • {job.city}
                  </p>
                </td>
                <td className="py-3.5 px-2 font-semibold text-slate-700">
                  {job.customerName}
                </td>
                <td className="py-3.5 px-2 text-slate-600">
                  {job.workerName || "Unassigned"}
                </td>
                <td className="py-3.5 px-2 font-extrabold text-navy">
                  Rs. {job.amount.toLocaleString()}
                </td>
                <td className="py-3.5 px-2">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${getStatusBadge(
                      job.status
                    )}`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                </td>
                <td className="py-3.5 px-2 text-right font-semibold text-slate-400">
                  {job.createdAt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
