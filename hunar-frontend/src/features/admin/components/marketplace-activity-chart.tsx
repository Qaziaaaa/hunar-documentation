"use client";

import { Activity, TrendingUp } from "lucide-react";

export function MarketplaceActivityChart() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const jobsPosted = [45, 52, 60, 48, 75, 90, 82];
  const jobsCompleted = [38, 48, 55, 42, 68, 85, 78];
  const disputes = [1, 2, 1, 3, 2, 4, 1];

  const maxVal = 100;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-teal/10 text-teal">
            <Activity className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-navy">
              Marketplace Activity Chart
            </h3>
            <p className="text-xs text-slate-500">
              Weekly jobs posted vs completed vs disputes
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-navy">
            <span className="size-3 rounded-full bg-navy" />
            <span>Jobs Posted</span>
          </div>
          <div className="flex items-center gap-1.5 text-teal">
            <span className="size-3 rounded-full bg-teal" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5 text-orange">
            <span className="size-3 rounded-full bg-orange" />
            <span>Disputes</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Bars */}
      <div className="mt-6 flex h-48 items-end justify-between gap-3 pt-4">
        {days.map((day, idx) => (
          <div key={day} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-end justify-center gap-1.5 h-full">
              {/* Posted Bar */}
              <div
                style={{ height: `${(jobsPosted[idx] / maxVal) * 100}%` }}
                className="w-3 rounded-t-md bg-navy transition-all duration-300 hover:opacity-80"
                title={`Posted: ${jobsPosted[idx]}`}
              />
              {/* Completed Bar */}
              <div
                style={{ height: `${(jobsCompleted[idx] / maxVal) * 100}%` }}
                className="w-3 rounded-t-md bg-teal transition-all duration-300 hover:opacity-80"
                title={`Completed: ${jobsCompleted[idx]}`}
              />
              {/* Disputes Bar */}
              <div
                style={{ height: `${(disputes[idx] / maxVal) * 100 * 5}%` }}
                className="w-3 rounded-t-md bg-orange transition-all duration-300 hover:opacity-80"
                title={`Disputes: ${disputes[idx]}`}
              />
            </div>
            <span className="text-[11px] font-extrabold text-slate-500">
              {day}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
        <span className="flex items-center gap-1 text-green-600 font-bold">
          <TrendingUp className="size-4" /> +14.2% activity growth this week
        </span>
        <span>Avg completion rate: 92.4%</span>
      </div>
    </div>
  );
}
