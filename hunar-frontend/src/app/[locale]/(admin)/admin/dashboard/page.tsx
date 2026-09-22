import {
  MOCK_ADMIN_KPIS,
  MOCK_LIVE_JOBS,
  MOCK_VERIFICATIONS,
} from "@/mocks/admin.mock";
import { AdminShell } from "@/features/admin/components/admin-shell";
import { JobStatusDonutChart } from "@/features/admin/components/job-status-donut-chart";
import { KpiStatCards } from "@/features/admin/components/kpi-stat-cards";
import { LiveJobsStream } from "@/features/admin/components/live-jobs-stream";
import { MarketplaceActivityChart } from "@/features/admin/components/marketplace-activity-chart";
import { PendingVerificationsWidget } from "@/features/admin/components/pending-verifications-widget";
import { Link } from "@/i18n/navigation";
import { FileCheck2, ShieldCheck, Users } from "lucide-react";

export const metadata = {
  title: "Admin Dashboard — HUNAR Operations",
  description: "Live marketplace overview, analytics, and worker verification management",
};

export default function AdminDashboardPage() {
  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-teal">
                <ShieldCheck className="size-3.5" />
                Live Control Center
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-navy">
              Operations Dashboard
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Real-time performance metrics, verification review queue, and active jobs stream
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/users/workers"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-navy shadow-sm transition hover:bg-slate-50"
            >
              <Users className="size-4 text-teal" />
              <span>Manage Workers</span>
            </Link>
            <Link
              href="/admin/verifications"
              className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-navy/20 transition hover:bg-navy/90"
            >
              <FileCheck2 className="size-4 text-teal-300" />
              <span>Verification Queue</span>
            </Link>
          </div>
        </div>

        {/* 1. KPI Stat Cards */}
        <KpiStatCards stats={MOCK_ADMIN_KPIS} />

        {/* 2. Charts Row (Marketplace Activity Chart + Job Status Donut Chart) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <MarketplaceActivityChart />
          </div>
          <div className="lg:col-span-1">
            <JobStatusDonutChart />
          </div>
        </div>

        {/* 3. Operational Grid Layout for Widgets */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Pending Verifications Widget */}
          <PendingVerificationsWidget requests={MOCK_VERIFICATIONS} />

          {/* Live Jobs Stream Table */}
          <LiveJobsStream jobs={MOCK_LIVE_JOBS} />
        </div>
      </div>
    </AdminShell>
  );
}
