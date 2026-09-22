import {
  fetchAdminKpis,
  fetchAuditLogsFeed,
  fetchDisputesQueue,
  fetchLiveJobsStream,
  fetchPendingVerifications,
  fetchPlatformSettings,
  fetchRecentTransactions,
  fetchTopWorkers,
  fetchWithdrawalRequests,
} from "@/features/admin/api/admin-api";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { KpiStatCards } from "@/features/admin/components/kpi-stat-cards";
import { LiveJobsStream } from "@/features/admin/components/live-jobs-stream";
import { PendingVerificationsWidget } from "@/features/admin/components/pending-verifications-widget";
import { RecentTransactionsTable } from "@/features/admin/components/recent-transactions-table";
import { TopWorkersLeaderboard } from "@/features/admin/components/top-workers-leaderboard";
import { DisputesQueueWidget } from "@/features/admin/components/disputes-queue-widget";
import { CategorySupplyDemandChart } from "@/features/admin/components/category-supply-demand-chart";
import { WithdrawalRequestsWidget } from "@/features/admin/components/withdrawal-requests-widget";
import { PlatformSettingsCard } from "@/features/admin/components/platform-settings-card";
import { AuditLogsFeed } from "@/features/admin/components/audit-logs-feed";
import { Link } from "@/i18n/navigation";
import { FileCheck2, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard — HUNAR Operations",
  description: "Live marketplace overview, analytics, financial ledger, infrastructure health, and worker verification management",
};

export default async function AdminDashboardPage() {
  const [
    kpis,
    verifications,
    transactions,
    withdrawals,
    disputes,
    liveJobs,
    auditLogs,
    settings,
    topWorkers,
  ] = await Promise.all([
    fetchAdminKpis(),
    fetchPendingVerifications(),
    fetchRecentTransactions(),
    fetchWithdrawalRequests(),
    fetchDisputesQueue(),
    fetchLiveJobsStream(),
    fetchAuditLogsFeed(),
    fetchPlatformSettings(),
    fetchTopWorkers(),
  ]);

  return (
    <AdminShell>
      <div className="space-y-2.5">
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

        {/* 1. KPI Stat Cards */}
        <KpiStatCards stats={kpis} />

        {/* 2. Financial Ledger Table (Full Width 100%) */}
        <RecentTransactionsTable transactions={transactions} />

        {/* 4. Operational Verifications & Payouts (Left) + Vertical Category Graph (Right) */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12">
          {/* Left Column: Stacked Verifications & Clearances Widgets */}
          <div className="space-y-2.5 lg:col-span-7">
            <PendingVerificationsWidget requests={verifications} />
            <WithdrawalRequestsWidget withdrawals={withdrawals} />
          </div>

          {/* Right Column: Vertical Category Supply vs Demand Column Graph */}
          <div className="lg:col-span-5">
            <CategorySupplyDemandChart />
          </div>
        </div>

        {/* 5. Top Verified Professionals & Active Disputes */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          <TopWorkersLeaderboard workers={topWorkers} />
          <DisputesQueueWidget disputes={disputes} />
        </div>

        {/* 6. Live Jobs Stream Table (Full Width 100%) */}
        <LiveJobsStream jobs={liveJobs} />

        {/* 7. System Audit Log Feed */}
        <AuditLogsFeed logs={auditLogs} />

        {/* 8. Platform Rules & Settings Card (Placed at the Bottom) */}
        <PlatformSettingsCard settings={settings} />
      </div>
    </AdminShell>
  );
}




