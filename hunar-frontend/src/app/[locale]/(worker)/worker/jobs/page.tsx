"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { ToneBadge } from "@/components/shared/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listWorkerJobs, isHistoryJob, queryKeys } from "@/services/worker/jobs.service";
import { formatRs } from "@/lib/money";
import { jobStatusTone } from "@/lib/status-meta";

export default function WorkerJobsPage() {
  const t = useTranslations("Worker");
  const [tab, setTab] = useState<"active" | "history">("active");
  const jobs = useQuery({ queryKey: queryKeys.jobs, queryFn: listWorkerJobs });
  const visibleJobs = jobs.data?.filter((job) => (tab === "history" ? isHistoryJob(job.status) : !isHistoryJob(job.status))) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t("jobs.title")} description={t("jobs.description")} />
      <div className="flex gap-2 border-b border-border">
        {(["active", "history"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === item ? "border-teal text-teal" : "border-transparent text-muted-foreground"}`}
          >
            {t(`jobs.${item}`)}
          </button>
        ))}
      </div>
      {jobs.isPending ? <LoadingState label={t("common.loading")} /> : null}
      {jobs.isError ? <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => void jobs.refetch()} /> : null}
      {jobs.isSuccess && visibleJobs.length === 0 ? (
        <EmptyState title={tab === "history" ? t("jobs.emptyHistoryTitle") : t("jobs.emptyActiveTitle")} description={tab === "history" ? t("jobs.emptyHistoryDescription") : t("jobs.emptyActiveDescription")} />
      ) : null}
      <div className="grid gap-4">
        {visibleJobs.map((job) => (
          <Card key={job.id}>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-navy">{job.title}</h2>
                  <ToneBadge tone={jobStatusTone(job.status)} label={t(`status.job.${job.status}`)} />
                </div>
                <p className="text-sm text-muted-foreground">{job.address}</p>
                <p className="text-sm font-medium text-navy">
                  {t("jobs.agreedVisitCharge")}: {formatRs(job.lockedVisitCharge ?? job.suggestedVisitCharge ?? 0)}
                </p>
              </div>
              <Link href={`/worker/jobs/${job.id}`} className="shrink-0">
                <Button variant="outline">
                  {t("common.viewDetails")}
                  <ArrowRight aria-hidden="true" className="size-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}