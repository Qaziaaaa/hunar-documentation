"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ImageUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { formatRs } from "@/lib/money";
import { commissionStatusTone } from "@/lib/status-meta";
import type { CommissionStatus, EarningsTransaction } from "@/types/finance";
import { cn } from "@/lib/utils";
import { ToneBadge } from "./tone-badge";

export interface TransactionTableLabels {
  colJob: string;
  colVisitCharge: string;
  colRepairCharge: string;
  colCommission: string;
  colScreenshot: string;
  colDate: string;
  detailsTitle: string;
  commissionRate: string;
  commissionAmount: string;
  paymentStatus: string;
  verificationDate: string;
  submitScreenshot: string;
  screenshotStatuses: Record<CommissionStatus, string>;
}

function ScreenshotBadge({
  status,
  label,
}: {
  status: CommissionStatus;
  label: string;
}) {
  return (
    <ToneBadge
      tone={commissionStatusTone(status)}
      label={label}
      withDot
    />
  );
}

function DetailsPanel({
  transaction,
  labels,
  onSubmitScreenshot,
}: {
  transaction: EarningsTransaction;
  labels: TransactionTableLabels;
  onSubmitScreenshot?: (transaction: EarningsTransaction) => void;
}) {
  const rows: Array<{ label: string; value: React.ReactNode }> = [
    { label: labels.colJob, value: transaction.jobTitle || transaction.jobId },
    { label: labels.colVisitCharge, value: formatRs(transaction.visitCharge) },
    {
      label: labels.colRepairCharge,
      value: formatRs(transaction.repairCharge),
    },
    {
      label: labels.commissionRate,
      value: `${Math.round(transaction.commissionRate * 100)}%`,
    },
    {
      label: labels.commissionAmount,
      value: formatRs(transaction.commission),
    },
    {
      label: labels.paymentStatus,
      value: (
        <ScreenshotBadge
          status={transaction.commissionStatus}
          label={labels.screenshotStatuses[transaction.commissionStatus]}
        />
      ),
    },
    { label: labels.colDate, value: formatDateTime(transaction.date) },
  ];

  if (transaction.verifiedAt) {
    rows.push({
      label: labels.verificationDate,
      value: formatDateTime(transaction.verifiedAt),
    });
  }

  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="mb-3 text-sm font-semibold text-navy">
        {labels.detailsTitle}
      </p>
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <dt className="text-sm text-muted-foreground">{row.label}</dt>
            <dd className="text-sm font-medium text-navy">{row.value}</dd>
          </div>
        ))}
      </dl>
      {transaction.commissionStatus === "PENDING" && onSubmitScreenshot ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => onSubmitScreenshot(transaction)}
        >
          <ImageUp aria-hidden="true" className="size-4" />
          {labels.submitScreenshot}
        </Button>
      ) : null}
    </div>
  );
}

export function TransactionTable({
  transactions,
  labels,
  onSubmitScreenshot,
}: {
  transactions: EarningsTransaction[];
  labels: TransactionTableLabels;
  onSubmitScreenshot?: (transaction: EarningsTransaction) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const toggle = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  return (
    <div>
      <table className="hidden w-full border-collapse text-sm md:table">
        <caption className="sr-only">{labels.detailsTitle}</caption>
        <thead>
          <tr className="border-b border-border text-start">
            <th scope="col" className="px-3 py-2 text-start font-medium text-muted-foreground">
              {labels.colJob}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium text-muted-foreground">
              {labels.colVisitCharge}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium text-muted-foreground">
              {labels.colRepairCharge}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium text-muted-foreground">
              {labels.colCommission}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium text-muted-foreground">
              {labels.colScreenshot}
            </th>
            <th scope="col" className="px-3 py-2 text-start font-medium text-muted-foreground">
              {labels.colDate}
            </th>
            <th scope="col" className="px-3 py-2">
              <span className="sr-only">{labels.detailsTitle}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => {
            const expanded = expandedId === transaction.id;
            return (
              <Fragment key={transaction.id}>
                <tr className="border-b border-border align-middle">
                  <td className="px-3 py-3 font-medium text-navy">
                    {transaction.jobTitle || transaction.jobId}
                  </td>
                  <td className="px-3 py-3">{formatRs(transaction.visitCharge)}</td>
                  <td className="px-3 py-3">{formatRs(transaction.repairCharge)}</td>
                  <td className="px-3 py-3 font-medium text-navy">
                    {formatRs(transaction.commission)}
                  </td>
                  <td className="px-3 py-3">
                    <ScreenshotBadge
                      status={transaction.commissionStatus}
                      label={labels.screenshotStatuses[transaction.commissionStatus]}
                    />
                  </td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {formatDateTime(transaction.date)}
                  </td>
                  <td className="px-3 py-3 text-end">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-expanded={expanded}
                      aria-label={labels.detailsTitle}
                      onClick={() => toggle(transaction.id)}
                    >
                      <ChevronDown
                        aria-hidden="true"
                        className={cn(
                          "size-4 transition-transform",
                          expanded && "rotate-180"
                        )}
                      />
                    </Button>
                  </td>
                </tr>
                {expanded ? (
                  <tr>
                    <td colSpan={7} className="px-3 pb-4">
                      <DetailsPanel
                        transaction={transaction}
                        labels={labels}
                        onSubmitScreenshot={onSubmitScreenshot}
                      />
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>

      <ul className="space-y-3 md:hidden">
        {transactions.map((transaction) => {
          const expanded = expandedId === transaction.id;
          return (
            <li
              key={transaction.id}
              className="rounded-xl border border-border bg-card p-4"
            >
              <button
                type="button"
                className="flex w-full items-start justify-between gap-3 text-start outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-expanded={expanded}
                onClick={() => toggle(transaction.id)}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-navy">
                    {transaction.jobTitle || transaction.jobId}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatDateTime(transaction.date)}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold text-navy">
                    {formatRs(transaction.commission)}
                  </span>
                  <ScreenshotBadge
                    status={transaction.commissionStatus}
                    label={labels.screenshotStatuses[transaction.commissionStatus]}
                  />
                </span>
              </button>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">{labels.colVisitCharge}</p>
                  <p className="font-medium text-navy">
                    {formatRs(transaction.visitCharge)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{labels.colRepairCharge}</p>
                  <p className="font-medium text-navy">
                    {formatRs(transaction.repairCharge)}
                  </p>
                </div>
              </div>
              {expanded ? (
                <div className="mt-3">
                  <DetailsPanel
                    transaction={transaction}
                    labels={labels}
                    onSubmitScreenshot={onSubmitScreenshot}
                  />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
