"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, RefreshCw, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyJobsState } from "@/components/shared/empty-jobs-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRatingSummary, queryKeys as reviewKeys } from "@/services/worker/review.service";
import { getWorkerProfile } from "@/services/worker/profile.service";
import { listNearbyJobs, queryKeys as jobKeys } from "@/services/worker/jobs.service";
import { queryKeys as profileKeys } from "@/services/worker/profile.service";
import { formatRs } from "@/lib/money";
import { formatDateTime } from "@/lib/format";
import { jobStatusTone } from "@/lib/status-meta";
import type { Job } from "@/types/job";
import { ToneBadge } from "@/components/shared/tone-badge";

export default function WorkerDashboardPage() {
  const t = useTranslations("Worker");
  const nearby = useQuery({ queryKey: jobKeys.nearby, queryFn: listNearbyJobs });
  const profile = useQuery({ queryKey: profileKeys.profile(), queryFn: getWorkerProfile });
  const rating = useQuery({
    queryKey: reviewKeys.rating(profile.data?.id ?? "worker-demo-1"),
    queryFn: () => getRatingSummary(profile.data?.id),
  });

  const refreshJobs = () => {
    void nearby.refetch();
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
      />

      {profile.isPending || rating.isPending ? (
        <LoadingState label={t("common.loading")} />
      ) : profile.isError || rating.isError ? (
        <ErrorState
          title={t("empty.errorTitle")}
          description={t("empty.errorDescription")}
          onRetry={() => {
            void profile.refetch();
            void rating.refetch();
          }}
        />
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={t("dashboard.activeJobs")}
              value="0"
              icon={BriefcaseBusiness}
            />
            <StatCard
              label={t("dashboard.totalEarnings")}
              value={formatRs(0)}
              icon={BriefcaseBusiness}
            />
            <StatCard
              label={t("dashboard.rating")}
              value={rating.data?.average ?? 0}
              icon={Star}
              hint={`${rating.data?.totalReviews ?? 0} ${t("dashboard.reviewsCount", { count: rating.data?.totalReviews ?? 0 })}`}
            />
            <StatCard
              label={t("dashboard.completedJobs")}
              value={profile.data?.completedJobs ?? 0}
              icon={BriefcaseBusiness}
            />
          </section>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>{t("dashboard.nearbyJobs")}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("dashboard.nearbyJobsDescription")}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={refreshJobs} disabled={nearby.isFetching}>
                <RefreshCw className={nearby.isFetching ? "size-4 animate-spin" : "size-4"} aria-hidden="true" />
                {t("dashboard.checkAgain")}
              </Button>
            </CardHeader>
            <CardContent>
              {nearby.isPending ? (
                <LoadingState label={t("common.loading")} />
              ) : nearby.isError ? (
                <ErrorState
                  title={t("empty.errorTitle")}
                  description={t("empty.errorDescription")}
                  onRetry={refreshJobs}
                />
              ) : nearby.data.length === 0 ? (
                <EmptyJobsState
                  title={t("dashboard.noJobsTitle")}
                  description={t("dashboard.noJobsDescription")}
                  checkAgainLabel={t("dashboard.checkAgain")}
                  expandAreaLabel={t("dashboard.expandServiceArea")}
                  onCheckAgain={refreshJobs}
                  checking={nearby.isFetching}
                />
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {nearby.data.map((job) => (
                    <NearbyJobCard key={job.id} job={job} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function NearbyJobCard({ job }: { job: Job }) {
  const t = useTranslations("Worker");
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-navy">{job.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {job.area ? `${job.area}, ` : ""}{job.city}
            </p>
          </div>
          <ToneBadge tone={jobStatusTone(job.status)} label={t(`status.job.${job.status}`)} />
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {job.description ?? t("jobs.emptyDescription")}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <span className="text-sm font-medium text-navy">
            {job.suggestedVisitCharge ? formatRs(job.suggestedVisitCharge) : t("common.notAvailable")}
          </span>
          <Link href={`/worker/jobs/${job.id}`}>
            <Button size="sm" className="bg-teal hover:bg-teal/85">
              {t("dashboard.viewJob")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">{formatDateTime(job.createdAt)}</p>
      </CardContent>
    </Card>
  );
}