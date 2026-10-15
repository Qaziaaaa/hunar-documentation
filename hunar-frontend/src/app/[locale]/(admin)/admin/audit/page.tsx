"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/features/admin/api/admin-api";
import type { AuditLogEntry } from "@/types/admin";
import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";

export default function AuditTrailPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminApi
      .listAuditLogs()
      .then(setLogs)
      .catch((err: unknown) => {
        setLogs([]);
        setError(err instanceof Error ? err.message : "Failed to load the audit log.");
      })
      .finally(() => setLoading(false));
  }, [reloadKey]);

  return (
<div className="space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
              <ShieldCheck className="size-3.5" /> Immutable Security Logs
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
            Platform Admin Audit Trail
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Audit history tracking every administrative action, user suspension, and verification decision
          </p>
        </div>

        {error && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            <span className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 font-bold text-red-700 transition hover:bg-red-100"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-4">Log ID</th>
                <th className="py-4 px-4">Admin Actor</th>
                <th className="py-4 px-4">Action Type</th>
                <th className="py-4 px-4">Target Resource</th>
                <th className="py-4 px-4">Action Details</th>
                <th className="py-4 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={6} className="py-6 px-4 text-center text-slate-500">Loading audit log...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="py-6 px-4 text-center text-slate-500">{error ? "Audit log unavailable." : "No audit entries recorded yet."}</td></tr>
              ) : (
              logs.map((log) => (
                <tr key={log.id} className="transition hover:bg-slate-50">
                  <td className="py-4 px-4 font-mono font-extrabold text-navy">{log.id}</td>
                  <td className="py-4 px-4 font-bold text-navy">{log.adminName}</td>
                  <td className="py-4 px-4 font-extrabold text-teal">{log.actionType}</td>
                  <td className="py-4 px-4 font-semibold text-slate-700">{log.targetResource}</td>
                  <td className="py-4 px-4 text-slate-600">{log.details}</td>
                  <td className="py-4 px-4 text-right text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
);
}
