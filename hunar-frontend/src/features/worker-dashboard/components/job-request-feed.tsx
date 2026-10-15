"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { JobRequestCard } from "./job-request-card";
import { RadarSearchView } from "./radar-search-view";
import type { JobRequest, JobRequestCategory } from "../types";

const JobRequestModal = dynamic(
  () => import("./job-request-modal").then((mod) => mod.JobRequestModal),
  { ssr: false }
);

import { useLocale } from "next-intl";
import { ApiError } from "@/lib/api-client";
import { getSocket } from "@/lib/socket";
import { listNearbyJobs } from "@/services/worker/jobs.service";
import { subscribeToNotifications } from "@/services/worker/notification.service";
import { timeAgo, formatDate, formatTime, formatDateSlot, isDateOnlyTimestamp, formatPreferredTiming } from "@/lib/format";
import { isMockMode } from "@/lib/data-source";
import { formatAreaOrSector } from "@/lib/location";
import type { Job } from "@/types/job";

const CATEGORY_LABELS: Record<string, JobRequestCategory> = {
  Plumbing: "Plumber",
  Electrical: "Electrician",
  "AC & Refrigeration": "AC Technician",
  Carpentry: "Carpenter",
  Painting: "Painter",
  Cleaning: "Home Cleaner",
  Masonry: "Mason / Mistri",
  "Pest Control": "Pest Control",
  "General Handyman": "Handyman",
  Mechanics: "Mechanic",
  "Solar Energy": "Solar Technician",
  "Appliance Repair": "Appliance Repair",
};

function toFeedJobRequest(job: Job): JobRequest {
  const rawFullName = job.customer?.name?.trim() || "";
  // Strip '(Customer)' or '(Worker)' suffixes from seed/test accounts, e.g. "Abdullah (Customer)" -> "Abdullah"
  const cleanName = rawFullName.replace(/\s*\((Customer|Worker)\)/gi, "").trim();
  const fullName = cleanName || "Customer";
  const firstName = fullName.split(/\s+/)[0] || fullName;
  const rawCategory = typeof job.category === "object" ? job.category?.name?.trim() : String(job.category || "");
  const category = (CATEGORY_LABELS[rawCategory] ??
    (rawCategory || "Appliance Repair")) as JobRequestCategory;
  const distance =
    typeof job.distanceKm === "number" && job.distanceKm > 0
      ? `${job.distanceKm.toFixed(1)} km`
      : "Nearby";
  const locationArea = formatAreaOrSector({
    area: job.area,
    address: job.address,
    city: job.city,
  });
  const isUrgent = job.urgency === "EMERGENCY" || job.urgency === "HIGH";

  const rawAvatar =
    (job as any).customer?.avatarUrl ||
    (job as any).customer?.user?.avatarUrl ||
    job.customer?.avatarUrl;
  // Only use avatarUrl if the customer has genuinely uploaded a photo
  const avatarUrl =
    rawAvatar && typeof rawAvatar === "string" && rawAvatar.trim() !== "" && !rawAvatar.startsWith("/landing/")
      ? rawAvatar.trim()
      : "";

  const rawRating = (job as any).customer?.rating ?? job.customer?.rating;
  const rawReviews =
    (job as any).customer?.reviewCount ??
    (job as any).customer?.reviewsCount ??
    job.customer?.reviewCount;
  const rawOrders = (job as any).customer?.totalOrders ?? job.customer?.totalOrders;

  const rating = rawRating && Number(rawRating) > 0 ? Number(rawRating) : 0;
  const reviewCount =
    rawReviews && Number(rawReviews) > 0 ? Number(rawReviews) : 0;
  const totalOrders =
    rawOrders && Number(rawOrders) > 0 ? Number(rawOrders) : 0;

  return {
    id: job.id,
    category,
    title: job.title,
    description: job.description ?? "",
    distance,
    locationArea,
    uploadedTime: timeAgo(job.createdAt),
    postedTimestamp: Date.parse(job.createdAt) || undefined,
    suggestedVisitCharge: job.suggestedVisitCharge ?? job.lockedVisitCharge ?? undefined,
    preferredTiming: formatPreferredTiming(job.preferredVisitTime, false, isUrgent),
    status: isUrgent ? "URGENT" : "OPEN",
    customer: {
      firstName,
      fullName,
      avatarUrl,
      rating,
      reviewCount,
      totalOrders,
      isVerified: Boolean((job as any).customer?.isVerified ?? false),
      memberSince: (job as any).customer?.memberSince || "Member",
    },
    images: (job.images ?? []).filter(
      (src) => typeof src === "string" && src.trim().length > 0
    ),
    voiceNote:
      job.voiceNoteUrl && job.voiceNoteUrl.trim() !== "" && !job.voiceNoteUrl.startsWith("blob:")
        ? {
            audioUrl: job.voiceNoteUrl.trim(),
            waveformPattern: [35, 60, 45, 80, 95, 65, 40, 75, 90, 85, 50, 70, 40, 60, 30],
          }
        : undefined,
  };
}

