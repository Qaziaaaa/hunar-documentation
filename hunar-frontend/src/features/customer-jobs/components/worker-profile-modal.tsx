"use client";

import {
  Check,
  CheckCircle2,
  Fingerprint,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Star,
  Wrench,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import type { WorkerOffer } from "../types";

interface WorkerProfileModalProps {
  offer: WorkerOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectWorker: (offer: WorkerOffer) => void;
}

export function WorkerProfileModal({
  offer,
  isOpen,
  onClose,
  onSelectWorker,
}: WorkerProfileModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  if (!isOpen || !offer) return null;

  const { worker } = offer;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#123B5D]/10 text-[#123B5D]">
              {isUrdu ? "کاریگر کا پروفائل" : "Pro Profile"}
            </span>
            <span className="text-xs font-semibold text-[#0F766E] bg-[#0F766E]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <CheckCircle2 className="size-3.5" />
              {isUrdu ? "آج دستیاب ہے" : "Available Today"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            title={isUrdu ? "بند کریں" : "Close"}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-left rtl:text-right text-[#123B5D]">
          {/* Worker Bio & Identity Header */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
            <div className="relative size-20 sm:size-24 rounded-2xl overflow-hidden shrink-0 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={worker.avatarUrl}
                alt={worker.name}
                className="w-full h-full object-cover"
              />
              <span
                className="absolute bottom-1 right-1 rtl:right-auto rtl:left-1 bg-[#16A34A] text-white p-1 rounded-full ring-2 ring-white flex items-center justify-center"
                title={isUrdu ? "تصدیق شدہ کاریگر" : "Verified Pro"}
              >
                <Check className="size-3 stroke-[3]" />
              </span>
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-[#123B5D]">
                      {worker.name}
                    </h3>
                    {worker.businessName && (
                      <span className="text-xs text-slate-500 font-medium">
                        ({worker.businessName})
                      </span>
                    )}
                    <ShieldCheck className="size-4 text-[#16A34A]" />
                  </div>
                  <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="size-3 text-[#0F766E]" />
                    {worker.serviceArea}
                  </p>
                </div>

                <div className="text-left sm:text-right rtl:text-right rtl:sm:text-left">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {isUrdu ? "مجوزہ فیس" : "Proposed Fee"}
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-[#0F766E]">
                    Rs. {offer.visitFee.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed pt-1">
                {worker.bio}
              </p>
            </div>
          </div>

          {/* Verified Credentials Bar */}
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50/80 rounded-2xl">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-[#123B5D] shadow-2xs">
              <CheckCircle2 className="size-3.5 text-[#16A34A]" />
              {isUrdu ? "شناختی کارڈ تصدیق شدہ" : "CNIC Verified"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-[#123B5D] shadow-2xs">
              <Fingerprint className="size-3.5 text-[#16A34A]" />
              {isUrdu ? "نادرا بائیومیٹرک کلیئرڈ" : "NADRA Biometrics Cleared"}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-[#0F766E] shadow-2xs">
              <ShieldCheck className="size-3.5 text-[#0F766E]" />
              {isUrdu ? `ہنر سرٹیفائیڈ پرو (${worker.hunarBadgeId})` : `HUNAR Certified Pro (${worker.hunarBadgeId})`}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white text-[#123B5D] shadow-2xs">
              <ShieldCheck className="size-3.5 text-[#16A34A]" />
              {isUrdu ? "پولیس تصدیق شدہ" : "Police Character Cleared"}
            </span>
          </div>

          {/* Key Stats Bento Grid */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3.5 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="text-center border-r rtl:border-r-0 rtl:border-l border-slate-100 pr-1 sm:pr-2 rtl:pr-0 rtl:pl-1 rtl:sm:pl-2">
              <div className="flex items-center justify-center text-[#F59E0B] font-bold text-sm sm:text-base">
                <Star className="size-4 fill-[#F59E0B] mr-0.5 rtl:mr-0 rtl:ml-0.5" />
                {worker.rating.toFixed(1)}
              </div>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                {isUrdu ? `${worker.totalReviews} ریویوز` : `${worker.totalReviews} reviews`}
              </p>
            </div>

            <div className="text-center border-r rtl:border-r-0 rtl:border-l border-slate-100 pr-1 sm:pr-2 rtl:pr-0 rtl:pl-1 rtl:sm:pl-2">
              <span className="text-sm sm:text-base font-bold text-[#123B5D]">
                {worker.jobSuccessRate}%
              </span>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                {isUrdu ? "کامیابی کا تناسب" : "Job Success"}
              </p>
            </div>

            <div className="text-center border-r rtl:border-r-0 rtl:border-l border-slate-100 pr-1 sm:pr-2 rtl:pr-0 rtl:pl-1 rtl:sm:pl-2">
              <span className="text-sm sm:text-base font-bold text-[#123B5D]">
                {worker.completedJobsCount}
              </span>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                {isUrdu ? "مکمل کام" : "Jobs Done"}
              </p>
            </div>

            <div className="text-center">
              <span className="text-sm sm:text-base font-bold text-[#0F766E]">
                {worker.responseTime}
              </span>
              <p className="text-[10.5px] text-slate-500 mt-0.5">
                {isUrdu ? "جواب کا وقت" : "Resp. Time"}
              </p>
            </div>
          </div>

          {/* Service Expertise Tags */}
          <div className="space-y-2">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
              <Wrench className="size-3.5 text-[#0F766E]" />
              {isUrdu ? "سروس کی مہارت" : "Service Expertise"}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {worker.expertiseTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 bg-slate-50 rounded-lg text-xs font-medium text-[#123B5D]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Verified Work Photos */}
          {worker.workProjects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  {isUrdu ? "حالیہ تصدیق شدہ پراجیکٹس" : "Recent Verified Work Projects"}
                </h4>
                <span className="text-xs text-slate-400">
                  {isUrdu ? `${worker.workProjects.length} منصوبے` : `${worker.workProjects.length} projects`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {worker.workProjects.map((proj) => (
                  <div
                    key={proj.id}
                    className="rounded-xl overflow-hidden bg-slate-50 shadow-2xs"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proj.imageUrl}
                      alt={proj.title}
                      className="w-full h-24 object-cover"
                    />
                    <div className="p-2">
                      <p className="text-xs font-bold text-[#123B5D] truncate">
                        {proj.title}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {proj.location}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings & Feedback Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-[#F59E0B]" />
                {isUrdu ? "کسٹمر ریٹنگز اور آراء" : "Customer Ratings & Feedback"}
              </h4>
              <span className="text-xs font-bold text-[#0F766E]">
                {isUrdu ? `99% مثبت (${worker.totalReviews} ریویوز)` : `99% Positive (${worker.totalReviews} reviews)`}
              </span>
            </div>

            {/* Rating Bars */}
            <div className="p-3.5 rounded-2xl bg-slate-50 space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span className="w-6 font-medium text-[#123B5D]">5 ★</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full"
                    style={{ width: `${worker.ratingBreakdown.fiveStar}%` }}
                  />
                </div>
                <span className="w-8 text-right rtl:text-left text-slate-500 font-medium">
                  {worker.ratingBreakdown.fiveStar}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-6 font-medium text-[#123B5D]">4 ★</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full"
                    style={{ width: `${worker.ratingBreakdown.fourStar}%` }}
                  />
                </div>
                <span className="w-8 text-right rtl:text-left text-slate-500 font-medium">
                  {worker.ratingBreakdown.fourStar}%
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="w-6 font-medium text-[#123B5D]">3 ★</span>
                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#F59E0B] rounded-full"
                    style={{ width: `${worker.ratingBreakdown.threeStar}%` }}
                  />
                </div>
                <span className="w-8 text-right rtl:text-left text-slate-500 font-medium">
                  {worker.ratingBreakdown.threeStar}%
                </span>
              </div>
            </div>

            {/* Recent Reviews List */}
            <div className="space-y-2.5">
              {worker.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-3 bg-white rounded-xl shadow-2xs space-y-1 border border-slate-100"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#123B5D]">
                        {rev.customerName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        • {rev.customerArea}
                      </span>
                    </div>
                    <div className="flex items-center text-[#F59E0B] text-xs font-bold">
                      <Star className="size-3 fill-[#F59E0B] mr-0.5 rtl:mr-0 rtl:ml-0.5" />
                      {rev.rating}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rev.comment}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    {rev.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Bottom Fixed CTA */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 block">
              {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee"}
            </span>
            <span className="text-base sm:text-lg font-extrabold text-[#0F766E]">
              Rs. {offer.visitFee.toLocaleString()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectWorker(offer);
            }}
            className="py-3 px-6 rounded-2xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.99] flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="size-4.5" />
            <span>{isUrdu ? "کاریگر منتخب کریں اور بُک کریں" : "Select Worker & Book"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

