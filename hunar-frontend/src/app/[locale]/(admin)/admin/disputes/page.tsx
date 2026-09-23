"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { Link } from "@/i18n/navigation";
import { MOCK_DISPUTES } from "@/mocks/admin.mock";
import type { DisputeReport } from "@/types/admin";
import { AlertTriangle, Eye, ShieldAlert } from "lucide-react";

export default function DisputesPage() {
  const [disputes] = useState<DisputeReport[]>(MOCK_DISPUTES);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/20 bg-orange/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange">
              <AlertTriangle className="size-3.5" /> Conflict Resolution Center
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Disputes Queue & Incident Reports
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Review customer & worker conflict reports, inspect evidence trails, and resolve disputes
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Dispute ID</th>
                <th className="py-4 px-4">Reporter</th>
                <th className="py-4 px-4">Target User</th>
                <th className="py-4 px-4">Issue Category</th>
                <th className="py-4 px-4">Submitted Date</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {disputes.map((d) => (
                <tr key={d.id} className="transition hover:bg-slate-50">
                  <td className="py-4 px-4 font-extrabold text-navy">{d.id}</td>
                  <td className="py-4 px-4 font-extrabold text-navy">
                    {d.reporterName} ({d.reporterRole})
                  </td>
                  <td className="py-4 px-4 font-semibold text-slate-700">{d.targetName}</td>
                  <td className="py-4 px-4 font-bold text-orange">{d.issueCategory}</td>
                  <td className="py-4 px-4 text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-[10px] font-extrabold text-orange">
                      {d.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link
                      href={`/admin/disputes/${d.id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-navy px-3 py-1.5 text-xs font-bold text-white shadow-sm"
                    >
                      <Eye className="size-3.5 text-teal-300" /> Inspect Evidence
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
