"use client";

import { useState, useMemo } from "react";
import { JobRequestCard } from "./job-request-card";
import { JobRequestModal } from "./job-request-modal";
import { RadarSearchView } from "./radar-search-view";
import { MOCK_JOB_REQUESTS } from "../mock-job-requests";
import type { JobRequest } from "../types";

export function JobRequestFeed({
  searchQuery = "",
  city = "Peshawar",
  isOnline = true,
}: {
  searchQuery?: string;
  city?: string;
  isOnline?: boolean;
}) {
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sentOfferIds, setSentOfferIds] = useState<string[]>([]);
  const [hiddenJobIds, setHiddenJobIds] = useState<string[]>([]);

  const filteredJobs = useMemo(() => {
    return MOCK_JOB_REQUESTS.filter((job) => {
      // Exclude hidden/dismissed jobs
      if (hiddenJobIds.includes(job.id)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesDesc = job.description.toLowerCase().includes(q);
        const matchesArea = job.locationArea.toLowerCase().includes(q);
        const matchesName = job.customer.firstName.toLowerCase().includes(q);
        const matchesCategory = job.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesArea && !matchesName && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, hiddenJobIds]);

  const handleCardClick = (job: JobRequest) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleOfferSent = (jobId: string) => {
    setSentOfferIds((prev) => [...prev, jobId]);
  };

  const handleHideJob = (jobId: string) => {
    setHiddenJobIds((prev) => [...prev, jobId]);
  };

  return (
    <section className="w-full space-y-4" data-purpose="job-requests-section">
      {/* OFFLINE NOTICE (if worker is offline) */}
      {!isOnline && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
          <p className="font-medium">
            <strong>You are currently Offline.</strong> Switch your status to <strong>Online</strong> in the header to receive realtime push notifications when new requests are posted.
          </p>
        </div>
      )}

      {/* HIDDEN JOBS BAR (if any) */}
      {hiddenJobIds.length > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <span>{hiddenJobIds.length} job request{hiddenJobIds.length === 1 ? "" : "s"} hidden (swiped right)</span>
          <button
            type="button"
            onClick={() => setHiddenJobIds([])}
            className="text-[#0F8B8D] hover:underline font-bold text-xs cursor-pointer"
          >
            Reset &amp; show all
          </button>
        </div>
      )}

      {/* JOB REQUESTS LIST WITH REDUCED THICKNESS DIVIDER BETWEEN REQUESTS */}
      {filteredJobs.length > 0 ? (
        <div className="flex flex-col w-full">
          {filteredJobs.map((job, index) => (
            <div key={job.id} className="w-full">
              <JobRequestCard
                job={job}
                onClick={handleCardClick}
                onHide={handleHideJob}
              />
              {index < filteredJobs.length - 1 && (
                <div
                  className="w-full h-[3px] rounded-full bg-slate-200/80 my-3.5"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-full flex flex-col items-center justify-center animate-in fade-in duration-300">
          <RadarSearchView city={city} />
        </div>
      )}

      {/* JOB REQUEST DETAILS MODAL */}
      <JobRequestModal
        job={selectedJob}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOfferSent={handleOfferSent}
      />
    </section>
  );
}
