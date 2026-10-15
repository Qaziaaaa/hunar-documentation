"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  fetchAdminKpis,
  fetchAuditLogsFeed,
  fetchCommissionRate,
  fetchDisputesQueue,
  fetchLiveJobsStream,
  fetchPendingVerifications,
  fetchRecentTransactions,
  fetchTopWorkers,
  fetchWithdrawalRequests,
} from "@/features/admin/api/admin-api";
import { Link } from "@/i18n/navigation";
import { FileCheck2, ShieldCheck, Users } from "lucide-react";
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

// Progressive sections: each data group loads independently (Promise.allSettled),
// so the hero paints as soon as KPIs + transactions land, mid cards as soon as
// jobs + workers land, and the activity table as soon as its feeds land — no
// all-or-nothing spinner.
export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<AdminKpiStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[] | null>(null);
  const [liveJobs, setLiveJobs] = useState<LiveJobItem[] | null>(null);
  const [topWorkers, setTopWorkers] = useState<WorkerUser[] | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[] | null>(null);
  const [disputes, setDisputes] = useState<DisputeReport[] | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[] | null>(null);
  const [verifications, setVerifications] = useState<VerificationRequest[] | null>(null);
  const [commissionRate, setCommissionRate] = useState<number | null>(null);

  const [topError, setTopError] = useState<string | null>(null);
  const [midError, setMidError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);

  const viewRef = useRef<HTMLDivElement | null>(null);
  const entrancePlayedRef = useRef(false);
  const activityPlayedRef = useRef(false);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const loadedRef = useRef({ top: false, mid: false, feed: false });

  // Progressive sections: each data group loads independently (Promise.allSettled),
  // so the hero paints as soon as KPIs + transactions land, mid cards as soon as
  // jobs + workers land, and the activity table as soon as its feeds land — no
  // all-or-nothing spinner. Skips ticks while a previous load is in flight.
  const loadAll = useCallback(() => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    let pending = 3;
    const settle = () => {
      pending -= 1;
      if (pending <= 0) inFlightRef.current = false;
    };

    // Section 1 — ov-top: hero + stats (+ real commission rate for the hero label)
    Promise.allSettled([fetchAdminKpis(), fetchRecentTransactions(), fetchCommissionRate()]).then(
      ([kpisResult, txResult, rateResult]) => {
        if (mountedRef.current) {
          if (kpisResult.status === "fulfilled") setKpis(kpisResult.value);
          if (txResult.status === "fulfilled") setTransactions(txResult.value);
          if (rateResult.status === "fulfilled") setCommissionRate(rateResult.value);
          const allOk = kpisResult.status === "fulfilled" && txResult.status === "fulfilled";
          if (allOk) {
            loadedRef.current.top = true;
            setTopError(null);
          } else if (!loadedRef.current.top) {
            const failed = [kpisResult, txResult].find((r) => r.status === "rejected");
            if (failed && failed.status === "rejected") {
              setTopError(
                failed.reason instanceof Error ? failed.reason.message : "Failed to load KPIs",
              );
            }
          }
        }
        settle();
      },
    );

    // Section 2 — ov-mid: pipeline (kpis) + demand (jobs + workers) + toplist (workers)
    Promise.allSettled([fetchLiveJobsStream(), fetchTopWorkers()]).then(
      ([jobsResult, workersResult]) => {
        if (mountedRef.current) {
          if (jobsResult.status === "fulfilled") setLiveJobs(jobsResult.value);
          if (workersResult.status === "fulfilled") setTopWorkers(workersResult.value);
          const allOk = jobsResult.status === "fulfilled" && workersResult.status === "fulfilled";
          if (allOk) {
            loadedRef.current.mid = true;
            setMidError(null);
          } else if (!loadedRef.current.mid) {
            const failed = [jobsResult, workersResult].find((r) => r.status === "rejected");
            if (failed && failed.status === "rejected") {
              setMidError(
                failed.reason instanceof Error ? failed.reason.message : "Failed to load insights",
              );
            }
          }
        }
        settle();
      },
    );

    // Section 3 — activity table feeds
    Promise.allSettled([
      fetchWithdrawalRequests(),
      fetchDisputesQueue(),
      fetchAuditLogsFeed(),
      fetchPendingVerifications(),
    ]).then(([wdResult, dpResult, auResult, vfResult]) => {
      if (mountedRef.current) {
        if (wdResult.status === "fulfilled") setWithdrawals(wdResult.value);
        if (dpResult.status === "fulfilled") setDisputes(dpResult.value);
        if (auResult.status === "fulfilled") setAuditLogs(auResult.value);
        if (vfResult.status === "fulfilled") setVerifications(vfResult.value);
        const allOk =
          wdResult.status === "fulfilled" &&
          dpResult.status === "fulfilled" &&
          auResult.status === "fulfilled" &&
          vfResult.status === "fulfilled";
        if (allOk) {
          loadedRef.current.feed = true;
          setFeedError(null);
        } else if (!loadedRef.current.feed) {
          const failed = [wdResult, dpResult, auResult, vfResult].find(
            (r) => r.status === "rejected",
          );
          if (failed && failed.status === "rejected") {
            setFeedError(
              failed.reason instanceof Error ? failed.reason.message : "Failed to load activity",
            );
          }
        }
      }
      settle();
    });
  }, []);

  // Initial load + 20s live polling (skipped while the tab is hidden; a
  // visibilitychange to visible triggers an immediate refresh instead).
  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    const id = setInterval(() => {
      if (!document.hidden) loadAll();
    }, 20000);
    const onVisible = () => {
      if (!document.hidden) loadAll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadAll]);

  const retry = useCallback(() => {
    setTopError(null);
    setMidError(null);
    setFeedError(null);
    loadedRef.current = { top: false, mid: false, feed: false };
    entrancePlayedRef.current = false;
    activityPlayedRef.current = false;
    resetDashboardEntrance(viewRef.current);
    loadAll();
  }, [loadAll]);

  // A section is "ready" when its critical inputs arrived; skeletons show per-card otherwise.
  const topReady = kpis !== null && transactions !== null;
  const midReady = liveJobs !== null && topWorkers !== null && kpis !== null;
  const feedReady =
    withdrawals !== null && disputes !== null && auditLogs !== null && verifications !== null;

  // Card CSS entrance runs on mount when each section gets data.
  useEffect(() => {
    if (!topReady || !midReady) return;
    if (entrancePlayedRef.current) return;
    entrancePlayedRef.current = true;
    if (viewRef.current) viewRef.current.dataset.entrance = "on";
  }, [topReady, midReady]);

  // Activity rows: sample x:16 stagger once the feed lands (may be after mid).
  useEffect(() => {
    if (!feedReady || activityPlayedRef.current) return;
    activityPlayedRef.current = true;
    requestAnimationFrame(() => {
      if (viewRef.current) playDashboardEntrance(viewRef.current, { activityReady: true });
    });
  }, [feedReady]);

  // Wharf title: plain text — entrance splits into per-char spans.
  const titleText = "Operations Dashboard";

  return (
<div ref={viewRef} className="wf-view" data-testid="dashboard-view">
        {/* Page Header — Wharf .page */}
        <header className="wf-page">
          <div className="wf-page__text">
            <span className="inline-flex items-center gap-1 rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-teal">
              <ShieldCheck className="size-3" />
              Live Control Center
            </span>
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
              Real-time performance metrics, verification review queue, transactions ledger, and
              active jobs stream
            </p>
          </div>
          <div className="wf-page__actions">
            <Link href="/admin/users/workers" className="wf-btn wf-btn--ghost">
              <Users className="size-4 text-teal" />
              Manage Workers
            </Link>
            <Link href="/admin/verifications" className="wf-btn wf-btn--primary">
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
        <section aria-label="Recent activity">
          {feedError ? (
            <SectionError label="Recent activity" error={feedError} onRetry={retry} />
          ) : withdrawals && disputes && auditLogs && verifications ? (
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
