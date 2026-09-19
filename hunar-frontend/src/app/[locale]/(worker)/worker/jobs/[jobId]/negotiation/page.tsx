"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ConfirmationModal } from "@/components/shared/confirmation-modal";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { LockedPriceBadge } from "@/components/shared/locked-price-badge";
import { NegotiationOfferCard } from "@/components/shared/negotiation-offer-card";
import { NegotiationTimeline } from "@/components/shared/negotiation-timeline";
import { PageHeader } from "@/components/shared/page-header";
import { RepairPriceCard } from "@/components/shared/repair-price-card";
import { ScopeChangeCard } from "@/components/shared/scope-change-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format";
import { formatRs } from "@/lib/money";
import { negotiationStatusTone } from "@/lib/status-meta";
import { getNegotiationContext, acceptCounterOffer, rejectCounterOffer, requestScopeChange, sendCounterOffer, submitEstimate, queryKeys } from "@/services/worker/negotiation.service";
import { getWorkerJob, queryKeys as jobKeys } from "@/services/worker/jobs.service";
import { ToneBadge } from "@/components/shared/tone-badge";

export default function NegotiationPage() {
  const t = useTranslations("Worker");
  const params = useParams<{ jobId: string }>();
  const jobId = params.jobId;
  const queryClient = useQueryClient();
  const context = useQuery({ queryKey: queryKeys.negotiation(jobId), queryFn: () => getNegotiationContext(jobId) });
  const jobDetails = useQuery({ queryKey: jobKeys.job(jobId), queryFn: () => getWorkerJob(jobId) });
  const [confirm, setConfirm] = useState<"accept" | "reject" | null>(null);
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState("");
  const [counterNote, setCounterNote] = useState("");
  const [estimateAmount, setEstimateAmount] = useState("");
  const [estimateDescription, setEstimateDescription] = useState("");

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.negotiation(jobId) });
  const accept = useMutation({ mutationFn: () => acceptCounterOffer(context.data!.repair.id, context.data!.repair.amount), onSuccess: refresh });
  const reject = useMutation({ mutationFn: () => rejectCounterOffer(context.data!.repair.id), onSuccess: refresh });
  const counter = useMutation({
    mutationFn: () => sendCounterOffer(context.data!.repair.id, { amount: Number(counterAmount), note: counterNote || undefined }),
    onSuccess: () => { setCounterOpen(false); setCounterAmount(""); setCounterNote(""); void refresh(); },
  });
  const scope = useMutation({
    mutationFn: (input: { amount: number; reason: string }) => requestScopeChange(context.data!.repair.id, { repairId: context.data!.repair.id, ...input }),
    onSuccess: refresh,
  });
  const estimate = useMutation({
    mutationFn: () => submitEstimate(context.data!.visit?.id ?? "", { amount: Number(estimateAmount), description: estimateDescription.trim() }),
    onSuccess: () => { setEstimateAmount(""); setEstimateDescription(""); void refresh(); },
  });

  if (context.isPending) return <LoadingState label={t("common.loading")} />;
  if (context.isError || !context.data) return <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => void context.refetch()} />;
  const { repair, job, status, maxRounds, currentRound, canAccept, canCounter, canReject, scopeChange } = context.data;
  const fullJob = jobDetails.data;
  const lastOffer = repair.negotiationHistory.at(-1);
  const canSubmitCounter = Number(counterAmount) > 0 && Number.isFinite(Number(counterAmount));

  return (
    <div className="space-y-6">
      <PageHeader title={t("negotiation.title")} description={t("negotiation.subtitle")} />
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t("negotiation.jobInformation")}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-semibold text-navy">{job.title}</h2><p className="text-sm text-muted-foreground">{job.city}{job.area ? `, ${job.area}` : ""}</p></div>
                <ToneBadge tone={negotiationStatusTone(status)} label={t(`status.negotiation.${status}`)} />
              </div>
              <p className="text-sm text-muted-foreground">{fullJob?.description ?? t("negotiation.problemDescription")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <RepairPriceCard label={t("negotiation.visitChargeLabel")} amount={fullJob?.lockedVisitCharge ?? fullJob?.suggestedVisitCharge ?? 0} hint={t("negotiation.separateChargeNote")} />
                <RepairPriceCard label={t("negotiation.estimatedRepairPrice")} amount={repair.lockedAmount ?? repair.amount} />
              </div>
            </CardContent>
          </Card>

          {lastOffer ? (
            <NegotiationOfferCard
              actorLabel={lastOffer.by === "customer" ? t("common.customer") : t("common.you")}
              amount={lastOffer.amount}
              note={lastOffer.note}
              timestamp={lastOffer.timestamp}
              canAccept={canAccept}
              canReject={canReject}
              canCounter={canCounter}
              lockedLabel={status === "locked" ? t("negotiation.priceLocked") : undefined}
              acceptLabel={accept.isPending ? t("negotiation.accepting") : t("negotiation.accept")}
              rejectLabel={reject.isPending ? t("negotiation.rejecting") : t("negotiation.reject")}
              counterLabel={t("negotiation.counter")}
              onAccept={() => setConfirm("accept")}
              onReject={() => setConfirm("reject")}
              onCounter={() => setCounterOpen(true)}
            />
          ) : (
            <Card>
              <CardHeader><CardTitle>{t("negotiation.estimateTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("negotiation.estimateDescription")}</p>
                <div className="grid gap-2"><Label htmlFor="estimate-amount">{t("negotiation.estimatePrice")}</Label><Input id="estimate-amount" type="number" min="1" value={estimateAmount} onChange={(event) => setEstimateAmount(event.target.value)} /></div>
                <div className="grid gap-2"><Label htmlFor="estimate-description">{t("negotiation.estimateDescriptionLabel")}</Label><Textarea id="estimate-description" placeholder={t("negotiation.estimateDescriptionPlaceholder")} value={estimateDescription} onChange={(event) => setEstimateDescription(event.target.value)} /></div>
                <Button className="bg-teal hover:bg-teal/85" disabled={!estimateAmount || !estimateDescription.trim() || estimate.isPending} onClick={() => estimate.mutate()}>{estimate.isPending ? t("common.submitting") : t("negotiation.submitEstimate")}</Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>{t("negotiation.negotiationHistory")}</CardTitle></CardHeader>
            <CardContent><NegotiationTimeline entries={repair.negotiationHistory} workerLabel={t("common.worker")} customerLabel={t("common.customer")} roundLabel={t("common.notAvailable")} /></CardContent>
          </Card>

          <ScopeChangeCard
            currentPrice={repair.lockedAmount ?? repair.amount}
            pendingRevision={scopeChange}
            disabled={status !== "locked" || scope.isPending}
            approveLabel={t("negotiation.scopePendingTitle")}
            pendingLabel={t("negotiation.scopePendingTitle")}
            requestTitle={t("negotiation.scopeChangeTitle")}
            requestDescriptionLabel={t("negotiation.scopeChangeDescription")}
            amountLabel={t("negotiation.scopeAmount")}
            reasonLabel={t("negotiation.scopeReason")}
            reasonPlaceholder={t("negotiation.scopeReasonPlaceholder")}
            submitLabel={t("negotiation.scopeSubmit")}
            submittingLabel={t("negotiation.scopeSubmitting")}
            onSubmit={(amount, reason) => scope.mutate({ amount, reason })}
          />
        </div>

        <Card className="h-fit">
          <CardHeader><CardTitle>{t("common.round", { current: currentRound, max: maxRounds })}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{canCounter ? t("negotiation.awaitingCustomer") : t("negotiation.noActions")}</p>
            {!canCounter && repair.negotiationRound >= maxRounds ? <p className="rounded-lg bg-orange/10 p-3 text-orange">{t("negotiation.roundLimitReached")}</p> : null}
            {repair.lockedAmount != null ? <div className="flex items-center justify-between gap-3"><span>{t("negotiation.agreedAmount")}</span><span className="font-semibold text-navy">{formatRs(repair.lockedAmount)}</span></div> : null}
            {repair.lockedAt ? <p>{t("negotiation.lockedAt", { date: formatDateTime(repair.lockedAt) })}</p> : null}
            {repair.lockedAmount != null ? <LockedPriceBadge amount={repair.lockedAmount} lockedAt={repair.lockedAt} /> : null}
          </CardContent>
        </Card>
      </div>

      <ConfirmationModal open={confirm === "accept"} onOpenChange={(open) => !open && setConfirm(null)} title={t("negotiation.accept")} description={t("negotiation.priceLocked")} confirmLabel={accept.isPending ? t("negotiation.accepting") : t("negotiation.accept")} onConfirm={() => { accept.mutate(); setConfirm(null); }} />
      <ConfirmationModal open={confirm === "reject"} onOpenChange={(open) => !open && setConfirm(null)} title={t("negotiation.rejectTitle")} description={t("negotiation.rejectDescription")} confirmLabel={reject.isPending ? t("negotiation.rejecting") : t("negotiation.reject")} variant="destructive" onConfirm={() => { reject.mutate(); setConfirm(null); }} />
      {counterOpen ? (
        <Card className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-lg border-teal shadow-xl sm:inset-x-auto sm:right-6">
          <CardHeader><CardTitle>{t("negotiation.counterTitle")}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2"><Label htmlFor="counter-amount">{t("negotiation.counterAmount")}</Label><Input id="counter-amount" type="number" min="1" value={counterAmount} onChange={(event) => setCounterAmount(event.target.value)} /></div>
            <div className="grid gap-2"><Label htmlFor="counter-note">{t("negotiation.counterNote")}</Label><Textarea id="counter-note" placeholder={t("negotiation.counterNotePlaceholder")} value={counterNote} onChange={(event) => setCounterNote(event.target.value)} /></div>
            <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCounterOpen(false)}>{t("common.cancel")}</Button><Button className="bg-teal hover:bg-teal/85" disabled={!canSubmitCounter || counter.isPending} onClick={() => counter.mutate()}>{counter.isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}{counter.isPending ? t("common.submitting") : t("negotiation.counter")}</Button></div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}