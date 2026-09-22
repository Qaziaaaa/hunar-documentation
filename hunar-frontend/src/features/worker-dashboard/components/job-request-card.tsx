"use client";

import Image from "next/image";
import { MapPin, Star, Zap, Wrench, AirVent, SunMedium, Hammer, Paintbrush, Flame, Sparkles } from "lucide-react";
import type { JobRequest } from "../types";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Electrician: Zap,
  Plumber: Wrench,
  "AC Technician": AirVent,
  "Solar Technician": SunMedium,
  Carpenter: Hammer,
  Painter: Paintbrush,
  Welder: Flame,
};

export function JobRequestCard({
  job,
  onClick,
}: {
  job: JobRequest;
  onClick: (job: JobRequest) => void;
}) {
  const Icon = CATEGORY_ICONS[job.category] || Wrench;
  const isUrgent = job.status === "URGENT";

  return (
    <article
      onClick={() => onClick(job)}
      className="group relative flex w-full cursor-pointer gap-2.5 sm:gap-3.5 bg-white p-3 sm:p-4 border-b-2 border-slate-300 last:border-b-0 transition-all duration-200 hover:bg-slate-50/80 active:scale-[0.995]"
      data-purpose="job-request-card"
    >
      {/* LEFT SIDE — Customer Profile */}
      <div className="flex w-15 sm:w-16 shrink-0 flex-col items-center border-r border-slate-100/80 pr-2 sm:pr-2.5 text-center">
        {/* Customer Profile Image */}
        <div className="relative mb-1 size-10 sm:size-11 overflow-hidden rounded-full border border-slate-200 bg-slate-100 group-hover:border-teal transition-colors">
          <Image
            src={job.customer.avatarUrl}
            alt={job.customer.firstName}
            fill
            className="object-cover"
            sizes="44px"
          />
        </div>

        {/* First Name Only */}
        <p className="w-full truncate text-xs sm:text-[13px] font-extrabold text-navy leading-tight">
          {job.customer.firstName}
        </p>

        {/* Star Rating */}
        <div className="mt-0.5 flex items-center justify-center gap-0.5 text-[11px] font-extrabold text-[#F59E0B]">
          <Star className="size-3 fill-[#F59E0B] stroke-none" />
          <span>{job.customer.rating.toFixed(1)}</span>
        </div>

        {/* Total Orders Number Only */}
        <p className="mt-0.5 text-[10px] font-semibold text-slate-500" title={`${job.customer.totalOrders} total completed orders`}>
          {job.customer.totalOrders}
        </p>

        {/* Uploaded Time */}
        <span className="mt-0.5 block text-[9.5px] font-medium text-slate-400">
          {job.uploadedTime}
        </span>
      </div>

      {/* RIGHT SIDE — Job Request Information */}
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          {/* Top Row: Distance, 1-Line Location, Category & Status Badges */}
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal/10 px-2 py-0.5 text-xs font-extrabold text-teal">
                <MapPin className="size-3.5" />
                {job.distance}
              </span>
              <span className="truncate text-sm sm:text-[15px] font-extrabold text-navy tracking-tight">
                {job.locationArea}
              </span>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {isUrgent && (
                <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  <Sparkles className="size-2.5" /> Urgent
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-0.5 text-[10.5px] font-bold text-navy">
                <Icon className="size-3 text-teal" />
                {job.category}
              </span>
            </div>
          </div>

          {/* Job Description (Max 2 lines, truncated) */}
          <p className="line-clamp-2 text-xs sm:text-[13px] font-normal leading-relaxed text-slate-800">
            {job.description}
          </p>
        </div>

        {/* Bottom Row: Media Row (2 Image Thumbnails + Voice Message Player) */}
        <div className="mt-2 flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-100/80">
          {/* 2 Small Image Thumbnails */}
          {job.images && job.images.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              {job.images.slice(0, 2).map((imgUrl, idx) => (
                <div
                  key={idx}
                  className="relative size-10 sm:size-11 overflow-hidden rounded-lg border border-slate-100 bg-slate-100 hover:opacity-90 transition-opacity"
                >
                  <Image
                    src={imgUrl}
                    alt={`Job preview ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
