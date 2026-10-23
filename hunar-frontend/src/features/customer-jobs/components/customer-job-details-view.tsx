"use client";

import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  MapPin,
  MessageSquare,
  Pause,
  Phone,
  Play,
  Radio,
  ShieldCheck,
  Volume2,
  Wrench,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { formatDateTime, formatJobDate } from "@/lib/format";
import { WorkerOfferCard } from "./worker-offer-card";
import { WorkerProfileModal } from "./worker-profile-modal";
import { CustomerReviewModal } from "./customer-review-modal";
import { acceptWorkerOffer } from "../api/customer-jobs-api";
import type { CustomerJob, WorkerOffer } from "../types";

interface CustomerJobDetailsViewProps {
  initialJob: CustomerJob;
}

export function CustomerJobDetailsView({ initialJob }: CustomerJobDetailsViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [job, setJob] = useState<CustomerJob>(initialJob);

  useEffect(() => {
    if (initialJob) {
      setJob(initialJob);
    }
  }, [initialJob]);

  const [selectedOfferForProfile, setSelectedOfferForProfile] = useState<WorkerOffer | null>(null);
  const [confirmingOfferId, setConfirmingOfferId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const queryClient = useQueryClient();

  const showToast = (message: string, tone: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastTone(tone);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Reset audio state when job voice note changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
    setAudioDuration(null);
  }, [job?.voiceNoteUrl]);

  // Format seconds to mm:ss
  const formatAudioDuration = (seconds?: number | null) => {
    if (!seconds || isNaN(seconds) || !isFinite(seconds) || seconds <= 0) {
      return job?.voiceNoteDuration ? `0:${String(job.voiceNoteDuration).padStart(2, "0")}` : "--:--";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
      setAudioDuration(audio.duration);
    } else if (audio.duration === Infinity) {
      // Chrome MediaRecorder WebM bug: seeking near the end resolves true duration
      const onSeeked = () => {
        audio.removeEventListener("seeked", onSeeked);
        if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
          setAudioDuration(audio.duration);
        }
        audio.currentTime = 0;
      };
      audio.addEventListener("seeked", onSeeked, { once: true });
      audio.currentTime = 1e101;
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setAudioCurrentTime(audio.currentTime);
    if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
      setAudioDuration(audio.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioCurrentTime(0);
  };

  // Audio Playback Handler
  const handleToggleAudio = () => {
    if (!job.voiceNoteUrl) return;
    const audio = audioRef.current || (document.getElementById("job-details-voice-player") as HTMLAudioElement | null);
    if (!audio) return;

    if (isPlayingAudio) {
      audio.pause();
      setIsPlayingAudio(false);
    } else {
      audio.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  // Direct Booking Confirmation Handler
  const handleConfirmBooking = async (offer: WorkerOffer) => {
    setConfirmingOfferId(offer.id);
    try {
      await acceptWorkerOffer(job.id, offer.id);
    } catch (err) {
      console.warn("acceptWorkerOffer error:", err);
      showToast(
        isUrdu
          ? "بکنگ نہیں ہو سکی، براہِ کرم دوبارہ کوشش کریں۔"
          : "Booking failed — the visit was not scheduled. Please try again.",
        "error"
      );
      setConfirmingOfferId(null);
      return;
    }
    setJob((prev) => ({
      ...prev,
      status: "visit_scheduled",
      selectedOffer: offer,
    }));
    setSelectedOfferForProfile(null);
    setConfirmingOfferId(null);
    void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
    showToast(
      isUrdu
        ? `${offer.worker.name} کی بکنگ کامیابی سے ہو گئی! سیکیورٹی PIN فعال ہے۔`
        : `Successfully booked ${offer.worker.name}! Security PIN activated.`
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-16 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 rtl:right-auto rtl:left-6 z-60 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${
            toastTone === "error" ? "bg-rose-600" : "bg-[#0F766E]"
          }`}
        >
          {toastTone === "error" ? (
            <AlertTriangle className="size-5 shrink-0" />
          ) : (
            <CheckCircle2 className="size-5 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
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
              {job.area || (isUrdu ? "آن لوکیشن" : "On Location")}
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
            {formatDateTime(job.createdAt)}
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
                <p className="text-[11px] text-slate-400">{formatDateTime(job.createdAt)}</p>
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
                  ref={audioRef}
                  id="job-details-voice-player"
                  src={job.voiceNoteUrl}
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleAudioEnded}
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
                    <span className="text-slate-400 text-[11px] font-mono">
                      {isPlayingAudio
                        ? `${formatAudioDuration(audioCurrentTime)} / ${formatAudioDuration(audioDuration || job.voiceNoteDuration)}`
                        : formatAudioDuration(audioDuration || job.voiceNoteDuration)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F766E] rounded-full transition-all duration-150"
                      style={{
                        width: `${
                          audioDuration && audioDuration > 0
                            ? Math.min(100, Math.max(0, (audioCurrentTime / audioDuration) * 100))
                            : isPlayingAudio ? 50 : 0
                        }%`,
                      }}
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
                    {formatJobDate(job.preferredDate) || (isUrdu ? "آج" : "Today")}
                  </span>{" "}
                  • {job.preferredTimeSlot || (job.scheduleType === "asap" ? (isUrdu ? "⚡ فوری" : "⚡ Immediate") : (isUrdu ? "مناسب وقت" : "Flexible Timing"))}
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
                    {job.status === "completed"
                      ? (isUrdu ? "کل ادا شدہ رقم" : "Total Paid")
                      : (isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee")}
                  </span>
                  <span className="text-lg font-extrabold text-[#0F766E]">
                    Rs.{" "}
                    {(
                      job.status === "completed"
                        ? ((job.totalAmount && job.totalAmount > 0)
                            ? job.totalAmount
                            : (job.selectedOffer.visitFee + (job.repairCharge ?? 0)))
                        : job.selectedOffer.visitFee
                    ).toLocaleString()}
                  </span>
                  {job.status === "completed" && Boolean(job.repairCharge && job.repairCharge > 0) && (
                    <span className="text-[10px] text-slate-500 block">
                      {isUrdu
                        ? `وزٹ Rs. ${job.selectedOffer.visitFee} + مرمت Rs. ${job.repairCharge}`
                        : `Visit Rs. ${job.selectedOffer.visitFee} + Repair Rs. ${job.repairCharge}`}
                    </span>
                  )}
                </div>
              </div>

              {/* Doorstep Security Code Callout */}
              {job.securityPin && (
                <div className="p-3 bg-white rounded-2xl border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {isUrdu ? "دہلیز داخلہ PIN" : "Doorstep Entry PIN"}
                    </span>
                    <span className="text-xs text-slate-600">
                      {isUrdu ? "کاریگر کی آمد پر یہ PIN تصدیق کریں" : "Technician shares this code at door to verify identity"}
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold tracking-widest text-[#0F766E] bg-[#0F766E]/10 px-3 py-1 rounded-lg">
                    {job.securityPin}
                  </span>
                </div>
              )}

              {/* Action Buttons for Active Job */}
              {job.status !== "completed" && (
                <div className="space-y-2.5">
                  <Link
                    href={`/customer/job/${job.id}/tracking`}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
                  >
                    <Clock className="size-4" />
                    <span>
                      {isUrdu
                        ? "لائیو آمد اور دہلیز PIN ٹریک کریں ←"
                        : "Track Live Arrival & Doorstep PIN →"}
                    </span>
                  </Link>

                  <div className="flex items-center gap-2.5">
                    {job.selectedOffer.worker.phone && (
                      <a
                        href={`tel:${job.selectedOffer.worker.phone}`}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Phone className="size-3.5 text-success" />
                        <span>{isUrdu ? "کاریگر کو کال کریں" : "Call Pro"}</span>
                      </a>
                    )}
                    <Link
                      href={`/customer/chat?jobId=${job.id}`}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="size-3.5 text-teal" />
                      <span>{isUrdu ? "پیغام بھیجیں" : "Message"}</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Rate & Review Card for Completed Job */}
              {job.status === "completed" && (
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <span>
                        {isUrdu
                          ? "سروس کامیابی سے مکمل ہو چکی ہے"
                          : "Service Successfully Completed"}
                      </span>
                    </div>
                    {job.hasReviewed ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-200/70 text-emerald-950 flex items-center gap-1">
                        <Star className="size-3 fill-emerald-800 text-emerald-800" />
                        <span>
                          {job.customerReview?.rating ?? 5}/5 {isUrdu ? "ریویو درج ہے" : "Reviewed"}
                        </span>
                      </span>
                    ) : null}
                  </div>

                  <p className="text-[11px] text-emerald-700/90">
                    {isUrdu
                      ? "ادائیگی کی تصدیق ہو چکی ہے اور 5 روزہ وارنٹی فعال ہے۔ کاریگر کی حوصلہ افزائی کے لیے اپنا ریویو درج کریں۔"
                      : "Payment has been settled and 5-Day Craftsmanship Warranty is active. Please rate your technician's workmanship."}
                  </p>

                  {job.customerReview?.comment && (
                    <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-100 text-[11px] text-slate-700 italic">
                      &ldquo;{job.customerReview.comment}&rdquo;
                    </div>
                  )}

                  {!job.hasReviewed && (
                    <button
                      type="button"
                      onClick={() => setIsReviewModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Star className="size-4 fill-slate-950" />
                      <span>
                        {isUrdu ? "کاریگر کو ریویو دیں اور ریٹنگ درج کریں" : "Rate & Review Technician"}
                      </span>
                    </button>
                  )}
                </div>
              )}
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
                      isConfirming={confirmingOfferId === offer.id}
                      onViewProfile={(off) => setSelectedOfferForProfile(off)}
                      onSelectWorker={(off) => handleConfirmBooking(off)}
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
                    ? "WorkerFIX 100% تصدیق شدہ کوالٹی کی ضمانت"
                    : "WorkerFIX 100% Verified Quality Guarantee"}
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
          handleConfirmBooking(off);
        }}
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
      {/* Review Modal for Completed Jobs */}
      <CustomerReviewModal
        job={job}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onReviewSubmitted={(review) => {
          setJob((prev) => ({
            ...prev,
            hasReviewed: true,
            customerReview: {
              rating: review.rating,
              comment: review.comment,
              date: new Date().toISOString(),
            },
          }));
          void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
          showToast(
            isUrdu
              ? "آپ کا ریویو کامیابی سے جمع کر لیا گیا ہے!"
              : "Your review has been successfully submitted!"
          );
        }}
      />
    </div>
  );
}

