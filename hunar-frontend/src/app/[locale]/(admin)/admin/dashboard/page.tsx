"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCommissionRate,
  fetchDashboardActivity,
  fetchDashboardOverview,
  fetchLiveJobsStream,
  fetchRecentTransactions,
} from "@/features/admin/api/admin-api";
import { adminKeys, prefetchAdminLists } from "@/features/admin/queries";
import { Link } from "@/i18n/navigation";
import { FileCheck2, Users } from "lucide-react";
import { DashboardHeroCard } from "@/features/admin/components/dashboard/dashboard-hero-card";
import { DashboardStatsGrid } from "@/features/admin/components/dashboard/dashboard-stats-grid";
import { DashboardPipelineCard } from "@/features/admin/components/dashboard/dashboard-pipeline-card";
import { DashboardDemandCard } from "@/features/admin/components/dashboard/dashboard-demand-card";
import { DashboardToplistCard } from "@/features/admin/components/dashboard/dashboard-toplist-card";
import { DashboardActivityTable } from "@/features/admin/components/dashboard/dashboard-activity-table";
import {
  CardSkeleton,
  HeroSkeleton,
  SectionError,
  StatsSkeleton,
  TableSkeleton,
} from "@/features/admin/components/dashboard/dashboard-skeletons";
import { playDashboardEntrance, resetDashboardEntrance } from "@/features/admin/components/dashboard/dashboard-entrance";

