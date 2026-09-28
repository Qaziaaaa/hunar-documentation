"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import type { CustomerJob, WorkerOffer } from "../types";

interface SelectWorkerModalProps {
  job: CustomerJob;
  offer: WorkerOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking: (offer: WorkerOffer) => void;
}

export function SelectWorkerModal({
  job,
  offer,
  isOpen,
  onClose,
  onConfirmBooking,
}: SelectWorkerModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen || !offer) return null;

  const { worker } = offer;

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirmBooking(offer);
      setIsConfirming(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 text-[#123B5D]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
              <CheckCircle2 className="size-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#123B5D]">
                {isUrdu ? "کاریگر کی بکنگ کی تصدیق" : "Confirm Technician Booking"}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isUrdu ? "وزٹ شیڈول کرنے سے پہلے آخری مرحلہ" : "Final step before scheduling visit"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Selected Pro Card Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative size-12 rounded-xl overflow-hidden shadow-2xs shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={worker.avatarUrl}
                  alt={worker.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[#123B5D]">
                    {worker.name}
                  </span>
                  <ShieldCheck className="size-3.5 text-[#16A34A]" />
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {worker.businessName || (isUrdu ? "تصدیق شدہ کاریگر" : "Verified Pro")}
                </p>
              </div>
            </div>

            <div className="text-right rtl:text-left">
              <span className="text-[10.5px] text-slate-400 block font-medium">
                {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee"}
              </span>
              <span className="text-base font-extrabold text-[#0F766E]">
                Rs. {offer.visitFee.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Schedule & Address Pill */}
          <div className="p-3.5 rounded-2xl bg-slate-50 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin className="size-3.5 text-[#0F766E] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#123B5D]">
                  {isUrdu ? "سروس کا مقام: " : "Service Location: "}
                </span>
                <span>{job.address} ({job.area})</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="size-3.5 text-[#0F766E] shrink-0" />
              <div>
                <span className="font-bold text-[#123B5D]">
                  {isUrdu ? "پسندیدہ وقت: " : "Preferred Timing: "}
                </span>
                <span>
                  {job.preferredDate || (isUrdu ? "آج" : "Today")} • {job.preferredTimeSlot || (isUrdu ? "صبح کا وقت" : "Morning")}
                </span>
              </div>
            </div>
          </div>


          {/* Safety Trust Note */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
            <ShieldCheck className="size-4 text-[#16A34A] shrink-0" />
            <span>
              {isUrdu
                ? "نادرا تصدیق شدہ کاریگر ڈور سٹیپ سیکیورٹی PIN کے ساتھ۔"
                : "Verified technician with doorstep security PIN."}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-5 border-t border-slate-100 bg-white flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            {isUrdu ? "منسوخ کریں" : "Cancel"}
          </button>

          <button
            type="button"
            disabled={isConfirming}
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isConfirming ? (
              <span>{isUrdu ? "شیڈول ہو رہا ہے..." : "Scheduling Visit..."}</span>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>{isUrdu ? "بکنگ کنفرم کریں" : "Confirm Booking"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

