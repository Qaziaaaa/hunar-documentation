"use client";

import React, { useState } from "react";
import { JobFeedFilters } from "@/types/job";
import {
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  ChevronDown,
} from "lucide-react";

interface JobFiltersBarProps {
  filters: JobFeedFilters;
  onChange: (update: Partial<JobFeedFilters>) => void;
  onReset: () => void;
  totalLiveCount: number;
}

const CATEGORIES: { label: string; value: string }[] = [
  { label: "All", value: "all" },
  { label: "Plumber", value: "Plumber" },
  { label: "Electrician", value: "Electrician" },
  { label: "AC Tech", value: "AC Technician" },
  { label: "Carpenter", value: "Carpenter" },
  { label: "Painter", value: "Painter" },
  { label: "Mechanic", value: "Mechanic" },
];

const DISTANCES = [
  { label: "Within 2 km", value: 2 },
  { label: "Within 5 km", value: 5 },
  { label: "Within 10 km", value: 10 },
  { label: "Within 20 km", value: 20 },
];

export function JobFiltersBar({
  filters,
  onChange,
  onReset,
  totalLiveCount,
}: JobFiltersBarProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3">
      {/* Top Strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0F8B8D] animate-pulse" />
          <span className="font-bold text-slate-900 text-sm">Nearby Jobs</span>
          <span className="px-2 py-0.5 rounded-full bg-[#E2F3F4] text-[#0F8B8D] font-bold text-xs">
            {totalLiveCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              showAdvanced
                ? "bg-[#123B5D] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Filters</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform ${
                showAdvanced ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={onReset}
            title="Reset"
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = filters.category === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onChange({ category: cat.value })}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "bg-[#0F8B8D] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Advanced Filters Drawer */}
      {showAdvanced && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in duration-150 text-xs">
          {/* Distance */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Distance
            </label>
            <select
              value={filters.maxDistanceKm}
              onChange={(e) =>
                onChange({ maxDistanceKm: Number(e.target.value) })
              }
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
            >
              {DISTANCES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Price Range (Rs.)
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice ?? ""}
                onChange={(e) =>
                  onChange({
                    minPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice ?? ""}
                onChange={(e) =>
                  onChange({
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
              />
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                onChange({
                  sortBy: e.target.value as JobFeedFilters["sortBy"],
                })
              }
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 focus:border-[#0F8B8D]"
            >
              <option value="fresh_first">Fresh First</option>
              <option value="distance_nearest">Nearest</option>
              <option value="price_highest">Highest Price</option>
            </select>
          </div>

          {/* Toggles */}
          <div>
            <label className="font-bold text-slate-600 block mb-1">
              Options
            </label>
            <div className="space-y-1 pt-0.5">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={filters.onlyWithoutOffers}
                  onChange={(e) =>
                    onChange({ onlyWithoutOffers: e.target.checked })
                  }
                  className="rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span>No offers yet</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={filters.hideFarJobs}
                  onChange={(e) => onChange({ hideFarJobs: e.target.checked })}
                  className="rounded border-slate-300 text-[#0F8B8D] focus:ring-[#0F8B8D]"
                />
                <span>Within 5 km</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
