"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatRs } from "@/lib/money";
import type { RepairRevision } from "@/types/repair";

export function ScopeChangeCard({
  currentPrice,
  pendingRevision,
  disabled,
  approveLabel,
  pendingLabel,
  requestTitle,
  requestDescriptionLabel,
  amountLabel,
  reasonLabel,
  reasonPlaceholder,
  submitLabel,
  submittingLabel,
  onSubmit,
}: {
  currentPrice: number;
  pendingRevision?: RepairRevision;
  disabled?: boolean;
  approveLabel: string;
  pendingLabel: string;
  requestTitle: string;
  requestDescriptionLabel: string;
  amountLabel: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  submitLabel: string;
  submittingLabel: string;
  onSubmit: (amount: number, reason: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (pendingRevision) {
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-orange/40 bg-orange/5 p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert aria-hidden="true" className="size-5 text-orange" />
          <p className="text-sm font-semibold text-navy">{pendingLabel}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Rs.{" "}
          <span className="font-semibold text-navy">
            {pendingRevision.proposedAmount.toLocaleString("en-PK")}
          </span>{" "}
          — {pendingRevision.reason}
        </p>
        <span className="inline-flex w-fit items-center rounded-md bg-white px-2.5 py-1 text-xs font-medium text-orange ring-1 ring-orange/30">
          {approveLabel}
        </span>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const parsed = Number(amount);
        if (!Number.isFinite(parsed) || parsed < 0) return;
        if (!reason.trim()) return;
        setSubmitting(true);
        onSubmit(parsed, reason.trim());
      }}
    >
      <div className="flex items-center gap-2">
        <TriangleAlert aria-hidden="true" className="size-5 text-orange" />
        <p className="text-sm font-semibold text-navy">{requestTitle}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        {requestDescriptionLabel} {formatRs(currentPrice)}
      </p>
      <div className="grid gap-2">
        <Label htmlFor="scope-amount">{amountLabel}</Label>
        <Input
          id="scope-amount"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={disabled || submitting}
          placeholder="0"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="scope-reason">{reasonLabel}</Label>
        <Textarea
          id="scope-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={reasonPlaceholder}
          disabled={disabled || submitting}
        />
      </div>
      <Button
        type="submit"
        variant="outline"
        disabled={disabled || submitting || !amount || !reason.trim()}
        className="w-fit"
      >
        {submitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : null}
        {submitting ? submittingLabel : submitLabel}
      </Button>
    </form>
  );
}