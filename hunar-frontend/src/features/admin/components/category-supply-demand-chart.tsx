"use client";

import { BarChart3, Zap, Flame, Droplet, Hammer, Paintbrush, TrendingUp } from "lucide-react";

export function CategorySupplyDemandChart() {
  const categories = [
    {
      shortName: "Electrical",
      fullName: "Electrical Work",
      icon: Zap,
      demandJobs: 680,
      activeWorkers: 215,
      ratio: "3.1x",
      statusLabel: "Optimal",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      shortName: "HVAC / AC",
      fullName: "HVAC & AC Repair",
      icon: Flame,
      demandJobs: 520,
      activeWorkers: 142,
      ratio: "3.6x",
      statusLabel: "Shortage",
      badgeBg: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      shortName: "Plumbing",
      fullName: "Plumbing Services",
      icon: Droplet,
      demandJobs: 490,
      activeWorkers: 180,
      ratio: "2.7x",
      statusLabel: "Optimal",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      shortName: "Carpentry",
      fullName: "Carpentry & Woodwork",
      icon: Hammer,
      demandJobs: 240,
      activeWorkers: 95,
      ratio: "2.5x",
      statusLabel: "Balanced",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      shortName: "Painting",
      fullName: "Painting & Wallpaper",
      icon: Paintbrush,
      demandJobs: 185,
      activeWorkers: 88,
      ratio: "2.1x",
      statusLabel: "Capacity",
      badgeBg: "bg-sky-50 text-sky-700 border-sky-200",
    },
  ];

  const maxVal = 700;

  return (
    <div className="flex flex-col justify-between h-full rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
      {/* Header */}
      <div>
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal shadow-xs">
              <BarChart3 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-navy">Category Supply vs Demand Analytics</h3>
              <p className="text-[11px] text-slate-500">
                Trade capacity comparison (Customer Jobs vs Verified Workers)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[10px] font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <div className="flex items-center gap-1 text-navy">
              <span className="size-2.5 rounded-sm bg-navy" />
              <span>Customer Demand</span>
            </div>
            <div className="flex items-center gap-1 text-teal">
              <span className="size-2.5 rounded-sm bg-teal" />
              <span>Worker Supply</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Container with Y-Axis lines */}
      <div className="relative my-2 pt-4 pb-1">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-0 top-4 bottom-6 flex flex-col justify-between pointer-events-none opacity-40">
          <div className="border-b border-dashed border-slate-200 w-full flex justify-between text-[8px] text-slate-400 font-mono">
            <span>700</span>
          </div>
          <div className="border-b border-dashed border-slate-200 w-full flex justify-between text-[8px] text-slate-400 font-mono">
            <span>500</span>
          </div>
          <div className="border-b border-dashed border-slate-200 w-full flex justify-between text-[8px] text-slate-400 font-mono">
            <span>250</span>
          </div>
          <div className="border-b border-slate-200 w-full flex justify-between text-[8px] text-slate-400 font-mono">
            <span>0</span>
          </div>
        </div>

        {/* Columns */}
        <div className="relative flex h-36 items-end justify-between gap-2 px-1 z-10">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const demandHeight = (cat.demandJobs / maxVal) * 100;
            const supplyHeight = (cat.activeWorkers / maxVal) * 100;

            return (
              <div key={cat.fullName} className="flex flex-1 flex-col items-center h-full justify-end group">
                {/* Status Badge */}
                <span className={`mb-1.5 rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide ${cat.badgeBg}`}>
                  {cat.statusLabel}
                </span>

                {/* Vertical Bars */}
                <div className="flex w-full items-end justify-center gap-1 h-full">
                  {/* Demand Column Bar */}
                  <div className="flex flex-col items-center w-4 sm:w-5 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ height: `${demandHeight}%` }}>
                    <span className="text-[8px] font-black text-navy mb-0.5">{cat.demandJobs}</span>
                    <div className="w-full h-full rounded-t-md bg-gradient-to-t from-navy to-slate-800 shadow-xs" />
                  </div>

                  {/* Supply Column Bar */}
                  <div className="flex flex-col items-center w-4 sm:w-5 transition-transform duration-300 group-hover:-translate-y-0.5" style={{ height: `${supplyHeight}%` }}>
                    <span className="text-[8px] font-black text-teal mb-0.5">{cat.activeWorkers}</span>
                    <div className="w-full h-full rounded-t-md bg-gradient-to-t from-teal to-emerald-400 shadow-xs" />
                  </div>
                </div>

                {/* Label */}
                <div className="mt-2 flex items-center gap-1 text-[10px] font-extrabold text-navy">
                  <Icon className="size-2.5 text-slate-500" />
                  <span>{cat.shortName}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Summary */}
      <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-2 text-[10px] font-semibold text-slate-500">
        <span className="flex items-center gap-1 text-slate-600 font-bold">
          <TrendingUp className="size-3 text-teal" /> Avg Ratio: <strong className="text-navy">2.8x Jobs / Worker</strong>
        </span>
        <span>Peak Shortage: <strong className="text-rose-600 font-black">HVAC & AC Repair</strong></span>
      </div>
    </div>
  );
}
