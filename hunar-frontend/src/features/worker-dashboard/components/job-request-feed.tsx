"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { JobRequestCard } from "./job-request-card";
import { JobRequestModal } from "./job-request-modal";
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

  const filteredJobs = useMemo(() => {
    return MOCK_JOB_REQUESTS.filter((job) => {
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
  }, [searchQuery]);

  const handleCardClick = (job: JobRequest) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleOfferSent = (jobId: string) => {
    setSentOfferIds((prev) => [...prev, jobId]);
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

      {/* JOB REQUESTS LIST */}
      {filteredJobs.length > 0 ? (
        <div className="flex flex-col w-full gap-3 sm:gap-4">
          {filteredJobs.map((job) => (
            <JobRequestCard
              key={job.id}
              job={job}
              onClick={handleCardClick}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
            <Search className="size-6" />
          </div>
          <h3 className="text-base font-bold text-navy">No Matching Job Requests</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            No active service requests found in {city} matching your search query.
          </p>
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
