"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { Link } from "@/i18n/navigation";
import { MOCK_LIVE_JOBS } from "@/mocks/admin.mock";
import type { LiveJobItem } from "@/types/admin";
import { Briefcase, Eye, Filter, Search } from "lucide-react";

export default function JobsPage() {
  const [jobs] = useState<LiveJobItem[]>(MOCK_LIVE_JOBS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = jobs.filter((j) => {
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (j.workerName && j.workerName.toLowerCase().includes(search.toLowerCase())) ||
      j.category.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" ? true : j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Briefcase className="size-3.5" />
              Work Orders Control
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Jobs & Work Orders Monitoring
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Monitor active customer requests, track status progress, and inspect job audit records
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job title, customer, worker, or category..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <Filter className="ml-2 size-3.5 text-slate-400" />
            {["ALL", "IN_PROGRESS", "OFFERS_RECEIVING", "COMPLETED", "DISPUTED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-lg px-3 py-1.5 font-bold transition ${
                  statusFilter === st
                    ? "bg-navy text-white shadow-sm"
                    : "text-slate-600 hover:text-navy"
                }`}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Job Title / Category</th>
                <th className="py-4 px-4">Customer</th>
                <th className="py-4 px-4">Assigned Worker</th>
                <th className="py-4 px-4">Amount</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.map((job) => (
                <tr key={job.id} className="transition hover:bg-slate-50">
                  <td className="py-4 px-4">
                    <p className="font-extrabold text-navy">{job.title}</p>
                    <p className="text-[10px] text-slate-400">
                      ID: {job.id} • {job.category} • {job.city}
                    </p>
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-700">
                    {job.customerName}
                  </td>
                  <td className="py-4 px-4 text-slate-600">
                    {job.workerName || "Unassigned"}
                  </td>
                  <td className="py-4 px-4 font-extrabold text-navy">
                    Rs. {job.amount.toLocaleString()}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                        job.status === "IN_PROGRESS"
                          ? "border-teal/20 bg-teal/10 text-teal"
                          : job.status === "COMPLETED"
                          ? "border-green-200 bg-green-100 text-green-700"
                          : job.status === "DISPUTED"
                          ? "border-red-200 bg-red-100 text-red-700"
                          : "border-slate-200 bg-slate-100 text-slate-700"
                      }`}
                    >
                      {job.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-slate-50"
                    >
                      <Eye className="size-3.5 text-teal" /> Drill-Down
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
