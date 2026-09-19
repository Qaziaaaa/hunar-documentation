"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { Link } from "@/i18n/navigation";
import { MOCK_VERIFICATIONS } from "@/mocks/admin.mock";
import type { VerificationRequest } from "@/types/admin";

import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  MapPin,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";

export default function VerificationsQueuePage() {
  const [items, setItems] = useState<VerificationRequest[]>(MOCK_VERIFICATIONS);
  const [search, setSearch] = useState("");

  const filtered = items.filter(
    (item) =>
      item.workerName.toLowerCase().includes(search.toLowerCase()) ||
      item.workerPhone.includes(search) ||
      item.serviceCity.toLowerCase().includes(search.toLowerCase()) ||
      item.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                <FileCheck2 className="size-3.5" />
                Identity & Skills Audit
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
              Worker Verification Queue
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Review submitted CNIC identity documents, trade skills, and approve verified workers
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search verification submissions by worker name, city, or trade..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs font-medium outline-none transition focus:border-teal focus:bg-white focus:ring-2 focus:ring-teal/15"
            />
          </div>
        </div>

        {/* Verification Cards Queue Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal/30 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-navy text-lg font-bold text-white shadow-md shadow-navy/15">
                      {item.workerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-navy">
                        {item.workerName}
                      </h3>
                      <p className="text-xs font-medium text-slate-500">
                        {item.workerPhone}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                      item.status === "PENDING"
                        ? "border-orange/20 bg-orange/10 text-orange"
                        : item.status === "VERIFIED"
                        ? "border-teal/20 bg-teal/10 text-teal"
                        : "border-red-200 bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Wrench className="size-4 shrink-0 text-slate-400" />
                    <span className="font-semibold">{item.skills.join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="size-4 shrink-0 text-slate-400" />
                    <span>
                      {item.serviceCity} • {item.experienceYears} Years Experience
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="size-4 shrink-0 text-slate-400" />
                    <span>Submitted: {new Date(item.submittedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {item.rejectionReason ? (
                  <div className="mt-4 rounded-xl border border-orange/20 bg-orange/10 p-3 text-[11px] text-orange">
                    <p className="flex items-center gap-1 font-extrabold">
                      <AlertCircle className="size-3.5" /> Note to Worker:
                    </p>
                    <p className="mt-0.5">{item.rejectionReason}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <Link
                  href={`/admin/verifications/${item.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3 text-xs font-bold text-white shadow-md transition hover:bg-navy/90"
                >
                  <ShieldCheck className="size-4 text-teal-300" />
                  <span>Review CNIC & Verify Application</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
