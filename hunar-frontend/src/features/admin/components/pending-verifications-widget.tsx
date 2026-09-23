"use client";

import { CheckCircle2, ChevronRight, Clock, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { VerificationRequest } from "@/types/admin";

export function PendingVerificationsWidget({
  requests,
}: {
  requests: VerificationRequest[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-orange/10 text-orange">
            <Clock className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-navy">
              Pending Worker Verifications
            </h3>
            <p className="text-xs text-slate-500">
              Review identity documents to verify workers
            </p>
          </div>
        </div>
        <Link
          href="/admin/verifications"
          className="flex items-center gap-1 text-xs font-bold text-teal transition hover:underline"
        >
          <span>View All ({requests.length})</span>
          <ChevronRight className="size-4" />
        </Link>
      </div>

      <div className="mt-4 divide-y divide-slate-100">
        {requests.map((item) => (
          <div
            key={item.id}
            className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-navy text-sm font-bold text-white shadow-sm">
                {item.workerName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-extrabold text-navy">{item.workerName}</p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
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

            <div className="flex items-center gap-2">
              <Link
                href={`/admin/verifications/${item.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-navy transition hover:bg-slate-100"
              >
                <ShieldCheck className="size-3.5 text-teal" />
                <span>Review CNIC</span>
              </Link>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-xl bg-green-50 text-green-700 transition hover:bg-green-100"
                title="Quick Approve"
              >
                <CheckCircle2 className="size-4" />
              </button>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-xl bg-red-50 text-red-600 transition hover:bg-red-100"
                title="Quick Reject"
              >
                <XCircle className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
