"use client";

import { PieChart } from "lucide-react";

export function JobStatusDonutChart() {
  const data = [
    { label: "Completed", value: 1190, color: "#16A34A", percentage: "83.3%" },
    { label: "Active / In Progress", value: 142, color: "#0F8B8D", percentage: "9.9%" },
    { label: "Open / Receiving Offers", value: 38, color: "#123B5D", percentage: "2.7%" },
    { label: "Cancelled", value: 58, color: "#94A3B8", percentage: "4.1%" },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
        <div className="flex size-9 items-center justify-center rounded-xl bg-navy/10 text-navy">
          <PieChart className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-navy">
            Job Status Distribution
          </h3>
          <p className="text-xs text-slate-500">
            Marketplace job breakdown by current lifecycle stage
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-around">
        {/* SVG Donut Graphic */}
        <div className="relative flex size-36 items-center justify-center">
          <svg className="size-full -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#E2E8F0"
              strokeWidth="4"
            />
            {/* Completed Slice */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#16A34A"
              strokeWidth="4"
              strokeDasharray="83.3 100"
              strokeDashoffset="0"
            />
            {/* Active Slice */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#0F8B8D"
              strokeWidth="4"
              strokeDasharray="9.9 100"
              strokeDashoffset="-83.3"
            />
            {/* Open Slice */}
            <circle
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke="#123B5D"
              strokeWidth="4"
              strokeDasharray="2.7 100"
              strokeDashoffset="-93.2"
            />
          </svg>

          <div className="absolute flex flex-col items-center text-center">
            <span className="text-xl font-black text-navy">1,428</span>
            <span className="text-[10px] font-bold text-slate-400">Total Jobs</span>
          </div>
        </div>

        {/* Legend Stats */}
        <div className="space-y-3 text-xs w-full max-w-[220px]">
          {data.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="size-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-slate-700">{item.label}</span>
              </div>
              <span className="font-extrabold text-navy">{item.value} ({item.percentage})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
