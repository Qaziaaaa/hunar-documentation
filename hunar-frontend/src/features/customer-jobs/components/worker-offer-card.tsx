"use client";

import { CheckCircle2, Clock, MapPin, ShieldCheck, Star, User } from "lucide-react";
import { useLocale } from "next-intl";
import type { WorkerOffer } from "../types";

interface WorkerOfferCardProps {
  offer: WorkerOffer;
  onViewProfile: (offer: WorkerOffer) => void;
  onSelectWorker: (offer: WorkerOffer) => void;
}

export function WorkerOfferCard({
  offer,
  onViewProfile,
  onSelectWorker,
}: WorkerOfferCardProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const { worker } = offer;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 transition-all duration-200 hover:shadow-md space-y-4">
      {/* Top Header: Worker Portrait & Identity */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3.5">
          {/* Avatar with Verified Badge */}
          <div className="relative size-14 sm:size-16 rounded-2xl overflow-hidden shrink-0 shadow-2xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={worker.avatarUrl}
              alt={worker.name}
              className="w-full h-full object-cover"
            />
            {worker.isCnicVerified && (
              <span
                className="absolute bottom-0.5 right-0.5 rtl:right-auto rtl:left-0.5 size-4.5 rounded-full bg-[#16A34A] text-white flex items-center justify-center ring-2 ring-white"
                title={isUrdu ? "نادرا سی این آئی سی تصدیق شدہ پرو" : "NADRA CNIC Verified Pro"}
              >
                <CheckCircle2 className="size-3" />
              </span>
            )}
          </div>

          {/* Worker Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm sm:text-base font-bold text-[#123B5D]">
                {worker.name}
              </h4>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-[10px] font-bold">
                <ShieldCheck className="size-3" />
                {isUrdu ? "تصدیق شدہ پرو" : "Verified Pro"}
              </span>
            </div>

            {worker.businessName && (
              <p className="text-xs text-slate-500 font-medium">
                {worker.businessName}
              </p>
            )}

            {/* Rating & Stats */}
            <div className="flex items-center gap-2 pt-0.5 text-xs">
              <span className="flex items-center text-[#F59E0B] font-bold">
                <Star className="size-3.5 fill-[#F59E0B] mr-0.5 rtl:mr-0 rtl:ml-0.5" />
                {worker.rating.toFixed(1)}
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500 font-medium">
                {isUrdu ? `(${worker.completedJobsCount} مکمل کام)` : `(${worker.completedJobsCount} jobs completed)`}
              </span>
            </div>
          </div>
        </div>

        {/* Visit Fee & ETA Column */}
        <div className="text-left sm:text-right rtl:sm:text-left flex sm:flex-col justify-between items-center sm:items-end rtl:sm:items-start border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
          <div>
            <span className="text-[11px] text-slate-400 block font-medium">
              {isUrdu ? "وزٹ و معائنہ فیس" : "Visit & Diagnostic Fee"}
            </span>
            <span className="text-base sm:text-xl font-extrabold text-[#0F766E]">
              Rs. {offer.visitFee.toLocaleString()}
            </span>
          </div>

          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 sm:mt-1">
            <Clock className="size-3 text-[#0F766E]" />
            <span>{offer.estimatedArrival}</span>
          </div>
        </div>
      </div>

      {/* Technician Note if provided */}
      {offer.note && (
        <div className="p-2.5 rounded-xl bg-slate-50/80 text-xs text-slate-600 leading-relaxed">
          <span className="font-semibold text-[#123B5D]">
            {isUrdu ? "کاریگر کا نوٹ: " : "Pro Note: "}
          </span>
          {offer.note}
        </div>
      )}

      {/* Verified Badges Pill Bar */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-slate-50 text-slate-600">
          <MapPin className="size-3 text-[#0F766E]" />
          {isUrdu ? `${offer.distanceKm} کلومیٹر دور` : `${offer.distanceKm} km away`}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-slate-50 text-slate-600">
          <Clock className="size-3 text-slate-400" />
          {isUrdu ? `جواب: ${worker.responseTime}` : `Resp: ${worker.responseTime}`}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-slate-50 text-slate-600">
          <ShieldCheck className="size-3 text-[#16A34A]" />
          {isUrdu ? "نادرا تصدیق شدہ" : "NADRA Cleared"}
        </span>
      </div>

      {/* Clean 2-Action Buttons (No Negotiation) */}
      <div className="flex items-center gap-2.5 pt-1">
        <button
          type="button"
          onClick={() => onViewProfile(offer)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
        >
          <User className="size-3.5 text-slate-500" />
          <span>{isUrdu ? "پروفائل دیکھیں" : "View Profile"}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectWorker(offer)}
          className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
        >
          <CheckCircle2 className="size-4" />
          <span>{isUrdu ? "کاریگر منتخب کریں" : "Select Worker"}</span>
        </button>
      </div>
    </div>
  );
}

