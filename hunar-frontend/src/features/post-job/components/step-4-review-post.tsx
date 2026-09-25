"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  Layers,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import { useLocale } from "next-intl";
import { CATEGORY_OPTIONS } from "../data/categories";
import type { PostJobData, PostJobStep } from "../types";

interface Step4ReviewPostProps {
  data: PostJobData;
  onChange: (updates: Partial<PostJobData>) => void;
  onGoToStep: (step: PostJobStep) => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function Step4ReviewPost({
  data,
  onChange,
  onGoToStep,
  onSubmit,
  isSubmitting = false,
}: Step4ReviewPostProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const selectedCategory = CATEGORY_OPTIONS.find(
    (c) => c.id === data.category
  );
  const Icon = selectedCategory?.icon || Layers;

  const handleToggleAudio = () => {
    if (!data.voiceNoteUrl) return;
    const audio = document.getElementById("review-audio-player") as HTMLAudioElement | null;
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.play().catch(() => {});
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in-50 duration-300 pb-20 lg:pb-8">
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

      {/* 3 Review Cards Grid (Pure White, No Border) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Top Card: Service & Problem Description (Spans 2 cols) */}
        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-5 col-span-1 md:col-span-2 relative overflow-hidden group border border-slate-100">
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

        {/* Bottom Left Card: Media Attachments */}
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
            <div className="p-2.5 bg-slate-50 border border-slate-200/70 rounded-xl flex items-center gap-2 mt-2">
              <audio
                id="review-audio-player"
                src={data.voiceNoteUrl}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleToggleAudio}
                className="size-8 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-[#0D7A7C] cursor-pointer"
              >
                {isPlayingAudio ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4 ml-0.5 rtl:ml-0 rtl:mr-0.5" />
                )}
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#123B5D] mb-1">
                  <span>{isUrdu ? "وائس نوٹ کی تفصیل" : "Voice Description"}</span>
                  <span className="text-slate-600 font-semibold">
                    {data.voiceNoteDuration
                      ? `${Math.floor(data.voiceNoteDuration / 60)}:${(data.voiceNoteDuration % 60).toString().padStart(2, "0")}`
                      : "0:15"}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-[#0F8B8D] rounded-full transition-all ${
                      isPlayingAudio ? "w-3/4" : "w-1/3"
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            <span className="text-[11px] text-slate-500 font-medium mt-2 block">
              {isUrdu ? "کوئی وائس نوٹ ریکارڈ نہیں کیا گیا" : "No voice note recorded"}
            </span>
          )}
        </div>

        {/* Bottom Right Card: Location & Schedule */}
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
                {data.area || "Peshawar"} • {data.landmark || (isUrdu ? "پشاور ہب" : "Peshawar Hub")}
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
                  {data.preferredDate || (isUrdu ? "آج" : "Today")}
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
                ? "تمام کاریگر نادرا سی این آئی سی سے تصدیق شدہ ہیں، ڈور سٹیپ او ٹی پی پن اور فکسڈ 300 روپے وزٹ چارجز کے ساتھ۔"
                : "All technicians are NADRA CNIC verified with doorstep OTP PIN confirmation and transparent pricing."}
            </p>
          </div>
        </div>
        <CheckCircle2 className="size-5 text-green-600 shrink-0" />
      </div>

      {/* Bottom Actions */}
      <div className="pt-3 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onGoToStep(3)}
          className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
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
  );
}

