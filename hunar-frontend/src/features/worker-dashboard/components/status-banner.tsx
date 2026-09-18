"use client";

import { useState } from "react";
import {
  Radio,
  Power,
  Info,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";

export function StatusBanner({
  isOnline,
  onToggleOnline,
  city = "Peshawar",
  serviceAreas = ["Hayatabad", "University Town", "Saddar"],
}: {
  isOnline: boolean;
  onToggleOnline: () => void;
  city?: string;
  serviceAreas?: string[];
}) {
  const [showRuleInfo, setShowRuleInfo] = useState(false);

  return (
    <div className="hidden w-full md:block">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border transition-all duration-300 p-4 sm:p-5",
          isOnline
            ? "border-teal/30 bg-gradient-to-r from-teal/10 via-white to-teal/5 shadow-xs"
            : "border-slate-200 bg-white shadow-xs"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left: Online Status Visual & Message */}
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={cn(
                "relative flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors shadow-xs",
                isOnline ? "bg-teal text-white" : "bg-slate-300 text-slate-600"
              )}
            >
              {isOnline ? (
                <Radio className="size-6 animate-pulse" />
              ) : (
                <Power className="size-5" />
              )}
              {isOnline && (
                <span className="absolute -top-1 -right-1 flex size-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                  <span className="relative inline-flex rounded-full size-3 bg-[#16A34A]" />
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-navy">
                  {isOnline ? "Status: Online & Ready for Jobs" : "Status: Currently Offline"}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold",
                    isOnline
                      ? "bg-teal/20 text-teal"
                      : "bg-slate-200 text-slate-700"
                  )}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      isOnline ? "bg-teal animate-pulse" : "bg-slate-500"
                    )}
                  />
                  {isOnline ? "LIVE ON RADAR" : "OFF RADAR"}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                {isOnline ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 text-teal shrink-0" />
                    Receiving customer job requests across {city} ({serviceAreas.slice(0, 3).join(", ")}).
                  </span>
                ) : (
                  "You are hidden from customer searches. Switch Online to receive new jobs."
                )}
              </p>
            </div>
          </div>

          {/* Right: Interactive Switch Button + Policy Trigger */}
          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              type="button"
              onClick={() => setShowRuleInfo(!showRuleInfo)}
              className="flex size-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
              title="View status rules"
            >
              <Info className="size-4" />
            </button>

            {/* Toggle Button */}
            <button
              type="button"
              role="switch"
              aria-checked={isOnline}
              onClick={onToggleOnline}
              className={cn(
                "group relative inline-flex h-10 w-24 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal/30 focus:ring-offset-2",
                isOnline ? "bg-teal" : "bg-slate-300"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-flex size-8 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                  isOnline
                    ? "translate-x-14 rtl:-translate-x-14 text-teal"
                    : "translate-x-1 rtl:-translate-x-1 text-slate-400"
                )}
              >
                <Power className="size-4" />
              </span>
              <span
                className={cn(
                  "absolute text-[11px] font-bold uppercase transition-all select-none",
                  isOnline
                    ? "left-3 rtl:left-auto rtl:right-3 text-white"
                    : "right-3 rtl:right-auto rtl:left-3 text-slate-600"
                )}
              >
                {isOnline ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>

        {/* Rule Policy Collapsible Card */}
        {showRuleInfo && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/80 text-xs space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 font-bold text-navy">
              <Sparkles className="size-3.5 text-teal" />
              <span>Status Rules &amp; Wallet Policy:</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              • In current mode, your Online/Offline status is controlled manually by this switch.
              <br />
              • Once the Wallet API is integrated, you remain <strong>Online</strong> as long as your wallet balance is ≥ −500 Rs.
              <br />
              • When Online, nearby customer requests in Peshawar match your skills in real-time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
