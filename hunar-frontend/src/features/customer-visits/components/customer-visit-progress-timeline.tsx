"use client";

import React from "react";
import { Check, Clock, MapPin, ShieldCheck, Wrench, Calendar, Navigation } from "lucide-react";
import type { TimelineStepInfo } from "../types";

interface CustomerVisitProgressTimelineProps {
  steps: TimelineStepInfo[];
  isUrdu?: boolean;
}

const STEP_ICONS = [
  Calendar,    // 1. Scheduled
  Navigation,  // 2. En route
  MapPin,      // 3. Arrived
  Wrench,      // 4. Inspection
  ShieldCheck, // 5. Completed
];

export function CustomerVisitProgressTimeline({
  steps,
  isUrdu = false,
}: CustomerVisitProgressTimelineProps) {
  return (
    <div className="w-full py-2">
      {/* Desktop Horizontal Stepper */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          {/* Background Track Line */}
          <div className="absolute top-5 left-6 right-6 h-1 bg-slate-200 -z-0" />

          {steps.map((step, idx) => {
            const Icon = STEP_ICONS[idx] || Clock;
            const isCompleted = step.status === "completed";
            const isCurrent = step.status === "current";

            // Connecting progress line fill (for completed segments)
            const isNextCompletedOrCurrent =
              idx < steps.length - 1 &&
              (steps[idx + 1].status === "completed" || steps[idx + 1].status === "current");

            return (
              <div
                key={step.id}
                className="relative z-10 flex flex-col items-center flex-1 text-center px-1"
              >
                {/* Connecting Line Segment between nodes */}
                {idx < steps.length - 1 && (
                  <div
                    className={`absolute top-5 left-1/2 w-full h-1 -z-10 transition-colors duration-300 ${
                      isCompleted && isNextCompletedOrCurrent
                        ? "bg-[#16A34A]"
                        : "bg-slate-200"
                    }`}
                  />
                )}

                {/* Node Circle */}
                <div
                  className={`size-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 shadow-sm ${
                    isCompleted
                      ? "bg-[#16A34A] text-white ring-4 ring-[#16A34A]/20"
                      : isCurrent
                      ? "bg-[#0F766E] text-white ring-4 ring-[#0F766E]/25 shadow-md scale-110"
                      : "bg-white text-slate-400 border-2 border-slate-300"
                  }`}
                  aria-label={`${step.label} (${step.status})`}
                >
                  {isCompleted ? (
                    <Check className="size-5 stroke-[2.8]" />
                  ) : isCurrent ? (
                    <div className="relative flex items-center justify-center">
                      <span className="size-2 rounded-full bg-white animate-ping absolute" />
                      <Icon className="size-4.5 stroke-[2.4]" />
                    </div>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Step Labels & Info */}
                <div className="mt-3 space-y-0.5 max-w-[130px]">
                  <div className="flex items-center justify-center gap-1">
                    <p
                      className={`text-xs leading-tight transition-colors ${
                        isCurrent
                          ? "font-extrabold text-[#0F766E]"
                          : isCompleted
                          ? "font-bold text-[#123B5D]"
                          : "font-medium text-slate-400"
                      }`}
                    >
                      {isUrdu ? step.labelUr : step.label}
                    </p>
                  </div>

                  <p className="text-[10.5px] text-slate-500 leading-tight">
                    {isUrdu ? step.descriptionUr : step.description}
                  </p>

                  {/* Real timestamp if available */}
                  {step.timestamp && (
                    <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1 border border-slate-200">
                      {formatTimestamp(step.timestamp)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Vertical Stepper */}
      <div className="block md:hidden space-y-4">
        {steps.map((step, idx) => {
          const Icon = STEP_ICONS[idx] || Clock;
          const isCompleted = step.status === "completed";
          const isCurrent = step.status === "current";
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} className="relative flex items-start gap-3.5">
              {/* Connecting line for vertical layout */}
              {!isLast && (
                <div
                  className={`absolute top-9 left-4.5 -ml-px w-0.5 bottom-0 -mb-4 transition-colors ${
                    isCompleted ? "bg-[#16A34A]" : "bg-slate-200"
                  }`}
                />
              )}

              {/* Node Circle */}
              <div
                className={`relative z-10 size-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                  isCompleted
                    ? "bg-[#16A34A] text-white ring-3 ring-[#16A34A]/20"
                    : isCurrent
                    ? "bg-[#0F766E] text-white ring-3 ring-[#0F766E]/25 shadow-md scale-105"
                    : "bg-white text-slate-400 border-2 border-slate-300"
                }`}
              >
                {isCompleted ? (
                  <Check className="size-4.5 stroke-[2.8]" />
                ) : isCurrent ? (
                  <Icon className="size-4 stroke-[2.4]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs sm:text-sm leading-tight ${
                      isCurrent
                        ? "font-extrabold text-[#0F766E]"
                        : isCompleted
                        ? "font-bold text-[#123B5D]"
                        : "font-medium text-slate-400"
                    }`}
                  >
                    {isUrdu ? step.labelUr : step.label}
                  </h4>

                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20 shrink-0">
                      <span className="size-1.5 rounded-full bg-[#0F766E] animate-ping" />
                      <span>{isUrdu ? "فعال مرحلہ" : "Current"}</span>
                    </span>
                  )}
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#16A34A]/10 text-[#16A34A] shrink-0">
                      <span>{isUrdu ? "مکمل" : "Done"}</span>
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isUrdu ? step.descriptionUr : step.description}
                </p>

                {step.timestamp && (
                  <span className="inline-block text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md mt-1 border border-slate-200">
                    {formatTimestamp(step.timestamp)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatTimestamp(raw: string): string {
  try {
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return raw;
  }
}
