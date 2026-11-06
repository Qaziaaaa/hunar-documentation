"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useWorkerJobs, workerStore } from "@/stores/worker-jobs-store";
import { WorkerUpcomingVisitCard } from "./worker-upcoming-visit-card";
import { WorkerPastJobCard } from "./worker-past-job-card";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { getAccessToken, getRefreshToken } from "@/lib/api-client";
import {
  Calendar,
  CheckCircle2,
} from "lucide-react";

export function WorkerJobsHub() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isUrdu = locale === "ur";
  const { jobs, offers, status, hydrated, error } = useWorkerJobs();

  // Tab State: "upcoming" | "past"
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // Revalidate jobs immediately on mount so latest upcoming and past jobs appear instantly
  React.useEffect(() => {
    const hasWorkerAuth = Boolean(
      getAccessToken("WORKER", true) ||
      getAccessToken(undefined, true) ||
      getRefreshToken("WORKER") ||
      getRefreshToken()
    );
    if (!hasWorkerAuth) return;
    void workerStore.hydrate({ force: true });
  }, []);

  const handleTabChange = (tab: "upcoming" | "past") => {
    setActiveTab(tab);
    if (tab === "past" && pastJobs.length === 0) {
      void workerStore.hydrate({ force: true });
    }
  };

  const isImmediateJob = (j: any) =>
    Boolean(j.isUrgent) ||
    j.urgency === "emergency" ||
    j.urgency === "EMERGENCY" ||
    j.preferredVisitWindow?.timeSlot?.includes("Immediate");

  // 1. Upcoming & Active Visits (strictly scheduled appointments - no immediate jobs)
  const upcomingVisits = jobs.filter(
    (j) =>
      !isImmediateJob(j) &&
      (
        j.status === "accepted" ||
        j.status === "visit_in_progress" ||
        j.status === "visit_completed" ||
        j.status === "inspecting" ||
        j.status === "inspection_submitted" ||
        j.status === "repair_negotiating" ||
        j.status === "repair_approved" ||
        j.status === "repair_in_progress" ||
        j.status === "repair_declined"
      )
  );

  // 2. Past Completed Jobs
  const pastJobs = jobs.filter((j) => {
    const s = String(j.status || "").toLowerCase();
    return s === "completed" || s === "paid" || s === "reviewed";
  });
  const INITIAL_PAST_LIMIT = 6;
  const [pastLimit, setPastLimit] = useState(INITIAL_PAST_LIMIT);
  const visiblePastJobs = pastJobs.slice(0, pastLimit);

  // Prevent flashing "No Upcoming Visits" before initial store hydration finishes
  if ((!hydrated || status === "loading") && jobs.length === 0) {
    return <LoadingState label={isUrdu ? "جابز لوڈ کی جا رہی ہیں..." : "Loading your jobs..."} />;
  }

  if (status === "error" && jobs.length === 0) {
    return (
      <ErrorState
        title="Unable to load your jobs"
        description={
          error ?? "Please check your network connection and try again."
        }
        onRetry={() => void workerStore.hydrate({ force: true })}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 w-full overflow-x-hidden animate-in fade-in">
      {/* Tabs Below Header: Upcoming Jobs vs Past Jobs */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-auto shadow-2xs">
          {/* Tab 1: Upcoming Jobs */}
          <button
            type="button"
            onClick={() => handleTabChange("upcoming")}
            className={`flex-1 sm:flex-initial py-2.5 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-[#123B5D] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Calendar className="size-4" />
            <span>{isUrdu ? "آنے والی جابز" : "Upcoming Jobs"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                activeTab === "upcoming"
                  ? "bg-teal-400/25 text-teal-200"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {upcomingVisits.length}
            </span>
          </button>

          {/* Tab 2: Past Jobs */}
          <button
            type="button"
            onClick={() => handleTabChange("past")}
            className={`flex-1 sm:flex-initial py-2.5 px-5 sm:px-6 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "past"
                ? "bg-[#123B5D] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <CheckCircle2 className="size-4" />
            <span>{isUrdu ? "ماضی کی جابز" : "Past Jobs"}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10.5px] font-black ${
                activeTab === "past"
                  ? "bg-teal-400/25 text-teal-200"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {pastJobs.length}
            </span>
          </button>
        </div>
      </div>
      {/* TAB CONTENT 2: UPCOMING JOBS */}
      {activeTab === "upcoming" && (
        <section className="space-y-4 animate-in fade-in" aria-label="Upcoming Scheduled Visits">
          {upcomingVisits.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {upcomingVisits.map((job) => (
                <WorkerUpcomingVisitCard
                  key={job.id}
                  job={job}
                  offer={offers[job.id]}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-2">
              <Calendar className="size-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">
                {isUrdu ? "کوئی آنے والی جابز نہیں ہیں" : "No Upcoming Visits"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isUrdu
                  ? "آپ کے پاس کوئی شیڈول شدہ وزٹ نہیں ہے۔ نئی جابز حاصل کرنے کے لیے آفر بھیجیں۔"
                  : "You do not have any upcoming scheduled visits. Submit visit offers on available jobs to schedule new appointments."}
              </p>
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT 2: PAST JOBS */}
      {activeTab === "past" && (
        <section className="space-y-4 animate-in fade-in" aria-label="Past Completed Jobs">
          {pastJobs.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {visiblePastJobs.map((job) => (
                  <WorkerPastJobCard key={job.id} job={job} />
                ))}
              </div>
              {pastJobs.length > pastLimit && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPastLimit((prev) => prev + INITIAL_PAST_LIMIT)}
                    className="py-2.5 px-6 rounded-xl bg-white border border-slate-200 text-[#123B5D] hover:bg-slate-50 text-xs sm:text-sm font-bold shadow-2xs transition-all cursor-pointer hover:border-[#0F8B8D]"
                  >
                    {isUrdu
                      ? `مزید مکمل شدہ جابز دیکھیں (${pastJobs.length - pastLimit} باقی)`
                      : `Load More Completed Jobs (${pastJobs.length - pastLimit} remaining)`}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-2">
              <CheckCircle2 className="size-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">
                {isUrdu ? "ابھی کوئی مکمل شدہ جاب نہیں ہے" : "No Completed Jobs Yet"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isUrdu
                  ? "آپ کی ماضی کی مکمل شدہ جابز، آمدنی کی تفصیلات، اور کسٹمر ریٹنگ یہاں نظر آئیں گی۔"
                  : "Your past completed jobs, earnings breakdown, and customer ratings will be displayed here."}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
