"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  FileText,
  Gavel,
  Lock,
  RotateCcw,
  Scale,
  X,
  XCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { timeAgo } from "@/lib/format";
import { adminApi, processWithdrawalRequest } from "@/features/admin/api/admin-api";
import type {
  AuditLogEntry,
  DisputeReport,
  LiveJobItem,
  PaymentTransaction,
  VerificationRequest,
  WithdrawalRequest,
} from "@/types/admin";
import { SegControl } from "./seg-control";

type ActivityKind = "payment" | "payout" | "dispute" | "job" | "audit" | "verification";
type FilterKind = "all" | ActivityKind;

interface ActivityRow {
  id: string;
  kind: ActivityKind;
  when: string;
  title: string;
  sub: string;
  who: string;
  amount?: number;
  statusLabel: string;
  statusTone: "good" | "warn" | "bad" | "info" | "muted";
  action?: "payout" | "dispute";
}

const FILTER_OPTIONS = [
  { value: "all" as const, label: "All" },
  { value: "payment" as const, label: "Payments" },
  { value: "payout" as const, label: "Payouts" },
  { value: "dispute" as const, label: "Disputes" },
  { value: "job" as const, label: "Jobs" },
  { value: "verification" as const, label: "Verifications" },
  { value: "audit" as const, label: "Audit" },
];

const KIND_PILL: Record<ActivityKind, { label: string; mod: string }> = {
  payment: { label: "Payment", mod: "wf-pill--good" },
  payout: { label: "Payout", mod: "wf-pill--info" },
  dispute: { label: "Dispute", mod: "wf-pill--bad" },
  job: { label: "Job", mod: "wf-pill--info" },
  audit: { label: "Audit", mod: "wf-pill--muted" },
  verification: { label: "Verification", mod: "wf-pill--warn" },
};

const MAX_ROWS = 25;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

const AVATAR_MODS = ["wf-avatar--teal", "wf-avatar--amber", "wf-avatar--navy", ""] as const;

function avatarMod(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_MODS[Math.abs(h) % AVATAR_MODS.length];
}

