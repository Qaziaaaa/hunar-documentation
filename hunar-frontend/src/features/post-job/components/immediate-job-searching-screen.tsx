"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Zap,
  MapPin,
  Star,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";
import {
  getJobOffers,
  acceptWorkerOffer,
  rejectWorkerOffer,
  getJobDetail,
  transformBackendOffer,
  cancelCustomerJob,
} from "@/features/customer-jobs/api/customer-jobs-api";
import type { WorkerOffer } from "@/features/customer-jobs/types";
import { getSocket } from "@/lib/socket";
import { getOfferRemainingSeconds, URGENT_OFFER_TTL_SECONDS } from "@/lib/urgent-offer";
import type { PostJobData } from "../types";

export interface ImmediateJobSearchingScreenProps {
  jobId: string;
  data: PostJobData;
  onExit?: () => void;
}

export function ImmediateJobSearchingScreen({
  jobId,
  data,
  onExit,
}: ImmediateJobSearchingScreenProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const router = useRouter();

  const [offers, setOffers] = useState<WorkerOffer[]>([]);
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  const [decliningOfferId, setDecliningOfferId] = useState<string | null>(null);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [acceptedOffer, setAcceptedOffer] = useState<WorkerOffer | null>(null);
  const [securityPin, setSecurityPin] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancellingJob, setIsCancellingJob] = useState(false);
  const [, setTick] = useState(0);

  const isAcceptedRef = useRef(false);
  const declinedOffersRef = useRef<Map<string, number>>(new Map());

  // Check if an offer was declined locally and has not been re-submitted with a newer timestamp
  const isOfferDeclinedLocally = useCallback((offerId?: string, workerId?: string, createdAt?: string): boolean => {
    const oId = (offerId || "").toLowerCase().trim();
    const wId = (workerId || "").toLowerCase().trim();
    const declinedAt =
      (oId ? declinedOffersRef.current.get(oId) : undefined) ??
      (wId ? declinedOffersRef.current.get(wId) : undefined);

    if (declinedAt === undefined) return false;

    const createdMs = createdAt ? new Date(createdAt).getTime() : 0;
    // If the offer was created at or before it was declined, it is stale/declined
    if (createdMs <= declinedAt) {
      return true;
    }
    // Newer submission from worker: clear the declined entry
    if (oId) declinedOffersRef.current.delete(oId);
    if (wId) declinedOffersRef.current.delete(wId);
    return false;
  }, []);

  // 1-second interval ticker: updates countdown timers and auto-purges expired offers (>50s)
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
      setOffers((prev) => {
        const stillActive = prev.filter(
          (o) =>
            !o.isDeclined &&
            !isOfferDeclinedLocally(o.id, o.worker?.id, o.createdAt) &&
            getOfferRemainingSeconds(o) > 0
        );
        if (stillActive.length !== prev.length) {
          return stillActive;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOfferDeclinedLocally]);

  // Fetch offers helper
  const syncOffers = useCallback(async () => {
    if (isAcceptedRef.current || !jobId) return;
    try {
      const fetched = await getJobOffers(jobId);
      if (Array.isArray(fetched)) {
        const activeOnly = fetched.filter(
          (o) =>
            !o.isDeclined &&
            (o as any).status !== "WITHDRAWN" &&
            (o as any).status !== "REJECTED" &&
            !isOfferDeclinedLocally(o.id, o.worker?.id, o.createdAt) &&
            getOfferRemainingSeconds(o) > 0
        );

        setOffers((prev) => {
          const map = new Map<string, WorkerOffer>();
          for (const o of activeOnly) {
            map.set(o.id, o);
          }

          const nowMs = Date.now();
          // Retain an unconfirmed socket offer from prev only if:
          // 1. It is not declined/withdrawn
          // 2. It hasn't expired (> 0s remaining)
          // 3. It was created in the last 4 seconds (handles transient socket-vs-poll race)
          for (const o of prev) {
            if (
              map.has(o.id) ||
              o.isDeclined ||
              isOfferDeclinedLocally(o.id, o.worker?.id, o.createdAt)
            ) {
              continue;
            }
            const createdMs = o.createdAt ? new Date(o.createdAt).getTime() : 0;
            const ageMs = nowMs - createdMs;
            if (createdMs > 0 && ageMs < 4000 && getOfferRemainingSeconds(o) > 0) {
              map.set(o.id, o);
            }
          }
          return Array.from(map.values());
        });
      }
    } catch {
      // Background sync retry
    }
  }, [jobId, isOfferDeclinedLocally]);

  // Initial fetch and 2.5-second polling fallback
  useEffect(() => {
    void syncOffers();
    const interval = setInterval(() => {
      void syncOffers();
    }, 2500);
    return () => clearInterval(interval);
  }, [syncOffers]);

  // On mount: check if job was already accepted/assigned and route directly to tracking
  useEffect(() => {
    if (!jobId) return;
    void getJobDetail(jobId)
      .then((detail) => {
        if (!detail) return;
        const s = (detail.status || "").toUpperCase();
        if (
          s === "WORKER_ASSIGNED" ||
          s === "OFFER_ACCEPTED" ||
          s === "VISIT_SCHEDULED" ||
          s === "IN_PROGRESS" ||
          detail.selectedOffer
        ) {
          if (typeof window !== "undefined") {
            try {
              sessionStorage.removeItem("workerfix_active_asap_job_id");
              sessionStorage.removeItem("workerfix_active_asap_job_data");
              const url = new URL(window.location.href);
              url.searchParams.delete("searchingJobId");
              window.history.replaceState(null, "", url.toString());
            } catch {}
          }
          router.push(`/customer/jobs/${jobId}/tracking`);
        } else if (s === "CANCELLED" || s === "COMPLETED") {
          handleExit();
        }
      })
      .catch((err: any) => {
        if (err?.status === 404) {
          handleExit();
        }
      });
  }, [jobId, router]);

  // Socket.io Real-time listener for incoming & withdrawn offers
  useEffect(() => {
    if (!jobId) return;
    const targetJobId = jobId.toLowerCase().trim();
    const socket = getSocket();

    const handleJobOfferEvent = (payload: any) => {
      if (isAcceptedRef.current) return;
      const incomingJobId = (payload?.jobId || payload?.offer?.jobId || "")
        ?.toString()
        .toLowerCase()
        .trim();

      if (incomingJobId === targetJobId) {
        if (payload?.offer) {
          try {
            const transformed = transformBackendOffer(payload.offer);
            if (isOfferDeclinedLocally(transformed.id, transformed.worker?.id, transformed.createdAt)) {
              return;
            }
            if (getOfferRemainingSeconds(transformed) <= 0) return;
            setOffers((prev) => {
              // If previously present (e.g. re-offer after expiration or decline), update it in place
              const existingIndex = prev.findIndex(
                (o) =>
                  o.id === transformed.id ||
                  (o.worker?.id && transformed.worker?.id && o.worker.id === transformed.worker.id)
              );
              if (existingIndex >= 0) {
                const next = [...prev];
                next[existingIndex] = { ...transformed, isDeclined: false };
                return next;
              }
              return [{ ...transformed, isDeclined: false }, ...prev];
            });
          } catch {
            void syncOffers();
          }
        } else {
          void syncOffers();
        }
      }
    };

    const handleJobOfferWithdrawnEvent = (payload: any) => {
      const incomingJobId = (payload?.jobId || "")?.toString().toLowerCase().trim();
      const withdrawnOfferId = payload?.offerId || payload?.id;
      const withdrawnWorkerId = payload?.workerId;

      if (incomingJobId === targetJobId && (withdrawnOfferId || withdrawnWorkerId)) {
        const now = Date.now();
        if (withdrawnOfferId) {
          declinedOffersRef.current.set(String(withdrawnOfferId).toLowerCase().trim(), now);
        }
        if (withdrawnWorkerId) {
          declinedOffersRef.current.set(String(withdrawnWorkerId).toLowerCase().trim(), now);
        }
        setOffers((prev) =>
          prev.filter(
            (o) =>
              (!withdrawnOfferId || o.id !== withdrawnOfferId) &&
              (!withdrawnWorkerId || o.worker?.id !== withdrawnWorkerId)
          )
        );
      }
    };

    if (socket) {
      socket.on("job:offer", handleJobOfferEvent);
      socket.on("job:offer:withdrawn", handleJobOfferWithdrawnEvent);
      socket.on("job:offerWithdrawn", handleJobOfferWithdrawnEvent);
      socket.on("job:offer:rejected", handleJobOfferWithdrawnEvent);
      socket.on("job:offerRejected", handleJobOfferWithdrawnEvent);
      socket.on("job:offer:declined", handleJobOfferWithdrawnEvent);
      socket.on("job:offerDeclined", handleJobOfferWithdrawnEvent);
    }

    return () => {
      if (socket) {
        socket.off("job:offer", handleJobOfferEvent);
        socket.off("job:offer:withdrawn", handleJobOfferWithdrawnEvent);
        socket.off("job:offerWithdrawn", handleJobOfferWithdrawnEvent);
        socket.off("job:offer:rejected", handleJobOfferWithdrawnEvent);
        socket.off("job:offerRejected", handleJobOfferWithdrawnEvent);
        socket.off("job:offer:declined", handleJobOfferWithdrawnEvent);
        socket.off("job:offerDeclined", handleJobOfferWithdrawnEvent);
      }
    };
  }, [jobId, syncOffers, isOfferDeclinedLocally]);

  // Handle Offer Decline
  const handleDecline = async (offer: WorkerOffer) => {
    if (decliningOfferId || acceptingOfferId) return;
    setDecliningOfferId(offer.id);

    // Record in local declined map immediately to prevent in-flight polls from restoring it
    const now = Date.now();
    if (offer.id) {
      declinedOffersRef.current.set(String(offer.id).toLowerCase().trim(), now);
    }
    if (offer.worker?.id) {
      declinedOffersRef.current.set(String(offer.worker.id).toLowerCase().trim(), now);
    }

    // Optimistically remove from incoming offers list
    setOffers((prev) => prev.filter((o) => o.id !== offer.id));

    try {
      await rejectWorkerOffer(jobId, offer.id);
    } catch (err) {
      console.warn("Could not decline offer on backend:", err);
    } finally {
      setDecliningOfferId(null);
    }
  };

  // Handle Offer Acceptance
  const handleAccept = async (offer: WorkerOffer) => {
    if (acceptingOfferId || isAcceptedRef.current) return;

    if (getOfferRemainingSeconds(offer) <= 0) {
      setAcceptError(
        isUrdu
          ? "یہ پیشکش ختم ہو چکی ہے۔ براہ کرم نئی پیشکش کا انتظار کریں۔"
          : "This offer has expired. Please wait for another offer."
      );
      setOffers((prev) => prev.filter((o) => o.id !== offer.id));
      return;
    }

    setAcceptingOfferId(offer.id);
    setAcceptError(null);

    try {
      const res = await acceptWorkerOffer(jobId, offer.id);
      if (res.success) {
        isAcceptedRef.current = true;
        setAcceptedOffer(offer);

        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("workerfix_active_asap_job_id");
            sessionStorage.removeItem("workerfix_active_asap_job_data");
            const url = new URL(window.location.href);
            url.searchParams.delete("searchingJobId");
            window.history.replaceState(null, "", url.toString());
          } catch {}
        }

        // Fetch security PIN from job details
        try {
          const detail = await getJobDetail(jobId);
          if (detail.securityPin) {
            setSecurityPin(detail.securityPin);
          }
        } catch {
          // ignore
        }

        // Navigate directly to the live tracking page after short celebration
        setTimeout(() => {
          router.push(`/customer/jobs/${jobId}/tracking`);
        }, 1500);
      }
    } catch (err: any) {
      setAcceptError(
        err?.message ||
          (isUrdu
            ? "آفر قبول کرنے میں مسئلہ پیش آیا۔ دوبارہ کوشش کریں۔"
            : "Failed to accept offer. Please try again.")
      );
      setAcceptingOfferId(null);
    }
  };

  const handleExit = () => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("workerfix_active_asap_job_id");
        sessionStorage.removeItem("workerfix_active_asap_job_data");
        const url = new URL(window.location.href);
        url.searchParams.delete("searchingJobId");
        window.history.replaceState(null, "", url.toString());
      } catch {}
    }
    if (onExit) {
      onExit();
    } else {
      router.push("/customer/jobs");
    }
  };

  const handleCancelJob = async () => {
    if (isCancellingJob || !jobId) return;
    setIsCancellingJob(true);
    try {
      await cancelCustomerJob(jobId, "Cancelled by customer during technician search");
    } catch (err: any) {
      // If the job is already cancelled or expired, treat it as expected terminal state
      const isExpectedTerminal =
        err?.message?.includes("JOB_INVALID_STATE") ||
        err?.status === 400 ||
        err?.status === 404;
      if (!isExpectedTerminal) {
        console.warn("Could not cancel job via API:", err?.message || String(err));
      }
    } finally {
      setIsCancellingJob(false);
      setShowCancelConfirm(false);
      handleExit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F8FAFC] text-[#1A1A2E] flex flex-col overflow-y-auto">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <WorkerFixLogo variant="dark" size="sm" />
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
            <span className="size-2 rounded-full bg-amber-500 animate-ping" />
            <span>{isUrdu ? "فوری جاب براڈکاسٹ" : "Urgent Broadcast Active"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCancelConfirm(true)}
            disabled={isCancellingJob}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
          >
            <X className="size-3.5 stroke-[2.5]" />
            <span>{isUrdu ? "منسوخ کریں" : "Cancel"}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Searching Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 text-center">
          <h1 className="text-base sm:text-lg font-black text-[#123B5D]">
            {isUrdu
              ? "قریبی تصدیق شدہ ماہرین تلاش کیے جا رہے ہیں"
              : "Searching for Nearby Technicians"}
          </h1>
        </div>

        {/* Live Offers Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <span>{isUrdu ? "موصولہ آفرز" : "Incoming Technician Offers"}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  offers.length > 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {offers.length}
              </span>
            </h2>

            {offers.length > 0 && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                {isUrdu ? "لائیو اپڈیٹ" : "Live updates"}
              </span>
            )}
          </div>

          {acceptError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {acceptError}
            </div>
          )}

          {offers.length === 0 ? (
            /* Empty State: Radar Pulse Animation waiting for first offer */
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center mx-auto animate-pulse">
                <Zap className="size-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  {isUrdu
                    ? "ماہرین کی پیشکشوں کا انتظار ہے..."
                    : "Waiting for incoming offers..."}
                </p>
              </div>
            </div>
          ) : (
            /* List of Incoming Offers */
            <div className="space-y-3">
              {offers.map((offer) => {
                const isAcceptingThis = acceptingOfferId === offer.id;
                const isDecliningThis = decliningOfferId === offer.id;
                const worker = offer.worker;
                const rating = Number(worker?.rating || 5.0).toFixed(1);
                const reviewCount = worker?.totalReviews || 0;
                const remainingSec = getOfferRemainingSeconds(offer);
                const progressPercent = Math.max(
                  0,
                  Math.min(100, (remainingSec / URGENT_OFFER_TTL_SECONDS) * 100)
                );

                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-teal-500/50 shadow-xs hover:shadow-md transition-all p-4 sm:p-5 flex flex-col gap-3.5 animate-in slide-in-from-bottom-3 duration-300"
                  >
                    {/* Top Row: Worker Details + Shifted Visit Fee (500) */}
                    <div className="flex items-start justify-between gap-3">
                      {/* Left: Avatar + Details */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="relative size-12 sm:size-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center font-black text-slate-600 text-lg">
                          {worker?.avatarUrl ? (
                            <Image
                              src={worker.avatarUrl}
                              alt={worker.name || "Technician"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span>{(worker?.name || "T")[0].toUpperCase()}</span>
                          )}
                        </div>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                              {worker?.name || (isUrdu ? "ماہر کاریگر" : "Verified Technician")}
                            </h3>
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                              <ShieldCheck className="size-3" />
                              {isUrdu ? "تصدیق شدہ" : "Verified"}
                            </span>

                            {/* Live 50s Urgency Expiration Badge */}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border transition-colors ${
                                remainingSec <= 15
                                  ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                                  : remainingSec <= 30
                                  ? "bg-amber-50 border-amber-200 text-amber-800"
                                  : "bg-teal-50 border-teal-200 text-[#0F8B8D]"
                              }`}
                            >
                              <Clock className="size-3 stroke-[2.5]" />
                              <span>
                                {isUrdu
                                  ? `${remainingSec}s باقی`
                                  : `${remainingSec}s left`}
                              </span>
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                            <span className="flex items-center gap-1 font-bold text-slate-800">
                              <Star className="size-3.5 text-amber-500 fill-amber-500" />
                              {rating}
                              {reviewCount > 0 && (
                                <span className="text-slate-400 font-normal">
                                  ({reviewCount})
                                </span>
                              )}
                            </span>

                            {worker?.experienceYears ? (
                              <span>
                                {worker.experienceYears}{" "}
                                {isUrdu ? "سال کا تجربہ" : "yrs exp"}
                              </span>
                            ) : null}

                            {offer.distanceKm > 0 && (
                              <span className="flex items-center gap-0.5 text-slate-500">
                                <MapPin className="size-3 text-slate-400" />
                                {offer.distanceKm.toFixed(1)} km
                              </span>
                            )}
                          </div>

                          {offer.note && (
                            <p className="text-xs text-slate-600 italic line-clamp-1 pt-0.5">
                              "{offer.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Shifted Visit Fee (500) */}
                      <div className="text-right shrink-0 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5">
                        <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
                          {isUrdu ? "وزٹ چارجز" : "Visit Charge"}
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#0F8B8D]">
                          Rs. {offer.visitFee.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* 50-Second Countdown Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                          remainingSec <= 15
                            ? "bg-rose-500"
                            : remainingSec <= 30
                            ? "bg-amber-500"
                            : "bg-[#0F8B8D]"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Bottom Action Row: Decline Button + Accept Button */}
                    <div className="flex items-center justify-end gap-2.5 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleDecline(offer)}
                        disabled={Boolean(acceptingOfferId) || isDecliningThis}
                        className="py-2 px-3.5 sm:px-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        {isDecliningThis ? (
                          <span>{isUrdu ? "مسترد ہو رہا ہے..." : "Declining..."}</span>
                        ) : (
                          <span>{isUrdu ? "مسترد کریں" : "Decline"}</span>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(offer)}
                        disabled={
                          Boolean(acceptingOfferId) || isDecliningThis || remainingSec <= 0
                        }
                        className="py-2 px-4 sm:px-5 rounded-xl bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isAcceptingThis ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            <span>{isUrdu ? "بک کیا جا رہا ہے..." : "Booking..."}</span>
                          </>
                        ) : (
                          <>
                            <span>{isUrdu ? "قبول کریں" : "Accept"}</span>
                            <ChevronRight className="size-4 rtl:rotate-180" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Accepted Success Overlay Modal */}
      {acceptedOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-7 max-w-md w-full text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="size-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <Sparkles className="size-3.5" />
                <span>{isUrdu ? "کاریگر بک ہو گیا!" : "Technician Booked!"}</span>
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {isUrdu ? "آپ کی جاب کنفرم ہو گئی ہے" : "Your Visit is Confirmed"}
              </h3>
              <p className="text-xs text-slate-600 font-medium">
                {isUrdu
                  ? `${acceptedOffer.worker.name} کو الرٹ کر دیا گیا ہے اور وہ روانہ ہو رہے ہیں۔`
                  : `${acceptedOffer.worker.name} has been notified and will be on the way.`}
              </p>
            </div>

            {securityPin && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  {isUrdu ? "سیکیورٹی پن (کاریگر کی آمد پر بتائیں)" : "Security PIN (Share upon arrival)"}
                </span>
                <span className="text-2xl font-mono font-black text-[#123B5D] tracking-widest block">
                  {securityPin}
                </span>
              </div>
            )}

            <div className="pt-2">
              <Link
                href={`/customer/jobs/${jobId}/tracking`}
                className="w-full py-3 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                <span>{isUrdu ? "لائیو ٹریکنگ دیکھیں" : "Go to Live Job Tracking"}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 sm:p-6 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {isUrdu ? "کیا آپ یہ آرڈر منسوخ کرنا چاہتے ہیں؟" : "Cancel This Order?"}
                </h3>
               
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCancellingJob}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {isUrdu ? "تلاش جاری رکھیں" : "Keep Searching"}
              </button>
              <button
                type="button"
                onClick={handleCancelJob}
                disabled={isCancellingJob}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isCancellingJob ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>{isUrdu ? "منسوخ ہو رہا ہے..." : "Cancelling..."}</span>
                  </>
                ) : (
                  <span>{isUrdu ? "ہاں، منسوخ کریں" : "Yes, Cancel Order"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

