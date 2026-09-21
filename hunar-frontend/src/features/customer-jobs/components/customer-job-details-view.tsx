"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Volume2,
  Wrench,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { WorkerOfferCard } from "./worker-offer-card";
import { WorkerProfileModal } from "./worker-profile-modal";
import { SelectWorkerModal } from "./select-worker-modal";
import { acceptWorkerOffer } from "../api/customer-jobs-api";
import type { CustomerJob, WorkerOffer } from "../types";

interface CustomerJobDetailsViewProps {
  initialJob: CustomerJob;
}

export function CustomerJobDetailsView({ initialJob }: CustomerJobDetailsViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [job, setJob] = useState<CustomerJob>(initialJob);
  const [selectedOfferForProfile, setSelectedOfferForProfile] = useState<WorkerOffer | null>(null);
  const [selectedOfferForBooking, setSelectedOfferForBooking] = useState<WorkerOffer | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Audio Playback Handler
  const handleToggleAudio = () => {
    if (!job.voiceNoteUrl) return;
    const audio = document.getElementById("job-details-voice-player") as HTMLAudioElement | null;
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

  // Direct Booking Confirmation Handler
  const handleConfirmBooking = async (offer: WorkerOffer) => {
    try {
      await acceptWorkerOffer(job.id, offer.id);
    } catch (err) {
      console.warn("acceptWorkerOffer error:", err);
    }
    setJob((prev) => ({
      ...prev,
      status: "visit_scheduled",
      selectedOffer: offer,
    }));
    setSelectedOfferForBooking(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-16 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Top Breadcrumb / Back Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#0F766E] transition-colors"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          <span>{isUrdu ? "ڈیش بورڈ پر واپس جائیں" : "Back to Dashboard"}</span>
        </Link>

        <span className="text-xs font-mono font-bold text-slate-400">
          {isUrdu ? "ریفرنس:" : "Ref:"} {job.id}
        </span>
      </div>

      {/* Main Title & Status Hero */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0F766E]/10 text-[#0F766E]">
              <Wrench className="size-3.5" />
              {job.subCategory || (isUrdu ? "سروس درخواست" : "Service Request")}
            </span>

            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
              <MapPin className="size-3 text-[#0F766E]" />
              {job.area || (isUrdu ? "پشاور" : "Peshawar")}
            </span>

            {job.status === "receiving_offers" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                {isUrdu
                  ? `آفرز موصول ہو رہی ہیں (${job.offers.length} کاریگر)`
                  : `Receiving Offers (${job.offers.length} pros)`}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0F766E]/15 text-[#0F766E]">
                <CheckCircle2 className="size-3.5" />
                {isUrdu ? "وزٹ شیڈول ہو گیا" : "Visit Scheduled"}
              </span>
            )}
          </div>

          <h1 className="text-lg sm:text-2xl font-extrabold text-[#123B5D] leading-snug">
            {job.title}
          </h1>
        </div>

        <div className="text-left md:text-right rtl:text-right rtl:md:text-left border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
          <span className="text-xs text-slate-400 block font-medium">
            {isUrdu ? "پوسٹ کرنے کی تاریخ" : "Posted On"}
          </span>
          <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
            {job.createdAt}
          </span>
        </div>
      </div>

      {/* 2-Column Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (5 Cols): Job Info, Timeline, Media, Location */}
        <div className="lg:col-span-5 space-y-4">
          {/* Job Timeline Status Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
              {isUrdu ? "جاب اسٹیٹس ٹائم لائن" : "Job Status Timeline"}
            </h3>

            <div className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l-2 rtl:border-l-0 rtl:border-r-2 border-[#0F766E] space-y-5">
              {/* Step 1: Posted */}
              <div className="relative">
                <div className="absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-1 size-4 rounded-full bg-[#0F766E] ring-4 ring-white" />
                <p className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "جاب شائع کی گئی" : "Job Published"}
                </p>
                <p className="text-[11px] text-slate-400">{job.createdAt}</p>
              </div>

              {/* Step 2: Receiving Offers */}
              <div className="relative">
                <div
                  className={`absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-1 size-4 rounded-full ${
                    job.status === "receiving_offers"
                      ? "bg-[#0F766E] animate-pulse ring-4 ring-[#0F766E]/20"
                      : "bg-[#0F766E] ring-4 ring-white"
                  }`}
                />
                <p className="text-xs font-bold text-[#0F766E]">
                  {isUrdu ? "تصدیق شدہ پرو آفرز موصول ہو رہی ہیں" : "Receiving Verified Pro Offers"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isUrdu
                    ? `قریبی ${job.offers.length} ٹیکنیشنز نے دلچسپی ظاہر کی`
                    : `${job.offers.length} technicians interested nearby`}
                </p>
              </div>

              {/* Step 3: Worker Selected */}
              <div
                className={`relative ${
                  job.status === "receiving_offers" ? "opacity-40" : "opacity-100"
                }`}
              >
                <div
                  className={`absolute -left-[31px] rtl:-left-auto rtl:-right-[31px] top-1 size-4 rounded-full ${
                    job.status !== "receiving_offers"
                      ? "bg-[#0F766E] ring-4 ring-white"
                      : "bg-slate-300 ring-4 ring-white"
                  }`}
                />
                <p className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "کاریگر کا انتخاب مکمل" : "Technician Confirmed"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {job.selectedOffer
                    ? isUrdu
                      ? `${job.selectedOffer.worker.name} بُک ہو چکا ہے`
                      : `${job.selectedOffer.worker.name} booked`
                    : isUrdu
                    ? "آپ کے انتخاب کا انتظار ہے"
                    : "Awaiting your selection"}
                </p>
              </div>
            </div>
          </div>

          {/* Description & Media Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3.5">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
              {isUrdu ? "مسئلے کی تفصیل" : "Problem Description"}
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {job.description}
            </p>

            {/* Photos Thumbnails */}
            {job.photos.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500">
                  {isUrdu
                    ? `منسلک تصاویر (${job.photos.length})`
                    : `Attached Photos (${job.photos.length})`}
                </span>
                <div className="flex flex-wrap gap-2">
                  {job.photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewPhoto(photoUrl)}
                      className="size-16 rounded-2xl overflow-hidden shadow-2xs hover:scale-105 transition-transform cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Note Audio Player */}
            {job.voiceNoteUrl && (
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                <audio
                  id="job-details-voice-player"
                  src={job.voiceNoteUrl}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleToggleAudio}
                  className="size-9 rounded-full bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-[#115E59] cursor-pointer"
                >
                  {isPlayingAudio ? (
                    <Pause className="size-4" />
                  ) : (
                    <Play className="size-4 ml-0.5 rtl:ml-0 rtl:mr-0.5" />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#123B5D] mb-1">
                    <span className="flex items-center gap-1">
                      <Volume2 className="size-3 text-[#0F766E]" />
                      {isUrdu ? "وائس نوٹ" : "Voice Note"}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      0:{job.voiceNoteDuration || 15}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-[#0F766E] rounded-full transition-all ${
                        isPlayingAudio ? "w-3/4" : "w-1/3"
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Location & Preferred Timing Card */}
          <div className="bg-white rounded-3xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
              {isUrdu ? "سروس کا مقام اور وقت" : "Service Location & Timing"}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-[#0F766E] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[#123B5D]">{job.address}</p>
                  <p className="text-[11px] text-slate-500">
                    {job.area} {job.landmark && `• ${isUrdu ? "نشانی" : "Landmark"}: ${job.landmark}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-1">
                <Clock className="size-4 text-[#0F766E] shrink-0" />
                <p className="text-slate-600">
                  <span className="font-bold text-[#123B5D]">
                    {job.preferredDate || (isUrdu ? "آج" : "Today")}
                  </span>{" "}
                  • {job.preferredTimeSlot || (isUrdu ? "فوری / ابھی" : "Immediate / ASAP")}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="size-3 text-[#0F766E]" />
              <span>
                {isUrdu
                  ? "بُک شدہ کاریگر کے ساتھ درست پتہ شیئر کیا جائے گا"
                  : "Exact address shared with booked technician"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column (7 Cols): Available Worker Offers Feed */}
        <div className="lg:col-span-7 space-y-4">
          {/* Confirmed Visit Status Box (If worker is already booked) */}
          {job.selectedOffer ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-[#0F766E]/30 space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E]">
                  <CheckCircle2 className="size-5" />
                  <span>{isUrdu ? "بکنگ کنفرم اور فعال ہے" : "Confirmed Booking Active"}</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0F766E] text-white">
                  {isUrdu ? "وزٹ شیڈول ہو گیا" : "Visit Scheduled"}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-xl overflow-hidden shadow-2xs shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={job.selectedOffer.worker.avatarUrl}
                      alt={job.selectedOffer.worker.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#123B5D]">
                      {job.selectedOffer.worker.name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {job.selectedOffer.worker.businessName}
                    </p>
                  </div>
                </div>

                <div className="text-right rtl:text-left">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee"}
                  </span>
                  <span className="text-lg font-extrabold text-[#0F766E]">
                    Rs. {job.selectedOffer.visitFee.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Doorstep Security PIN Callout */}
              <div className="p-4 rounded-2xl bg-[#123B5D] text-white flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200">
                    {isUrdu ? "آپ کا ڈور سٹیپ سیکیورٹی PIN:" : "Your Doorstep Security PIN:"}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {isUrdu
                      ? "دروازہ کھولنے سے پہلے کاریگر سے یہ کوڈ سنیں۔"
                      : "Ask pro to recite this code before opening door."}
                  </p>
                </div>
                <span className="font-mono text-xl font-black tracking-widest text-[#0F766E] bg-white px-3 py-1 rounded-xl">
                  {job.securityPin || "6492"}
                </span>
              </div>

              {/* Completion & Review Direct Action */}
              <Link
                href={`/customer/job/${job.id}/complete`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <span>
                  {isUrdu
                    ? "مکمل شدہ کام کا جائزہ لیں اور ادائیگی منظور کریں ←"
                    : "Inspect Completed Work & Authorize Payment →"}
                </span>
              </Link>
            </div>
          ) : (
            <>
              {/* Offers Header */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-[#123B5D]">
                    {isUrdu ? "دستیاب تصدیق شدہ ماہرین کی آفرز" : "Available Verified Pro Offers"}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0F766E]/10 text-[#0F766E]">
                    {isUrdu ? `${job.offers.length} دستیاب` : `${job.offers.length} Available`}
                  </span>
                </div>
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {isUrdu ? "بغیر کسی اضافی کمیشن کے براہ راست بکنگ" : "Direct booking with zero commission"}
                </span>
              </div>

              {/* Offers Cards List */}
              {job.offers.length > 0 ? (
                <div className="space-y-3.5">
                  {job.offers.map((offer) => (
                    <WorkerOfferCard
                      key={offer.id}
                      offer={offer}
                      onViewProfile={(off) => setSelectedOfferForProfile(off)}
                      onSelectWorker={(off) => setSelectedOfferForBooking(off)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-8 text-center space-y-3 shadow-sm">
                  <Radio className="size-10 text-[#0F766E] mx-auto animate-pulse" />
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    {isUrdu ? "قریبی تصدیق شدہ ماہرین کو الرٹ بھیجا جا رہا ہے" : "Alerting Nearby Verified Pros"}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isUrdu
                      ? `ہم نے آپ کی درخواست ${job.area} کے تصدیق شدہ ماہرین تک پہنچا دی ہے۔ جلد ہی آفرز یہاں ظاہر ہوں گی۔`
                      : `We have broadcast your request to licensed specialists in ${job.area}. Offers will appear live here shortly.`}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Safety & Satisfaction Trust Card */}
          <div className="p-4 rounded-3xl bg-white shadow-sm flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#123B5D]">
                  {isUrdu
                    ? "ہنر 100% تصدیق شدہ کوالٹی کی ضمانت"
                    : "HUNAR 100% Verified Quality Guarantee"}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {isUrdu
                    ? "تمام کاریگر نادرا سی این آئی سی سے تصدیق شدہ ہیں، ڈور سٹیپ او ٹی پی پن اور فکسڈ وزٹ فیس کے ساتھ۔"
                    : "NADRA CNIC verified technician with doorstep OTP PIN confirmation and transparent visit pricing."}
                </p>
              </div>
            </div>
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          </div>
        </div>
      </div>

      {/* Worker Profile Modal */}
      <WorkerProfileModal
        offer={selectedOfferForProfile}
        isOpen={Boolean(selectedOfferForProfile)}
        onClose={() => setSelectedOfferForProfile(null)}
        onSelectWorker={(off) => {
          setSelectedOfferForProfile(null);
          setSelectedOfferForBooking(off);
        }}
      />

      {/* Select Worker & Confirm Booking Dialog */}
      <SelectWorkerModal
        job={job}
        offer={selectedOfferForBooking}
        isOpen={Boolean(selectedOfferForBooking)}
        onClose={() => setSelectedOfferForBooking(null)}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Photo Lightbox Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt="Photo preview"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

