"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  MapPin,
  Star,
  Zap,
  Wrench,
  AirVent,
  SunMedium,
  Hammer,
  Paintbrush,
  Flame,
  Sparkles,
  EyeOff,
} from "lucide-react";
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
  onHide,
}: {
  job: JobRequest;
  onClick: (job: JobRequest) => void;
  onHide?: (jobId: string) => void;
}) {
  const Icon = CATEGORY_ICONS[job.category] || Wrench;
  const isUrgent = job.status === "URGENT";

  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const isSwipingHorizontal = useRef(false);

  // Trigger dismissal animation and removal
  const triggerDismiss = () => {
    setIsDismissed(true);
    setOffsetX(window.innerWidth || 500);
    setTimeout(() => {
      if (onHide) {
        onHide(job.id);
      }
    }, 280);
  };

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
    isSwipingHorizontal.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX.current;
    const deltaY = e.touches[0].clientY - dragStartY.current;

    if (!isSwipingHorizontal.current) {
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
        isSwipingHorizontal.current = true;
      } else if (Math.abs(deltaY) > 8) {
        setIsDragging(false);
        return;
      }
    }

    if (isSwipingHorizontal.current) {
      // Only allow dragging to the right (positive deltaX)
      if (deltaX > 0) {
        setOffsetX(deltaX);
      } else {
        setOffsetX(0);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX > 90) {
      triggerDismiss();
    } else {
      if (offsetX < 6 && !isSwipingHorizontal.current) {
        onClick(job);
      }
      setOffsetX(0);
    }
  };

  // Mouse drag handlers (for testing swipe on desktop)
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartX.current = e.clientX;
    setIsDragging(true);
    isSwipingHorizontal.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    if (deltaX > 5) {
      isSwipingHorizontal.current = true;
      setOffsetX(deltaX);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offsetX > 90) {
      triggerDismiss();
    } else {
      if (offsetX < 6 && !isSwipingHorizontal.current) {
        onClick(job);
      }
      setOffsetX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (offsetX > 90) {
        triggerDismiss();
      } else {
        setOffsetX(0);
      }
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden transition-all duration-300 ${
        isDismissed ? "max-h-0 opacity-0 py-0 my-0 border-none" : "max-h-96"
      }`}
    >
      {/* Background Reveal Bar (Shown underneath when swiped right) */}
      <div className="absolute inset-0 bg-rose-50 border-y border-rose-200 flex items-center justify-start px-5 text-rose-600 font-extrabold text-xs select-none">
        <div
          className="flex items-center gap-2 transition-opacity duration-150"
          style={{ opacity: Math.min(1, offsetX / 60) }}
        >
          <div className="size-8 rounded-full bg-rose-100 flex items-center justify-center">
            <EyeOff className="size-4 text-rose-600" />
          </div>
          <span>{offsetX > 90 ? "Release to Hide Request" : "Slide right to hide"}</span>
        </div>
      </div>

      {/* Main Foreground Card */}
      <article
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        className="group relative flex w-full cursor-pointer select-none gap-2.5 sm:gap-3.5 bg-white p-3 sm:p-4 border-b-2 border-slate-300 last:border-b-0 transition-colors hover:bg-slate-50/80 active:scale-[0.995]"
        data-purpose="job-request-card"
      >
        {/* LEFT SIDE — Customer Profile */}
        <div className="flex w-15 sm:w-16 shrink-0 flex-col items-center border-r border-slate-100/80 pr-2 sm:pr-2.5 text-center pointer-events-none">
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
          <p className="w-full truncate text-xs sm:text-[13px] font-extrabold text-[#123B5D] leading-tight">
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
        <div className="flex min-w-0 flex-1 flex-col justify-between pointer-events-none">
          <div>
            {/* Top Row: Distance, 1-Line Location, Category & Status Badges */}
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5 pr-6">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0F8B8D]/10 px-2 py-0.5 text-xs font-extrabold text-[#0F8B8D]">
                  <MapPin className="size-3.5" />
                  {job.distance}
                </span>
                <span className="truncate text-sm sm:text-[15px] font-extrabold text-[#123B5D] tracking-tight">
                  {job.locationArea}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isUrgent && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 border border-rose-100">
                    <Sparkles className="size-2.5" /> Urgent
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100/80 px-2 py-0.5 text-[10.5px] font-bold text-[#123B5D]">
                  <Icon className="size-3 text-[#0F8B8D]" />
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
    </div>
  );
}

