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
import { FileCheck2, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard — WorkerFIX Operations",
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
    topWorkers,
  ] = await Promise.all([
    fetchAdminKpis(),
    fetchPendingVerifications(),
    fetchRecentTransactions(),
    fetchWithdrawalRequests(),
    fetchDisputesQueue(),
    fetchLiveJobsStream(),
    fetchAuditLogsFeed(),
    fetchTopWorkers(),
  ]);

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

        {/* Main Dashboard Layout with Integrated Right Cards */}
        <div className="flex flex-col xl:flex-row gap-3 items-stretch">
          {/* Left / Center Main Content */}
          <div className="flex-1 min-w-0 flex flex-col gap-3">
            {/* 1. KPI Stat Cards */}
            <KpiStatCards stats={kpis} />

            {/* 2. Category Chart (left) + Recent Transactions (right) — Side by Side */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-5">
                <CategorySupplyDemandChart />
              </div>
              <div className="lg:col-span-7">
                <RecentTransactionsTable transactions={transactions} />
              </div>
            </div>

            {/* 4. Worker Payout Clearances & Active Disputes */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <WithdrawalRequestsWidget withdrawals={withdrawals} />
              <DisputesQueueWidget disputes={disputes} />
            </div>

            {/* 5. System Audit Log Feed */}
            <div className="flex-1">
              <AuditLogsFeed logs={auditLogs} />
            </div>
          </div>

          {/* Right Column Cards (Part of Dashboard) */}
          <div className="w-full xl:w-80 2xl:w-88 shrink-0 flex flex-col h-full">
            <DashboardRightPanel
              jobs={liveJobs}
              verifications={verifications}
              topWorkers={[...topWorkers].sort((a, b) => a.name.localeCompare(b.name))}
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

