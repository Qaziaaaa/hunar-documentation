"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  X,
  MapPin,
  Star,
  Calendar,
  ShieldCheck,
  Zap,
  Wrench,
  AirVent,
  SunMedium,
  Hammer,
  Paintbrush,
  Flame,
  Maximize2,
  Sparkles,
  Send,
  CheckCircle2,
  Loader2,
  Volume2,
} from "lucide-react";
import { VoicePlayer } from "./voice-player";
import { Button } from "@/components/ui/button";
import { submitWorkerOffer } from "@/services/worker/offers.service";
import { workerStore } from "@/stores/worker-jobs-store";
import { getWalletBalance } from "@/services/worker/earnings.service";
import { ApiError } from "@/lib/api-client";
import { formatPreferredTiming } from "@/lib/format";
import type { JobRequest } from "../types";

const WALLET_INSUFFICIENT_OFFER_MESSAGE =
  "Your wallet balance is insufficient to submit an offer. Please top up your wallet to continue.";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Electrician: Zap,
  Plumber: Wrench,
  "AC Technician": AirVent,
  "Solar Technician": SunMedium,
  Carpenter: Hammer,
  Painter: Paintbrush,
  Welder: Flame,
  "Home Cleaner": Sparkles,
  "Mason / Mistri": Hammer,
  "Pest Control": Flame,
  Handyman: Wrench,
};

import { useLocale } from "next-intl";

