"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, Star, MapPin, Navigation, X } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getSocket } from "@/lib/socket";
import { getWorkerJob } from "@/services/worker/jobs.service";
import { withdrawWorkerOffer } from "@/services/worker/offers.service";
import { workerStore } from "@/stores/worker-jobs-store";
import { showOfferToast } from "../stores/worker-offer-toast-store";
import type { JobRequest } from "../types";

export interface UrgentBidCountdownModalProps {
  isOpen: boolean;
  job: JobRequest | null;
  visitCharge: number;
  offerId?: string;
  onClose: () => void;
}

const COUNTDOWN_SECONDS = 50;

export function UrgentBidCountdownModal({
  isOpen,
  job,
  visitCharge,
  offerId,
  onClose,
}: UrgentBidCountdownModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();

  const [remainingProgress, setRemainingProgress] = useState(1);
  const [isAccepted, setIsAccepted] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const acceptedRef = useRef(false);
  const timeoutHandledRef = useRef(false);
  const declinedRef = useRef(false);

  // Format the actual visit fee clearly and safely
  const displayCharge =
    typeof visitCharge === "number" && !isNaN(visitCharge) && visitCharge > 0
      ? visitCharge
      : typeof job?.suggestedVisitCharge === "number" && !isNaN(job.suggestedVisitCharge) && job.suggestedVisitCharge > 0
      ? job.suggestedVisitCharge
      : 0;

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

  const customerRating =
    typeof customer?.rating === "number" && customer.rating > 0
      ? customer.rating.toFixed(1)
      : "0";
  const customerReviews =
    typeof customer?.reviewCount === "number"
      ? customer.reviewCount
      : (job as any)?.reviewCount ?? 0;

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
    if (acceptedRef.current || declinedRef.current) return;
    declinedRef.current = true;

    if (job?.id) {
      workerStore.expireOffer(job.id);
    }

    showOfferToast("declined");
    onClose();
  };

  // Timer & progress bar mechanics based on elapsed time: remainingProgress = max(0, 1 - elapsedTime / 50)
  useEffect(() => {
    if (!isOpen || !job) {
      setRemainingProgress(1);
      setIsAccepted(false);
      setIsTimedOut(false);
      acceptedRef.current = false;
      timeoutHandledRef.current = false;
      declinedRef.current = false;
      startTimeRef.current = null;
      return;
    }

    // Set the start timestamp once when modal opens so re-renders do not reset it
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }
    acceptedRef.current = false;
    timeoutHandledRef.current = false;
    declinedRef.current = false;

    const interval = setInterval(() => {
      if (acceptedRef.current || declinedRef.current) {
        clearInterval(interval);
        return;
      }

      if (!startTimeRef.current) return;
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
      const progress = Math.max(0, 1 - elapsedSeconds / COUNTDOWN_SECONDS);
      setRemainingProgress(progress);

      if (progress <= 0 && !timeoutHandledRef.current && !declinedRef.current) {
        timeoutHandledRef.current = true;
        clearInterval(interval);
        setIsTimedOut(true);

        // Expire the offer on backend and in local store
        if (offerId) {
          void withdrawWorkerOffer(offerId).catch(() => 0);
        }
        if (job.id) {
          workerStore.expireOffer(job.id);
        }

        // Allow the expired message to show briefly, then cleanly close and return to feed
        setTimeout(() => {
          showOfferToast("expired");
          onClose();
        }, 1400);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen, job?.id, offerId, onClose]);

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
        }
      }

      // Check store jobs
      const foundJob = state.jobs.find(
        (j: any) => j.id?.toLowerCase().trim() === targetJobId
      );
      if (
        foundJob &&
        (foundJob.status === "accepted" ||
          foundJob.status === "visit_in_progress" ||
          foundJob.status === "inspecting" ||
          foundJob.status === "inspection_submitted" ||
          (foundJob.status as string) === "on_the_way" ||
          (foundJob.status as string) === "WORKER_ASSIGNED" ||
          (foundJob.status as string) === "OFFER_ACCEPTED" ||
          Boolean((foundJob as any).assignedWorkerId) ||
          Boolean((foundJob as any).selectedWorkerId))
      ) {
        handleOfferAccepted();
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
          (liveJob as any)?.myOffer?.status === "REJECTED" ||
          (liveJob as any)?.myOffer?.status === "WITHDRAWN" ||
          (liveJob as any)?.myOffer?.status === "rejected" ||
          s === "OFFER_REJECTED"
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
      {/* Top Close Button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rtl:right-auto rtl:left-4 z-20 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
        title={isUrdu ? "بند کریں" : "Close"}
      >
        <X className="size-5" />
      </button>

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
        ) : isTimedOut ? (
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">
              {isUrdu ? "پیشکش کی مدت ختم ہو گئی" : "Offer Expired"}
            </h1>
            <p className="text-xs sm:text-sm text-white/80 font-medium">
              {isUrdu
                ? "50 سیکنڈ میں کسٹمر کا جواب موصول نہیں ہوا۔ فیڈ پر واپس جا رہے ہیں..."
                : "No response within 50s. Returning to feed..."}
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
              {isUrdu ? "کسٹمر کے قبول کرنے کا انتظار ہے..." : "Waiting for customer response..."}
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
              <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
                <Star className="size-2.5 fill-amber-500 text-amber-500 shrink-0" />
                <span>{customerRating}</span>
                <span className="text-slate-400 font-normal">({customerReviews})</span>
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
