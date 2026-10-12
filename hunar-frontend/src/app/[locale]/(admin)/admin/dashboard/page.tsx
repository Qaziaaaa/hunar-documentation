"use client";

import { useEffect, useState } from "react";
import {
  fetchAdminKpis,
  fetchAuditLogsFeed,
  fetchDisputesQueue,
  fetchLiveJobsStream,
  fetchPendingVerifications,
  fetchRecentTransactions,
  fetchTopWorkers,
  fetchWithdrawalRequests,
} from "@/features/admin/api/admin-api";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { KpiStatCards } from "@/features/admin/components/kpi-stat-cards";
import { RecentTransactionsTable } from "@/features/admin/components/recent-transactions-table";
import { DisputesQueueWidget } from "@/features/admin/components/disputes-queue-widget";
import { CategorySupplyDemandChart } from "@/features/admin/components/category-supply-demand-chart";
import { WithdrawalRequestsWidget } from "@/features/admin/components/withdrawal-requests-widget";
import { AuditLogsFeed } from "@/features/admin/components/audit-logs-feed";
import { DashboardRightPanel } from "@/features/admin/components/dashboard-right-panel";
import { Link } from "@/i18n/navigation";
import { AlertTriangle, FileCheck2, Loader2, ShieldCheck, Users } from "lucide-react";
import type {
  AdminKpiStats,
  AuditLogEntry,
  DisputeReport,
  LiveJobItem,
  PaymentTransaction,
  VerificationRequest,
  WithdrawalRequest,
  WorkerUser,
} from "@/types/admin";

interface DashboardData {
  kpis: AdminKpiStats;
  verifications: VerificationRequest[];
  transactions: PaymentTransaction[];
  withdrawals: WithdrawalRequest[];
  disputes: DisputeReport[];
  liveJobs: LiveJobItem[];
  auditLogs: AuditLogEntry[];
  topWorkers: WorkerUser[];
}

// Client component: the previous async server component ran every admin fetch
// without a localStorage token (401) and the api layer answered with MOCK_*
// data — the dashboard displayed invented KPIs. Fetching here carries the
// authenticated token; errors now surface instead of substituting mocks.
export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchAdminKpis(),
      fetchPendingVerifications(),
      fetchRecentTransactions(),
      fetchWithdrawalRequests(),
      fetchDisputesQueue(),
      fetchLiveJobsStream(),
      fetchAuditLogsFeed(),
      fetchTopWorkers(),
    ])
      .then(
        ([kpis, verifications, transactions, withdrawals, disputes, liveJobs, auditLogs, topWorkers]) => {
          if (cancelled) return;
          setData({ kpis, verifications, transactions, withdrawals, disputes, liveJobs, auditLogs, topWorkers });
        },
      )
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <AdminShell>
      <div className="space-y-3">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center border-b border-slate-200/60 pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal">
                <ShieldCheck className="size-2.5" />
                Live Control Center
              </span>
            </div>
            <h1 className="mt-0.5 text-xl font-black tracking-tight text-navy">
              Operations Dashboard
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Real-time performance metrics, verification review queue, transactions ledger, and active jobs stream
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/users/workers"
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-navy shadow-xs transition hover:bg-slate-50"
            >
              <Users className="size-3 text-teal" />
              <span>Manage Workers</span>
            </Link>
            <Link
              href="/admin/verifications"
              className="inline-flex items-center gap-1 rounded-xl bg-navy px-2.5 py-1.5 text-[11px] font-bold text-white shadow-xs shadow-navy/20 transition hover:bg-navy/90"
            >
              <FileCheck2 className="size-3 text-teal-300" />
              <span>Verification Queue</span>
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertTriangle className="mx-auto size-6 text-red-500" />
            <p className="mt-2 text-sm font-bold text-red-700">Dashboard data failed to load</p>
            <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setReloadKey((k) => k + 1);
              }}
              className="mt-3 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        ) : !data ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-10 text-sm font-semibold text-slate-500">
            <Loader2 className="size-4 animate-spin text-teal" />
            Loading live operations data…
          </div>
        ) : (
          <>
            {/* Main Dashboard Layout with Integrated Right Cards */}
            <div className="flex flex-col xl:flex-row gap-3 items-stretch">
              {/* Left / Center Main Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                {/* 1. KPI Stat Cards */}
                <KpiStatCards stats={data.kpis} />

                {/* 2. Category Chart (left) + Recent Transactions (right) — Side by Side */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-stretch">
                  <div className="lg:col-span-5">
                    <CategorySupplyDemandChart />
                  </div>
                  <div className="lg:col-span-7">
                    <RecentTransactionsTable transactions={data.transactions} />
                  </div>
                </div>

                {/* 4. Worker Payout Clearances & Active Disputes */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <WithdrawalRequestsWidget withdrawals={data.withdrawals} />
                  <DisputesQueueWidget disputes={data.disputes} />
                </div>

                {/* 5. System Audit Log Feed */}
                <div className="flex-1">
                  <AuditLogsFeed logs={data.auditLogs} />
                </div>
              </div>

              {/* Right Column Cards (Part of Dashboard) */}
              <div className="w-full xl:w-80 2xl:w-88 shrink-0 flex flex-col h-full">
                <DashboardRightPanel
                  jobs={data.liveJobs}
                  verifications={data.verifications}
                  topWorkers={[...data.topWorkers].sort((a, b) => a.name.localeCompare(b.name))}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
