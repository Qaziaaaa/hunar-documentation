"use client";

import { useEffect, useState } from "react";
import { Navigation, MapPin, AlertCircle, RefreshCw } from "lucide-react";

interface RadarSearchViewProps {
  city?: string;
  workerName?: string;
  onViewFeed?: () => void;
  geoStatus?: "requesting" | "granted" | "denied" | "unavailable" | "idle";
  geoCoords?: { lat: number; lng: number } | null;
  onRequestGps?: () => void;
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
  geoStatus = "idle",
  geoCoords,
  onRequestGps,
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
      <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 shadow-2xs">
        <span className="relative flex size-2.5">
          <span
            className={`absolute inline-flex size-full animate-ping rounded-full opacity-75 ${
              geoStatus === "denied" || geoStatus === "unavailable"
                ? "bg-amber-500"
                : geoStatus === "requesting"
                ? "bg-sky-500"
                : "bg-teal"
            }`}
          />
          <span
            className={`relative inline-flex size-2.5 rounded-full ${
              geoStatus === "denied" || geoStatus === "unavailable"
                ? "bg-amber-500"
                : geoStatus === "requesting"
                ? "bg-sky-500"
                : "bg-teal"
            }`}
          />
        </span>
        <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
          {geoStatus === "granted" && geoCoords
            ? `Live GPS Active · ${geoCoords.lat.toFixed(2)}, ${geoCoords.lng.toFixed(2)} · 25 km`
            : geoStatus === "requesting"
            ? "Detecting GPS Location..."
            : geoStatus === "denied" || geoStatus === "unavailable"
            ? `Default Area (${city}) · GPS Disabled`
            : `Live Radar Active · ${city}`}
        </span>
      </div>

      {/* GPS PERMISSION WARNING / RETRY NOTICE */}
      {(geoStatus === "denied" || geoStatus === "unavailable") && (
        <div className="mb-6 inline-flex max-w-md items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2 text-xs text-amber-900 shadow-xs">
          <AlertCircle className="size-4 shrink-0 text-amber-600" />
          <span className="text-left flex-1">
            {geoStatus === "denied"
              ? `Location permission denied. Showing nearby requests in ${city}.`
              : `Unable to detect GPS position. Showing nearby requests in ${city}.`}
          </span>
          {onRequestGps && (
            <button
              type="button"
              onClick={onRequestGps}
              className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-200/70 px-2 py-1 font-bold text-amber-900 transition-colors hover:bg-amber-300/80 cursor-pointer text-[11px]"
            >
              <RefreshCw className="size-3" />
              Enable GPS
            </button>
          )}
        </div>
      )}

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
