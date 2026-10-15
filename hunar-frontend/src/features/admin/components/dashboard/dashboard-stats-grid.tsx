"use client";

import { useMemo } from "react";
import { Activity, ArrowUpRight, Briefcase, CheckCircle2, Clock, UserCheck, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useCountUp } from "@/lib/use-count-up";
import type { AdminKpiStats, LiveJobItem } from "@/types/admin";
import { Sparkline } from "./sparkline";

/** Daily job-post counts for the last 14 days, derived from the live jobs stream. */
function jobSparkPoints(jobs: LiveJobItem[]): number[] {
  const days = 14;
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayStart = startOfDay(now);
  const totals = new Array<number>(days).fill(0);

  for (const job of jobs) {
    const dayIndex = Math.floor((todayStart - startOfDay(new Date(job.createdAt))) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < days) totals[days - 1 - dayIndex] += 1;
  }
  return totals;
}

/** Unique customers who posted a job per day (last 14 days) — Customers card spark. */
function customerSparkPoints(jobs: LiveJobItem[]): number[] {
  const days = 14;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const todayStart = startOfDay(new Date());
  const byDay: Set<string>[] = Array.from({ length: days }, () => new Set<string>());
  for (const job of jobs) {
    const dayIndex = Math.floor((todayStart - startOfDay(new Date(job.createdAt))) / 86_400_000);
    if (dayIndex >= 0 && dayIndex < days) byDay[days - 1 - dayIndex].add(job.customerName || job.id);
  }
  return byDay.map((s) => s.size);
}

function StatCard({
  title,
  icon,
  variant,
  value,
  note,
  spark,
  href,
  pulse,
}: {
  title: string;
  icon: React.ReactNode;
  variant?: "acc" | "night" | "warn" | "grey";
  value: number;
  note: React.ReactNode;
  spark?: number[];
  href: string;
  pulse?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`wf-card wf-stat${variant ? ` wf-stat--${variant}` : ""}`}
      data-card
      data-lift
      style={{ "--ci": 1 } as React.CSSProperties}
    >
      <div className="wf-stat__head">
        <span className="wf-stat__icon" aria-hidden>
          {icon}
        </span>
        <span className="wf-stat__title">{title}</span>
        <span className="wf-stat__go" aria-hidden>
          <ArrowUpRight />
        </span>
      </div>
      <p className="wf-stat__num">
        {value.toLocaleString()}
        {pulse && (
          <span className="relative ml-2 inline-flex size-2 align-middle" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500 wf-dot" />
          </span>
        )}
      </p>
      <p className="wf-stat__note">{note}</p>
      {spark && <Sparkline points={spark} className="wf-anim-clip" />}
    </Link>
  );
}

export function DashboardStatsGrid({
  kpis,
  liveJobs,
}: {
  kpis: AdminKpiStats;
  liveJobs: LiveJobItem[];
}) {
  const totalJobs = useCountUp(kpis.totalJobs);
  const totalCustomers = useCountUp(kpis.totalCustomers);
  const totalWorkers = useCountUp(kpis.totalWorkers);
  const activeNow = useCountUp(kpis.activeNowCount);

  const jobSpark = useMemo(() => jobSparkPoints(liveJobs), [liveJobs]);
  const customerSpark = useMemo(() => customerSparkPoints(liveJobs), [liveJobs]);

  return (
    <div className="wf-stats" data-testid="stats-grid">
      <StatCard
        title="Total Jobs"
        href="/admin/jobs"
        icon={<Briefcase />}
        variant="acc"
        value={totalJobs}
        note={`${kpis.activeJobs} active · ${kpis.completedJobs} done`}
        spark={jobSpark}
      />
      <StatCard
        title="Customers"
        href="/admin/users/customers"
        icon={<Users />}
        variant="night"
        value={totalCustomers}
        spark={customerSpark}
        note={
          <span className="wf-delta">
            <ArrowUpRight aria-hidden />
            +{kpis.newCustomersThisWeek} this week
          </span>
        }
      />
      <StatCard
        title="Workers"
        href="/admin/users/workers"
        icon={<UserCheck />}
        variant="warn"
        value={totalWorkers}
        note={
          <>
            <span className="wf-delta">
              <CheckCircle2 aria-hidden />
              {kpis.verifiedWorkers} verified
            </span>
            <span className="wf-delta wf-delta--warn">
              <Clock aria-hidden />
              {kpis.pendingWorkers} pending
            </span>
          </>
        }
      />
      <StatCard
        title="Active Now"
        href="/admin/jobs"
        icon={<Activity />}
        variant="grey"
        value={activeNow}
        note="Live jobs in progress"
        pulse
      />
    </div>
  );
}
