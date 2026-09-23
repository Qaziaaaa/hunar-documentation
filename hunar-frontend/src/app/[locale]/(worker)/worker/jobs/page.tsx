"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useWorkerJobs } from "@/stores/worker-jobs-store";
import { NearbyJobsFeed } from "@/features/jobs/components/nearby-jobs-feed";
import { OfferStatusBadge } from "@/features/negotiation/components/offer-status-badge";
import { formatRs } from "@/lib/design-tokens";
import {
  Compass,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function WorkerJobsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const { jobs, offers } = useWorkerJobs();
  const [activeTab, setActiveTab] = useState<
    "all_nearby" | "active" | "offers_sent" | "completed"
  >("active");

  const activeJobs = jobs.filter(
    (j) =>
      j.status === "accepted" ||
      j.status === "visit_in_progress" ||
      j.status === "visit_completed" ||
      j.status === "inspecting" ||
      j.status === "inspection_submitted" ||
      j.status === "repair_negotiating"
  );

  const sentOfferJobs = jobs.filter((j) => !!offers[j.id]);

  const completedJobs = jobs.filter((j) => j.status === "completed");

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Work Orders &amp; Jobs Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your nearby job requests, sent offers, and active field visits.
          </p>
        </div>
      </div>

      {/* Tabs Strip */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "active"
              ? "bg-[#123B5D] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>Active In-Flight</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
            {activeJobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("offers_sent")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "offers_sent"
              ? "bg-[#123B5D] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <span>Offers Sent &amp; Bids</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
            {sentOfferJobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("all_nearby")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "all_nearby"
              ? "bg-[#123B5D] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Nearby Requests Feed</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("completed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === "completed"
              ? "bg-[#123B5D] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Completed ({completedJobs.length})</span>
        </button>
      </div>

      {/* Tab 1: Active In Flight Jobs */}
      {activeTab === "active" && (
        <div className="space-y-4">
          {activeJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border-2 border-[#0F8B8D]/30 p-5 shadow-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs">
                        Active In Progress
                      </span>
                      <span className="text-xs font-bold text-[#123B5D]">
                        Agreed:{" "}
                        {formatRs(
                          offers[job.id]?.agreedVisitCharge ??
                            offers[job.id]?.visitCharge ??
                            800
                        )}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base">
                      {job.title}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {job.problemSummary}
                    </p>

                    <div className="text-xs text-slate-500 pt-1">
                      Customer: <strong>{job.customer.name}</strong> •{" "}
                      {job.location.area}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                    <Link
                      href={`/${locale}/worker/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      <span>Continue Visit &amp; Inspection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs sm:text-sm">
              No active job in progress right now. Send visit offers on nearby requests to get booked!
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sent Offers & Bids */}
      {activeTab === "offers_sent" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sentOfferJobs.map((job) => {
              const offer = offers[job.id];
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <OfferStatusBadge status={offer.status} />
                      <span className="text-xs font-bold text-slate-900">
                        Quote: {formatRs(offer.visitCharge)}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {job.title}
                    </h3>

                    <div className="text-xs text-slate-500">
                      {job.location.area} • ({job.location.distanceKm} km away)
                    </div>

                    {offer.message && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                        &quot;{offer.message}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Round {offer.currentRound} of {offer.maxRounds}
                    </span>

                    <Link
                      href={`/${locale}/worker/jobs/${job.id}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F8B8D] hover:underline"
                    >
                      <span>View Negotiation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Nearby Requests Feed */}
      {activeTab === "all_nearby" && <NearbyJobsFeed />}

      {/* Tab 4: Completed Jobs */}
      {activeTab === "completed" && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs sm:text-sm">
          Completed job records and customer review ratings will appear here upon completion.
        </div>
      )}
    </div>
  );
}
