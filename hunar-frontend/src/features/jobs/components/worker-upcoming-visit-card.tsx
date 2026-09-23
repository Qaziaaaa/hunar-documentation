"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import { WorkerJobDetailsModal } from "./worker-job-details-modal";
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  Eye,
} from "lucide-react";

interface WorkerUpcomingVisitCardProps {
  job: JobRequest;
  offer?: VisitOffer;
  onStartVisit?: (jobId: string) => void;
}

export function WorkerUpcomingVisitCard({
  job,
  offer,
  onStartVisit,
}: WorkerUpcomingVisitCardProps) {
  const router = useRouter();

  const [isStarting, setIsStarting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const agreedVisitCharge =
    offer?.agreedVisitCharge ??
    offer?.visitCharge ??
    job.visitCharge ??
    job.customerSuggestedPrice ??
    600;

  const handleStartDispatch = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsStarting(true);
    workerStore.startVisit(job.id);
    if (onStartVisit) {
      onStartVisit(job.id);
    }
    router.push(`/worker/jobs/${job.id}`);
  };

  const isToday =
    job.preferredVisitWindow.date.toLowerCase().includes("today");

  return (
    <>
      <div
        onClick={() => setShowDetails(true)}
        className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 p-3.5 sm:p-5 shadow-[0_6px_16px_-4px_rgba(18,59,93,0.12)] hover:shadow-[0_10px_22px_-4px_rgba(18,59,93,0.18)] transition-all space-y-3.5 flex flex-col justify-between w-full cursor-pointer group"
      >
        <div className="space-y-3">
          {/* Top Badges Row */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-extrabold ${
                  isToday
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <Calendar className="size-3" />
                <span>{job.preferredVisitWindow.date}</span>
              </span>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-700">
                <Clock className="size-3" />
                <span className="truncate max-w-[130px] sm:max-w-none">{job.preferredVisitWindow.timeSlot}</span>
              </span>
            </div>

            <span className="text-[11px] font-bold text-slate-400 shrink-0">
              #{job.id}
            </span>
          </div>

          {/* Job Title */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] font-bold text-[10px] uppercase tracking-wider border border-[#0F8B8D]/20">
                {job.category}
              </span>
              {job.urgency === "emergency" && (
                <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-[10px] uppercase tracking-wider border border-rose-100">
                  Priority
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight group-hover:text-[#0F8B8D] transition-colors line-clamp-2">
              {job.title}
            </h3>
          </div>

          {/* Customer Mini Bar */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="size-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs overflow-hidden border border-slate-200 shrink-0">
                {job.customer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.customer.avatarUrl}
                    alt={job.customer.name}
                    className="size-full object-cover"
                  />
                ) : (
                  job.customer.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 truncate block">
                  {job.customer.name}
                </span>
                <span className="text-[10.5px] text-slate-500 truncate block">
                  ⭐ {job.customer.rating} ({job.customer.totalReviews} reviews)
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[9px] uppercase font-bold text-slate-400 block">
                Agreed Fee
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#123B5D]">
                {formatRs(agreedVisitCharge)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={handleStartDispatch}
            disabled={isStarting}
            className="w-full sm:w-auto py-2 sm:py-2.5 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#123B5D] text-white text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Navigation className="size-3.5 shrink-0" />
            <span className="truncate">Start Visit &amp; En Route</span>
          </button>
        </div>
      </div>

      {/* Pop-up Details Modal */}
      {showDetails && (
        <WorkerJobDetailsModal
          job={job}
          offer={offer}
          isOpen={showDetails}
          onClose={() => setShowDetails(false)}
          onStartVisit={onStartVisit}
        />
      )}
    </>
  );
}
