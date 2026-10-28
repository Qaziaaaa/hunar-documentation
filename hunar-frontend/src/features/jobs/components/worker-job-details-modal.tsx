"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import dynamic from "next/dynamic";

const WorkerChatModal = dynamic(
  () => import("./worker-chat-modal").then((mod) => mod.WorkerChatModal),
  { ssr: false }
);
import { VoicePlayer } from "@/features/worker-dashboard/components/voice-player";
import {
  X,
  MapPin,
  Calendar,
  Clock,
  Phone,
  MessageSquare,
  Play,
  Pause,
  Volume2,
  Navigation,
  CheckCircle2,
  Star,
  ImageIcon,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Zap,
} from "lucide-react";

interface WorkerJobDetailsModalProps {
  job: JobRequest;
  offer?: VisitOffer;
  isOpen: boolean;
  onClose: () => void;
  onStartVisit?: (jobId: string) => void;
}

export function WorkerJobDetailsModal({
  job,
  offer,
  isOpen,
  onClose,
  onStartVisit,
}: WorkerJobDetailsModalProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isUrdu = locale === "ur";

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const jobPhotos =
    job.photos && job.photos.length > 0
      ? job.photos
      : Array.isArray((job as any).images)
      ? (job as any).images
      : [];

  const voiceNoteData =
    job.voiceNote ||
    ((job as any).voiceNoteUrl
      ? {
          url: (job as any).voiceNoteUrl,
          waveform: [30, 60, 45, 90, 75, 40, 65, 80, 50, 70, 95, 40, 60, 30],
        }
      : undefined);

  if (!isOpen) return null;

  const isCompleted = job.status === "completed";

  const agreedVisitCharge =
    (isCompleted && job.visitCharge !== undefined)
      ? job.visitCharge
      : (offer?.agreedVisitCharge ??
         offer?.visitCharge ??
         job.visitCharge ??
         job.customerSuggestedPrice ??
         0);

  const isEnRoute = job.status === "visit_in_progress";

  const handleStartDispatch = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsStarting(true);
    if (!isEnRoute) {
      workerStore.startVisit(job.id);
      if (onStartVisit) {
        onStartVisit(job.id);
      }
    }
    onClose();
    router.push(`/worker/jobs/${job.id}`);
  };

  const isToday =
    job.preferredVisitWindow.date.toLowerCase().includes("today");

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in"
        onClick={onClose}
      >
        {/* Modal Window */}
        <div
          className="bg-white text-slate-900 w-full max-w-xl lg:max-w-4xl xl:max-w-5xl rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ======================================================== */}
          {/* 1. MODAL HEADER */}
          {/* ======================================================== */}
          <div className="bg-white border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between gap-3 sticky top-0 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] font-extrabold text-[11px] uppercase tracking-wider border border-[#0F8B8D]/20">
                {job.category}
              </span>
              {!isCompleted && job.status !== "completed" && job.urgency === "emergency" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-600 font-extrabold text-[11px] uppercase tracking-wider border border-rose-200">
                  <AlertTriangle className="size-3" />
                  <span>Emergency</span>
                </span>
              )}
              {isCompleted ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                  <CheckCircle2 className="size-3" />
                  <span>Completed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#123B5D]/10 text-[#123B5D] font-bold text-[11px] border border-[#123B5D]/20">
                  <span>Scheduled Visit</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-400">
                #{job.id}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. SCROLLABLE MODAL BODY */}
          {/* ======================================================== */}
          <div
            className="p-4 sm:p-6 lg:p-7 overflow-y-auto overflow-x-hidden scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden bg-white"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-7">
              {/* Left Column: Job Info, Problem Details, Voice Note, Attached Photos */}
              <div className="lg:col-span-7 space-y-5 min-w-0">
                {/* Title & Timing Row */}
                <div className="min-w-0">
                  <h2 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 leading-snug tracking-tight break-words [overflow-wrap:anywhere]">
                    {job.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-semibold">
                      <Clock className="size-3.5 text-slate-400" />
                      <span>Posted {job.postedAgo || "recently"}</span>
                    </span>
                    <span>•</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        isToday
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {job.preferredVisitWindow.timeSlot.includes("Immediate") || (job as any).isUrgent ? (
                        <Zap className="size-3 fill-current text-amber-600" />
                      ) : (
                        <Calendar className="size-3" />
                      )}
                      <span>{job.preferredVisitWindow.date} ({job.preferredVisitWindow.timeSlot.replace(/^⚡\s*/, "")})</span>
                    </span>
                  </div>
                </div>

                {/* Problem Description */}
                <div className="space-y-1.5 min-w-0 max-w-full">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Problem Description
                  </h4>
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal break-words [overflow-wrap:anywhere] [word-break:break-word] whitespace-pre-wrap min-w-0 max-w-full">
                    {job.description || job.problemSummary}
                  </div>
                </div>

                {/* Voice Note Attachment (if present) */}
                {voiceNoteData?.url && (
                  <div className="space-y-1.5">
                    <VoicePlayer
                      voiceNote={{
                        audioUrl: voiceNoteData.url,
                        waveformPattern: voiceNoteData.waveform,
                      }}
                      variant="full"
                    />
                  </div>
                )}

                {/* Attached Photos (if present) */}
                {jobPhotos && jobPhotos.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <ImageIcon className="size-3.5 text-[#0F8B8D]" />
                      <span>Attached Photos ({jobPhotos.length})</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {jobPhotos.map((photo: string, idx: number) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedPhoto(photo)}
                          className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 group cursor-pointer hover:border-[#0F8B8D] transition-colors"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo}
                            alt={`Attachment ${idx + 1}`}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-200"
                            loading="lazy"
                            decoding="async"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                            <ExternalLink className="size-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Agreed Fee, Customer Profile, Address & Logistics */}
              <div className="lg:col-span-5 space-y-4">
                {/* Agreed Financial Summary Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                        {isCompleted ? "Total Net Settlement" : "Agreed Doorstep Visit Fee"}
                      </span>
                      <div className="text-xl sm:text-2xl font-black text-[#123B5D] mt-0.5">
                        {formatRs(isCompleted ? (job.workerNetEarnings ?? (agreedVisitCharge - Math.round(agreedVisitCharge * 0.1))) : agreedVisitCharge)}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    Locked visit fee. Payout is credited upon doorstep arrival and verification.
                  </p>
                </div>

                {/* Customer Profile & Instant Contact */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 sm:size-12 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-sm">
                        {job.customer.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={job.customer.avatarUrl}
                            alt={job.customer.name}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : null}
                        {(!job.customer.avatarUrl) && (
                          job.customer.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                            {job.customer.name}
                          </h4>
                          {job.customer.isVerified && (
                            <span className="size-4 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center text-[10px] font-bold" title="Verified Customer">
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <Star className="size-3 text-[#F59E0B] fill-[#F59E0B]" />
                          <span className="font-bold text-slate-700">{job.customer.rating}</span>
                          <span>({job.customer.totalReviews} reviews)</span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Call & Message CTAs */}
                    <div className="flex items-center gap-2">
                      {job.customer.phone && (
                        <a
                          href={`tel:${job.customer.phone}`}
                          className="size-9 sm:size-10 rounded-xl bg-success/10 hover:bg-success text-success hover:text-white border border-success/20 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                          title="Call Customer"
                        >
                          <Phone className="size-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="size-9 sm:size-10 rounded-xl bg-teal/10 hover:bg-teal text-teal hover:text-white border border-teal/20 flex items-center justify-center transition-all shadow-2xs cursor-pointer"
                        title="Message Customer"
                      >
                        <MessageSquare className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Customer Location & Address Details */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-[#0F8B8D]">
                      <MapPin className="size-3.5" />
                      <span>Customer Address</span>
                    </span>
                    <span className="text-slate-600 font-extrabold normal-case">
                      {job.location.distanceKm} km away
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                    {job.location.fullAddress}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {job.location.area}, {job.location.city}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 3. MODAL FOOTER ACTIONS */}
          {/* ======================================================== */}
          <div className="bg-white border-t border-slate-100 p-4 sm:p-5 flex items-center justify-between gap-3 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-colors cursor-pointer"
            >
              Close
            </button>

            {!isCompleted ? (
              <button
                type="button"
                onClick={handleStartDispatch}
                disabled={isStarting}
                className="py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl bg-[#0F8B8D] hover:bg-[#123B5D] text-white text-xs sm:text-sm font-extrabold shadow-md shadow-[#0F8B8D]/20 transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Navigation className="size-4 shrink-0" />
                <span>{isEnRoute ? "View Live Tracking" : "Start Visit & En Route"}</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Job Completed &amp; Settled</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Large Image Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Preview"
              decoding="async"
              className="max-w-full max-h-[80vh] object-contain"
            />
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 size-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}

      {/* Embedded Worker Chat Modal */}
      {showChatModal && (
        <WorkerChatModal
          job={job}
          isOpen={showChatModal}
          onClose={() => setShowChatModal(false)}
          onCallCustomer={() => {
            if (job.customer.phone) {
              window.open(`tel:${job.customer.phone}`);
            }
          }}
        />
      )}
    </>
  );
}
