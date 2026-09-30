"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { JobRequestCard } from "./job-request-card";
import { JobRequestModal } from "./job-request-modal";
import { RadarSearchView } from "./radar-search-view";
import { MOCK_JOB_REQUESTS } from "../mock-job-requests";
import type { JobRequest, JobRequestCategory } from "../types";

import { useLocale } from "next-intl";
import { isMockMode } from "@/lib/data-source";
import { ApiError } from "@/lib/api-client";
import { listNearbyJobs } from "@/services/worker/jobs.service";
import { subscribeToNotifications } from "@/services/worker/notification.service";
import { timeAgo, formatDate, formatTime } from "@/lib/format";
import type { Job } from "@/types/job";

const CATEGORY_LABELS: Record<string, JobRequestCategory> = {
  Plumbing: "Plumber",
  Electrical: "Electrician",
  "AC & Refrigeration": "AC Technician",
  Carpentry: "Carpenter",
  Painting: "Painter",
  Mechanics: "Mechanic",
  "Solar Energy": "Solar Technician",
  "Appliance Repair": "Appliance Repair",
};

function toFeedJobRequest(job: Job): JobRequest {
  const fullName = job.customer?.name?.trim() || "Customer";
  const firstName = fullName.split(/\s+/)[0] || "Customer";
  const rawCategory = job.category?.name?.trim() || "";
  const category = (CATEGORY_LABELS[rawCategory] ??
    (rawCategory || "Appliance Repair")) as JobRequestCategory;
  const distance =
    typeof job.distanceKm === "number" && job.distanceKm > 0
      ? `${job.distanceKm.toFixed(1)} km`
      : "Nearby";
  const area = job.area ?? "";
  const city = job.city ?? "";
  const locationArea =
    (area && city && area.toLowerCase().includes(city.toLowerCase())
      ? area
      : [area, city].filter(Boolean).join(", ")) ||
    job.address ||
    "Location pending";
  const isUrgent = job.urgency === "EMERGENCY" || job.urgency === "HIGH";

  return {
    id: job.id,
    category,
    title: job.title,
    description: job.description ?? "",
    distance,
    locationArea,
    fullAddress: job.address || undefined,
    uploadedTime: timeAgo(job.createdAt),
    postedTimestamp: Date.parse(job.createdAt) || undefined,
    suggestedVisitCharge: job.suggestedVisitCharge ?? undefined,
    preferredTiming: job.preferredVisitTime
      ? `${formatDate(job.preferredVisitTime)}, ${formatTime(job.preferredVisitTime)}`
      : undefined,
    status: isUrgent ? "URGENT" : "OPEN",
    customer: {
      firstName,
      fullName,
      avatarUrl: "/landing/mansoor-avatar.png",
      rating: 0,
      reviewCount: 0,
      totalOrders: 0,
      isVerified: false,
      memberSince: "—",
    },
    images: (job.images ?? []).filter((src) => src.startsWith("/")),
    voiceNote: undefined,
  };
}

export function JobRequestFeed({
  searchQuery = "",
  city = "Peshawar",
  isOnline = true,
}: {
  searchQuery?: string;
  city?: string;
  isOnline?: boolean;
}) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [selectedJob, setSelectedJob] = useState<JobRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sentOfferIds, setSentOfferIds] = useState<string[]>([]);
  const [hiddenJobIds, setHiddenJobIds] = useState<string[]>([]);
  const isApiMode = !isMockMode();
  const [liveJobs, setLiveJobs] = useState<Job[]>([]);
  const [feedError, setFeedError] = useState<string | null>(null);

  const refreshLiveJobs = useCallback(() => {
    listNearbyJobs()
      .then((jobs) => {
        setLiveJobs(jobs);
        setFeedError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          setFeedError(
            "Your session is signed in with the wrong account type. Sign in as a worker to see job requests.",
          );
        } else if (err instanceof ApiError && err.status === 401) {
          setFeedError("Your session expired. Please sign in again.");
        } else {
          setFeedError(
            err instanceof Error ? err.message : "Could not load new job requests",
          );
        }
      });
  }, []);

  useEffect(() => {
    if (!isApiMode) return;
    refreshLiveJobs();
    const intervalId = window.setInterval(refreshLiveJobs, 15000);
    const onFocus = () => refreshLiveJobs();
    window.addEventListener("focus", onFocus);
    const unsubscribe = subscribeToNotifications((notification) => {
      const type = String((notification as { type?: unknown }).type ?? "");
      if (type === "JOB_MATCHED" || type === "new_job") refreshLiveJobs();
    });
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
      unsubscribe();
    };
  }, [isApiMode, refreshLiveJobs]);

  const sourceJobs = useMemo(() => {
    return isApiMode ? liveJobs.map(toFeedJobRequest) : MOCK_JOB_REQUESTS;
  }, [isApiMode, liveJobs]);

  const filteredJobs = useMemo(() => {
    return sourceJobs.filter((job) => {
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
  }, [searchQuery, hiddenJobIds, sourceJobs]);

  const handleCardClick = (job: JobRequest) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleOfferSent = (jobId: string) => {
    setSentOfferIds((prev) => [...prev, jobId]);
    refreshLiveJobs();
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
            <strong>{isUrdu ? "آپ اس وقت آف لائن ہیں۔" : "You are currently Offline."}</strong>{" "}
            {isUrdu
              ? "نئے کام کے نوٹیفیکیشنز موصول کرنے کے لیے ہیڈر میں اپنا اسٹیٹس آن لائن کریں۔"
              : "Switch your status to Online in the header to receive realtime push notifications when new requests are posted."}
          </p>
        </div>
      )}

      {/* LIVE FEED STATUS (api mode only) */}
      {isApiMode && feedError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-800">
          <strong>{isUrdu ? "اپ ڈیٹ ناکام:" : "Could not refresh:"}</strong> {feedError}
        </div>
      )}

      {/* HIDDEN JOBS BAR (if any) */}
      {hiddenJobIds.length > 0 && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600">
          <span>
            {isUrdu
              ? `${hiddenJobIds.length} کام کی درخواستیں چھپائی گئیں`
              : `${hiddenJobIds.length} job request${hiddenJobIds.length === 1 ? "" : "s"} hidden (swiped right)`}
          </span>
          <button
            type="button"
            onClick={() => setHiddenJobIds([])}
            className="text-[#0F8B8D] hover:underline font-bold text-xs cursor-pointer"
          >
            {isUrdu ? "دوبارہ تمام دکھائیں" : "Reset & show all"}
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
