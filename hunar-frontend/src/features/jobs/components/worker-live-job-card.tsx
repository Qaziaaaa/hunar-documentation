"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore } from "@/stores/worker-jobs-store";
import {
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Wrench,
  Clock,
} from "lucide-react";

interface WorkerLiveJobCardProps {
  job: JobRequest;
  offer?: VisitOffer;
  onOpenChat?: (customerId: string, customerName: string) => void;
}

export function WorkerLiveJobCard({
  job,
  offer,
}: WorkerLiveJobCardProps) {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [copiedPin, setCopiedPin] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const agreedVisitCharge =
    offer?.agreedVisitCharge ??
    offer?.visitCharge ??
    job.visitCharge ??
    job.customerSuggestedPrice ??
    800;

  const commissionHold = Math.round(agreedVisitCharge * 0.1);
  const netEarnings = agreedVisitCharge - commissionHold;
  const securityPin = job.securityPin || "7294";
  const etaMinutes = job.etaMinutes || 12;

  const handleCopyPin = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(securityPin);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const getStatusDetails = () => {
    switch (job.status) {
      case "visit_in_progress":
        return {
          stepIndex: 2,
          label: "En Route to Site",
          badgeBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
          desc: `Heading to ${job.location.area}. Estimated arrival in ~${etaMinutes} mins.`,
          nextActionLabel: "I've Arrived at Site",
          actionType: "arrive",
        };
      case "visit_completed":
      case "inspecting":
        return {
          stepIndex: 3,
          label: "At Doorstep / Inspecting",
          badgeBg: "bg-teal-500/10 text-teal-600 border-teal-500/20",
          desc: "Perform on-site diagnosis, take photos, and submit repair plan.",
          nextActionLabel: "Open Inspection Form",
          actionType: "inspect",
        };
      case "inspection_submitted":
      case "repair_negotiating":
        return {
          stepIndex: 4,
          label: "Quotation Review",
          badgeBg: "bg-purple-500/10 text-purple-600 border-purple-500/20",
          desc: "Customer is reviewing your repair proposal and quotation.",
          nextActionLabel: "View Quotation Status",
          actionType: "quote",
        };
      case "repair_approved":
      case "repair_in_progress":
        return {
          stepIndex: 5,
          label: "Repair in Progress",
          badgeBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
          desc: "Executing approved repair work with genuine parts & testing.",
          nextActionLabel: "Complete Repair & Invoice",
          actionType: "complete",
        };
      default:
        return {
          stepIndex: 1,
          label: "Visit Confirmed",
          badgeBg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
          desc: "Visit scheduled with customer. Prepare your toolkit and start dispatch.",
          nextActionLabel: "Start Visit & Share GPS",
          actionType: "start",
        };
    }
  };

  const statusInfo = getStatusDetails();

  const handleQuickAdvance = (e: React.MouseEvent) => {
    e.preventDefault();
    setActionError(null);
    setIsUpdatingStatus(true);

    try {
      if (statusInfo.actionType === "start") {
        workerStore.startVisit(job.id);
      } else if (statusInfo.actionType === "arrive") {
        const res = workerStore.arriveAtSite(job.id);
        if (!res.success) {
          setActionError(res.error || "Wallet hold failed");
        }
      } else if (statusInfo.actionType === "inspect") {
        workerStore.startInspection(job.id);
      }
    } catch (err: any) {
      setActionError(err.message || "Action failed");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const timelineSteps = [
    { num: 1, label: "Confirmed" },
    { num: 2, label: "En Route" },
    { num: 3, label: "Arrived" },
    { num: 4, label: "Inspect" },
    { num: 5, label: "Repair" },
  ];

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl border-2 border-[#0F8B8D]/30 shadow-sm transition-all w-full">
      {/* Top Gradient Active Beacon */}
      <div className="h-1.5 sm:h-2 bg-gradient-to-r from-[#123B5D] via-[#0F8B8D] to-[#16A34A] animate-pulse" />

      <div className="p-3.5 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header Row: Live Badge & Agreed Fee */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="relative flex size-9 sm:size-11 items-center justify-center rounded-xl sm:rounded-2xl bg-[#0F8B8D]/10 text-[#0F8B8D] shrink-0 mt-0.5 sm:mt-0">
              <Navigation className="size-4 sm:size-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 size-2.5 sm:size-3 bg-emerald-500 rounded-full ring-2 ring-white animate-ping" />
              <span className="absolute -top-1 -right-1 size-2.5 sm:size-3 bg-emerald-500 rounded-full ring-2 ring-white" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border uppercase tracking-wider ${statusInfo.badgeBg}`}>
                  🔴 LIVE
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                  #{job.id}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-[#123B5D] tracking-tight mt-0.5 leading-snug break-words">
                {job.title}
              </h2>
            </div>
          </div>

          {/* Visit Fee Chip */}
          <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-2.5 sm:px-4 sm:py-2.5 border border-slate-200/80 flex sm:flex-col justify-between items-center sm:items-end shrink-0">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Agreed Visit Fee
            </div>
            <div className="text-base sm:text-xl font-black text-[#123B5D]">
              {formatRs(agreedVisitCharge)}
            </div>
            <div className="text-[10px] text-emerald-600 font-semibold hidden sm:block">
              Net: {formatRs(netEarnings)} <span className="text-slate-400">(−{formatRs(commissionHold)})</span>
            </div>
          </div>
        </div>

        {/* 5-Step Visual Timeline */}
        <div className="bg-slate-50/80 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] font-bold text-slate-500">
            <span className="truncate">Status: <strong className="text-[#0F8B8D]">{statusInfo.label}</strong></span>
            <span className="shrink-0 ms-2">Step {statusInfo.stepIndex}/5</span>
          </div>

          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
            {timelineSteps.map((s) => {
              const isPassed = s.num <= statusInfo.stepIndex;
              const isCurrent = s.num === statusInfo.stepIndex;
              return (
                <div key={s.num} className="space-y-1 text-center min-w-0">
                  <div
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? "bg-[#0F8B8D] ring-2 ring-[#0F8B8D]/30"
                        : isPassed
                        ? "bg-emerald-500"
                        : "bg-slate-200"
                    }`}
                  />
                  <span
                    className={`text-[9px] sm:text-[10px] block font-medium truncate ${
                      isCurrent
                        ? "text-[#0F8B8D] font-bold"
                        : isPassed
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 pt-0.5 leading-relaxed">
            {statusInfo.desc}
          </p>
        </div>

        {/* Error Alert if any */}
        {actionError && (
          <div className="flex items-center gap-2 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="break-words">{actionError}</span>
          </div>
        )}

        {/* Customer & Location Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Customer Details Box */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Customer Details
              </span>
              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                <ShieldCheck className="size-3" />
                Verified
              </span>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="size-9 sm:size-11 rounded-full bg-slate-100 flex items-center justify-center font-extrabold text-slate-700 text-xs sm:text-sm overflow-hidden border border-slate-200 shrink-0">
                {job.customer.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={job.customer.avatarUrl}
                    alt={job.customer.name}
                    className="size-full object-cover"
                  />
                ) : (
                  job.customer.name.slice(0, 2).toUpperCase()
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                  {job.customer.name}
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1">
                  ⭐ {job.customer.rating} ({job.customer.totalReviews} bookings)
                </p>
              </div>
            </div>

            {/* Doorstep Verification PIN */}
            <div className="flex items-center justify-between bg-slate-50 p-2 sm:p-2.5 rounded-xl border border-slate-200/80 gap-2">
              <div className="text-[11px] sm:text-xs truncate">
                <span className="text-slate-500 font-medium">Doorstep PIN: </span>
                <span className="font-mono font-bold text-[#123B5D] tracking-widest text-xs sm:text-sm ms-1">
                  {securityPin}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyPin}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white transition-colors shrink-0"
                title="Copy PIN"
              >
                {copiedPin ? (
                  <Check className="size-3.5 sm:size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5 sm:size-4" />
                )}
              </button>
            </div>

            {/* Quick Contact Buttons */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setShowCallModal(true)}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Phone className="size-3.5 text-[#0F8B8D]" />
                <span>Call</span>
              </button>

              <Link
                href={`/${locale}/worker/jobs/${job.id}`}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1.5 text-center"
              >
                <MessageSquare className="size-3.5 text-[#0F8B8D]" />
                <span>Chat</span>
              </Link>
            </div>
          </div>

          {/* Location & Navigation Box */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Peshawar Destination
                </span>
                <span className="text-[11px] font-bold text-[#0F8B8D]">
                  {job.location.distanceKm} km (~{etaMinutes} min)
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-700">
                <MapPin className="size-4 text-[#0F8B8D] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {job.location.area}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed break-words">
                    {job.location.fullAddress}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  job.location.fullAddress
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 sm:py-2.5 px-3 rounded-xl border border-[#0F8B8D]/30 bg-teal-50/50 hover:bg-teal-50 text-[#0F8B8D] text-[11px] sm:text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation className="size-3.5 shrink-0" />
                <span className="truncate">Open Google Maps</span>
                <ExternalLink className="size-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="pt-3 sm:pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
          <div className="text-[11px] sm:text-xs text-slate-500 text-center sm:text-left">
            Slot: <strong className="text-slate-800">{job.preferredVisitWindow.timeSlot}</strong>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {statusInfo.actionType !== "quote" && (
              <button
                type="button"
                onClick={handleQuickAdvance}
                disabled={isUpdatingStatus}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                <span className="truncate">{statusInfo.nextActionLabel}</span>
              </button>
            )}

            <Link
              href={`/${locale}/worker/jobs/${job.id}`}
              className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 group text-center"
            >
              <Wrench className="size-4 shrink-0" />
              <span className="truncate">Full Inspection Flow</span>
              <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Call Customer Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0">
                <Phone className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  Contact Customer
                </h3>
                <p className="text-xs text-slate-500 truncate">{job.customer.name}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">
                Direct Phone Line
              </span>
              <p className="text-base sm:text-lg font-mono font-bold text-[#123B5D]">
                {job.customer.phone}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
              <a
                href={`tel:${job.customer.phone}`}
                className="flex-1 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold text-center hover:bg-[#0B7F74]"
              >
                Dial Now
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
