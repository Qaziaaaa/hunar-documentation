"use client";

import React, { useMemo } from "react";
import { useWorkerJobs, workerStore } from "@/stores/worker-jobs-store";
import { JobCard } from "./job-card";
import { JobFiltersBar } from "./job-filters-bar";
import { Inbox, Compass, Sparkles } from "lucide-react";

export function NearbyJobsFeed() {
  const { jobs, offers, filters, workerOnline } = useWorkerJobs();

  // Combine All 5 Filters Synchronously
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Only show jobs open for bidding or in negotiation for this worker
        // (Active/completed jobs can be viewed in My Active Jobs tab)
        const isEligible =
          job.status === "open" ||
          job.status === "offer_sent" ||
          job.status === "customer_viewing" ||
          job.status === "counter_received";

        if (!isEligible) return false;

        // 1. Filter by Category / Skill
        if (filters.category !== "all" && job.category !== filters.category) {
          return false;
        }

        // 2. Filter by Distance Radius (km)
        if (job.location.distanceKm > filters.maxDistanceKm) {
          return false;
        }

        // 3. Filter by Visit Charge Range (Rs.)
        if (filters.minPrice !== undefined && job.customerSuggestedPrice !== undefined) {
          if (job.customerSuggestedPrice < filters.minPrice) return false;
        }
        if (filters.maxPrice !== undefined && job.customerSuggestedPrice !== undefined) {
          if (job.customerSuggestedPrice > filters.maxPrice) return false;
        }

        // 5. Filter by Job Type (Only without offers / Hide far jobs)
        if (filters.onlyWithoutOffers && job.totalOffers > 0) {
          return false;
        }
        if (filters.hideFarJobs && job.location.distanceKm > 5) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // 4. Sort by selection (Default: Fresh First)
        if (filters.sortBy === "distance_nearest") {
          return a.location.distanceKm - b.location.distanceKm;
        }
        if (filters.sortBy === "price_highest") {
          return (b.customerSuggestedPrice ?? 0) - (a.customerSuggestedPrice ?? 0);
        }
        // fresh_first
        return new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime();
      });
  }, [jobs, filters]);

  return (
    <div className="space-y-5">
      {/* Offline Status Warning if worker is toggled offline */}
      {!workerOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-900 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              <strong>You are offline.</strong> Turn online to receive job notifications.
            </span>
          </div>
          <button
            onClick={() => workerStore.toggleOnline()}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
          >
            Go Online
          </button>
        </div>
      )}

      {/* Task 2: Filter Controls Bar */}
      <JobFiltersBar
        filters={filters}
        onChange={(update) => workerStore.setFilter(update)}
        onReset={() => workerStore.resetFilters()}
        totalLiveCount={filteredJobs.length}
      />

      {/* Task 1: Job Cards Feed */}
      {filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              workerOffer={offers[job.id]}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Inbox className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">
            No matching jobs
          </h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">
            Try adjusting distance or category filters to see more requests.
          </p>
          <button
            type="button"
            onClick={() => workerStore.resetFilters()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors mt-1"
          >
            <Compass className="w-3.5 h-3.5 text-[#0F8B8D]" />
            <span>Reset Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
