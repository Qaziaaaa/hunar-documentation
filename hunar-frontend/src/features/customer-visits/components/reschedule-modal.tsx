"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import { Calendar, CheckCircle2, Clock, X } from "lucide-react";
import type { ScheduledVisit } from "../types";

interface RescheduleModalProps {
  visit: ScheduledVisit | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmReschedule: (newDate: string, newSlot: string) => void;
}

export function RescheduleModal({
  visit,
  isOpen,
  onClose,
  onConfirmReschedule,
}: RescheduleModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [selectedDate, setSelectedDate] = useState<string>("Tomorrow");
  const [selectedSlot, setSelectedSlot] = useState<string>("Morning (8:00 AM - 12:00 PM)");
  const [reason, setReason] = useState<string>("");

  if (!isOpen || !visit) return null;

  const dateOptions = isUrdu
    ? [
        { label: "آج شام", value: "Today Evening", desc: "4:00 PM – 7:00 PM" },
        { label: "کل", value: "Tomorrow", desc: "معمول کے اوقات" },
        { label: "پرسوں", value: "Day After Tomorrow", desc: "ویک اینڈ سلاٹ" },
      ]
    : [
        { label: "Today Evening", value: "Today Evening", desc: "4:00 PM – 7:00 PM" },
        { label: "Tomorrow", value: "Tomorrow", desc: "Preferred regular slots" },
        { label: "Day After Tomorrow", value: "Day After Tomorrow", desc: "Weekend slot" },
      ];

  const slotOptions = isUrdu
    ? [
        { label: "صبح", value: "Morning", time: "8:00 AM – 12:00 PM" },
        { label: "دوپہر", value: "Afternoon", time: "12:00 PM – 4:00 PM" },
        { label: "شام", value: "Evening", time: "4:00 PM – 7:00 PM" },
      ]
    : [
        { label: "Morning", value: "Morning", time: "8:00 AM – 12:00 PM" },
        { label: "Afternoon", value: "Afternoon", time: "12:00 PM – 4:00 PM" },
        { label: "Evening", value: "Evening", time: "4:00 PM – 7:00 PM" },
      ];

  const handleSave = () => {
    onConfirmReschedule(selectedDate, selectedSlot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 space-y-5 p-6 rtl:text-right">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
              <Calendar className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#123B5D]">
                {isUrdu ? "وزٹ کا وقت تبدیل کریں" : "Reschedule Visit Appointment"}
              </h3>
              <p className="text-xs text-slate-500">
                {isUrdu ? `آرڈر #${visit.id} • ${visit.technician.name}` : `Order #${visit.id} • ${visit.technician.name}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#123B5D] block">
            {isUrdu ? "نئی تاریخ منتخب کریں" : "Select New Preferred Date"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {dateOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedDate(opt.value)}
                className={`p-3 rounded-xl border text-left rtl:text-right transition-all cursor-pointer ${
                  selectedDate === opt.value
                    ? "border-[#0F766E] bg-[#0F766E]/5 ring-2 ring-[#0F766E]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold text-[#123B5D] block">{opt.label}</span>
                <span className="text-[10.5px] text-slate-500 block mt-0.5">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slot Selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#123B5D] block">
            {isUrdu ? "مناسب وقت منتخب کریں" : "Select Time Slot"}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {slotOptions.map((slot) => {
              const fullSlot = `${slot.label} (${slot.time})`;
              const isSelected = selectedSlot.startsWith(slot.value) || selectedSlot.startsWith(slot.label);
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setSelectedSlot(fullSlot)}
                  className={`p-3 rounded-xl border text-left rtl:text-right transition-all cursor-pointer ${
                    isSelected
                      ? "border-[#0F766E] bg-[#0F766E]/5 ring-2 ring-[#0F766E]/20"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold text-[#123B5D] block">{slot.label}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">{slot.time}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#123B5D] block">
            {isUrdu
              ? "کاریگر کے لیے خصوصی ہدایات (اختیاری)"
              : "Reason or Instructions for Technician (Optional)"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              isUrdu
                ? "مثلاً: دفتر کے بعد تشریف لائیں یا گیٹ پر پہنچ کر گھنٹی بجائیں..."
                : "e.g. Please come after office hours or call gate security before entry..."
            }
            rows={2}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 resize-none bg-slate-50 focus:bg-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {isUrdu ? "پہلا وقت برقرار رکھیں" : "Keep Original"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-[0.99]"
          >
            <CheckCircle2 className="size-4" />
            <span>{isUrdu ? "نیا وقت کنفرم کریں" : "Confirm New Slot"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

