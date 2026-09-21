"use client";

import { ArrowRight, ChevronRight, Sparkles, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { MOCK_CUSTOMER_JOBS } from "../mock/customer-mock-data";

export function ActiveJobsTable() {
  const jobs = MOCK_CUSTOMER_JOBS;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
              My Active Jobs
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[#123B5D] text-xs font-semibold">
              {jobs.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track quotes, technician dispatches, and milestone completions
          </p>
        </div>
        <Link
          href="/customer/jobs"
          className="text-[#0F8B8D] hover:text-[#0F8B8D]/80 text-xs inline-flex items-center gap-1 font-semibold self-start sm:self-auto"
        >
          <span>View All Past Jobs</span>
          <ArrowRight className="size-3.5 rtl:rotate-180" />
        </Link>
      </div>

      {/* Status Flow Visualizer */}
      <div className="p-3 border border-slate-200 rounded-lg flex items-center justify-between overflow-x-auto text-[11px] font-medium text-slate-500 bg-white gap-2">
        <div className="flex items-center gap-1.5 text-[#0F8B8D] font-bold min-w-max">
          <span className="w-5 h-5 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Job Posted</span>
        </div>
        <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5 text-[#0F8B8D] font-bold min-w-max">
          <span className="w-5 h-5 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Receiving Bids</span>
        </div>
        <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5 text-[#123B5D] font-bold min-w-max">
          <span className="w-5 h-5 rounded-full bg-[#123B5D] text-white flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Pro Selected</span>
        </div>
        <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5 text-slate-400 min-w-max">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
            4
          </span>
          <span>On-Site Visit</span>
        </div>
        <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
        <div className="flex items-center gap-1.5 text-slate-400 min-w-max">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">
            5
          </span>
          <span>Completion</span>
        </div>
      </div>

      {/* Structured Job Data Table */}
      <div className="overflow-x-auto -mx-5 sm:mx-0">
        <table className="w-full text-left min-w-[620px]">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 text-[11px] uppercase tracking-wider bg-slate-50/50">
              <th className="py-2.5 px-4 sm:px-3 rounded-l font-semibold">
                Job Title &amp; Category
              </th>
              <th className="py-2.5 px-3 font-semibold">Offers &amp; Assignment</th>
              <th className="py-2.5 px-3 font-semibold">Posted Date</th>
              <th className="py-2.5 px-3 font-semibold">Status</th>
              <th className="py-2.5 px-4 sm:px-3 text-right rounded-r font-semibold">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 sm:px-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 line-clamp-1">
                      {job.title}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium">
                        {job.category}
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        • {job.subCategory}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-3">
                  {job.assignedWorker ? (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#123B5D] text-white flex items-center justify-center font-bold text-[10px]">
                        {job.assignedWorker.avatarInitials}
                      </div>
                      <span className="font-medium text-slate-800">
                        {job.assignedWorker.name}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 font-semibold text-[11px]">
                      <Tag className="size-3" />
                      {job.offersCount} Offers
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">
                  {job.postedDate}
                </td>

                <td className="py-3.5 px-3 whitespace-nowrap">
                  {job.status === "RECEIVING_OFFERS" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-bold">
                      Receiving Offers
                    </span>
                  ) : job.status === "VISIT_SCHEDULED" ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0F8B8D]/10 text-[#0F8B8D] text-[11px] font-bold">
                      Visit Scheduled
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold">
                      In Progress
                    </span>
                  )}
                </td>

                <td className="py-3.5 px-4 sm:px-3 text-right whitespace-nowrap">
                  {job.status === "RECEIVING_OFFERS" ? (
                    <Link
                      href={`/customer/job/${job.id}`}
                      className="inline-block px-3 py-1.5 rounded-md bg-[#0F8B8D] text-white text-xs font-semibold hover:bg-[#0F8B8D]/90 transition-colors shadow-2xs"
                    >
                      View Offers ({job.offersCount})
                    </Link>
                  ) : job.status === "VISIT_SCHEDULED" ? (
                    <Link
                      href={`/customer/job/${job.id}/tracking`}
                      className="inline-block px-3 py-1.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-colors"
                    >
                      Track Arrival
                    </Link>
                  ) : (
                    <Link
                      href={`/customer/job/${job.id}`}
                      className="text-[#0F8B8D] hover:underline text-xs font-semibold"
                    >
                      Manage
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
