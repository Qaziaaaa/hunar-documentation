"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { VerificationRequest } from "@/types/admin";
import { approveWorkerVerification, rejectWorkerVerification } from "@/features/admin/api/admin-api";

export function PendingVerificationsWidget({
  requests: initialRequests,
}: {
  requests: VerificationRequest[];
}) {
  const [items, setItems] = useState<VerificationRequest[]>(initialRequests);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (workerId: string, reqId: string) => {
    setProcessingId(reqId);
    await approveWorkerVerification(workerId);
    setItems((prev) => prev.filter((i) => i.id !== reqId));
    setProcessingId(null);
  };

  const handleReject = async (workerId: string, reqId: string) => {
    setProcessingId(reqId);
    await rejectWorkerVerification(workerId, "Verification rejected by admin");
    setItems((prev) => prev.filter((i) => i.id !== reqId));
    setProcessingId(null);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-orange/10 text-orange">
            <Clock className="size-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy">
              Pending Worker Verifications
            </h3>
            <p className="text-[10px] text-slate-500">
              Review identity documents to verify workers
            </p>
          </div>
        </div>
        <Link
          href="/admin/verifications"
          className="flex items-center gap-1 text-[10px] font-bold text-teal transition hover:underline"
        >
          <span>View All ({items.length})</span>
          <ChevronRight className="size-3" />
        </Link>
      </div>

      <div className="mt-1.5 divide-y divide-slate-100">
        {items.length === 0 ? (
          <p className="py-3 text-center text-xs text-slate-500 font-medium">
            No pending verifications
          </p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-1.5 py-1.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-navy text-[10px] font-bold text-white shadow-2xs">
                  {item.workerName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-navy">{item.workerName}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-[9px] text-slate-500">
                    <span className="font-semibold text-slate-700">
                      {item.skills.join(", ")}
                    </span>
                    <span>•</span>
                    <span>{item.serviceCity}</span>
                    <span>•</span>
                    <span>{item.experienceYears} yrs exp</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/verifications/${item.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[9px] font-semibold text-navy transition hover:bg-slate-100"
                >
                  <ShieldCheck className="size-2.5 text-teal" />
                  <span>Review CNIC</span>
                </Link>
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleApprove(item.workerId, item.id)}
                  className="flex size-6 items-center justify-center rounded-md bg-green-50 text-green-700 transition hover:bg-green-100 disabled:opacity-50"
                  title="Quick Approve"
                >
                  <CheckCircle2 className="size-3" />
                </button>
                <button
                  type="button"
                  disabled={processingId === item.id}
                  onClick={() => handleReject(item.workerId, item.id)}
                  className="flex size-6 items-center justify-center rounded-md bg-red-50 text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  title="Quick Reject"
                >
                  <XCircle className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