export function JobRequestFeed({
  searchQuery = "",
  city = "",
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
  const [geoCoords, setGeoCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoStatus, setGeoStatus] = useState<"requesting" | "granted" | "denied" | "unavailable" | "idle">("idle");
  const geoCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  const refreshLiveJobs = useCallback((coordsOverride?: { lat: number; lng: number } | null) => {
    const coords = coordsOverride !== undefined ? coordsOverride : geoCoordsRef.current;
    const locationArg = coords ? { lat: coords.lat, lng: coords.lng, radiusKm: 25 } : undefined;
    listNearbyJobs(locationArg)
      .then((jobs) => {
        setLiveJobs(jobs);
        setFeedError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 403) {
          const msg = err.message || "";
          if (msg.includes("WORKER_NOT_VERIFIED") || msg.includes("verify your profile")) {
            setFeedError("Your worker profile is pending verification. Jobs will appear once approved.");
          } else if (msg.includes("WORKER_PROFILE_INCOMPLETE") || msg.includes("complete your profile")) {
            setFeedError(msg);
          } else if (msg.includes("Only workers")) {
            setFeedError(
              "Your session is signed in with the wrong account type. Sign in as a worker to see job requests.",
            );
          } else {
            setFeedError(
              msg || "Access forbidden. Please ensure you are logged in with an approved worker account.",
            );
          }
        } else if (err instanceof ApiError && err.status === 401) {
          setFeedError("Your session expired. Please sign in again.");
        } else {
          setFeedError(
            err instanceof Error ? err.message : "Could not load new job requests",
          );
        }
      });
  }, []);

  const requestGps = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGeoStatus("unavailable");
      refreshLiveJobs(null);
      return;
    }

    setGeoStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        geoCoordsRef.current = coords;
        setGeoCoords(coords);
        setGeoStatus("granted");
        refreshLiveJobs(coords);
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("unavailable");
        }
        refreshLiveJobs(null);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  }, [refreshLiveJobs]);

  useEffect(() => {
    requestGps();
  }, [requestGps]);

  useEffect(() => {
    refreshLiveJobs();
    // Interval poll removed (perf sprint): refresh happens on window focus
    // and whenever the backend pushes JOB_MATCHED/new_job/job:new over the socket.
    const onFocus = () => refreshLiveJobs();
    const onJobCreated = () => refreshLiveJobs();
    window.addEventListener("focus", onFocus);
    window.addEventListener("hunar_job_created", onJobCreated);
    window.addEventListener("storage", onJobCreated);

    const unsubscribe = subscribeToNotifications((notification) => {
      const type = String((notification as { type?: unknown }).type ?? "");
      if (type === "JOB_MATCHED" || type === "new_job") refreshLiveJobs();
    });

    // B8 fallback: socket push is the primary refresh trigger. If the socket
    // never connects (backend down, proxy blocks websockets), the feed would go
    // permanently stale — poll slowly while disconnected, and refetch the
    // moment the socket connects.
    const socket = getSocket();
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    const syncFallbackPolling = () => {
      if (socket?.connected) {
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      } else if (!fallbackInterval) {
        fallbackInterval = setInterval(refreshLiveJobs, 30_000);
      }
    };
    const onConnect = () => {
      refreshLiveJobs();
      syncFallbackPolling();
    };
    // inDrive-style push: the backend broadcasts job:new to the `workers`
    // room the moment a job goes live, so the card appears immediately.
    const onJobPush = () => refreshLiveJobs();
    socket?.on("connect", onConnect);
    socket?.on("job:new", onJobPush);
    socket?.on("disconnect", syncFallbackPolling);
    socket?.on("connect_error", syncFallbackPolling);
    syncFallbackPolling();

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("hunar_job_created", onJobCreated);
      window.removeEventListener("storage", onJobCreated);
      unsubscribe();
      socket?.off("connect", onConnect);
      socket?.off("job:new", onJobPush);
      socket?.off("disconnect", syncFallbackPolling);
      socket?.off("connect_error", syncFallbackPolling);
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [refreshLiveJobs]);

  const sourceJobs = useMemo(() => {
    return liveJobs.map(toFeedJobRequest);
  }, [liveJobs]);

  const filteredJobs = useMemo(() => {
    return sourceJobs.filter((job: JobRequest) => {
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

      {/* LIVE FEED STATUS */}
      {feedError && (
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
          {filteredJobs.map((job: JobRequest, index: number) => (
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
          <RadarSearchView
            city={city}
            geoStatus={geoStatus}
            geoCoords={geoCoords}
            onRequestGps={requestGps}
          />
        </div>
      )}

      {/* JOB REQUEST DETAILS MODAL */}
      {isModalOpen && selectedJob && (
        <JobRequestModal
          job={selectedJob}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onOfferSent={handleOfferSent}
        />
      )}
    </section>
  );
}
