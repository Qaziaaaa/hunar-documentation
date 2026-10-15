"use client";

import { useMemo, useState } from "react";
import { adminApi } from "@/features/admin/api/admin-api";
import { useAdminResource } from "@/features/admin/hooks/use-admin-resource";
import { Link } from "@/i18n/navigation";
import {
  Calendar,
  Clock,
  Eye,
  Filter,
  MapPin,
  Search,
  UserCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";

export default function VisitsPage() {
  const visitsRes = useAdminResource(() => adminApi.listVisits({ limit: 50 }));
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);

  const visits = visitsRes.data?.items ?? [];

  const filtered = useMemo(
    () =>
      visits.filter((v: any) => {
        const matchesSearch =
          (v.jobTitle && v.jobTitle.toLowerCase().includes(search.toLowerCase())) ||
          (v.customer?.name && v.customer.name.toLowerCase().includes(search.toLowerCase())) ||
          (v.worker?.name && v.worker.name.toLowerCase().includes(search.toLowerCase())) ||
          (v.customer?.phone && v.customer.phone.includes(search)) ||
          (v.worker?.phone && v.worker.phone.includes(search));

        const matchesStatus = statusFilter === "ALL" ? true : v.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [visits, search, statusFilter],
  );

  return (
<div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <Calendar className="size-3.5" />
              Visits & Inspection Control
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Visits Management
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Monitor worker site visits, scheduled inspection dates, diagnosis reports, and repair estimates
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by job, customer name, worker name, or phone..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
            <Filter className="ml-2 size-3.5 text-slate-400" />
            {["ALL", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"].map((st) => (
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

        {/* Visits Datatable */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-4">Job Request</th>
                  <th className="py-4 px-4">Customer</th>
                  <th className="py-4 px-4">Assigned Worker</th>
                  <th className="py-4 px-4">Visit Date & Time</th>
                  <th className="py-4 px-4">Visit Charge</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((visit: any) => (
                  <tr key={visit.id} className="transition hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <p className="font-extrabold text-navy">{visit.jobTitle}</p>
                      <p className="text-[10px] text-slate-400">Job ID: {visit.jobId}</p>
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-700">
                      {visit.customer?.name ?? visit.customer?.phone ?? "—"}
                    </td>
                    <td className="py-4 px-4 font-semibold text-teal">
                      {visit.worker?.name ?? visit.worker?.phone ?? "Unassigned"}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-slate-400" />
                        <span>{new Date(visit.scheduledDate).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-extrabold text-navy">
                      Rs. {visit.visitCharge?.toLocaleString()}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          visit.status === "COMPLETED"
                            ? "border-green-200 bg-green-100 text-green-700"
                            : visit.status === "IN_PROGRESS"
                            ? "border-teal/20 bg-teal/10 text-teal"
                            : visit.status === "SCHEDULED"
                            ? "border-blue-200 bg-blue-100 text-blue-700"
                            : "border-red-200 bg-red-100 text-red-700"
                        }`}
                      >
                        {visit.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedVisit(visit)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-navy hover:bg-slate-50"
                      >
                        <Eye className="size-3.5 text-teal" /> Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visit Details Modal */}
        {selectedVisit ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="rounded-full bg-teal/10 px-2.5 py-0.5 text-[10px] font-bold text-teal uppercase">
                    Visit Inspection Audit
                  </span>
                  <h3 className="mt-1 text-lg font-extrabold text-navy">
                    {selectedVisit.jobTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVisit(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                    <Users className="size-3" /> Customer
                  </p>
                  <p className="font-extrabold text-navy">{selectedVisit.customer?.name ?? "—"}</p>
                  <p className="text-slate-500">{selectedVisit.customer?.phone}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 space-y-1">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase text-slate-400">
                    <UserCheck className="size-3" /> Worker
                  </p>
                  <p className="font-extrabold text-teal">{selectedVisit.worker?.name ?? "—"}</p>
                  <p className="text-slate-500">{selectedVisit.worker?.phone}</p>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-semibold">Scheduled Date:</span>
                  <span className="font-bold text-navy">{new Date(selectedVisit.scheduledDate).toLocaleString()}</span>
                </div>
                {selectedVisit.actualDate ? (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-semibold">Arrival Date:</span>
                    <span className="font-bold text-navy">{new Date(selectedVisit.actualDate).toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-semibold">Locked Visit Charge:</span>
                  <span className="font-black text-teal">Rs. {selectedVisit.visitCharge}</span>
                </div>
              </div>

              {selectedVisit.diagnosis || selectedVisit.repairPlan ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-2 text-xs">
                  <h4 className="font-bold text-navy flex items-center gap-1.5">
                    <Wrench className="size-3.5 text-teal" /> Inspection & Diagnosis Findings
                  </h4>
                  {selectedVisit.diagnosis ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Diagnosis</p>
                      <p className="text-slate-700 font-medium">{selectedVisit.diagnosis}</p>
                    </div>
                  ) : null}
                  {selectedVisit.repairPlan ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400">Proposed Repair Plan</p>
                      <p className="text-slate-700 font-medium">{selectedVisit.repairPlan}</p>
                    </div>
                  ) : null}
                  {selectedVisit.repairEstimate ? (
                    <div className="pt-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Repair Estimate</p>
                      <p className="text-sm font-extrabold text-navy">Rs. {selectedVisit.repairEstimate}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-4 flex justify-between items-center border-t border-slate-100 pt-3">
                <Link
                  href={`/admin/jobs/${selectedVisit.jobId}`}
                  className="text-xs font-bold text-teal hover:underline"
                >
                  View Related Job Audit
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedVisit(null)}
                  className="rounded-xl bg-navy px-5 py-2 text-xs font-bold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
);
}
