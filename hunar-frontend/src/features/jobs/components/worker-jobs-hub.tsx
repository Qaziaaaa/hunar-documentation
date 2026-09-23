"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useWorkerJobs } from "@/stores/worker-jobs-store";
import { WorkerUpcomingVisitCard } from "./worker-upcoming-visit-card";
import { WorkerPastJobCard } from "./worker-past-job-card";
import {
  Calendar,
  CheckCircle2,
  Clock,
} from "lucide-react";

export function WorkerJobsHub() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isUrdu = locale === "ur";
  const { jobs, offers } = useWorkerJobs();

  // Tab State: "upcoming" | "past"
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  // 1. Upcoming Scheduled Visits (all accepted visits or active visits ready to dispatch)
  const upcomingVisits = jobs.filter(
    (j) => j.status === "accepted" || j.status === "visit_in_progress"
  );

  // 2. Past Completed Jobs
  const pastJobs = jobs.filter((j) => j.status === "completed");

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 w-full overflow-x-hidden animate-in fade-in">
      {/* Tabs Below Header: Upcoming Jobs vs Past Jobs */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 w-full sm:w-auto shadow-2xs">
          {/* Tab 1: Upcoming Jobs */}
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
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
            onClick={() => setActiveTab("past")}
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

        <span className="text-xs text-slate-500 font-medium hidden sm:block">
          {activeTab === "upcoming"
            ? `${upcomingVisits.length} scheduled visit${upcomingVisits.length === 1 ? "" : "s"}`
            : `${pastJobs.length} settled & completed job${pastJobs.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* TAB CONTENT 1: UPCOMING JOBS */}
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
              <h3 className="text-sm font-bold text-slate-700">No Upcoming Visits</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You do not have any upcoming scheduled visits. Submit visit offers on available jobs to schedule new appointments.
              </p>
            </div>
          )}
        </section>
      )}

      {/* TAB CONTENT 2: PAST JOBS */}
      {activeTab === "past" && (
        <section className="space-y-4 animate-in fade-in" aria-label="Past Completed Jobs">
          {pastJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {pastJobs.map((job) => (
                <WorkerPastJobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-2">
              <CheckCircle2 className="size-8 text-slate-300 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700">No Completed Jobs Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your past completed jobs, earnings breakdown, and customer ratings will be displayed here.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
