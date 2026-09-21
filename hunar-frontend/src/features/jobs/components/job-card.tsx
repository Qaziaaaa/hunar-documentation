"use client";

import React from "react";
import { Link } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import {
  MapPin,
  Clock,
  Calendar,
  Image as ImageIcon,
  Mic,
  ArrowRight,
  ShieldCheck,
  Flame,
  Wrench,
  Zap,
  Droplet,
  Wind,
  Hammer,
  Paintbrush,
  Cog,
  CheckCircle2,
} from "lucide-react";

interface JobCardProps {
  job: JobRequest;
  workerOffer?: VisitOffer;
}

export function JobCard({ job, workerOffer }: JobCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Plumber":
        return <Droplet className="w-4 h-4 text-[#0F8B8D]" />;
      case "Electrician":
        return <Zap className="w-4 h-4 text-[#F59E0B]" />;
      case "AC Technician":
        return <Wind className="w-4 h-4 text-[#123B5D]" />;
      case "Carpenter":
        return <Hammer className="w-4 h-4 text-[#B45309]" />;
      case "Painter":
        return <Paintbrush className="w-4 h-4 text-[#7C3AED]" />;
      case "Mechanic":
        return <Cog className="w-4 h-4 text-[#D97706]" />;
      default:
        return <Wrench className="w-4 h-4 text-[#0F8B8D]" />;
    }
  };

  const hasPhotos = job.photos && job.photos.length > 0;
  const hasVoice = !!job.voiceNote;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 hover:border-[#0F8B8D]/40 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between relative overflow-hidden">
      {/* Top Accent Strip for Emergency Jobs */}
      {job.urgency === "emergency" && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-amber-500" />
      )}

      {/* Main Content Area */}
      <div className="space-y-3">
        {/* Row 1: Category, Urgency, & Posted Time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold text-xs">
              {getCategoryIcon(job.category)}
              <span>{job.category}</span>
            </span>

            {job.urgency === "emergency" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 font-bold text-[11px] tracking-wide">
                <Flame className="w-3 h-3 text-red-600 animate-pulse" />
                Emergency
              </span>
            )}

            {/* Offer Lifecycle Status Badge (If worker already placed offer) */}
            {workerOffer && (
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  workerOffer.status === "accepted"
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : workerOffer.status === "counter_received"
                    ? "bg-amber-50 border border-amber-300 text-amber-800 animate-bounce"
                    : "bg-teal-50 border border-teal-200 text-[#0F8B8D]"
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                {workerOffer.status === "accepted"
                  ? "Offer Accepted"
                  : workerOffer.status === "counter_received"
                  ? "Counter Received"
                  : "Offer Sent"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-400 text-xs shrink-0">
            <Clock className="w-3 h-3" />
            <span>{job.postedAgo}</span>
          </div>
        </div>

        {/* Row 2: Title & Problem Summary */}
        <div>
          <h3 className="font-bold text-slate-900 text-base group-hover:text-[#0F8B8D] transition-colors leading-snug">
            {job.title}
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
            {job.problemSummary}
          </p>
        </div>

        {/* Row 3: Location & Preferred Visit Window */}
        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 text-xs text-slate-600 pt-1">
          <div className="flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#0F8B8D] shrink-0" />
            <span>{job.location.area}</span>
            <span className="text-slate-400 font-normal">
              ({job.location.distanceKm} km away)
            </span>
          </div>

          {job.preferredVisitWindow && (
            <div className="flex items-center gap-1 text-slate-500">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {job.preferredVisitWindow.date} • {job.preferredVisitWindow.timeSlot}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Row 4: Footer Strip with Media Badges, Suggested Price, & CTA */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Media indicators (Photos / Voice Note) */}
        <div className="flex items-center gap-2">
          {hasPhotos && (
            <span
              title={`${job.photos.length} photos attached`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium"
            >
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>{job.photos.length}</span>
            </span>
          )}

          {hasVoice && (
            <span
              title={`Voice note attached (${job.voiceNote?.durationSeconds}s)`}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-teal-50 border border-teal-100 text-[#0F8B8D] text-xs font-semibold"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Voice Note ({job.voiceNote?.durationSeconds}s)</span>
            </span>
          )}
        </div>

        {/* Suggested Visit Charge & Action Button */}
        <div className="flex items-center gap-3">
          {job.customerSuggestedPrice && (
            <div className="text-right">
              <span className="block text-[10px] uppercase font-bold text-slate-400">
                Suggested Visit
              </span>
              <span className="font-extrabold text-[#123B5D] text-sm sm:text-base">
                {formatRs(job.customerSuggestedPrice)}
              </span>
            </div>
          )}

          <Link
            href={`/worker/jobs/${job.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white text-xs font-bold shadow-xs hover:shadow transition-all"
          >
            <span>{workerOffer ? (locale === "ur" ? "آفر دیکھیں" : "Manage Offer") : (locale === "ur" ? "آفر بھیجیں" : "Send Offer")}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
