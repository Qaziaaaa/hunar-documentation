"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Pause,
  Play,
  ShieldCheck,
  Volume2,
  Wrench,
  X,
  ArrowRight,
  User,
} from "lucide-react";
import { useLocale } from "next-intl";
import type { CustomerJob } from "../types";

interface CustomerJobDetailsModalProps {
  job: CustomerJob | null;
  isOpen: boolean;
  onClose: () => void;
  onReviewOffers?: (job: CustomerJob) => void;
}

export function CustomerJobDetailsModal({
  job,
  isOpen,
  onClose,
  onReviewOffers,
}: CustomerJobDetailsModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (previewPhoto) {
          setPreviewPhoto(null);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, previewPhoto]);

  // Audio Playback Handler
  const handleToggleAudio = () => {
    if (!job?.voiceNoteUrl) return;
    const audio = document.getElementById("job-modal-voice-player") as HTMLAudioElement | null;
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

  if (!isOpen || !job) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in-50 duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#123B5D] animate-in zoom-in-95 duration-200 border border-slate-100"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-xs text-[#1A1A2E] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-md">
                #{job.id}
              </span>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E]">
                <Wrench className="size-3.5" />
                <span>{job.subCategory || job.category}</span>
              </span>

              {job.status === "receiving_offers" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
                  <span className="size-2 rounded-full bg-[#0F766E] animate-ping" />
                  <span>
                    {isUrdu
                      ? `${job.offers.length} آفرز موصول ہوئیں`
                      : `${job.offers.length} Offers Received`}
                  </span>
                </span>
              )}

              {job.status === "visit_scheduled" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20">
                  <span className="size-2 rounded-full bg-[#F59E0B]" />
                  <span>{isUrdu ? "وزٹ شیڈول ہو گیا" : "Visit Scheduled"}</span>
                </span>
              )}

              {job.status === "completed" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="size-3.5" />
                  <span>{isUrdu ? "مکمل اور تصدیق شدہ" : "Completed & Verified"}</span>
                </span>
              )}
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

          {/* Modal Scrollable Body */}
          <div className="overflow-y-auto p-5 sm:p-6 space-y-5 flex-1">
            {/* Title & Created Timestamp */}
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-[#1A1A2E] leading-snug">
                {job.title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isUrdu ? `درخواست شائع کی گئی: ${job.createdAt}` : `Posted: ${job.createdAt}`}
              </p>
            </div>

            {/* Problem Description */}
            <div className="space-y-2">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                {isUrdu ? "مسئلے کی تفصیل" : "Problem Description"}
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 text-xs sm:text-sm text-slate-700 leading-relaxed border border-slate-100/80">
                {job.description || (isUrdu ? "کوئی اضافی تفصیل درج نہیں ہے۔" : "No additional description provided.")}
              </div>
            </div>

            {/* Attached Photos */}
            {job.photos && job.photos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {isUrdu
                    ? `منسلک تصاویر (${job.photos.length})`
                    : `Attached Photos (${job.photos.length})`}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {job.photos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPreviewPhoto(photoUrl)}
                      className="group relative size-20 rounded-2xl overflow-hidden shadow-2xs hover:scale-105 transition-all border border-slate-200 cursor-pointer"
                      title={isUrdu ? "بڑی تصویر دیکھیں" : "Click to enlarge"}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Attachment ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voice Note Audio */}
            {job.voiceNoteUrl && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  {isUrdu ? "وائس نوٹ" : "Voice Note"}
                </h3>
                <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
                  <audio
                    id="job-modal-voice-player"
                    src={job.voiceNoteUrl}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className="size-10 rounded-full bg-[#0F766E] text-white flex items-center justify-center shrink-0 shadow-xs hover:bg-[#115E59] cursor-pointer transition-all active:scale-95"
                  >
                    {isPlayingAudio ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4 ml-0.5 rtl:ml-0 rtl:mr-0.5" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#123B5D] mb-1">
                      <span className="flex items-center gap-1">
                        <Volume2 className="size-3.5 text-[#0F766E]" />
                        <span>{isUrdu ? "وائس میسج چلائیں" : "Listen to Voice Note"}</span>
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        0:{job.voiceNoteDuration || 15}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-[#0F766E] rounded-full transition-all duration-300 ${
                          isPlayingAudio ? "w-3/4 animate-pulse" : "w-1/4"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Service Location & Schedule Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Location Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B5D]">
                  <MapPin className="size-4 text-[#0F766E] shrink-0" />
                  <span>{isUrdu ? "مقام اور پتہ" : "Service Location"}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {job.address || job.area}
                </p>
                <p className="text-[11px] text-slate-500">
                  {job.area}, {job.city || "Pakistan"}
                  {job.landmark && ` • ${isUrdu ? "نشانی" : "Landmark"}: ${job.landmark}`}
                </p>
              </div>

              {/* Timing Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B5D]">
                  <Calendar className="size-4 text-[#0F766E] shrink-0" />
                  <span>{isUrdu ? "پسندیدہ وقت و شیڈول" : "Preferred Schedule"}</span>
                </div>
                <p className="text-xs text-slate-700 font-medium">
                  {job.preferredDate || (isUrdu ? "آج" : "Today")}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="size-3 text-slate-400" />
                  <span>{job.preferredTimeSlot || (isUrdu ? "صبح (8:00 AM - 12:00 PM)" : "Morning (8:00 AM - 12:00 PM)")}</span>
                  <span className="text-slate-300">•</span>
                  <span className="capitalize">{job.scheduleType === "asap" ? (isUrdu ? "فوری" : "Immediate (ASAP)") : (isUrdu ? "شیڈولڈ" : "Scheduled")}</span>
                </div>
              </div>
            </div>

            {/* Offers & Assigned Worker Status Section */}
            {job.status === "receiving_offers" && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#0F766E]/5 border border-[#0F766E]/20 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center font-bold text-xs">
                      <User className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-[#123B5D]">
                        {isUrdu
                          ? `${job.offers.length} تصدیق شدہ کاریگروں کی آفرز موصول ہوئیں`
                          : `${job.offers.length} Verified Technician Offers Available`}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {isUrdu
                          ? "کسی بھی وقت آفرز کا جائزہ لے کر وزٹ بک کر سکتے ہیں۔"
                          : "Compare quotes, check technician profiles, and confirm visit."}
                      </p>
                    </div>
                  </div>

                  {job.offers.length > 0 && onReviewOffers && (
                    <button
                      type="button"
                      onClick={() => onReviewOffers(job)}
                      className="px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <span>
                        {isUrdu
                          ? `${job.offers.length} آفرز کا جائزہ لیں`
                          : `Review ${job.offers.length} Offers`}
                      </span>
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </button>
                  )}
                </div>

                {job.offers.length > 0 && (
                  <div className="pt-2 border-t border-[#0F766E]/15 flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                    <span className="font-semibold text-[#123B5D]">
                      {isUrdu ? "جواب دینے والے کاریگر: " : "Responding Pros: "}
                    </span>
                    <span>
                      {job.offers.map((o) => o.worker.name).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {job.status === "visit_scheduled" && job.selectedOffer && (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/60 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={job.selectedOffer.worker.avatarUrl}
                        alt={job.selectedOffer.worker.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#123B5D]">
                          {job.selectedOffer.worker.name}
                        </span>
                        <ShieldCheck className="size-3.5 text-[#16A34A]" />
                      </div>
                      <p className="text-xs text-slate-500">
                        {job.selectedOffer.worker.businessName || (isUrdu ? "تصدیق شدہ کاریگر" : "Certified Technician")}
                      </p>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left">
                    <span className="text-[11px] text-slate-400 block font-medium">
                      {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee"}
                    </span>
                    <span className="text-base font-extrabold text-[#0F766E]">
                      Rs. {job.selectedOffer.visitFee.toLocaleString()}
                    </span>
                  </div>
                </div>

                {job.securityPin && (
                  <div className="p-3 bg-white rounded-xl border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">
                        {isUrdu ? "دہلیز پر تصدیق کا سیکیورٹی PIN" : "Doorstep Security PIN"}
                      </span>
                      <span className="text-xs text-slate-600">
                        {isUrdu ? "کاریگر کی دہلیز پر آمد کے وقت تصدیق کریں" : "Technician shares this code at door to verify identity"}
                      </span>
                    </div>
                    <span className="font-mono text-lg font-bold tracking-widest text-[#0F766E] bg-[#0F766E]/10 px-3 py-1 rounded-lg">
                      {job.securityPin}
                    </span>
                  </div>
                )}

                {/* Direct Action to Live Tracking */}
                <div className="pt-1">
                  <a
                    href="/customer/visits"
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <Clock className="size-4" />
                    <span>{isUrdu ? "لائیو وزٹ اور دہلیز PIN ٹریک کریں ←" : "Track Live Visit & Doorstep PIN →"}</span>
                  </a>
                </div>
              </div>
            )}

            {job.status === "completed" && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <span>{isUrdu ? "یہ کام تسلی بخش طور پر مکمل ہو چکا ہے" : "This service has been successfully completed"}</span>
                </div>
                <p className="text-[11px] text-emerald-700/90">
                  {isUrdu ? "ادائیگی کی تصدیق ہو چکی ہے اور 5 روزہ وارنٹی فعال ہے۔" : "Payment has been settled and 5-Day Craftsmanship Warranty is active."}
                </p>
                <div className="pt-1">
                  <a
                    href={`/customer/job/${job.id}/complete`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs transition-colors"
                  >
                    <span>{isUrdu ? "وارنٹی سرٹیفکیٹ اور رسید دیکھیں" : "View Warranty Certificate & Invoice"}</span>
                    <ArrowRight className="size-3.5 rtl:rotate-180" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-[#E2E8F0] font-semibold text-xs transition-colors cursor-pointer"
            >
              {isUrdu ? "بند کریں" : "Close"}
            </button>

            {job.status === "receiving_offers" && job.offers.length > 0 && onReviewOffers && (
              <button
                type="button"
                onClick={() => onReviewOffers(job)}
                className="py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-98"
              >
                <span>
                  {isUrdu
                    ? `${job.offers.length} آفرز کا جائزہ لیں`
                    : `Review ${job.offers.length} Offers`}
                </span>
                <ArrowRight className="size-4 rtl:rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox for Photos */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-in fade-in-50"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewPhoto}
              alt="Photo preview"
              className="w-full h-full object-contain"
            />
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-4 right-4 rtl:right-auto rtl:left-4 size-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
