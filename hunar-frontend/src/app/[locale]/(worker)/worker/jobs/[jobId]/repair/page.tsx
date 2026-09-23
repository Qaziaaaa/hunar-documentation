"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { LockedPriceBadge } from "@/components/shared/locked-price-badge";
import { PageHeader } from "@/components/shared/page-header";
import { RepairPriceCard } from "@/components/shared/repair-price-card";
import { ToneBadge } from "@/components/shared/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { formatRs } from "@/lib/money";
import { deriveRepairExecutionStatus, repairExecutionTone } from "@/lib/status-meta";
import { completeRepair, loadRepairContext, queryKeys, startRepair } from "@/services/worker/repair.service";

export default function RepairPage() {
  const t = useTranslations("Worker");
  const { jobId } = useParams<{ jobId: string }>();
  const queryClient = useQueryClient();
  const repairQuery = useQuery({ queryKey: queryKeys.repairByJob(jobId), queryFn: () => loadRepairContext(jobId) });
  const [completeOpen, setCompleteOpen] = useState(false);
  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.repairByJob(jobId) });
  const start = useMutation({ mutationFn: () => startRepair(repairQuery.data!.repair.id), onSuccess: refresh });
  const complete = useMutation({ mutationFn: () => completeRepair(repairQuery.data!.repair.id), onSuccess: () => { setCompleteOpen(false); void refresh(); } });

  if (repairQuery.isPending) return <LoadingState label={t("common.loading")} />;
  if (repairQuery.isError || !repairQuery.data) return <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => void repairQuery.refetch()} />;
  const { job, repair } = repairQuery.data;
  const executionStatus = deriveRepairExecutionStatus(repair);
  const canStart = repair.status === "ACCEPTED" && !repair.startedAt && !repair.completedAt;
  const canComplete = Boolean(repair.startedAt && !repair.completedAt);
  const price = repair.lockedAmount ?? repair.amount;

  return (
    <div className="space-y-6">
      <PageHeader title={t("repair.title")} description={t("repair.subtitle")} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card><CardHeader><CardTitle>{job.title}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{job.address}</p><p className="text-sm text-muted-foreground">{repair.description}</p><div className="grid gap-3 sm:grid-cols-2"><RepairPriceCard label={t("repair.lockedRepairPrice")} amount={price} hint={repair.lockedAmount != null ? <LockedPriceBadge amount={price} lockedAt={repair.lockedAt} /> : undefined} /><RepairPriceCard label={t("repair.visitCharge")} amount={job.lockedVisitCharge ?? job.suggestedVisitCharge ?? 0} /></div></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between gap-3"><CardTitle>{t(`status.execution.${executionStatus}`)}</CardTitle><ToneBadge tone={repairExecutionTone(executionStatus)} label={t(`status.execution.${executionStatus}`)} /></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{executionStatus === "repair_not_started" ? t("repair.awaitingApproval") : executionStatus === "repair_in_progress" ? t("repair.inProgressDescription") : t("repair.customerConfirmationHint")}</p>{repair.startedAt ? <p className="text-sm"><span className="text-muted-foreground">{t("repair.startTime")}: </span><span className="font-medium text-navy">{formatDateTime(repair.startedAt)}</span></p> : null}{repair.completedAt ? <p className="text-sm"><span className="text-muted-foreground">{t("repair.completionTimestamp")}: </span><span className="font-medium text-navy">{formatDateTime(repair.completedAt)}</span></p> : null}<div className="flex flex-wrap gap-2">{canStart ? <Button className="bg-teal hover:bg-teal/85" disabled={start.isPending} onClick={() => start.mutate()}>{start.isPending ? t("repair.starting") : t("repair.startRepair")}</Button> : null}{canComplete ? <Button className="bg-teal hover:bg-teal/85" disabled={complete.isPending} onClick={() => setCompleteOpen(true)}>{t("repair.completeRepair")}</Button> : null}</div></CardContent></Card>
        </div>
        <Card className="h-fit"><CardHeader><CardTitle>{t("repair.jobSummary")}</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">{t("repair.repairAmount")}</span><span className="font-semibold text-navy">{formatRs(price)}</span></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">{t("repair.visitCharge")}</span><span className="font-semibold text-navy">{formatRs(job.lockedVisitCharge ?? job.suggestedVisitCharge ?? 0)}</span></div></CardContent></Card>
      </div>
      <ConfirmationModal open={completeOpen} onOpenChange={setCompleteOpen} title={t("repair.completeConfirmTitle")} description={t("repair.completeConfirmDescription")} confirmLabel={complete.isPending ? t("repair.completing") : t("repair.completeRepair")} onConfirm={() => complete.mutate()} />
    </div>
  );
}