// Progressive sections via React Query: each data group is an independent
// query with its own poll cadence, so the hero paints as soon as overview +
// transactions land, mid cards as soon as jobs + workers land, and the
// activity table as soon as its feeds land — no all-or-nothing spinner.
// keepPreviousData means refetches update in place: no skeleton flash.
export default function AdminDashboardPage() {
  const queryClient = useQueryClient();

  // Warm Jobs/Visits/Reviews caches once the dashboard is interactive so the
  // first navigation to those pages paints from cache (idle, no main-thread fight).
  useEffect(() => {
    prefetchAdminLists(queryClient);
  }, [queryClient]);

  // Section 1 — ov-top: hero + stats (+ real commission rate for the hero label)
  const overviewQuery = useQuery({
    queryKey: adminKeys.overview,
    queryFn: fetchDashboardOverview,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
  const txQuery = useQuery({
    queryKey: adminKeys.transactions,
    queryFn: fetchRecentTransactions,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
  const rateQuery = useQuery({
    queryKey: adminKeys.commissionRate,
    queryFn: fetchCommissionRate,
    staleTime: 5 * 60_000,
  });

  // Section 2 — ov-mid: pipeline (kpis) + demand (jobs + workers) + toplist
  const jobsQuery = useQuery({
    queryKey: adminKeys.jobsStream,
    queryFn: fetchLiveJobsStream,
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  // Section 3 — activity table feeds
  const activityQuery = useQuery({
    queryKey: adminKeys.activity,
    queryFn: fetchDashboardActivity,
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const viewRef = useRef<HTMLDivElement | null>(null);
  const entrancePlayedRef = useRef(false);
  const activityPlayedRef = useRef(false);

  // Below-fold: the activity table mounts only once it nears the viewport
  // (its feeds still fetch in the background, so data is usually ready by
  // the time the user scrolls to it).
  const activitySectionRef = useRef<HTMLElement | null>(null);
  const [activityNear, setActivityNear] = useState(false);
  useEffect(() => {
    const el = activitySectionRef.current;
    if (!el || activityNear) return;
    if (typeof IntersectionObserver === "undefined") {
      // Async so the effect body never sets state synchronously.
      queueMicrotask(() => setActivityNear(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setActivityNear(true);
      },
      { rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [activityNear]);

  // Retry mirrors the old full-reload: clear entrance state and refetch every
  // dashboard query (data drops back to skeletons for the failed sections).
  const retry = useCallback(() => {
    entrancePlayedRef.current = false;
    activityPlayedRef.current = false;
    if (viewRef.current) resetDashboardEntrance(viewRef.current);
    queryClient.resetQueries({ queryKey: ["admin"] });
  }, [queryClient]);

  const kpis = overviewQuery.data?.kpis ?? null;
  const topWorkers = overviewQuery.data?.workers ?? null;
  const liveJobs = jobsQuery.data ?? null;
  const transactions = txQuery.data ?? null;
  const commissionRate = rateQuery.data ?? null;
  const withdrawals = activityQuery.data?.withdrawals ?? null;
  const disputes = activityQuery.data?.disputes ?? null;
  const auditLogs = activityQuery.data?.auditLogs ?? null;
  const verifications = activityQuery.data?.verifications ?? null;

  // A section is "ready" when its critical inputs arrived; skeletons show
  // per-card otherwise. Errors surface only while a section has no data yet —
  // once loaded, a failed refetch keeps the last good payload on screen.
  const topReady = kpis !== null && transactions !== null;
  const midReady = liveJobs !== null && topWorkers !== null && kpis !== null;
  const feedReady =
    withdrawals !== null && disputes !== null && auditLogs !== null && verifications !== null;

  const errMsg = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;
  const topError =
    (overviewQuery.isError && !topReady) || (txQuery.isError && !topReady)
      ? errMsg(overviewQuery.error ?? txQuery.error, "Failed to load KPIs")
      : null;
  const midError =
    (jobsQuery.isError && !midReady) || (overviewQuery.isError && !midReady)
      ? errMsg(jobsQuery.error ?? overviewQuery.error, "Failed to load insights")
      : null;
  const feedError =
    activityQuery.isError && !feedReady
      ? errMsg(activityQuery.error, "Failed to load activity")
      : null;

  // Card CSS entrance runs on mount when each section gets data.
  useEffect(() => {
    if (!topReady || !midReady) return;
    if (entrancePlayedRef.current) return;
    entrancePlayedRef.current = true;
    if (viewRef.current) viewRef.current.dataset.entrance = "on";
  }, [topReady, midReady]);

  // Activity rows: sample x:16 stagger once the feed lands (may be after mid)
  // and the table has actually mounted near the viewport.
  useEffect(() => {
    if (!feedReady || !activityNear || activityPlayedRef.current) return;
    activityPlayedRef.current = true;
    requestAnimationFrame(() => {
      if (viewRef.current) playDashboardEntrance(viewRef.current, { activityReady: true });
    });
  }, [feedReady, activityNear]);

  // Wharf title: plain text — entrance splits into per-char spans.
  const titleText = "Operations Dashboard";

  return (
<div ref={viewRef} className="wf-view" data-testid="dashboard-view">
        {/* Page Header — Wharf .page */}
        <header className="wf-page">
          <div className="wf-page__text">
            <h1 className="wf-page__title">
              {(() => {
                let charIndex = 0;
                const words = titleText.split(" ");
                return words.map((word, wi) => (
                  <Fragment key={word}>
                    <span className="word">
                      {[...word].map((ch) => {
                        const idx = charIndex++;
                        return (
                          <span
                            key={idx}
                            className="ch"
                            style={{ "--wi": idx } as React.CSSProperties}
                          >
                            {ch}
                          </span>
                        );
                      })}
                    </span>
                    {wi < words.length - 1 ? " " : null}
                  </Fragment>
                ));
              })()}
            </h1>
            <p className="wf-page__sub">
              Live KPIs, verification queue, transactions, and active jobs.
            </p>
          </div>
          <div className="wf-page__actions">
            <Link href="/admin/users/workers" className="wf-btn wf-btn--ghost">
              <Users className="size-4 text-teal" />
              Manage Workers
            </Link>
            <Link href="/admin/verifications" className="wf-btn wf-btn--primary magnetic">
              <FileCheck2 className="size-4 text-teal-300" />
              Verification Queue
            </Link>
          </div>
        </header>

        {/* ── ov-top: hero revenue (7fr) + 2×2 stats (5fr) ── */}
        <section className="wf-ov-top" aria-label="Overview">
          {topError ? (
            <SectionError label="Revenue overview" error={topError} onRetry={retry} />
          ) : kpis && transactions ? (
            <DashboardHeroCard
              totalRevenue={kpis.totalRevenue}
              transactions={transactions}
              commissionRate={commissionRate}
            />
          ) : (
            <HeroSkeleton />
          )}
          {topError ? (
            <SectionError label="Key metrics" error={topError} onRetry={retry} />
          ) : kpis ? (
            <DashboardStatsGrid kpis={kpis} liveJobs={liveJobs ?? []} />
          ) : (
            <StatsSkeleton />
          )}
        </section>

        {/* ── ov-mid: pipeline + demand + toplist (3-col) ── */}
        <section className="wf-ov-mid" aria-label="Marketplace insights">
          {midError ? (
            <SectionError label="Job pipeline" error={midError} onRetry={retry} />
          ) : kpis ? (
            <DashboardPipelineCard kpis={kpis} />
          ) : (
            <CardSkeleton label="job pipeline" />
          )}
          {midError ? (
            <SectionError label="Demand vs supply" error={midError} onRetry={retry} />
          ) : liveJobs && topWorkers ? (
            <DashboardDemandCard liveJobs={liveJobs} workers={topWorkers} />
          ) : (
            <CardSkeleton label="demand vs supply" />
          )}
          {midError ? (
            <SectionError label="Top workers" error={midError} onRetry={retry} />
          ) : topWorkers ? (
            <DashboardToplistCard workers={topWorkers} totalWorkers={kpis?.totalWorkers} />
          ) : (
            <CardSkeleton label="top workers" />
          )}
        </section>

        {/* ── Full-width activity table ── */}
        <section aria-label="Recent activity" ref={activitySectionRef}>
          {feedError ? (
            <SectionError label="Recent activity" error={feedError} onRetry={retry} />
          ) : activityNear && withdrawals && disputes && auditLogs && verifications ? (
            <DashboardActivityTable
              transactions={transactions ?? []}
              withdrawals={withdrawals}
              disputes={disputes}
              liveJobs={liveJobs ?? []}
              auditLogs={auditLogs}
              verifications={verifications}
            />
          ) : (
            <TableSkeleton />
          )}
        </section>
      </div>
);
}