function buildRows({
  transactions,
  withdrawals,
  disputes,
  liveJobs,
  auditLogs,
  verifications,
}: {
  transactions: PaymentTransaction[];
  withdrawals: WithdrawalRequest[];
  disputes: DisputeReport[];
  liveJobs: LiveJobItem[];
  auditLogs: AuditLogEntry[];
  verifications: VerificationRequest[];
}): ActivityRow[] {
  const rows: ActivityRow[] = [];

  for (const tx of transactions) {
    const isJobTx = tx.paymentMethod === "Job";
    const parties = [tx.customerName, tx.workerName].filter((p) => p && p !== "—");
    rows.push({
      id: `tx-${tx.id}`,
      kind: "payment",
      when: tx.timestamp,
      title: isJobTx ? `Job #${tx.jobId}` : tx.paymentMethod,
      sub: isJobTx ? tx.paymentMethod : `Ledger ${tx.id.slice(0, 8)}`,
      who: parties.length > 0 ? parties.join(" → ") : "Wallet entry",
      amount: tx.amount,
      statusLabel:
        tx.status === "SUCCESS" ? "Paid" : tx.status === "ESCROW_HELD" ? "In escrow" : "Refunded",
      statusTone: tx.status === "SUCCESS" ? "good" : tx.status === "ESCROW_HELD" ? "info" : "warn",
    });
  }

  for (const wd of withdrawals) {
    rows.push({
      id: `wd-${wd.id}`,
      kind: "payout",
      when: wd.requestedAt,
      title: "Payout request",
      sub: `${wd.bankName} · ••${wd.accountNumber.slice(-4)}`,
      who: wd.workerName,
      amount: wd.amount,
      statusLabel:
        wd.status === "PENDING"
          ? "Pending"
          : wd.status === "PROCESSED"
            ? "Released"
            : wd.status === "REJECTED"
              ? "Declined"
              : "Failed",
      statusTone:
        wd.status === "PENDING"
          ? "warn"
          : wd.status === "PROCESSED"
            ? "good"
            : wd.status === "REJECTED"
              ? "bad"
              : "bad",
      action: wd.status === "PENDING" ? "payout" : undefined,
    });
  }

  for (const d of disputes) {
    rows.push({
      id: `dp-${d.id}`,
      kind: "dispute",
      when: d.createdAt,
      title: d.issueCategory,
      sub: `${d.reporterName} vs ${d.targetName} · Job #${d.jobId}`,
      who: d.targetName,
      statusLabel:
        d.status === "OPEN"
          ? "Open"
          : d.status === "UNDER_REVIEW"
            ? "Reviewing"
            : d.status === "RESOLVED"
              ? "Resolved"
              : d.status === "DISMISSED"
                ? "Dismissed"
                : "Escalated",
      statusTone:
        d.status === "OPEN"
          ? "bad"
          : d.status === "UNDER_REVIEW"
            ? "warn"
            : d.status === "RESOLVED"
              ? "good"
              : d.status === "DISMISSED"
                ? "muted"
                : "bad",
      action: d.status === "OPEN" || d.status === "UNDER_REVIEW" ? "dispute" : undefined,
    });
  }

  for (const job of liveJobs) {
    const tone: ActivityRow["statusTone"] =
      job.status === "COMPLETED"
        ? "good"
        : job.status === "DISPUTED"
          ? "bad"
          : job.status === "CANCELLED"
            ? "muted"
            : job.status === "IN_PROGRESS"
              ? "warn"
              : "info";
    rows.push({
      id: `job-${job.id}`,
      kind: "job",
      when: job.createdAt,
      title: job.title,
      sub: `Job #${job.id.slice(0, 8)} · ${job.city}`,
      who: job.workerName ? `${job.customerName} → ${job.workerName}` : job.customerName,
      amount: job.amount,
      statusLabel: job.status.replace(/_/g, " ").toLowerCase(),
      statusTone: tone,
    });
  }

  for (const v of verifications) {
    rows.push({
      id: `vf-${v.id}`,
      kind: "verification",
      when: v.submittedAt,
      title: "Verification pending",
      sub: [v.serviceCity, v.skills.join(", ")].filter(Boolean).join(" · "),
      who: v.workerName,
      statusLabel: v.status === "VERIFIED" ? "Verified" : "Pending",
      statusTone: v.status === "VERIFIED" ? "good" : "warn",
    });
  }

  for (const log of auditLogs) {
    rows.push({
      id: `au-${log.id}`,
      kind: "audit",
      when: log.timestamp,
      title: log.actionType,
      sub: log.details,
      who: log.adminName,
      statusLabel: log.targetResource,
      statusTone: "muted",
    });
  }

  return rows
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, MAX_ROWS);
}

function Pill({ tone, label }: { tone: ActivityRow["statusTone"]; label: string }) {
  const mod =
    tone === "good"
      ? "wf-pill--good"
      : tone === "warn"
        ? "wf-pill--warn"
        : tone === "bad"
          ? "wf-pill--bad"
          : tone === "info"
            ? "wf-pill--info"
            : "wf-pill--muted";
  return (
    <span className={`wf-pill ${mod}`}>
      <i aria-hidden />
      {label}
    </span>
  );
}

function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [message, onDismiss]);
  return (
    <div className="wf-toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification" className="opacity-70 hover:opacity-100">
        <X className="size-3.5" />
      </button>
    </div>
  );
}

interface RejectModalState {
  withdrawal: WithdrawalRequest;
}

interface MediateModalState {
  dispute: DisputeReport;
}

