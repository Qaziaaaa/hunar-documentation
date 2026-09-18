"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";

interface RadarSearchViewProps {
  city?: string;
  workerName?: string;
  onViewFeed?: () => void;
}

const NEARBY_SIGNALS = [
  { id: 1, top: "28%", left: "68%" },
  { id: 2, top: "72%", left: "34%" },
  { id: 3, top: "35%", left: "26%" },
  { id: 4, top: "65%", left: "75%" },
];

export function RadarSearchView({
  city = "Peshawar",
  onViewFeed,
}: RadarSearchViewProps) {
  const [activeSignalIndex, setActiveSignalIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSignalIndex((prev) => (prev + 1) % NEARBY_SIGNALS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-140px)] w-full bg-white px-4 py-8 text-center select-none animate-in fade-in duration-300"
      data-purpose="radar-searching-screen"
    >
      {/* STATUS BADGE */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 shadow-2xs">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-teal opacity-75" />
          <span className="relative inline-flex size-2.5 rounded-full bg-teal" />
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
          Live Radar Active · 5 km Radius
        </span>
      </div>

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

        {/* Floating Nearby Blip Signals */}
        {NEARBY_SIGNALS.map((signal, idx) => {
          const isActive = idx === activeSignalIndex;
          return (
            <div
              key={signal.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-transform duration-500"
              style={{ top: signal.top, left: signal.left }}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`absolute size-4 rounded-full transition-all duration-300 ${
                    isActive ? "bg-teal/40 animate-ping" : "bg-teal/20"
                  }`}
                />
                <span
                  className={`size-2.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? "bg-teal ring-2 ring-white scale-125 shadow-sm shadow-teal"
                      : "bg-slate-300 opacity-60"
                  }`}
                />
              </div>
            </div>
          );
        })}

        {/* Center Radar Beacon / Navigation Node (Replaces broken image) */}
        <div className="relative z-20 flex size-12 sm:size-14 items-center justify-center rounded-full bg-teal text-white shadow-lg shadow-teal/30 ring-4 ring-teal/20">
          <Navigation className="size-5 sm:size-6 fill-white -rotate-45" />
          <span className="absolute -inset-1 rounded-full border border-teal/40 animate-ping opacity-75" />
        </div>
      </div>

      {/* TEXT HEADING */}
      <div className="mt-8 max-w-md space-y-2">
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-navy">
          Searching for new jobs around you...
        </h2>
      </div>
    </div>
  );
}
