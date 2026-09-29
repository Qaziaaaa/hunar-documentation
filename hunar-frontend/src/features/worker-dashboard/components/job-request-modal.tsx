"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { VoicePlayer } from "./voice-player";
import { Button } from "@/components/ui/button";
import { submitWorkerOffer } from "@/services/worker/offers.service";
import { isMockMode } from "@/lib/data-source";
import { ApiError } from "@/lib/api-client";
import type { JobRequest } from "../types";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Electrician: Zap,
  Plumber: Wrench,
  "AC Technician": AirVent,
  "Solar Technician": SunMedium,
  Carpenter: Hammer,
  Painter: Paintbrush,
  Welder: Flame,
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

  const visitCharge = job?.suggestedVisitCharge ?? 300;

  const handleSendOffer = async () => {
    if (!job || isSending || isSent) return;
    setIsSending(true);
    setSendError(null);
    try {
      if (!isMockMode()) {
        await submitWorkerOffer(job.id, visitCharge);
      }
      setIsSending(false);
      setIsSent(true);
      onOfferSent?.(job.id, visitCharge);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setIsSending(false);
      if (err instanceof ApiError && err.status === 401) {
        setSendError("Your session expired. Please sign in again to send an offer.");
      } else if (err instanceof ApiError && err.status === 403) {
        setSendError("Sign in with a worker account to send offers.");
      } else if (err instanceof ApiError && err.status === 409) {
        setSendError("You already sent an offer for this job.");
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
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

        {/* MODAL BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 space-y-5">
          {/* SECTION 1: Customer Profile Header Card */}
          <div className="rounded-2xl bg-slate-50/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full border border-teal/20 bg-white shadow-xs">
                  <Image
                    src={job.customer.avatarUrl}
                    alt={job.customer.firstName}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
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
                    <span className="flex items-center gap-1 text-[#F59E0B] font-bold">
                      <Star className="size-3.5 fill-[#F59E0B] stroke-none" />
                      {job.customer.rating.toFixed(1)}
                      <span className="text-slate-400 font-normal">
                        ({job.customer.reviewCount || 15})
                      </span>
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-navy font-bold">
                      {job.customer.totalOrders} Orders Completed
                    </span>
                    {job.customer.memberSince && (
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
          <div className="space-y-3 pt-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-navy leading-tight">
              {job.title}
            </h2>

            {/* Quick Metadata Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-teal/15 text-teal shrink-0 mt-0.5 shadow-2xs">
                  <MapPin className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-0.5">
                    {isUrdu ? "مقام" : "Location"} ({job.distance})
                  </span>
                  <p className="font-extrabold text-navy text-sm sm:text-base leading-snug">
                    {job.fullAddress || job.locationArea}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-orange/15 text-orange shrink-0 mt-0.5 shadow-2xs">
                  <Calendar className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block mb-0.5">
                    {isUrdu ? "ترجیحی وقت" : "Preferred Visit Window"}
                  </span>
                  <p className="font-extrabold text-navy text-sm sm:text-base leading-snug">
                    {job.preferredTiming || (isUrdu ? "کسی بھی وقت" : "Flexible Timing")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Complete Problem Description */}
          <div className="space-y-2 pt-2">
            <h4 className="text-sm sm:text-base font-extrabold text-navy">
              {isUrdu ? "تفصیلی وضاحت" : "Detailed Description"}
            </h4>
            <p className="text-sm sm:text-[15px] font-normal leading-relaxed text-slate-900">
              {job.description}
            </p>
          </div>

          {/* SECTION 4: Attached Media (Images + Voice Note) */}
          {(job.images?.length > 0 || job.voiceNote) && (
            <div className="space-y-2.5 pt-2">
              <h4 className="text-sm sm:text-base font-extrabold text-navy">
                {isUrdu ? "منسلک تصویر اور وائس نوٹ" : "Attached Media & Voice Note"}
              </h4>

              {/* Photos Gallery */}
              {job.images && job.images.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {job.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImagePreview(imgUrl)}
                      className="group relative h-28 sm:h-32 cursor-pointer overflow-hidden rounded-xl bg-slate-100 hover:opacity-95 transition-opacity"
                    >
                      <Image
                        src={imgUrl}
                        alt={`Attachment ${idx + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                        sizes="(max-width: 640px) 50vw, 200px"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-navy/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Maximize2 className="size-5 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Voice Message Player (Full variant) */}
              {job.voiceNote && (
                <VoicePlayer voiceNote={job.voiceNote} variant="full" />
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
            <div className="relative max-h-[85vh] max-w-[90vw] aspect-4/3 w-[600px] overflow-hidden rounded-2xl">
              <Image
                src={selectedImagePreview}
                alt="Enlarged attachment"
                fill
                className="object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
