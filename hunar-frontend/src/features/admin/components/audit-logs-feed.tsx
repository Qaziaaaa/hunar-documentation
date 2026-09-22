"use client";

import { ShieldCheck, ArrowUpRight, History, UserCheck, AlertTriangle, Wallet } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { AuditLogEntry } from "@/types/admin";

export function AuditLogsFeed({ logs }: { logs: AuditLogEntry[] }) {
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "WORKER_VERIFY":
        return <UserCheck className="size-3.5 text-teal" />;
      case "USER_SUSPEND":
        return <AlertTriangle className="size-3.5 text-rose-500" />;
      default:
        return <ShieldCheck className="size-3.5 text-navy" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-navy/10 text-navy">
            <History className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-navy">System Audit Log Feed</h3>
            <p className="text-[11px] text-slate-500">
              Immutable audit trail of administrator actions, approvals, and security events
            </p>
          </div>
        </div>
        <Link
          href="/admin/audit"
          className="flex items-center gap-1 text-[11px] font-bold text-teal transition hover:underline"
        >
          <span>Full Audit Log</span>
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      <div className="mt-2 space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 transition hover:bg-slate-50"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-white border border-slate-200 shadow-2xs">
                {getActionIcon(log.actionType)}
              </div>
              <div>
                <p className="text-xs font-extrabold text-navy">{log.details}</p>
                <p className="text-[9px] text-slate-500 font-medium">
                  By: <strong className="text-slate-700">{log.adminName}</strong> • Target: {log.targetResource}
                </p>
              </div>
            </div>
            <span className="font-mono text-[9px] font-bold text-slate-400">
              {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
