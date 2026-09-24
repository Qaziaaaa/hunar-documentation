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
    <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_16px_-6px_rgba(18,59,93,0.14)] hover:shadow-[0_16px_22px_-6px_rgba(18,59,93,0.20)] hover:border-[#0F8B8D]/40 transition-all duration-200 p-5 flex flex-col justify-between relative overflow-hidden">
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

          <span className="text-xs text-slate-500 font-medium">
            {job.postedAt || "Recently posted"}
          </span>
        </div>

        {/* Row 2: Title */}
        <div>
          <h3 className="font-extrabold text-[#123B5D] text-base group-hover:text-[#0F8B8D] transition-colors line-clamp-1">
            {job.title}
          </h3>
          <p className="text-slate-600 text-xs line-clamp-2 mt-1 leading-relaxed">
            {job.description}
          </p>
        </div>

        {/* Row 3: Customer Suggested Price & Meta Indicators */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="flex items-center gap-1 font-semibold text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span>{job.location.area}</span>
              <span className="text-slate-500 font-normal">({job.location.distanceKm} km)</span>
            </span>

            {/* Media indicators */}
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              {hasPhotos && (
                <span className="flex items-center text-slate-500 font-medium" title="Photos attached">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                </span>
              )}
              {hasVoice && (
                <span className="flex items-center text-amber-600 font-medium" title="Voice note attached">
                  <Mic className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          </div>

          {/* Pricing Info */}
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">
              Suggested Visit
            </span>
            <span className="font-extrabold text-[#123B5D] text-sm">
              {formatRs(job.customerSuggestedPrice || 300)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom CTA Bar */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0F8B8D]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>10% Commission Escrow</span>
        </span>

        <Link
          href={`/worker/jobs/${job.id}`}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white font-bold text-xs transition-all shadow-xs group-hover:shadow-md"
        >
          <span>View Job Details</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
