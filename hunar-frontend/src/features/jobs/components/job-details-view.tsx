"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import { VoiceNotePlayer } from "@/components/shared/voice-note-player";
import { SendVisitOfferDialog } from "@/features/negotiation/components/send-visit-offer-dialog";
import { OfferStatusBadge } from "@/features/negotiation/components/offer-status-badge";
import { CounterOfferPanel } from "@/features/negotiation/components/counter-offer-panel";
import { ActiveJobPreVisit } from "./active-job-previsit";
import {
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Send,
  Star,
  ArrowLeft,
  Flame,
} from "lucide-react";

interface JobDetailsViewProps {
  job: JobRequest;
  workerOffer?: VisitOffer;
}

export function JobDetailsView({ job, workerOffer }: JobDetailsViewProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [showOfferDialog, setShowOfferDialog] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // If the job is active, show the ActiveJobPreVisit screen directly
  const isActiveState =
    job.status === "accepted" ||
    job.status === "visit_in_progress" ||
    job.status === "visit_completed" ||
    job.status === "inspecting" ||
    job.status === "inspection_submitted" ||
    job.status === "repair_negotiating" ||
    job.status === "repair_approved";

  if (isActiveState) {
    return (
      <div className="space-y-4">
        <Link
          href={`/${locale}/worker`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F8B8D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <ActiveJobPreVisit job={job} offer={workerOffer} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Back Link */}
      <div>
        <Link
          href={`/${locale}/worker`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#0F8B8D] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-[#0F8B8D] font-bold text-xs">
                {job.category}
              </span>
              {job.urgency === "emergency" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-700 font-bold text-xs">
                  <Flame className="w-3 h-3 text-red-600" />
                  Emergency
                </span>
              )}
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{job.postedAgo}</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {job.title}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-[#0F8B8D] shrink-0" />
              <span className="font-semibold text-slate-800">{job.location.fullAddress}</span>
              <span className="text-slate-400">({job.location.distanceKm} km away)</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-left md:text-right shrink-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Suggested Visit
            </span>
            <span className="text-2xl font-black text-[#123B5D]">
              {job.customerSuggestedPrice
                ? formatRs(job.customerSuggestedPrice)
                : "Open"}
            </span>
          </div>
        </div>

        {/* Offer Status Badge */}
        {workerOffer && (
          <div className="pt-1">
            <OfferStatusBadge status={workerOffer.status} />
          </div>
        )}
      </div>

      {/* Counter Offer Panel if in negotiation */}
      {workerOffer && workerOffer.status === "counter_received" && (
        <CounterOfferPanel jobId={job.id} offer={workerOffer} />
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (8 cols): Description, Voice, Photos, Map */}
        <div className="lg:col-span-8 space-y-5">
          {/* Problem Description */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Problem Description
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Playable Voice Note */}
          {job.voiceNote && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Voice Note
              </h2>
              <VoiceNotePlayer
                url={job.voiceNote.url}
                durationSeconds={job.voiceNote.durationSeconds}
                waveform={job.voiceNote.waveform}
              />
            </div>
          )}

          {/* Photos */}
          {job.photos && job.photos.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Photos ({job.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {job.photos.map((photo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="h-32 rounded-2xl overflow-hidden border border-slate-200 cursor-zoom-in group"
                  >
                    <img
                      src={photo}
                      alt={`Photo ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Location & Map Preview */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Location
            </h2>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-700">
              <MapPin className="w-4 h-4 text-[#0F8B8D] shrink-0" />
              <span>{job.location.fullAddress}</span>
            </div>

            <div className="h-36 w-full rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-3 py-1.5 rounded-full shadow-xs">
                <MapPin className="w-3.5 h-3.5 text-[#0F8B8D]" />
                <span>{job.location.area}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Window, Customer, Action */}
        <div className="lg:col-span-4 space-y-5">
          {/* Preferred Window */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Preferred Visit Time
            </span>
            <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5 text-[#0F8B8D]" />
              <span>{job.preferredVisitWindow.date}</span>
            </div>
            <p className="text-xs text-slate-500 pl-5">
              {job.preferredVisitWindow.timeSlot}
            </p>
          </div>

          {/* Customer Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-xs space-y-2.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Customer
            </span>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                {job.customer.avatarUrl ? (
                  <img
                    src={job.customer.avatarUrl}
                    alt={job.customer.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#123B5D] font-bold">
                    {job.customer.name[0]}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-1 font-bold text-slate-900 text-xs sm:text-sm">
                  <span>{job.customer.name}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{job.customer.rating}</span>
                  <span className="text-slate-400 font-normal">
                    ({job.customer.totalReviews})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action: Send Visit Offer */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            {!workerOffer ? (
              <button
                type="button"
                onClick={() => setShowOfferDialog(true)}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send Visit Offer</span>
              </button>
            ) : (
              <div className="p-3 bg-teal-50 border border-teal-100 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-[#0F8B8D] block">Your Quote</span>
                <div className="flex justify-between text-slate-800 font-bold">
                  <span>Visit Charge:</span>
                  <span>{formatRs(workerOffer.visitCharge)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Dialog */}
      <SendVisitOfferDialog
        jobId={job.id}
        jobTitle={job.title}
        customerSuggestedPrice={job.customerSuggestedPrice}
        isOpen={showOfferDialog}
        onClose={() => setShowOfferDialog(false)}
        onSuccess={() => {}}
      />

      {/* Lightbox */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs cursor-pointer animate-in fade-in"
        >
          <div className="max-w-2xl max-h-[85vh] rounded-2xl overflow-hidden">
            <img
              src={selectedPhoto}
              alt="Inspection enlarged view"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
