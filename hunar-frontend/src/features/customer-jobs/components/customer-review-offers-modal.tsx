"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  User,
  Wrench,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import type { CustomerJob, WorkerOffer } from "../types";

interface CustomerReviewOffersModalProps {
  job: CustomerJob | null;
  isOpen: boolean;
  onClose: () => void;
  onViewJobDetails?: (job: CustomerJob) => void;
  onViewProfile: (offer: WorkerOffer) => void;
  onSelectWorker: (job: CustomerJob, offer: WorkerOffer) => void;
  onRejectOffer: (job: CustomerJob, offer: WorkerOffer) => void;
}

export function CustomerReviewOffersModal({
  job,
  isOpen,
  onClose,
  onViewJobDetails,
  onViewProfile,
  onSelectWorker,
  onRejectOffer,
}: CustomerReviewOffersModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [decliningOfferId, setDecliningOfferId] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen || !job) return null;

  const offers = job.offers || [];

  const handleConfirmDecline = (offer: WorkerOffer) => {
    onRejectOffer(job, offer);
    setDecliningOfferId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in-50 duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="bg-[#F8FAFC] rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#123B5D] animate-in zoom-in-95 duration-200 border border-slate-100"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-xs text-[#1A1A2E] bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-md">
              #{job.id}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-[#123B5D]">
              {isUrdu ? "کاریگروں کی آفرز کا جائزہ" : "Review Pro Offers"}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#0F766E]/10 text-[#0F766E] border border-[#0F766E]/20">
              <span className="size-2 rounded-full bg-[#0F766E] animate-ping" />
              <span>
                {isUrdu
                  ? `${offers.length} موصولہ آفرز`
                  : `${offers.length} Offers`}
              </span>
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

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-4 flex-1">
          {/* Quick Job Context Strip */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#0F766E]">
                    <Wrench className="size-3" />
                    <span>{job.subCategory || job.category}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3 text-[#0F766E]" />
                    <span>{job.area}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3 text-slate-400" />
                    <span>{job.preferredDate || (isUrdu ? "آج" : "Today")}</span>
                  </span>
                </div>
                <h4 className="text-sm font-bold text-[#1A1A2E] truncate">
                  {job.title}
                </h4>
              </div>

              {onViewJobDetails && (
                <button
                  type="button"
                  onClick={() => onViewJobDetails(job)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0F766E] bg-[#0F766E]/10 hover:bg-[#0F766E]/20 transition-colors shrink-0 self-start sm:self-center cursor-pointer"
                >
                  <span>{isUrdu ? "جاب کی مکمل تفصیلات" : "View Job Details"}</span>
                  <ExternalLink className="size-3 rtl:rotate-180" />
                </button>
              )}
            </div>
          </div>

          {/* Assigned Worker Banner if job is already booked */}
          {job.selectedOffer ? (
            <div className="bg-white rounded-2xl p-5 border-2 border-[#0F766E]/30 shadow-sm space-y-4 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#0F766E]">
                  <CheckCircle2 className="size-4.5" />
                  <span>{isUrdu ? "کاریگر متعین ہو چکا ہے" : "Technician Assigned & Confirmed"}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#0F766E] text-white">
                  {isUrdu ? "وزٹ شیڈول ہو گیا" : "Visit Scheduled"}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="relative size-12 rounded-xl overflow-hidden shadow-2xs shrink-0 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={job.selectedOffer.worker.avatarUrl}
                      alt={job.selectedOffer.worker.name}
                      className="w-full h-full object-cover"
                    />
                    {job.selectedOffer.worker.isCnicVerified && (
                      <span className="absolute bottom-0 right-0 size-3.5 bg-[#16A34A] rounded-full ring-2 ring-white flex items-center justify-center text-white">
                        <CheckCircle2 className="size-2.5" />
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#123B5D]">
                      {job.selectedOffer.worker.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {job.selectedOffer.worker.businessName || (isUrdu ? "تصدیق شدہ کاریگر" : "Certified Pro")}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[#F59E0B] font-bold mt-0.5">
                      <Star className="size-3 fill-[#F59E0B]" />
                      <span>{job.selectedOffer.worker.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">
                        ({job.selectedOffer.worker.completedJobsCount} {isUrdu ? "کام" : "jobs"})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right rtl:sm:text-left pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee"}
                  </span>
                  <span className="text-lg font-extrabold text-[#0F766E]">
                    Rs. {job.selectedOffer.visitFee.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 flex items-center justify-between">
                <span>
                  {isUrdu
                    ? "دیگر تمام آفرز بند ہو چکی ہیں۔ کاریگر کی دہلیز پر آمد کے وقت سیکیورٹی PIN کی تصدیق کریں۔"
                    : "Other offers closed. Verify the 4-digit Doorstep PIN upon arrival."}
                </span>
              </div>

              {/* Direct Transition Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <a
                  href={`/customer/visits`}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Clock className="size-4" />
                  <span>{isUrdu ? "لائیو وزٹ اور دہلیز PIN ٹریک کریں ←" : "Track Live Visit & Doorstep PIN →"}</span>
                </a>

                {job.selectedOffer.worker.phone && (
                  <a
                    href={`tel:${job.selectedOffer.worker.phone}`}
                    className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>{isUrdu ? "کال کریں" : "Call Pro"}</span>
                  </a>
                )}
              </div>
            </div>
          ) : offers.length > 0 ? (
            <div className="space-y-3.5">
              {offers.map((offer) => {
                const { worker } = offer;
                const isConfirmingDecline = decliningOfferId === offer.id;

                return (
                  <div
                    key={offer.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-sm hover:shadow-md transition-all space-y-3.5"
                  >
                    {/* Worker Header & Pricing Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Worker Avatar with CNIC verification badge */}
                        <div className="relative size-13 sm:size-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200 shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={worker.avatarUrl}
                            alt={worker.name}
                            className="w-full h-full object-cover"
                          />
                          {worker.isCnicVerified && (
                            <span
                              className="absolute bottom-0.5 right-0.5 rtl:right-auto rtl:left-0.5 size-4 rounded-full bg-[#16A34A] text-white flex items-center justify-center ring-2 ring-white"
                              title={isUrdu ? "نادرا تصدیق شدہ کاریگر" : "NADRA Verified Pro"}
                            >
                              <CheckCircle2 className="size-3" />
                            </span>
                          )}
                        </div>

                        {/* Worker Identity Details */}
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-[#1A1A2E]">
                              {worker.name}
                            </h4>
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#0F766E]/10 text-[#0F766E] text-[10px] font-bold">
                              <ShieldCheck className="size-3" />
                              <span>{isUrdu ? "تصدیق شدہ پرو" : "Verified Pro"}</span>
                            </span>
                          </div>

                          {worker.businessName && (
                            <p className="text-xs text-slate-500 font-medium">
                              {worker.businessName}
                            </p>
                          )}

                          {/* Rating & Completed Jobs */}
                          <div className="flex items-center gap-2 pt-0.5 text-xs">
                            <span className="flex items-center text-[#F59E0B] font-bold">
                              <Star className="size-3.5 fill-[#F59E0B] mr-0.5 rtl:mr-0 rtl:ml-0.5" />
                              <span>{worker.rating.toFixed(1)}</span>
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 font-medium">
                              {isUrdu
                                ? `(${worker.completedJobsCount} مکمل کام)`
                                : `(${worker.completedJobsCount} completed)`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quoted Fee & ETA */}
                      <div className="text-left sm:text-right rtl:sm:text-left flex sm:flex-col justify-between items-center sm:items-end rtl:sm:items-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
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

                    {/* Technician's Note / Remarks */}
                    {offer.note && (
                      <div className="p-2.5 rounded-xl bg-slate-50 text-xs text-slate-700 leading-relaxed border border-slate-100">
                        <span className="font-semibold text-[#123B5D]">
                          {isUrdu ? "کاریگر کا پیغام: " : "Worker Note: "}
                        </span>
                        <span>{offer.note}</span>
                      </div>
                    )}

                    {/* Verified Badges & Distance Pills */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-100">
                        <MapPin className="size-3 text-[#0F766E]" />
                        <span>{isUrdu ? `${offer.distanceKm} کلومیٹر دور` : `${offer.distanceKm} km away`}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-100">
                        <Clock className="size-3 text-slate-400" />
                        <span>{isUrdu ? `جواب: ${worker.responseTime}` : `Resp: ${worker.responseTime}`}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <ShieldCheck className="size-3 text-emerald-600" />
                        <span>{isUrdu ? "نادرا سی این آئی سی تصدیق شدہ" : "NADRA CNIC Cleared"}</span>
                      </span>
                    </div>

                    {/* Decline Confirmation Prompt or Standard Action Buttons */}
                    {isConfirmingDecline ? (
                      <div className="p-3 bg-red-50/80 border border-red-200 rounded-xl space-y-2 animate-in fade-in-50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-red-700">
                          <ShieldAlert className="size-4 shrink-0" />
                          <span>
                            {isUrdu
                              ? `کیا آپ واقعی ${worker.name} کی آفر مسترد کرنا چاہتے ہیں؟`
                              : `Are you sure you want to decline ${worker.name}'s offer?`}
                          </span>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setDecliningOfferId(null)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                          >
                            {isUrdu ? "منسوخ کریں" : "Cancel"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConfirmDecline(offer)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors cursor-pointer"
                          >
                            {isUrdu ? "ہاں، مسترد کریں" : "Yes, Decline"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 pt-1">
                        {/* View Profile */}
                        <button
                          type="button"
                          onClick={() => onViewProfile(offer)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-200 cursor-pointer active:scale-99"
                        >
                          <User className="size-3.5 text-slate-500" />
                          <span>{isUrdu ? "پروفائل دیکھیں" : "View Profile"}</span>
                        </button>

                        {/* Decline / Reject Offer */}
                        <button
                          type="button"
                          onClick={() => setDecliningOfferId(offer.id)}
                          className="py-2.5 px-3 rounded-xl bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 font-semibold text-xs transition-colors flex items-center justify-center gap-1 border border-slate-200 hover:border-red-200 cursor-pointer"
                          title={isUrdu ? "آفر مسترد کریں" : "Decline Offer"}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="hidden sm:inline">{isUrdu ? "مسترد کریں" : "Decline"}</span>
                        </button>

                        {/* Accept / Select Worker */}
                        <button
                          type="button"
                          onClick={() => onSelectWorker(job, offer)}
                          className="flex-1 py-2.5 px-3 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-99"
                        >
                          <CheckCircle2 className="size-4" />
                          <span>{isUrdu ? "کاریگر منتخب کریں" : "Select Worker"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center space-y-3 border border-[#E2E8F0]">
              <div className="size-12 rounded-2xl bg-teal-50 text-[#0F766E] flex items-center justify-center mx-auto">
                <Clock className="size-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[#123B5D]">
                  {isUrdu ? "ابھی تک کوئی آفر موصول نہیں ہوئی" : "No Offers Received Yet"}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {isUrdu
                    ? `ہم نے ${job.area} کے تصدیق شدہ ماہرین کو آپ کی درخواست پہنچا دی ہے۔ جلد ہی آفرز یہاں ظاہر ہوں گی۔`
                    : `We are alerting verified technicians in ${job.area}. Offers will appear live here as soon as pros respond.`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="size-4 text-[#16A34A] shrink-0" />
            <span className="hidden sm:inline">
              {isUrdu
                ? "نادرا تصدیق شدہ کاریگر اور شفاف فکسڈ وزٹ فیس"
                : "NADRA verified technicians with doorstep security PIN"}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            {isUrdu ? "بند کریں" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
