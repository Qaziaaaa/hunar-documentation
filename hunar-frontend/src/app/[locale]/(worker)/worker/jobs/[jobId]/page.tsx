"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, MapPin, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { ToneBadge } from "@/components/shared/tone-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { formatDateTime } from "@/lib/format";
import { formatRs } from "@/lib/money";
import { jobStatusTone } from "@/lib/status-meta";
import { getWorkerJob, queryKeys } from "@/services/worker/jobs.service";
import { cancelWorkerJob, getJobCancellationStage, queryKeys as cancellationKeys } from "@/services/worker/cancellation.service";
import type { CancellationReason } from "@/types/cancellation";

const REASONS: CancellationReason[] = ["customer_unavailable", "unsafe_conditions", "wrong_job_info", "parts_unavailable", "customer_requested", "other"];

export default function JobDetailsPage() {
  const t = useTranslations("Worker");
  const { jobId } = useParams<{ jobId: string }>();
  const client = useQueryClient();
  const job = useQuery({ queryKey: queryKeys.job(jobId), queryFn: () => getWorkerJob(jobId) });
  const stage = useQuery({ queryKey: cancellationKeys.stage(jobId), queryFn: () => getJobCancellationStage(jobId), enabled: job.isSuccess });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState<CancellationReason>("customer_unavailable");
  const [note, setNote] = useState("");
  const cancel = useMutation({ mutationFn: () => cancelWorkerJob({ jobId, stage: stage.data?.stage ?? "before_visit", reason, note: reason === "other" ? note : undefined, arrivedAt: stage.data?.arrivedAt }), onSuccess: () => { setCancelOpen(false); void client.invalidateQueries({ queryKey: queryKeys.job(jobId) }); } });
  if (job.isPending) return <LoadingState label={t("common.loading")} />;
  if (job.isError) return <ErrorState title={t("empty.jobNotFound")} description={t("empty.jobNotFoundDescription")} onRetry={() => void job.refetch()} />;
  const item = job.data;
  const afterArrival = stage.data?.stage === "after_arrival";
  const canCancel = !["COMPLETED", "PAID", "REVIEWED", "CANCELLED"].includes(item.status);
  return <div className="space-y-6"><PageHeader title={t("jobs.detailsTitle")} description={item.title} /><div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="space-y-6"><Card><CardHeader className="flex flex-row items-start justify-between gap-3"><div><CardTitle>{item.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{item.category?.name ?? t("common.job")}</p></div><ToneBadge tone={jobStatusTone(item.status)} label={t(`status.job.${item.status}`)} /></CardHeader><CardContent className="space-y-4"><p className="text-sm leading-relaxed text-muted-foreground">{item.description ?? t("jobs.emptyDescription")}</p><div className="flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 size-4 shrink-0 text-teal" aria-hidden="true" />{item.address}, {item.city}</div><div className="grid gap-3 sm:grid-cols-2"><Info label={t("jobs.agreedVisitCharge")} value={formatRs(item.lockedVisitCharge ?? item.suggestedVisitCharge ?? 0)} /><Info label={t("jobs.preferredVisit")} value={item.preferredVisitTime ? formatDateTime(item.preferredVisitTime) : t("common.notAvailable")} /></div>{item.status === "CANCELLED" ? <p className="rounded-lg bg-error/10 p-3 text-sm text-error">{t("jobs.customerCanceled")}</p> : null}{item.status === "DISPUTED" ? <p className="rounded-lg bg-orange/10 p-3 text-sm text-orange">{t("jobs.noShowReported")}</p> : null}</CardContent></Card><Card><CardHeader><CardTitle>{t("jobs.inspectionSummary")}</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2"><Info label={t("jobs.diagnosis")} value={t("common.notAvailable")} /><Info label={t("jobs.repairPlan")} value={t("common.notAvailable")} /></CardContent></Card></div><div className="space-y-4"><Card><CardHeader><CardTitle>{t("common.status")}</CardTitle></CardHeader><CardContent className="flex flex-col gap-2"><Link href={`/worker/jobs/${item.id}/negotiation`}><Button className="w-full bg-teal hover:bg-teal/85">{t("jobs.viewNegotiation")}<ArrowRight className="size-4" aria-hidden="true" /></Button></Link><Link href={`/worker/jobs/${item.id}/repair`}><Button variant="outline" className="w-full">{t("jobs.viewRepair")}<ArrowRight className="size-4" aria-hidden="true" /></Button></Link><Link href="/worker/chat"><Button variant="outline" className="w-full"><MessageSquare className="size-4" aria-hidden="true" />{t("jobs.messageCustomer")}</Button></Link>{canCancel ? <Button variant="destructive" className="w-full" onClick={() => setCancelOpen(true)}>{t("jobs.cancelJob")}</Button> : null}</CardContent></Card></div></div><ConfirmationModal open={cancelOpen} onOpenChange={setCancelOpen} title={afterArrival ? t("cancellation.confirmTitle") : t("cancellation.beforeVisitTitle")} description={afterArrival ? <div className="space-y-3"><p>{t("cancellation.reliabilityWarning")}</p><Label htmlFor="cancel-reason">{t("cancellation.reasonLabel")}</Label><Select value={reason} options={REASONS.map((item) => ({ value: item, label: t(`cancellation.reasons.${item}`) }))} onValueChange={(value) => value && setReason(value as CancellationReason)} placeholder={t("cancellation.reasonPlaceholder")} id="cancel-reason" />{reason === "other" ? <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder={t("cancellation.otherExplanationPlaceholder")} aria-label={t("cancellation.otherExplanationLabel")} /> : null}</div> : t("cancellation.beforeVisitDescription")} confirmLabel={cancel.isPending ? t("cancellation.cancelling") : t("cancellation.confirmCancel")} variant="destructive" loading={cancel.isPending} onConfirm={() => cancel.mutate()} /></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-sm font-medium text-navy">{value}</p></div>; }