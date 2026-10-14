"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Layers,
  MapPin,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { useLocale } from "next-intl";
import { formatJobDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { CATEGORY_OPTIONS } from "../data/categories";
import type { PostJobData, PostJobStep } from "../types";
import { buildPostJobSignInHref } from "../lib/return-url";
import { VoiceNoteBubblePlayer } from "./voice-note-recorder";

interface Step4ReviewPostProps {
  data: PostJobData;
  onChange: (updates: Partial<PostJobData>) => void;
  onGoToStep: (step: PostJobStep) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export function Step4ReviewPost({
  data,
  onChange,
  onGoToStep,
  onSubmit,
  isSubmitting = false,
  submitError = null,
}: Step4ReviewPostProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const selectedCategory = CATEGORY_OPTIONS.find(
    (c) => c.id === data.category
  );
  const Icon = selectedCategory?.icon || Layers;

  return (
    <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-4 lg:space-y-5 animate-in fade-in-50 duration-300 pb-24">
      {/* Header Section */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D]">
          {isUrdu ? "جائزہ اور تصدیق" : "Review & Post Job"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
          {isUrdu
            ? "برائے مہربانی دستیاب تصدیق شدہ ماہرین کو بھیجنے سے پہلے تفصیلات کا جائزہ لیں۔"
            : "Please review the details below before publishing your request to available verified professionals."}
        </p>
      </div>

      {/* Main Review Grid: Balanced 2-Column on Desktop (7/5 split), Responsive on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Column: Job Details & Media Attachments */}
        <div className="lg:col-span-7 space-y-4">
          {/* Card 1: Service & Problem Description */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 relative overflow-hidden group border border-slate-100">
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 p-1.5 text-[#0F8B8D] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title={isUrdu ? "تفصیلات تبدیل کریں" : "Edit Details"}
            >
              <Edit2 className="size-4" />
            </button>

            <div className="flex items-start gap-3.5">
              <div
                className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                  selectedCategory?.iconBg || "bg-[#0F8B8D]/10"
                } ${selectedCategory?.iconColor || "text-[#0F8B8D]"}`}
              >
                <Icon className="size-6 stroke-[2.2]" />
              </div>

              <div className="flex-1 pr-6 rtl:pr-0 rtl:pl-6 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2.5 py-0.5 bg-[#0F8B8D]/10 text-[#0F8B8D] rounded-full text-[11px] font-bold">
                    {selectedCategory?.name || (isUrdu ? "سروس" : "Service")}
                  </span>
                  {data.subCategory && (
                    <span className="text-[11px] font-bold text-slate-600">
                      • {data.subCategory}
                    </span>
                  )}
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#123B5D]">
                  {data.title || (isUrdu ? "بغیر عنوان جاب درخواست" : "Untitled Job Request")}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed pt-1">
                  {data.description || (isUrdu ? "کوئی تفصیل درج نہیں کی گئی۔" : "No description provided.")}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Media Attachments */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between border border-slate-100">
            <button
              type="button"
              onClick={() => onGoToStep(2)}
              className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 p-1.5 text-[#0F8B8D] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title={isUrdu ? "تصاویر تبدیل کریں" : "Edit Media"}
            >
              <Edit2 className="size-4" />
            </button>

            <div>
              <div className="flex items-center gap-1.5 mb-2 text-slate-700">
                <Volume2 className="size-4 text-[#0F8B8D]" />
                <h3 className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "منسلک فائلیں / میڈیا" : "Media Attachments"}
                </h3>
              </div>

              {data.photos.length > 0 ? (
                <div className="flex flex-wrap gap-2 my-2">
                  {data.photos.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="size-16 rounded-xl overflow-hidden shadow-2xs border border-slate-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium italic my-2">
                  {isUrdu ? "کوئی تصویر منسلک نہیں کی گئی" : "No photos attached"}
                </p>
              )}
            </div>

            {/* Voice Note Preview if recorded */}
            {data.voiceNoteUrl ? (
              <div className="mt-2">
                <VoiceNoteBubblePlayer
                  audioUrl={data.voiceNoteUrl}
                  durationSeconds={data.voiceNoteDuration || 0}
                  onReRecord={() => onGoToStep(2)}
                  readOnly={false}
                />
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium mt-2 block">
                {isUrdu ? "کوئی وائس نوٹ ریکارڈ نہیں کیا گیا" : "No voice note recorded"}
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Location, Schedule & Trust Verification */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card 3: Location & Schedule */}
          <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 relative overflow-hidden flex flex-col justify-between border border-slate-100">
            <button
              type="button"
              onClick={() => onGoToStep(3)}
              className="absolute top-3.5 right-3.5 rtl:right-auto rtl:left-3.5 p-1.5 text-[#0F8B8D] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title={isUrdu ? "شیڈول تبدیل کریں" : "Edit Schedule"}
            >
              <Edit2 className="size-4" />
            </button>

            <div>
              {/* Location */}
              <div className="mb-3">
                <div className="flex items-center gap-1.5 mb-1 text-slate-700">
                  <MapPin className="size-4 text-[#0F8B8D]" />
                  <h3 className="text-xs font-bold text-[#123B5D]">
                    {isUrdu ? "سروس کا مقام" : "Location"}
                  </h3>
                </div>
                <p className="text-xs font-bold text-[#123B5D]">
                  {data.address || (isUrdu ? "پتہ فراہم نہیں کیا گیا" : "Address not provided")}
                </p>
                <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                  {data.area || (isUrdu ? "علاقہ" : "Area")} • {data.landmark || (isUrdu ? "مرکزی لوکیشن" : "Location Hub")}
                </p>
              </div>

              <hr className="border-slate-100 my-2" />

              {/* Preferred Time */}
              <div>
                <div className="flex items-center gap-1.5 mb-1 text-slate-700">
                  <Clock className="size-4 text-[#0F8B8D]" />
                  <h3 className="text-xs font-bold text-[#123B5D]">
                    {isUrdu ? "پسندیدہ وقت" : "Preferred Time"}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg text-xs font-bold text-[#123B5D]">
                    <Calendar className="size-3 text-[#0F8B8D]" />
                    {formatJobDate(data.preferredDate) || (isUrdu ? "آج" : "Today")}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 bg-slate-50 border border-slate-200/60 rounded-lg text-xs font-bold text-[#123B5D]">
                    {data.scheduleType === "asap"
                      ? isUrdu ? "فوری / ابھی" : "Immediate / ASAP"
                      : data.preferredTimeSlot || (isUrdu ? "صبح کا وقت" : "Morning")}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 text-[11.5px] text-slate-600 font-medium flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-green-600 shrink-0" />
              <span>
                {isUrdu
                  ? "بُک شدہ تصدیق شدہ کاریگر کے ساتھ لوکیشن شیئر کی جائے گی"
                  : "Exact coordinates shared with booked technician"}
              </span>
            </div>
          </div>

          {/* Satisfaction & Verification Trust Banner */}
          <div className="p-3.5 rounded-2xl bg-white shadow-2xs border border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#123B5D]">
                  {isUrdu
                    ? "WorkerFIX 100% تصدیق شدہ کوالٹی اور تسلی بخش کام کی ضمانت"
                    : "WorkerFIX 100% Verified Quality Guaranteed"}
                </h4>
                <p className="text-[11px] text-slate-600 font-medium">
                  {isUrdu
                    ? "تمام کاریگر نادرا سی این آئی سی سے تصدیق شدہ ہیں، ڈور سٹیپ او ٹی پی پن اور شفاف تصدیق شدہ وزٹ فیس کے ساتھ۔"
                    : "All technicians are NADRA CNIC verified with doorstep OTP PIN confirmation and transparent pricing."}
                </p>
              </div>
            </div>
            <CheckCircle2 className="size-5 text-green-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="mt-3 flex flex-col items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-center text-xs font-medium text-red-700">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="size-4 shrink-0 text-red-600" />
            <span>{submitError}</span>
          </div>
          {(submitError.toLowerCase().includes("sign in") ||
            submitError.toLowerCase().includes("customer") ||
            submitError.toLowerCase().includes("لاگ ان") ||
            submitError.toLowerCase().includes("کسٹمر")) && (
            <Link
              href={buildPostJobSignInHref(data)}
              className="inline-flex items-center gap-1 font-bold text-teal hover:underline text-xs bg-white px-3 py-1.5 rounded-lg border border-teal/20 shadow-xs transition"
            >
              <span>{isUrdu ? "کسٹمر اکاؤنٹ میں لاگ ان کریں" : "Sign In as Customer"}</span>
              <ArrowRight className="size-3.5 rtl:rotate-180" />
            </Link>
          )}
        </div>
      )}

      {/* Fixed Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 sm:py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{isUrdu ? "پیچھے" : "Back"}</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onSubmit}
            className="px-6 py-2.5 rounded-full bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white font-bold text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{isUrdu ? "جاب پوسٹ ہو رہی ہے..." : "Publishing Job Request..."}</span>
            ) : (
              <>
                <span>{isUrdu ? "جاب پوسٹ کریں اور آفرز حاصل کریں" : "Post Job & Get Offers"}</span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

