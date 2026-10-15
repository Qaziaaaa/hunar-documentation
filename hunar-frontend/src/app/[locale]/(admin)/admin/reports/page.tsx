"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, LineChart, RefreshCw } from "lucide-react";
import {
  API_BASE_URL,
  getAccessToken,
} from "@/lib/api-client";
import { adminApi } from "@/features/admin/api/admin-api";
import type { JobsFunnelReport } from "@/types/admin";

const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
] as const;

function rangeToDates(days: number) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function ReportsPage() {
  const [days, setDays] = useState<number>(30);
  const [report, setReport] = useState<JobsFunnelReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (activeDays: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getJobsFunnelReport(rangeToDates(activeDays));
      setReport(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    setError(null);
    try {
      const { from, to } = rangeToDates(days);
      const params = new URLSearchParams({ format: "csv", from, to });
      const token = getAccessToken("ADMIN");
      const res = await fetch(
        `${API_BASE_URL}/admin/reports/jobs-funnel/export?${params.toString()}`,
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );
      if (!res.ok) throw new Error(`Export failed (HTTP ${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jobs-funnel-report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  };

  const d = report?.data;
  const tiles = d
    ? [
        { label: "Job Posts", value: d.posted.toLocaleString(), cls: "text-navy" },
        { label: "Offers Received", value: d.offersReceived.toLocaleString(), cls: "text-teal" },
        { label: "Accepted", value: d.accepted.toLocaleString(), cls: "text-navy" },
        { label: "Completed", value: d.completed.toLocaleString(), cls: "text-green-600" },
        { label: "Cancelled", value: d.cancelled.toLocaleString(), cls: "text-red-500" },
        {
          label: "Completion Rate",
          value: `${Number(d.conversionRate).toFixed(1)}%`,
          cls: "text-navy",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <LineChart className="size-3.5" /> Analytics Insights
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Reports &amp; Marketplace Analytics
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Real conversion funnel from the jobs ledger · downloadable CSV export
          </p>
        </div>

        <button
          type="button"
          onClick={handleExport}
          disabled={exporting || !report}
          className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-4 text-teal-300" />
          <span>{exporting ? "Exporting CSV…" : "Export CSV"}</span>
        </button>
      </div>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            onClick={() => setDays(r.days)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
              days === r.days
                ? "bg-navy text-white shadow-sm"
                : "border border-slate-200 bg-white text-slate-500 hover:border-teal/30"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          <span className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => void load(days)}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-bold text-red-700 transition hover:bg-red-100"
          >
            <RefreshCw className="size-3.5" /> Retry
          </button>
        </div>
      )}

      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="border-b border-slate-100 pb-2 text-sm font-extrabold text-navy">
          Marketplace Conversion Funnel
        </h3>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[84px] animate-pulse rounded-2xl border border-slate-100 bg-slate-50"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((t) => (
              <div key={t.label} className="rounded-2xl border border-slate-100 p-4 text-center">
                <p className="text-xs font-bold text-slate-400">{t.label}</p>
                <p className={`mt-1 text-2xl font-black ${t.cls}`}>{t.value}</p>
              </div>
            ))}
          </div>
        )}
        {report && !loading && (
          <p className="text-[11px] font-semibold text-slate-400">
            Period {new Date(report.period.from).toLocaleDateString()} →{" "}
            {new Date(report.period.to).toLocaleDateString()} · counts jobs created in period
            (completed counted by completion time)
          </p>
        )}
      </div>
    </div>
  );
}