export function JobRequestModal({
  job,
  isOpen,
  onClose,
  onOfferSent,
}: {
  job: JobRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onOfferSent?: (jobId: string, visitCharge: number) => void;
}) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      setSelectedImagePreview(null);
      setIsSending(false);
      setIsSent(false);
      setSendError(null);
    }
  }, [job]);

  const isUrgent =
    job?.status === "URGENT" ||
    (job as any)?.urgency === "EMERGENCY" ||
    (job as any)?.urgency === "HIGH" ||
    Boolean(job?.preferredTiming && /immediate|asap|جلد از جلد|30.?60/i.test(job.preferredTiming));

  const visitCharge = job?.suggestedVisitCharge ?? 0;

  const validImages = useMemo(() => {
    if (!job?.images || !Array.isArray(job.images)) return [];
    return job.images.filter(
      (src) => typeof src === "string" && src.trim().length > 0
    );
  }, [job?.images]);

  const voiceNoteData = useMemo(() => {
    if (job?.voiceNote?.audioUrl && !job.voiceNote.audioUrl.startsWith("blob:")) {
      return job.voiceNote;
    }
    const url = (job as any)?.voiceNoteUrl;
    if (url && typeof url === "string" && url.trim().length > 0 && !url.startsWith("blob:")) {
      return {
        audioUrl: url.trim(),
        waveformPattern: [35, 60, 45, 80, 95, 65, 40, 75, 90, 85, 50, 70, 40, 60, 30],
      };
    }
    return undefined;
  }, [job]);

  const handleSendOffer = async () => {
    if (!job || isSending || isSent) return;
    setIsSending(true);
    setSendError(null);
    try {
      // Pre-check the live wallet balance; the backend validates it again on submit.
      const balance = await getWalletBalance();
      if (balance <= 0) {
        setIsSending(false);
        setSendError(WALLET_INSUFFICIENT_OFFER_MESSAGE);
        return;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setIsSending(false);
        setSendError("Your session expired. Please sign in again to send an offer.");
        return;
      }
      // Network/read failure: let the backend make the final call.
    }
    try {
      const serverOffer = await submitWorkerOffer(job.id, visitCharge);
      workerStore.recordOfferSent(serverOffer as any, job.id);
      setIsSending(false);
      setIsSent(true);
      onOfferSent?.(job.id, visitCharge);
      setTimeout(() => {
        onClose();
      }, 250);
    } catch (err) {
      setIsSending(false);
      if (err instanceof ApiError && err.status === 401) {
        setSendError("Your session expired. Please sign in again to send an offer.");
      } else if (err instanceof ApiError && err.status === 403) {
        setSendError("Sign in with a worker account to send offers.");
      } else if (err instanceof ApiError && err.status === 409) {
        setSendError("You already sent an offer for this job.");
      } else if (err instanceof ApiError && err.status === 400) {
        setSendError(err.message || WALLET_INSUFFICIENT_OFFER_MESSAGE);
      } else {
        setSendError("Could not send your offer. Please try again.");
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (selectedImagePreview) {
          setSelectedImagePreview(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, selectedImagePreview, onClose]);

  if (!isOpen || !job) return null;

  const Icon = CATEGORY_ICONS[job.category] || Wrench;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden animate-in fade-in duration-200"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      onClick={onClose}
      data-purpose="job-request-details-modal"
    >
      <div
        className="relative flex flex-col w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL TOP HEADER */}
        <div className="sticky top-0 z-20 flex items-center justify-between bg-white px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-teal/10 text-teal">
              <Icon className="size-4" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
              {job.category} Request
            </span>
            {job.status === "URGENT" && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/80 flex items-center gap-1">
                <Sparkles className="size-3" /> Urgent
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-navy transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {/* MODAL BODY (Scrollable without visible scrollbars) */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 sm:px-6 pb-6 space-y-5"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {/* SECTION 1: Customer Profile Header Card */}
          <div className="rounded-2xl bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-[#123B5D]/20 bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center shadow-xs select-none">
                  {job.customer.avatarUrl ? (
                    <img
                      src={job.customer.avatarUrl}
                      alt={job.customer.firstName || "Customer"}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover rounded-full"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                        const fallback = e.currentTarget.parentElement?.querySelector("span");
                        if (fallback) fallback.classList.remove("sr-only");
                      }}
                    />
                  ) : null}
                  <span
                    className={`text-xl font-black text-[#123B5D] uppercase ${
                      job.customer.avatarUrl ? "sr-only" : ""
                    }`}
                  >
                    {(job.customer.firstName || job.customer.fullName || "C").trim().charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-extrabold text-navy truncate">
                      {job.customer.fullName || job.customer.firstName}
                    </h3>
                    {job.customer.isVerified && (
                      <span className="inline-flex items-center text-teal" title="NADRA Phone Verified Customer">
                        <ShieldCheck className="size-4" />
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
                    {job.customer.rating > 0 ? (
                      <span className="flex items-center gap-1 text-[#F59E0B] font-bold">
                        <Star className="size-3.5 fill-[#F59E0B] stroke-none" />
                        {job.customer.rating.toFixed(1)}
                        <span className="text-slate-400 font-normal">
                          ({job.customer.reviewCount ?? 0} reviews)
                        </span>
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">New Customer</span>
                    )}
                    {job.customer.totalOrders > 0 && (
                      <>
                        {job.customer.rating > 0 && <span className="text-slate-300">·</span>}
                        <span className="text-navy font-bold">
                          {job.customer.totalOrders} Orders Completed
                        </span>
                      </>
                    )}
                    {job.customer.memberSince && job.customer.memberSince !== "—" && (
                      <>
                        <span className="text-slate-300 hidden sm:inline">·</span>
                        <span className="text-slate-400 text-[11px] hidden sm:inline">
                          Member since {job.customer.memberSince}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-block rounded-full bg-slate-200/70 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                  {job.uploadedTime}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION 2: Key Job Specifications & Location */}
          <div className="space-y-3 pt-1 min-w-0 max-w-full">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-navy leading-tight break-words [overflow-wrap:anywhere] [word-break:break-word]">
              {job.title}
            </h2>

            {/* Quick Metadata Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="flex items-start gap-3 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-xl bg-teal/15 text-teal shrink-0 mt-0.5 shadow-2xs">
                  <MapPin className="size-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-0.5">
                    {isUrdu ? "علاقہ / سیکٹر" : "Area / Sector"} ({job.distance})
                  </span>
                  <p className="font-extrabold text-navy text-sm sm:text-base leading-snug break-words [overflow-wrap:anywhere]">
                    {job.locationArea}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`flex size-9 items-center justify-center rounded-xl shrink-0 mt-0.5 shadow-2xs ${
                    isUrgent
                      ? "bg-amber-100 text-amber-700 border border-amber-200"
                      : "bg-orange/15 text-orange"
                  }`}
                >
                  {isUrgent ? (
                    <Zap className="size-4.5 fill-current text-amber-600" />
                  ) : (
                    <Calendar className="size-4.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-0.5">
                    {isUrdu ? "ترجیحی وقت" : "Preferred Visit Window"}
                  </span>
                  <p
                    className={`font-extrabold text-sm sm:text-base leading-snug break-words [overflow-wrap:anywhere] ${
                      isUrgent ? "text-amber-800" : "text-navy"
                    }`}
                  >
                    {formatPreferredTiming(job.preferredTiming, isUrdu, isUrgent)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Complete Problem Description */}
          <div className="space-y-2 pt-2 min-w-0 max-w-full">
            <h4 className="text-sm sm:text-base font-extrabold text-navy">
              {isUrdu ? "تفصیلی وضاحت" : "Detailed Description"}
            </h4>
            <p className="text-sm sm:text-[15px] font-normal leading-relaxed text-slate-900 break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap min-w-0 max-w-full">
              {job.description}
            </p>
          </div>

          {/* SECTION 4: Attached Media (Images + Voice Note) */}
          {(validImages.length > 0 || voiceNoteData) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm sm:text-base font-extrabold text-navy">
                  {isUrdu ? "منسلک تصویر اور وائس نوٹ" : "Attached Media & Voice Note"}
                </h4>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  {validImages.length > 0 && (
                    <span>
                      {validImages.length} {validImages.length === 1 ? (isUrdu ? "تصویر" : "Photo") : (isUrdu ? "تصاویر" : "Photos")}
                    </span>
                  )}
                  {validImages.length > 0 && voiceNoteData && <span>•</span>}
                  {voiceNoteData && (
                    <span className="text-teal font-bold flex items-center gap-1">
                      <Volume2 className="size-3.5" />
                      <span>{isUrdu ? "وائس نوٹ" : "Voice Note"}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Photos Gallery */}
              {validImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {validImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImagePreview(imgUrl)}
                      className="group relative h-28 sm:h-32 cursor-pointer overflow-hidden rounded-xl bg-slate-100 hover:opacity-95 transition-opacity border border-slate-200/80"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-navy/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="size-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Voice Message Player (Full variant with real audio playback) */}
              {voiceNoteData && (
                <VoicePlayer voiceNote={voiceNoteData} variant="full" />
              )}
            </div>
          )}


        </div>

        {/* MODAL BOTTOM ACTION / FOOTER */}
        <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-md px-4 sm:px-6 py-3.5 space-y-2">
          {sendError && (
            <p
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700"
              role="alert"
            >
              {sendError}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-5 h-10 cursor-pointer"
            >
              {isUrdu ? "بند کریں" : "Close"}
            </Button>

            <Button
              type="button"
              onClick={handleSendOffer}
              disabled={isSending || isSent}
              className={`rounded-full text-xs sm:text-sm font-bold px-6 h-10 shadow-md transition-all cursor-pointer flex items-center gap-1.5 ${
                isSent
                  ? "bg-[#16A34A] hover:bg-[#16A34A] text-white"
                  : "bg-teal hover:bg-teal/90 text-white shadow-teal/20"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>{isUrdu ? "آفر بھیجی جا رہی ہے..." : "Sending Offer..."}</span>
                </>
              ) : isSent ? (
                <>
                  <CheckCircle2 className="size-4" />
                  <span>
                    {isUrdu
                      ? `آفر بھیج دی گئی (روپے ${visitCharge})`
                      : `Offer Sent (Rs. ${visitCharge})`}
                  </span>
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  <span>
                    {isUrdu
                      ? `روپے ${visitCharge} میں آفر بھیجیں`
                      : `Send Offer for Rs. ${visitCharge}`}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* IMAGE ZOOM OVERLAY (If clicked thumbnail) */}
        {selectedImagePreview && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-navy/90 p-4"
            onClick={() => setSelectedImagePreview(null)}
          >
            <button
              type="button"
              onClick={() => setSelectedImagePreview(null)}
              className="absolute top-4 right-4 flex size-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <X className="size-6" />
            </button>
            <div className="relative max-h-[85vh] max-w-[90vw] flex items-center justify-center overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImagePreview}
                alt="Enlarged attachment"
                decoding="async"
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
