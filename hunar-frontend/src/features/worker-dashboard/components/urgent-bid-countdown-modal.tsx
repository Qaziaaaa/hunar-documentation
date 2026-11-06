"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Star, MapPin, Navigation } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getSocket } from "@/lib/socket";
import { getWorkerJob } from "@/services/worker/jobs.service";
import { withdrawWorkerOffer } from "@/services/worker/offers.service";
import { workerStore, matchesJobId } from "@/stores/worker-jobs-store";
import { getUrgentOfferTimer, URGENT_OFFER_TTL_SECONDS, clearOfferExpiryCache } from "@/lib/urgent-offer";
import { showOfferToast } from "../stores/worker-offer-toast-store";
import type { JobRequest } from "../types";

export interface UrgentBidCountdownModalProps {
  isOpen: boolean;
  job: JobRequest | null;
  visitCharge: number;
  offerId?: string;
  offerCreatedAt?: string | number | Date;
  expiresAt?: string | number | Date;
  serverTime?: string | number | Date;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = URGENT_OFFER_TTL_SECONDS;

export function UrgentBidCountdownModal({
  isOpen,
  job,
  visitCharge,
  offerId,
  offerCreatedAt,
  expiresAt,
  serverTime,
  onClose,
}: UrgentBidCountdownModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();

  const [remainingProgress, setRemainingProgress] = useState(1);
  const [remainingSeconds, setRemainingSeconds] = useState(COUNTDOWN_SECONDS);
  const [isAccepted, setIsAccepted] = useState(false);

  const acceptedRef = useRef(false);
  const timeoutHandledRef = useRef(false);
  const declinedRef = useRef(false);

  // Format the actual visit fee clearly and safely
  const rawCharge =
    Number(visitCharge) > 0
      ? Number(visitCharge)
      : Number(job?.suggestedVisitCharge) > 0
      ? Number(job?.suggestedVisitCharge)
      : Number((job as any)?.lockedVisitCharge) > 0
      ? Number((job as any)?.lockedVisitCharge)
      : 0;
  const displayCharge = rawCharge;

  const formattedAmount =
    displayCharge > 0
      ? isUrdu
        ? `روپے ${displayCharge.toLocaleString()}`
        : `PKR ${displayCharge.toLocaleString()}`
      : "";

  // Customer & Job Details extracted directly from the actual job source of truth
  const customer = job?.customer;
  const customerName =
    customer?.fullName ||
    customer?.firstName ||
    (job as any)?.customerName ||
    (isUrdu ? "کسٹمر" : "Customer");
  const customerFirstName = customer?.firstName || customerName.split(" ")[0];
  const customerAvatar = customer?.avatarUrl || (job as any)?.customerAvatarUrl || "";
  const customerInitials =
    customerName
      .split(" ")
      .map((part: string) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    customerName.slice(0, 2).toUpperCase() ||
    "C";

  const rawRating = Number(
    customer?.rating ??
    (job as any)?.customerRating ??
    (job as any)?.rating ??
    0
  );
  const customerRating = rawRating > 0 ? rawRating.toFixed(1) : "0";
  const customerOrdersCount = Number(
    customer?.totalOrders ??
    (job as any)?.customerTotalOrders ??
    (job as any)?.totalOrders ??
    0
  );

  const areaText = job?.locationArea || (job as any)?.area || (job as any)?.city || "Location";
  const titleText = job?.title || (job as any)?.description || "Service Request";
  const distanceText =
    job?.distance && job.distance !== "Nearby"
      ? job.distance
      : (job as any)?.distanceKm
      ? `${(job as any).distanceKm} km`
      : "Nearby";

  // Function called as soon as customer acceptance is detected
  const handleOfferAccepted = () => {
    if (acceptedRef.current || declinedRef.current) return;
    acceptedRef.current = true;
    setIsAccepted(true);
    if (offerId) {
      clearOfferExpiryCache(offerId);
    }

    // Immediately mark job as accepted in worker store so navigation opens En Route screen with 0ms delay
    if (job?.id) {
      const existing = workerStore.getState().jobs.find((j) => matchesJobId(job.id, j.id));
      const customerObj = (job as any).customer || {};
      const resolvedCustomerName =
        customerObj.name ||
        customerObj.fullName ||
        customerObj.firstName ||
        (job as any).customerName ||
        "Customer";

      const normalizedJob: any = {
        ...(existing || {}),
        ...job,
        status: "accepted",
        visitCharge: displayCharge || (job as any)?.visitCharge,
        customer: {
          ...(existing?.customer || {}),
          ...customerObj,
          name: resolvedCustomerName,
          phone: customerObj.phone || (job as any).customerPhone || existing?.customer?.phone || "",
          rating: customerObj.rating ?? existing?.customer?.rating ?? 5.0,
          totalReviews: customerObj.totalReviews ?? customerObj.totalOrders ?? customerObj.reviewCount ?? 0,
          avatarUrl: customerObj.avatarUrl || existing?.customer?.avatarUrl || "",
          area: (job as any).locationArea || (job as any).area || existing?.customer?.area || "Location",
          isVerified: Boolean(customerObj.isVerified ?? existing?.customer?.isVerified),
        },
        location: {
          area: (job as any).location?.area || (job as any).locationArea || (job as any).area || "Location",
          city: (job as any).location?.city || (job as any).city || "Peshawar",
          latitude: (job as any).location?.latitude ?? (job as any).latitude ?? 0,
          longitude: (job as any).location?.longitude ?? (job as any).longitude ?? 0,
          address: (job as any).location?.address || (job as any).location?.fullAddress || (job as any).address || "",
        },
      };

      workerStore.upsertJob(normalizedJob);
      workerStore.updateJobStatus(job.id, "accepted", displayCharge);
    }

    // Briefly show the emerald confirmation, then navigate directly to the visit full screen
    setTimeout(() => {
      if (job?.id) {
        router.push(`/worker/jobs/${job.id}`);
      }
      onClose();
    }, 800);
  };

  // Function called as soon as customer declines/rejects the offer: immediately closes and returns directly to feed
  const handleOfferDeclined = () => {
    if (acceptedRef.current || declinedRef.current || timeoutHandledRef.current) return;
    declinedRef.current = true;
    if (offerId) {
      clearOfferExpiryCache(offerId);
    }

    if (job?.id) {
      workerStore.expireOffer(job.id);
    }

    showOfferToast("declined");
    onClose();
  };

  // Function called as soon as customer cancels the job request
  const handleJobCancelled = () => {
    if (acceptedRef.current || declinedRef.current || timeoutHandledRef.current) return;
    declinedRef.current = true;
    if (offerId) {
      clearOfferExpiryCache(offerId);
    }

    if (job?.id) {
      workerStore.expireOffer(job.id);
    }

    showOfferToast({
      type: "closed",
      customMessage: isUrdu ? "کسٹمر نے کام کی درخواست منسوخ کر دی" : "Job Cancelled by Customer",
    });
    onClose();
  };

  // Timer & progress bar mechanics synchronized with backend & customer
  useEffect(() => {
    if (!isOpen || !job) {
      setRemainingProgress(1);
      setRemainingSeconds(COUNTDOWN_SECONDS);
      setIsAccepted(false);
      acceptedRef.current = false;
      timeoutHandledRef.current = false;
      declinedRef.current = false;
      return;
    }

    acceptedRef.current = false;
    timeoutHandledRef.current = false;
    declinedRef.current = false;

    // Resolve offer timestamps: passed props, or store offer, or Date.now()
    const storeOffer = job?.id ? workerStore.getState().offers[job.id] : null;
    const resolvedCreatedAt = offerCreatedAt || storeOffer?.createdAt || new Date();
    const resolvedExpiresAt = expiresAt || storeOffer?.expiresAt;
    const resolvedServerTime = serverTime || storeOffer?.serverTime;

    const timeSource = {
      id: offerId,
      createdAt: resolvedCreatedAt,
      expiresAt: resolvedExpiresAt,
      serverTime: resolvedServerTime,
    };

    const updateTimer = () => {
      if (acceptedRef.current || declinedRef.current || timeoutHandledRef.current) return;

      const timer = getUrgentOfferTimer(timeSource, COUNTDOWN_SECONDS);
      setRemainingProgress(timer.progress);
      setRemainingSeconds(timer.remainingSeconds);

      if (timer.isExpired && !timeoutHandledRef.current && !declinedRef.current && !acceptedRef.current) {
        timeoutHandledRef.current = true;

        // Expire the offer on backend and in local store
        if (offerId) {
          clearOfferExpiryCache(offerId);
          void withdrawWorkerOffer(offerId).catch(() => 0);
        }
        if (job.id) {
          workerStore.expireOffer(job.id);
        }

        // Close immediately and show expired toast on the feed
        showOfferToast("expired");
        onClose();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 50);

    return () => clearInterval(interval);
  }, [isOpen, job?.id, offerId, offerCreatedAt, expiresAt, serverTime, onClose]);

  // Real-time Socket.io listener
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    const targetJobId = job.id.toLowerCase().trim();
    const targetOfferId = offerId?.toLowerCase().trim();
    const socket = getSocket();

    const onOfferAcceptedEvent = (data: any) => {
      const incomingJobId = (data?.jobId || data?.id || "")?.toString().toLowerCase().trim();
      if (incomingJobId === targetJobId) {
        handleOfferAccepted();
      }
    };

    const onOfferRejectedEvent = (data: any) => {
      const incomingJobId = (data?.jobId || data?.id || "")?.toString().toLowerCase().trim();
      const incomingOfferId = (data?.offerId || "")?.toString().toLowerCase().trim();
      if (
        (incomingJobId && incomingJobId === targetJobId) ||
        (targetOfferId && incomingOfferId && incomingOfferId === targetOfferId)
      ) {
        handleOfferDeclined();
      }
    };

    const onJobCancelledEvent = (data: any) => {
      const incomingJobId = (data?.jobId || data?.id || "")?.toString().toLowerCase().trim();
      if (incomingJobId === targetJobId) {
        handleJobCancelled();
      }
    };

    const onJobStatusChangedEvent = (data: any) => {
      const incomingJobId = (data?.jobId || data?.id || "")?.toString().toLowerCase().trim();
      const status = (data?.newStatus || data?.status || "").toString().toUpperCase();
      if (incomingJobId === targetJobId) {
        if (
          status === "WORKER_ASSIGNED" ||
          status === "OFFER_ACCEPTED" ||
          status === "VISIT_SCHEDULED" ||
          status === "ACCEPTED" ||
          status === "IN_PROGRESS"
        ) {
          handleOfferAccepted();
        } else if (
          status === "CANCELLED" ||
          status === "CANCELED" ||
          status === "CLOSED"
        ) {
          handleJobCancelled();
        } else if (
          status === "OFFER_REJECTED" ||
          status === "REJECTED" ||
          status === "DECLINED"
        ) {
          handleOfferDeclined();
        }
      }
    };

    if (socket) {
      socket.on("job:offer:accepted", onOfferAcceptedEvent);
      socket.on("job:offerAccepted", onOfferAcceptedEvent);
      socket.on("job:offer:rejected", onOfferRejectedEvent);
      socket.on("job:offerRejected", onOfferRejectedEvent);
      socket.on("job:offer:declined", onOfferRejectedEvent);
      socket.on("job:offerDeclined", onOfferRejectedEvent);
      socket.on("job:cancelled", onJobCancelledEvent);
      socket.on("job:canceled", onJobCancelledEvent);
      socket.on("jobCancelled", onJobCancelledEvent);
      socket.on("job:closed", onJobCancelledEvent);
      socket.on("job:status:changed", onJobStatusChangedEvent);
      socket.on("job:statusChanged", onJobStatusChangedEvent);
    }

    return () => {
      if (socket) {
        socket.off("job:offer:accepted", onOfferAcceptedEvent);
        socket.off("job:offerAccepted", onOfferAcceptedEvent);
        socket.off("job:offer:rejected", onOfferRejectedEvent);
        socket.off("job:offerRejected", onOfferRejectedEvent);
        socket.off("job:offer:declined", onOfferRejectedEvent);
        socket.off("job:offerDeclined", onOfferRejectedEvent);
        socket.off("job:cancelled", onJobCancelledEvent);
        socket.off("job:canceled", onJobCancelledEvent);
        socket.off("jobCancelled", onJobCancelledEvent);
        socket.off("job:closed", onJobCancelledEvent);
        socket.off("job:status:changed", onJobStatusChangedEvent);
        socket.off("job:statusChanged", onJobStatusChangedEvent);
      }
    };
  }, [isOpen, job?.id, offerId]);

  // Real-time WorkerStore subscriber
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    const targetJobId = job.id.toLowerCase().trim();
    const unsub = workerStore.subscribe(() => {
      if (acceptedRef.current || declinedRef.current) return;
      const state = workerStore.getState();

      // Check store offers
      for (const [key, offer] of Object.entries(state.offers) as [string, any][]) {
        if (
          key.toLowerCase().trim() === targetJobId ||
          offer.jobId?.toLowerCase().trim() === targetJobId
        ) {
          if (offer.status === "accepted" || offer.status === "ACCEPTED") {
            handleOfferAccepted();
            return;
          }
          if (
            offer.status === "rejected" ||
            offer.status === "REJECTED" ||
            offer.status === "declined" ||
            offer.status === "DECLINED"
          ) {
            handleOfferDeclined();
            return;
          }
          if (
            offer.status === "cancelled" ||
            offer.status === "CANCELLED" ||
            offer.status === "closed" ||
            offer.status === "CLOSED" ||
            offer.status === "closed_assigned"
          ) {
            handleJobCancelled();
            return;
          }
        }
      }

      // Check store jobs
      const foundJob = state.jobs.find(
        (j: any) => j.id?.toLowerCase().trim() === targetJobId
      );
      if (foundJob) {
        const js = (foundJob.status as string)?.toUpperCase();
        if (js === "CANCELLED" || js === "CANCELED" || js === "CLOSED") {
          handleJobCancelled();
          return;
        }
        if (
          js === "ACCEPTED" ||
          js === "VISIT_IN_PROGRESS" ||
          js === "INSPECTING" ||
          js === "INSPECTION_SUBMITTED" ||
          js === "ON_THE_WAY" ||
          js === "WORKER_ASSIGNED" ||
          js === "OFFER_ACCEPTED" ||
          Boolean((foundJob as any).assignedWorkerId) ||
          Boolean((foundJob as any).selectedWorkerId)
        ) {
          handleOfferAccepted();
          return;
        }
      }
    });

    return () => unsub();
  }, [isOpen, job?.id]);

  // Lightweight 2.5-second polling fallback
  useEffect(() => {
    if (!isOpen || !job?.id) return;

    const pollInterval = setInterval(async () => {
      if (acceptedRef.current || declinedRef.current) {
        clearInterval(pollInterval);
        return;
      }
      try {
        const liveJob = await getWorkerJob(job.id);
        if (!liveJob) return;

        const s = (liveJob.status || "").toString().toUpperCase();
        if (
          s === "WORKER_ASSIGNED" ||
          s === "OFFER_ACCEPTED" ||
          s === "VISIT_SCHEDULED" ||
          s === "ACCEPTED" ||
          (liveJob as any).assignedWorkerId ||
          (liveJob as any).selectedWorkerId ||
          (liveJob as any).selectedOfferId
        ) {
          handleOfferAccepted();
        } else if (
          s === "CANCELLED" ||
          s === "CANCELED" ||
          s === "CLOSED"
        ) {
          handleJobCancelled();
        } else if (
          (liveJob as any)?.myOffer?.status === "REJECTED" ||
          (liveJob as any)?.myOffer?.status === "rejected" ||
          s === "OFFER_REJECTED" ||
          s === "REJECTED"
        ) {
          handleOfferDeclined();
        }
      } catch {
        // Silently retry on next poll tick
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [isOpen, job?.id]);

  if (!isOpen || !job) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-between bg-black/65 backdrop-blur-[2px] animate-in fade-in duration-200 select-none overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      {/* Center Offer Status Message (Professional WorkerFix Wording) */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center pb-8 animate-in zoom-in-95 duration-200">
        {isAccepted ? (
          <div className="space-y-2.5">
            <div className="size-16 sm:size-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/50 animate-in zoom-in-75 duration-300">
              <CheckCircle2 className="size-10 sm:size-12 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
              {isUrdu ? "پیشکش قبول ہو گئی!" : "Offer Accepted!"}
            </h1>
            {formattedAmount && (
              <p className="text-xl sm:text-2xl font-black text-emerald-400 drop-shadow-sm">
                {formattedAmount}
              </p>
            )}
            <p className="text-xs sm:text-sm font-semibold text-white/90">
              {isUrdu
                ? "وزٹ پیج پر منتقل ہو رہے ہیں..."
                : "Taking you to visit screen..."}
            </p>
          </div>
        ) : (
          <div className="space-y-1 text-center drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)]">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {isUrdu ? "وزٹ پیشکش بھیج دی گئی" : "Visit Offer Submitted"}
            </h1>
            {formattedAmount && (
              <p className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight py-0.5">
                {formattedAmount}
              </p>
            )}
            <p className="text-xs sm:text-sm font-semibold text-white/90 tracking-tight">
              {isUrdu
                ? "کسٹمر کے قبول کرنے کا انتظار ہے..."
                : "Waiting for customer response..."}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Card (Exact structure & data from reference image, NO 'A b' text) */}
      <div className="w-full max-w-md mx-auto bg-white rounded-t-3xl shadow-[0_-12px_40px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col relative animate-in slide-in-from-bottom duration-300">
        {/* Navy-Blue Time Progress Line (50s smoothly diminishing, thin & subtle) */}
        <div className="w-full h-1 bg-slate-100 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              isAccepted ? "bg-emerald-500" : "bg-[#123B5D]"
            }`}
            style={{
              width: `${Math.max(0, Math.min(100, remainingProgress * 100))}%`,
            }}
          />
        </div>

        {/* Card Drag Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="px-5 pt-1 pb-4 space-y-3">
          {/* Main Info Row (Matching Highlighted Reference Image) */}
          <div className="flex items-start gap-3.5">
            {/* Left: Avatar + Name + Rating */}
            <div className="flex flex-col items-center shrink-0 w-14 text-center">
              <div className="size-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-sm text-[#123B5D] overflow-hidden shadow-2xs">
                {customerAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={customerAvatar}
                    alt={customerName}
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                ) : null}
                {!customerAvatar && customerInitials}
              </div>
              <span className="text-xs font-extrabold text-slate-900 mt-1 truncate max-w-full">
                {customerFirstName}
              </span>
              <span
                className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5"
                title={`${customerRating} rating · ${customerOrdersCount} completed ${customerOrdersCount === 1 ? "order" : "orders"}`}
              >
                <Star className="size-2.5 fill-amber-500 text-amber-500 shrink-0" />
                <span>{customerRating}</span>
                <span className="text-slate-400 font-normal">({customerOrdersCount})</span>
              </span>
            </div>

            {/* Middle: Location Area, Job Title & Distance/Category (NO 'A b' text) */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-start gap-2">
                <div className="size-6 rounded-lg bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="size-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                    {areaText}
                  </p>
                  <p className="text-[11px] text-slate-500 line-clamp-1 leading-tight mt-0.5 font-medium">
                    {titleText}
                  </p>
                </div>
              </div>

              {/* Distance & Category Info */}
              <div className="flex items-center gap-1.5 pt-0.5 text-[10.5px] text-slate-500 font-bold pl-8">
                <span className="inline-flex items-center gap-1 text-[#0F8B8D]">
                  <Navigation className="size-3 rotate-45 fill-current" />
                  {distanceText}
                </span>
                <span>·</span>
                <span className="text-slate-600 font-medium capitalize truncate">
                  {job.category}
                </span>
              </div>
            </div>
          </div>

          {/* Offered Fee Row */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-teal-50 text-[#0F8B8D] border border-teal-200 flex items-center justify-center font-black text-[11px]">
                Rs
              </div>
              <span className="font-black text-[#123B5D] text-sm sm:text-base">
                {formattedAmount || `PKR ${displayCharge}`}{" "}
                <span className="text-slate-400 font-medium text-xs">· Offered Visit Fee</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
