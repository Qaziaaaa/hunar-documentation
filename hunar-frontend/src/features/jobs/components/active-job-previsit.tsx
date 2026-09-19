"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import { VoiceNotePlayer } from "@/components/shared/voice-note-player";
import { VisitActionFlow } from "./visit-action-flow";
import {
  Phone,
  MessageSquare,
  XCircle,
  MapPin,
  Calendar,
  ShieldCheck,
  Star,
  CheckCircle,
  User,
} from "lucide-react";

interface ActiveJobPreVisitProps {
  job: JobRequest;
  offer?: VisitOffer;
}

export function ActiveJobPreVisit({ job, offer }: ActiveJobPreVisitProps) {
  const [showCallModal, setShowCallModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);

  const agreedVisitCharge =
    offer?.agreedVisitCharge ??
    offer?.visitCharge ??
    job.customerSuggestedPrice ??
    800;

  const getTimelineStepIndex = (status: JobRequest["status"]) => {
    switch (status) {
      case "accepted":
        return 1;
      case "visit_in_progress":
        return 2;
      case "visit_completed":
        return 3;
      case "inspecting":
        return 4;
      case "inspection_submitted":
      case "repair_negotiating":
      case "repair_approved":
      case "completed":
        return 5;
      default:
        return 1;
    }
  };

  const currentStep = getTimelineStepIndex(job.status);
  const timelineSteps = ["Confirmed", "En Route", "Arrived", "Inspection", "Repair"];

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError("Reason is required.");
      return;
    }
    workerStore.cancelJob(job.id, cancelReason);
    setShowCancelModal(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in">
      {/* Top Banner: Status & Agreed Visit Charge */}
      <div className="bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] rounded-3xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white font-bold text-[11px]">
            Active Job #{job.id}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {job.title}
          </h1>
          <p className="text-xs text-teal-100 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>{job.location.fullAddress}</span>
          </p>
        </div>

        <div className="bg-white/10 rounded-2xl p-3 sm:p-4 border border-white/20 text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-teal-200 block">
            Agreed Visit Fee
          </span>
          <span className="text-xl sm:text-2xl font-black text-white">
            {formatRs(agreedVisitCharge)}
          </span>
        </div>
      </div>

      {/* Progress Timeline Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center">
          {timelineSteps.map((title, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div
                key={idx}
                className={`py-2 px-1 rounded-xl border transition-all ${
                  isCurrent
                    ? "bg-teal-50 border-[#0F8B8D]"
                    : isDone
                    ? "bg-slate-50 border-slate-200"
                    : "bg-white border-slate-100 opacity-60"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full mx-auto flex items-center justify-center text-[10px] font-bold mb-1 ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-[#0F8B8D] text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {isDone ? <CheckCircle className="w-3 h-3" /> : stepNum}
                </div>
                <span
                  className={`text-[11px] font-bold block truncate ${
                    isCurrent ? "text-[#0F8B8D]" : "text-slate-700"
                  }`}
                >
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Col (7 cols): Customer Profile & Job Info */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            {/* Customer Bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-100 overflow-hidden flex items-center justify-center shrink-0">
                  {job.customer.avatarUrl ? (
                    <img
                      src={job.customer.avatarUrl}
                      alt={job.customer.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-[#0F8B8D]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      {job.customer.name}
                    </h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Star className="w-3 h-3 fill-current text-amber-500" />
                    <span className="font-bold text-slate-700">{job.customer.rating}</span>
                    <span>({job.customer.totalReviews})</span>
                  </div>
                </div>
              </div>

              {/* Call / Chat Actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCallModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[#0F8B8D]" />
                  <span>Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert(`Chat with ${job.customer.name}`)}
                  className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-[#0F8B8D] text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat</span>
                </button>
              </div>
            </div>

            {/* Visit Time & Locality */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Scheduled Time
                </span>
                <span className="font-semibold text-slate-800">
                  {job.preferredVisitWindow.timeSlot}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Area
                </span>
                <span className="font-semibold text-slate-800 truncate block">
                  {job.location.area}
                </span>
              </div>
            </div>

            {/* Problem Text */}
            <div className="pt-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Problem
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                {job.description}
              </p>
            </div>

            {/* Voice Note */}
            {job.voiceNote && (
              <div className="pt-1">
                <VoiceNotePlayer
                  url={job.voiceNote.url}
                  durationSeconds={job.voiceNote.durationSeconds}
                  waveform={job.voiceNote.waveform}
                />
              </div>
            )}

            {/* Cancel Action */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Cancel Job
              </button>
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Visit & Inspection Flow */}
        <div className="lg:col-span-5 space-y-5">
          <VisitActionFlow job={job} offer={offer} />
        </div>
      </div>

      {/* Call Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-xl border border-slate-100 text-center space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              Call Customer
            </h3>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-sm font-bold text-slate-800">
              {job.customer.phone}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Close
              </button>
              <a
                href={`tel:${job.customer.phone}`}
                className="flex-1 py-2 text-xs font-bold bg-[#0F8B8D] text-white rounded-xl hover:bg-[#0B7F74]"
              >
                Dial
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-xl border border-slate-100 space-y-3">
            <div className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
              <XCircle className="w-4 h-4" />
              <span>Cancel Job</span>
            </div>

            {cancelError && (
              <p className="text-xs text-red-600 font-semibold">{cancelError}</p>
            )}

            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-300"
              required
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 text-xs text-slate-500 rounded-xl hover:bg-slate-100"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleCancelSubmit}
                className="px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
