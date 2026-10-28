"use client";

import { Navigation } from "lucide-react";
import { useLocale } from "next-intl";

interface RadarSearchViewProps {
  city?: string;
  workerName?: string;
  onViewFeed?: () => void;
  geoStatus?: "requesting" | "granted" | "denied" | "unavailable" | "idle";
  geoCoords?: { lat: number; lng: number } | null;
  onRequestGps?: () => void;
}

const RADAR_DOTS = [
  // Dot 1: On 3rd ring (75% diameter / 37.5% radius) at top-right
  { id: 1, top: "23.5%", left: "76.5%", delay: "0s", size: "size-2.5" },
  // Dot 2: On 2nd ring (50% diameter / 25% radius) at bottom-left
  { id: 2, top: "62.5%", left: "28.35%", delay: "1.0s", size: "size-2.5" },
  // Dot 3: On 3rd ring (75% diameter / 37.5% radius) at bottom
  { id: 3, top: "86.2%", left: "40.3%", delay: "1.8s", size: "size-2.5" },
  // Dot 4: On 2nd ring (50% diameter / 25% radius) at middle-right
  { id: 4, top: "60.6%", left: "72.7%", delay: "2.6s", size: "size-2.5" },
];

export function RadarSearchView({
  city = "Peshawar",
  onViewFeed,
  geoStatus = "idle",
  geoCoords,
  onRequestGps,
}: RadarSearchViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full bg-white px-4 py-8 text-center select-none animate-in fade-in duration-300"
      data-purpose="radar-searching-screen"
    >
      {/* RADAR CONTAINER */}
      <div className="relative flex size-72 sm:size-96 items-center justify-center">
        {/* Concentric Radar Rings */}
        <div className="absolute size-full rounded-full border border-slate-200/80 bg-slate-50/20 shadow-inner" />
        <div className="absolute size-3/4 rounded-full border border-slate-200/90" />
        <div className="absolute size-1/2 rounded-full border border-teal/20 bg-teal/[0.02]" />
        <div className="absolute size-1/4 rounded-full border border-teal/30" />

        {/* Radar Crosshairs */}
        <div className="absolute h-full w-[1px] bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
        <div className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Rotating Radar Sweep Beam */}
        <div
          className="absolute inset-0 rounded-full animate-spin [animation-duration:4s] pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(15, 139, 141, 0.25) 0deg, rgba(15, 139, 141, 0.08) 45deg, transparent 65deg, transparent 360deg)",
          }}
        />

        {/* Round Circle Dots (Radar Signals) */}
        {RADAR_DOTS.map((dot) => (
          <div
            key={dot.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ top: dot.top, left: dot.left }}
          >
            <div className="relative flex items-center justify-center">
              <span
                className="absolute size-4 rounded-full bg-teal/35 animate-ping"
                style={{ animationDelay: dot.delay, animationDuration: "2.8s" }}
              />
              <span
                className={`relative ${dot.size} rounded-full bg-teal ring-2 ring-white shadow-sm shadow-teal/50`}
              />
            </div>
          </div>
        ))}

        {/* Center Radar Beacon / Navigation Node */}
        <div className="relative z-20 flex size-12 sm:size-14 items-center justify-center rounded-full bg-teal text-white shadow-lg shadow-teal/30 ring-4 ring-teal/20">
          <Navigation className="size-5 sm:size-6 fill-white -rotate-45" />
          <span className="absolute -inset-1 rounded-full border border-teal/40 animate-ping opacity-75" />
        </div>
      </div>

      {/* TEXT HEADING ONLY */}
      <div className="mt-8 max-w-md">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-navy">
          {isUrdu ? "نئی جابز کی تلاش جاری ہے..." : "Searching for new jobs..."}
        </h2>
      </div>
    </div>
  );
}