export function DashboardActivityTable({
  transactions,
  withdrawals: initialWithdrawals,
  disputes: initialDisputes,
  liveJobs,
  auditLogs,
  verifications,
}: {
  transactions: PaymentTransaction[];
  withdrawals: WithdrawalRequest[];
  disputes: DisputeReport[];
  liveJobs: LiveJobItem[];
  auditLogs: AuditLogEntry[];
  verifications: VerificationRequest[];
}) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [disputes, setDisputes] = useState<DisputeReport[]>(initialDisputes);
  const [filter, setFilter] = useState<FilterKind>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [rejectModal, setRejectModal] = useState<RejectModalState | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const [mediateModal, setMediateModal] = useState<MediateModalState | null>(null);
  const [resolutionAction, setResolutionAction] = useState<
    "refund_customer" | "release_worker" | "split_50_50" | "dismiss"
  >("refund_customer");
  const [freezeWallet, setFreezeWallet] = useState(false);
  const [mediationNotes, setMediationNotes] = useState("");

  const showToast = (msg: string) => setToastMessage(msg);

  const rows = useMemo(
    () =>
      buildRows({
        transactions,
        withdrawals,
        disputes,
        liveJobs,
        auditLogs,
        verifications,
      }),
    [transactions, withdrawals, disputes, liveJobs, auditLogs, verifications],
  );

  const visible = filter === "all" ? rows : rows.filter((r) => r.kind === filter);

  const handleApprovePayout = async (id: string, name: string, amount: number) => {
    setProcessingId(id);
    await processWithdrawalRequest(id, "approve");
    setWithdrawals((prev) => prev.map((w) => (w.id === id ? { ...w, status: "PROCESSED" } : w)));
    setProcessingId(null);
    showToast(`💰 Payout of Rs. ${amount.toLocaleString()} approved for ${name}`);
  };

  const handleOpenReject = (wd: WithdrawalRequest) => {
    setRejectModal({ withdrawal: wd });
    setRejectNote("");
  };

  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    setProcessingId(rejectModal.withdrawal.id);
    await processWithdrawalRequest(rejectModal.withdrawal.id, "reject", rejectNote);
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === rejectModal.withdrawal.id ? { ...w, status: "REJECTED" } : w)),
    );
    setProcessingId(null);
    showToast(
      `❌ Payout request #${rejectModal.withdrawal.id} rejected. Funds restored to worker balance.`,
    );
    setRejectModal(null);
    setRejectNote("");
  };

  const handleOpenMediate = (dispute: DisputeReport) => {
    setMediateModal({ dispute });
    setResolutionAction("refund_customer");
    setFreezeWallet(false);
    setMediationNotes("");
  };

  const handleExecuteResolution = async () => {
    if (!mediateModal || processingId) return;
    const dispute = mediateModal.dispute;
    const backendAction = resolutionAction === "dismiss" ? "dismiss" : "resolve";
    const actionLabels = {
      refund_customer: "Full refund issued to customer",
      release_worker: "Payout released to worker",
      split_50_50: "50/50 compromise settlement enforced",
      dismiss: "Dispute dismissed without penalty",
    };
    const baseLabel = actionLabels[resolutionAction];
    const resolution = mediationNotes.trim() ? `${baseLabel} — ${mediationNotes.trim()}` : baseLabel;

    setProcessingId(dispute.id);
    try {
      await adminApi.resolveDispute(dispute.id, backendAction, resolution);
    } catch {
      setProcessingId(null);
      showToast(`⚠️ Failed to resolve dispute #${dispute.id.slice(0, 8)} — no changes were applied`);
      return;
    }

    let freezeNote = "";
    if (freezeWallet) {
      const workerId =
        dispute.reporterRole === "WORKER"
          ? dispute.reporterId
          : dispute.respondentRole === "WORKER"
            ? dispute.respondentId
            : undefined;
      if (workerId) {
        try {
          await adminApi.freezeWallet(workerId, true, resolution.slice(0, 400));
          freezeNote = " · Worker wallet frozen";
        } catch {
          freezeNote = " · Wallet freeze failed";
        }
      } else {
        freezeNote = " · Wallet freeze skipped (no worker on this dispute)";
      }
    }

    const newStatus = resolutionAction === "dismiss" ? "DISMISSED" : "RESOLVED";
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === dispute.id ? { ...d, status: newStatus, resolutionNotes: resolution } : d,
      ),
    );
    setProcessingId(null);
    showToast(`⚖️ Dispute #${dispute.id.slice(0, 8)} ${newStatus.toLowerCase()}: ${baseLabel}${freezeNote}`);
    setMediateModal(null);
  };

  return (
    <div className="relative">
      {toastMessage && (
        <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
      )}

      <article className="wf-card wf-card--table" data-card style={{ "--ci": 4 } as React.CSSProperties}>
        <header className="wf-card__head">
          <div>
            <h3 className="wf-card__title">Recent activity</h3>
            <p className="wf-card__sub">
              Payments, payouts, disputes, jobs, verifications &amp; audit — newest first
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SegControl
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
              size="sm"
              label="Filter activity"
              className="min-w-0"
            />
            <Link href="/admin/payments" className="wf-link hidden sm:inline-flex">
              Ledger
            </Link>
          </div>
        </header>

        {visible.length === 0 ? (
          <div className="wf-empty">Nothing here yet</div>
        ) : (
          <div className="wf-table-wrap--stack overflow-x-auto">
            <table className="wf-table wf-table--stack wf-table--rows wf-rows--activity">
              <thead>
                <tr>
                  <th>When</th>
                  <th>What happened</th>
                  <th>Who</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => {
                  const kind = KIND_PILL[row.kind];
                  return (
                    <tr key={row.id}>
                      <td className="wf-act-when mono">
                        <time dateTime={row.when}>{timeAgo(row.when)}</time>
                      </td>
                      <td data-title>
                        <div className="cell">
                          <span className={`wf-pill ${kind.mod}`}>
                            <i aria-hidden />
                            {kind.label}
                          </span>
                          <div className="min-w-0">
                            <b>{row.title}</b>
                            <small>{row.sub}</small>
                          </div>
                        </div>
                      </td>
                      <td data-th="Who">
                        <div className="cell">
                          <span className={`wf-avatar ${avatarMod(row.who)}`} aria-hidden>
                            {initials(row.who.split("→")[0]!.trim())}
                          </span>
                          <small className="truncate">{row.who}</small>
                        </div>
                      </td>
                      <td className="num">
                        {row.amount !== undefined ? `Rs. ${row.amount.toLocaleString()}` : "—"}
                      </td>
                      <td data-th="Status">
                        <Pill tone={row.statusTone} label={row.statusLabel} />
                      </td>
                      <td data-action>
                        {row.action === "payout" && (
                          <>
                            <button
                              type="button"
                              className="wf-btn wf-btn--sm wf-btn--primary mr-2"
                              disabled={processingId === row.id.replace(/^wd-/, "")}
                              onClick={() => {
                                const wd = withdrawals.find((w) => `wd-${w.id}` === row.id);
                                if (wd) void handleApprovePayout(wd.id, wd.workerName, wd.amount);
                              }}
                            >
                              <CheckCircle aria-hidden />
                              Release
                            </button>
                            <button
                              type="button"
                              className="wf-btn wf-btn--sm wf-btn--danger"
                              disabled={processingId === row.id.replace(/^wd-/, "")}
                              onClick={() => {
                                const wd = withdrawals.find((w) => `wd-${w.id}` === row.id);
                                if (wd) handleOpenReject(wd);
                              }}
                            >
                              <XCircle aria-hidden />
                              Decline
                            </button>
                          </>
                        )}
                        {row.action === "dispute" && (
                          <button
                            type="button"
                            className="wf-btn wf-btn--sm wf-btn--ghost"
                            onClick={() => {
                              const d = disputes.find((x) => `dp-${x.id}` === row.id);
                              if (d) handleOpenMediate(d);
                            }}
                          >
                            <Gavel aria-hidden />
                            Mediate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <footer className="wf-card__foot" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>
            Showing {visible.length} of {rows.length} events
          </span>
          <Link href="/admin/payments" className="wf-link">
            Open payments
          </Link>
        </footer>
      </article>

      {/* ── Decline Payout Modal (PUT /admin/withdrawals/:id/process action: 'reject') ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Decline payout request"
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <XCircle className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy">Decline Payout Request</h3>
                  <p className="text-[11px] text-slate-500">
                    Worker:{" "}
                    <strong className="text-slate-800">{rejectModal.withdrawal.workerName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-600">
                <p>
                  Amount: <strong>Rs. {rejectModal.withdrawal.amount.toLocaleString()}</strong>
                </p>
                <p>
                  Bank: {rejectModal.withdrawal.bankName} ({rejectModal.withdrawal.accountNumber})
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Decline Reason / Admin Note:
                </label>
                <textarea
                  rows={2}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  placeholder="e.g. Account title mismatch or invalid IBAN..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] font-medium text-amber-800">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>Funds will be restored back to worker&apos;s available wallet balance.</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rejectNote.trim()}
                onClick={handleConfirmReject}
                className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-rose-700 disabled:opacity-50"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mediate Dispute Modal ── */}
      {mediateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Mediate dispute ${mediateModal.dispute.id}`}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-navy text-teal-300">
                  <Gavel className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-navy">
                    Mediate Dispute Ticket #{mediateModal.dispute.id.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Category:{" "}
                    <strong className="text-slate-800">{mediateModal.dispute.issueCategory}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMediateModal(null)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-2 text-[11px] text-slate-600">
                <div className="flex justify-between gap-2">
                  <span>
                    Customer:{" "}
                    <strong>
                      {mediateModal.dispute.reporterRole === "CUSTOMER"
                        ? mediateModal.dispute.reporterName
                        : mediateModal.dispute.targetName}
                    </strong>
                  </span>
                  <span>
                    Worker:{" "}
                    <strong>
                      {mediateModal.dispute.reporterRole === "WORKER"
                        ? mediateModal.dispute.reporterName
                        : mediateModal.dispute.targetName}
                    </strong>
                  </span>
                </div>
                <p className="mt-1 text-[11px] italic text-slate-500">
                  &ldquo;{mediateModal.dispute.description}&rdquo;
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Select Arbitration Decision:
                </label>
                <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setResolutionAction("refund_customer")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "refund_customer"
                        ? "border-teal bg-teal/5 text-navy font-bold ring-1 ring-teal"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <RotateCcw className="size-3.5 text-teal" />
                    <div>
                      <p className="text-[11px] font-bold">Refund Customer</p>
                      <p className="text-[11px] text-slate-400">Release escrow back to buyer</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("release_worker")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "release_worker"
                        ? "border-green-600 bg-green-50/50 text-navy font-bold ring-1 ring-green-600"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 className="size-3.5 text-green-600" />
                    <div>
                      <p className="text-[11px] font-bold">Release to Worker</p>
                      <p className="text-[11px] text-slate-400">Pay worker visit &amp; labor charge</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("split_50_50")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "split_50_50"
                        ? "border-amber-500 bg-amber-50/50 text-navy font-bold ring-1 ring-amber-500"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Scale className="size-3.5 text-amber-600" />
                    <div>
                      <p className="text-[11px] font-bold">50 / 50 Settlement</p>
                      <p className="text-[11px] text-slate-400">Split locked funds equally</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResolutionAction("dismiss")}
                    className={`flex items-center gap-2 rounded-xl border p-2 text-left transition ${
                      resolutionAction === "dismiss"
                        ? "border-slate-500 bg-slate-100 text-navy font-bold ring-1 ring-slate-500"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <FileText className="size-3.5 text-slate-500" />
                    <div>
                      <p className="text-[11px] font-bold">Dismiss Grievance</p>
                      <p className="text-[11px] text-slate-400">Deem complaint unjustified</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-2.5">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={freezeWallet}
                    onChange={(e) => setFreezeWallet(e.target.checked)}
                    className="size-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <Lock className="size-3 text-rose-600" />
                    <span className="text-[11px] font-bold text-rose-900">
                      Freeze Worker Wallet &amp; Block New Bidding
                    </span>
                  </div>
                </label>
                <p className="mt-1 pl-5.5 text-[11px] text-rose-700">
                  Check this if the worker engaged in fraudulent charges, physical abuse, or safety
                  violations.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700">
                  Mediation Audit Notes:
                </label>
                <textarea
                  rows={2}
                  value={mediationNotes}
                  onChange={(e) => setMediationNotes(e.target.value)}
                  placeholder="Record summary of evidence and agreement..."
                  className="mt-1 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:border-navy focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setMediateModal(null)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResolution}
                disabled={
                  !!processingId && processingId === (mediateModal?.dispute.id ?? null)
                }
                className="rounded-lg bg-navy px-4 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-navy/90 disabled:opacity-60"
              >
                {processingId === mediateModal?.dispute.id
                  ? "Executing…"
                  : "Execute Binding Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
