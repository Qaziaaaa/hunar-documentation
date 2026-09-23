"use client";

import { useState } from "react";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { Download, LineChart, TrendingUp } from "lucide-react";

export default function ReportsPage() {
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                <LineChart className="size-3.5" /> Analytics Insights
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
              Reports & Marketplace Analytics
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Download CSV performance exports and inspect conversion funnels
            </p>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-navy/90"
          >
            <Download className="size-4 text-teal-300" />
            <span>{exported ? "Exporting CSV..." : "Export Full Report (CSV)"}</span>
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-navy text-sm border-b border-slate-100 pb-2">
            Marketplace Conversion Funnel Snapshot
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 text-center">
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs text-slate-400 font-bold">Total Job Posts</p>
              <p className="text-2xl font-black text-navy mt-1">1,428</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs text-slate-400 font-bold">Offers Received</p>
              <p className="text-2xl font-black text-teal mt-1">4,120</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs text-slate-400 font-bold">Completed Visits</p>
              <p className="text-2xl font-black text-green-600 mt-1">1,190</p>
            </div>
            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs text-slate-400 font-bold">Completion Rate</p>
              <p className="text-2xl font-black text-navy mt-1">83.3%</p>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
