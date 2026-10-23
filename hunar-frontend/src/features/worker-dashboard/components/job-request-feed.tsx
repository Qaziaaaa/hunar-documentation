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
import { listNearbyJobs, getWorkerJob } from "@/services/worker/jobs.service";
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
  "Solar & UPS": "Solar Technician",
  "CCTV & Security": "CCTV & Security",
  Gardener: "Gardener",
  "Gardener (Mali)": "Gardener",
  Welder: "Welder",
  "Movers & Packers": "Movers & Packers",
  "Appliance Repair": "Appliance Repair",
};

export function isCategoryMatched(jobCategory?: string, workerSkills: string[] = []): boolean {
  if (!jobCategory || !workerSkills || workerSkills.length === 0) return false;

  const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, "");
  const normCategory = normalize(jobCategory);
  if (!normCategory) return false;

  return workerSkills.some((skill) => {
    if (!skill) return false;
    const normSkill = normalize(skill);
    if (!normSkill) return false;

    // Direct normalized match (e.g. "plumber" === "plumber")
    if (normSkill === normCategory) return true;

    // Stem / substring match with minimum length guard
    if (
      (normSkill.length >= 3 && normCategory.includes(normSkill)) ||
      (normCategory.length >= 3 && normSkill.includes(normCategory))
    ) {
      return true;
    }

    // Check alias mapping from CATEGORY_LABELS
    for (const [backendCat, labelCat] of Object.entries(CATEGORY_LABELS)) {
      const normBackend = normalize(backendCat);
      const normLabel = normalize(labelCat);
      const matchesSkill = normSkill === normBackend || normSkill === normLabel;
      const matchesCategory = normCategory === normBackend || normCategory === normLabel;
      if (matchesSkill && matchesCategory) {
        return true;
      }
    }

    return false;
  });
}


