"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { adminApi } from "@/features/admin/api/admin-api";
import type { DisputeReport } from "@/types/admin";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react";

export default function DisputeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [dispute, setDispute] = useState<DisputeReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void params.then((p) => {
      adminApi
        .getDisputeDetail(p.id)
        .then((d) => {
          if (!cancelled) setDispute(d);
        })
        .catch(() => {
          if (!cancelled) setDispute(null);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [params]);

  if (loading) {
    return (
<div className="p-8 text-center">
          <p className="text-base font-bold text-navy">Loading dispute report...</p>
        </div>
);
  }

  if (!dispute) {
    return (
      
        <div className="p-8 text-center">
          <p className="text-base font-bold text-navy">Dispute Report Not Found</p>
          <Link href="/admin/disputes" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-teal">
            <ArrowLeft className="size-4" /> Back to Disputes
          </Link>
        </div>
      
    );
  }

  const handleResolve = async () => {
    setActionError(null);
    const notes = resolutionNotes.trim();
    if (!notes) {
      setActionError("Resolution notes are required.");
      return;
    }
    setActing(true);
    try {
      await adminApi.resolveDispute(dispute.id, "RESOLVED", notes);
      setDispute((prev) =>
        prev
          ? {
              ...prev,
              status: "RESOLVED",
              resolutionNotes: notes,
            }
          : prev
      );
      setTimeout(() => router.push("/admin/disputes"), 1000);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to resolve dispute",
      );
    } finally {
      setActing(false);
    }
  };

  const handleDismiss = async () => {
    setActionError(null);
    const notes = resolutionNotes.trim();
    if (!notes) {
      setActionError("Resolution notes are required.");
      return;
    }
    setActing(true);
    try {
      await adminApi.resolveDispute(dispute.id, "DISMISSED", notes);
      setDispute((prev) =>
        prev
          ? {
              ...prev,
              status: "DISMISSED",
              resolutionNotes: notes,
            }
          : prev
      );
      setTimeout(() => router.push("/admin/disputes"), 1000);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to dismiss dispute",
      );
    } finally {
      setActing(false);
    }
  };

  return (
    
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/admin/disputes" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-navy">
          <ArrowLeft className="size-4" /> Back to Disputes Queue
        </Link>

        {actionError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            Action failed: {actionError}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange/20 bg-orange/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange">
                <AlertTriangle className="size-3.5" /> Incident Report #{dispute.id}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-navy">
                {dispute.status}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-black text-navy">{dispute.issueCategory}</h1>
            <p className="text-xs text-slate-500">Related Job: #{dispute.jobId}</p>
          </div>

          {/* Resolution Action Buttons (Task 33) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={acting || !resolutionNotes.trim()}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Dismiss Report
            </button>
            <button
              type="button"
              onClick={handleResolve}
              disabled={acting || !resolutionNotes.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-teal px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 className="size-4" /> {acting ? "Working..." : "Resolve & Refund"}
            </button>
          </div>
        </div>

        {/* Resolution Notes — required before either action can run (no invented text). */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-extrabold text-navy">
            Resolution Notes <span className="text-red-500">*</span>
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Both Resolve and Dismiss require your written notes — they are stored with
            the dispute record.
          </p>
          <textarea
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            placeholder="Describe the outcome, refund decision, or why this report is being dismissed..."
            className="mt-3 h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-teal"
          />
        </div>

        {/* Evidence & Parties Info */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
              <User className="size-4 text-teal" /> Involved Parties
            </h3>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Complainant / Reporter</p>
              <p className="font-extrabold text-navy">{dispute.reporterName} ({dispute.reporterRole})</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Respondent / Target</p>
              <p className="font-extrabold text-teal">{dispute.targetName}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3 text-xs">
            <h3 className="font-extrabold text-navy border-b border-slate-100 pb-2 text-sm flex items-center gap-2">
              <FileText className="size-4 text-teal" /> Reported Description
            </h3>
            <p className="leading-relaxed text-slate-600 font-medium">
              "{dispute.description}"
            </p>
          </div>
        </div>

        {/* Uploaded Evidence Photo Trail (Task 32) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-navy border-b border-slate-100 pb-3">
            Uploaded Evidence Media
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {dispute.evidenceUrls.map((url, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2">
                <img src={url} alt="Dispute evidence photo" className="h-60 w-full object-cover rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    
  );
}
