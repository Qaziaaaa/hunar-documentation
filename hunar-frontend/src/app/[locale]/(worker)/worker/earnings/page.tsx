"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { CommissionInstructionCard } from "@/components/shared/commission-instruction-card";
import { EarningsSummaryCards } from "@/components/shared/earnings-summary-cards";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PageHeader } from "@/components/shared/page-header";
import { TransactionTable } from "@/components/shared/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRsExact } from "@/lib/money";
import { getEarningsSummary, getTransactions, submitScreenshot, queryKeys } from "@/services/worker/earnings.service";
import { uploadImage, validateImage } from "@/services/worker/upload.service";
import type { EarningsTransaction } from "@/types/finance";

export default function EarningsPage() {
  const t = useTranslations("Worker");
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<EarningsTransaction | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const summary = useQuery({ queryKey: queryKeys.summary, queryFn: getEarningsSummary });
  const transactions = useQuery({ queryKey: queryKeys.transactions, queryFn: getTransactions });
  const submit = useMutation({
    mutationFn: async (file: File) => {
      if (!selected) throw new Error("TRANSACTION_NOT_SELECTED");
      const validation = validateImage(file);
      if (validation) throw new Error(validation);
      const uploaded = await uploadImage(file);
      return submitScreenshot({ commissionId: selected.id, screenshotUrl: uploaded.url });
    },
    onSuccess: () => { setSelected(null); setUploadError(null); void queryClient.invalidateQueries({ queryKey: queryKeys.transactions }); void queryClient.invalidateQueries({ queryKey: queryKeys.summary }); },
    onError: (error) => setUploadError(error instanceof Error ? error.message : t("earnings.screenshotFailure")),
  });

  if (summary.isPending || transactions.isPending) return <LoadingState label={t("common.loading")} />;
  if (summary.isError || transactions.isError) return <ErrorState title={t("empty.errorTitle")} description={t("empty.errorDescription")} onRetry={() => { void summary.refetch(); void transactions.refetch(); }} />;
  const labels = { totalEarned: t("earnings.totalEarned"), totalEarnedHint: t("earnings.totalEarnedHint"), totalCommission: t("earnings.totalCommission"), totalCommissionHint: t("earnings.totalCommissionHint"), pendingCommission: t("earnings.pendingCommission"), pendingCommissionHint: t("earnings.pendingCommissionHint") };
  const tableLabels = { colJob: t("earnings.colJob"), colVisitCharge: t("earnings.colVisitCharge"), colRepairCharge: t("earnings.colRepairCharge"), colCommission: t("earnings.colCommission"), colScreenshot: t("earnings.colScreenshot"), colDate: t("earnings.colDate"), detailsTitle: t("earnings.detailsTitle"), commissionRate: t("earnings.commissionRate"), commissionAmount: t("earnings.commissionAmount"), paymentStatus: t("earnings.paymentStatus"), verificationDate: t("earnings.verificationDate"), submitScreenshot: t("earnings.submitScreenshot"), screenshotStatuses: { PENDING: t("earnings.screenshotPending"), RECEIVED: t("earnings.screenshotReceived"), VERIFIED: t("earnings.screenshotVerified") } };

  return (
    <div className="space-y-8">
      <PageHeader title={t("earnings.title")} description={t("earnings.description")} />
      <EarningsSummaryCards summary={summary.data} labels={labels} />
      <Card className="border-orange/30 bg-orange/5"><CardContent className="space-y-2"><h2 className="font-semibold text-navy">{t("earnings.commissionRuleTitle")}</h2><p className="text-sm text-muted-foreground">{t("earnings.commissionRuleDescription", { percent: "10%" })}</p><p className="text-sm font-medium text-navy">{t("earnings.commissionExample", { visit: formatRsExact(300), commission: formatRsExact(30) })}</p></CardContent></Card>
      <CommissionInstructionCard labels={{ title: t("earnings.commissionInstructionsTitle"), bankAccountLabel: t("earnings.bankAccountLabel"), bankAccountPlaceholder: t("earnings.bankAccountPlaceholder"), paymentMethodLabel: t("earnings.paymentMethodLabel"), paymentMethodValue: t("earnings.paymentMethodValue"), afterPaymentTitle: t("earnings.afterPaymentTitle"), whatsappInstruction: t("earnings.whatsappInstruction"), whatsappMessageExample: t("earnings.whatsappMessageExample") }} />
      <Card><CardHeader><CardTitle>{t("earnings.transactionsTitle")}</CardTitle><p className="text-sm text-muted-foreground">{t("earnings.transactionsDescription")}</p></CardHeader><CardContent>{transactions.data.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">{t("earnings.emptyDescription")}</p> : <TransactionTable transactions={transactions.data} labels={tableLabels} onSubmitScreenshot={setSelected} />}</CardContent></Card>
      {selected ? <Card className="border-teal/30"><CardHeader><CardTitle>{t("earnings.submitScreenshot")}</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">{t("earnings.submitScreenshotHint")}</p><input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) submit.mutate(file); }} /><Button className="bg-teal hover:bg-teal/85" disabled={submit.isPending} onClick={() => fileRef.current?.click()}><ImageUp className="size-4" aria-hidden="true" />{submit.isPending ? t("common.submitting") : t("earnings.chooseFile")}</Button>{uploadError ? <p role="alert" className="text-sm text-error">{uploadError === "UNSUPPORTED_FILE_TYPE" || uploadError === "FILE_TOO_LARGE" ? t("earnings.screenshotFailure") : uploadError}</p> : null}</CardContent></Card> : null}
    </div>
  );
}