function toFeedJobRequest(job: Job): JobRequest {
  const rawFullName =
    job.customer?.name?.trim() ||
    (job as any).customerName?.trim() ||
    "";
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
    (job as any).customerAvatarUrl ||
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
      memberSince: (() => {
        const raw = (job as any).customer?.memberSince || (job as any).customer?.createdAt;
        if (!raw || raw === "Member" || raw === "—") return undefined;
        const parsed = new Date(raw);
        return Number.isNaN(parsed.getTime()) ? String(raw) : String(parsed.getFullYear());
      })(),
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

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function JobRequestFeed({
  searchQuery = "",
  city = "",
  isOnline = true,
  workerSkills: propSkills = [],
}: {
  searchQuery?: string;
  city?: string;
  isOnline?: boolean;
  workerSkills?: string[];
}) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const effectiveWorkerSkills = useMemo(() => {
    if (propSkills && propSkills.length > 0) return propSkills;
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem("hunar_worker_onboarding");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed?.skills) && parsed.skills.length > 0) {
            return parsed.skills;
          }
        }
      } catch {}
    }
    return [];
  }, [propSkills]);
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

  const refreshLiveJobs = useCallback((coordsOverride?: { lat: number; lng: number } | null, isSilent = false, retryCount = 0) => {
    const coords = coordsOverride !== undefined ? coordsOverride : geoCoordsRef.current;
    const locationArg = coords ? { lat: coords.lat, lng: coords.lng, radiusKm: 25 } : undefined;
    listNearbyJobs(locationArg)
      .then((jobs) => {
        setLiveJobs(jobs);
        setFeedError(null);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("hunar_worker_cached_jobs", JSON.stringify(jobs.slice(0, 30)));
          } catch {}
        }
      })
      .catch((err: unknown) => {
        // If it's a background revalidation, don't interrupt the user with an error banner
        if (isSilent) return;

        // On transient failure during mount, attempt 1 silent retry after 1.5s before showing error banner
        if (retryCount === 0) {
          setTimeout(() => {
            refreshLiveJobs(coordsOverride, false, 1);
          }, 1500);
          return;
        }

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
        const prev = geoCoordsRef.current;
        // Debounce GPS movement: only reload if moved > 250m
        const hasMoved = !prev || getDistanceKm(prev.lat, prev.lng, coords.lat, coords.lng) >= 0.25;
        geoCoordsRef.current = coords;
        setGeoCoords(coords);
        setGeoStatus("granted");
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("hunar_worker_coords", JSON.stringify(coords));
          } catch {}
        }
        if (hasMoved) {
          refreshLiveJobs(coords);
        }
      },
      (err) => {
        if (err.code === 1) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("unavailable");
        }
        refreshLiveJobs(null);
      },
      { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 },
    );
  }, [refreshLiveJobs]);

  // Fast restore from session cache on mount (0ms latency!)
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cachedRaw = sessionStorage.getItem("hunar_worker_cached_jobs");
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLiveJobs(parsed);
          }
        }
        const cachedCoordsRaw = sessionStorage.getItem("hunar_worker_coords");
        if (cachedCoordsRaw) {
          const parsedCoords = JSON.parse(cachedCoordsRaw);
          if (parsedCoords?.lat && parsedCoords?.lng) {
            geoCoordsRef.current = parsedCoords;
            setGeoCoords(parsedCoords);
            setGeoStatus("granted");
          }
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    requestGps();
  }, [requestGps]);

  useEffect(() => {
    refreshLiveJobs();
    const onFocus = () => refreshLiveJobs(undefined, true);
    const onJobCreated = () => refreshLiveJobs(undefined, true);
    window.addEventListener("focus", onFocus);
    window.addEventListener("hunar_job_created", onJobCreated);
    window.addEventListener("storage", onJobCreated);

    const unsubscribe = subscribeToNotifications((notification) => {
      const type = String((notification as { type?: unknown }).type ?? "");
      if (type === "JOB_MATCHED" || type === "new_job") refreshLiveJobs(undefined, true);
    });

    const socket = getSocket();
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    const syncFallbackPolling = () => {
      if (socket?.connected) {
        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }
      } else if (!fallbackInterval) {
        fallbackInterval = setInterval(() => refreshLiveJobs(undefined, true), 30_000);
      }
    };
    const onConnect = () => {
      refreshLiveJobs(undefined, true);
      syncFallbackPolling();
    };
    // inDrive-style instant card push: prepend incoming job directly to feed
    const onJobPush = (payload: any) => {
      const incomingJob = payload?.job || (payload?.id ? payload : null);
      if (incomingJob && incomingJob.id) {
        setLiveJobs((prev) => {
          const existsIdx = prev.findIndex((j) => j.id === incomingJob.id);
          if (existsIdx !== -1) {
            const next = [...prev];
            next[existsIdx] = { ...next[existsIdx], ...incomingJob };
            return next;
          }
          return [incomingJob, ...prev];
        });

        // Fail-safe: if customer details are missing on the push payload, fetch the complete job immediately
        if (!incomingJob.customer?.name && !incomingJob.customerName) {
          getWorkerJob(incomingJob.id)
            .then((fullJob) => {
              if (fullJob && fullJob.customer) {
                setLiveJobs((prev) =>
                  prev.map((j) => (j.id === fullJob.id ? { ...j, ...fullJob } : j))
                );
              }
            })
            .catch(() => 0);
        }
      }
      refreshLiveJobs(undefined, true);
    };

    const onJobClosed = (payload: any) => {
      const closedId = payload?.jobId || payload?.id || payload?.job?.id;
      if (!closedId) return;
      setLiveJobs((prev) => {
        const next = prev.filter((j) => j.id !== closedId);
        if (typeof window !== "undefined") {
          try {
            sessionStorage.setItem("hunar_worker_cached_jobs", JSON.stringify(next.slice(0, 30)));
          } catch {}
        }
        return next;
      });
      setSelectedJob((current) => (current?.id === closedId ? null : current));
    };

    const onJobStatusChanged = (payload: any) => {
      const status = payload?.newStatus || payload?.status;
      if (status && status !== "OPEN" && status !== "OFFERS_RECEIVED") {
        onJobClosed(payload);
      }
    };

    const onWindowJobClosed = (e: Event) => {
      const customEvent = e as CustomEvent<{ jobId?: string; id?: string }>;
      const id = customEvent.detail?.jobId || customEvent.detail?.id;
      if (id) {
        onJobClosed({ jobId: id });
      }
    };

    window.addEventListener("hunar_job_closed", onWindowJobClosed);

    socket?.on("connect", onConnect);
    socket?.on("job:new", onJobPush);
    socket?.on("job:closed", onJobClosed);
    socket?.on("job:offer:accepted", onJobClosed);
    socket?.on("job:offerAccepted", onJobClosed);
    socket?.on("job:cancelled", onJobClosed);
    socket?.on("job:status:changed", onJobStatusChanged);
    socket?.on("job:statusChanged", onJobStatusChanged);
    socket?.on("disconnect", syncFallbackPolling);
    socket?.on("connect_error", syncFallbackPolling);
    syncFallbackPolling();

    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("hunar_job_created", onJobCreated);
      window.removeEventListener("hunar_job_closed", onWindowJobClosed);
      window.removeEventListener("storage", onJobCreated);
      unsubscribe();
      socket?.off("connect", onConnect);
      socket?.off("job:new", onJobPush);
      socket?.off("job:closed", onJobClosed);
      socket?.off("job:offer:accepted", onJobClosed);
      socket?.off("job:offerAccepted", onJobClosed);
      socket?.off("job:cancelled", onJobClosed);
      socket?.off("job:status:changed", onJobStatusChanged);
      socket?.off("job:statusChanged", onJobStatusChanged);
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

  const sortedJobs = useMemo(() => {
    if (!effectiveWorkerSkills || effectiveWorkerSkills.length === 0) {
      return filteredJobs;
    }

    return [...filteredJobs].sort((a, b) => {
      const aMatched = isCategoryMatched(a.category, effectiveWorkerSkills);
      const bMatched = isCategoryMatched(b.category, effectiveWorkerSkills);

      if (aMatched && !bMatched) return -1;
      if (!aMatched && bMatched) return 1;
      return 0;
    });
  }, [filteredJobs, effectiveWorkerSkills]);

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

      {/* JOB REQUESTS LIST: ONLY TWO STATES: JOBS IF PRESENT, RADAR SCANNER OTHERWISE */}
      {sortedJobs.length > 0 ? (
        <div className="flex flex-col w-full">
          {sortedJobs.map((job: JobRequest, index: number) => (
            <div key={job.id} className="w-full">
              <JobRequestCard
                job={job}
                onClick={handleCardClick}
                onHide={handleHideJob}
                isMatchedCategory={isCategoryMatched(job.category, effectiveWorkerSkills)}
              />
              {index < sortedJobs.length - 1 && (
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
