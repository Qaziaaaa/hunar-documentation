"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Clock,
  Crosshair,
  Home,
  Lock,
  MapPin,
  Sparkles,
  Zap,
} from "lucide-react";
import { useLocale } from "next-intl";
import { PeshawarMapPicker, PESHAWAR_HOTSPOTS } from "./peshawar-map-picker";
import { SERVICE_AREAS } from "../data/categories";
import type { PostJobData, ScheduleType, TimeWindowOption } from "../types";

interface Step3LocationScheduleProps {
  data: PostJobData;
  onChange: (updates: Partial<PostJobData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step3LocationSchedule({
  data,
  onChange,
  onNext,
  onBack,
}: Step3LocationScheduleProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Time slot options
  const timeWindows: { id: TimeWindowOption; label: string; time: string }[] = [
    {
      id: "morning",
      label: isUrdu ? "صبح کا وقت" : "Morning",
      time: "8:00 AM - 12:00 PM",
    },
    {
      id: "afternoon",
      label: isUrdu ? "دوپہر کا وقت" : "Afternoon",
      time: "12:00 PM - 4:00 PM",
    },
    {
      id: "evening",
      label: isUrdu ? "شام کا وقت" : "Evening",
      time: "4:00 PM - 8:00 PM",
    },
    {
      id: "specific",
      label: isUrdu ? "مخصوص وقت" : "Specific Time",
      time: isUrdu ? "باہمی چیٹ پر طے شدہ" : "Flexible as per mutual chat",
    },
  ];

  // Calendar dates: next 14 days
  const today = new Date();
  const calendarDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return {
      dateString: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString(isUrdu ? "ur-PK" : "en-US", { weekday: "short" }),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString(isUrdu ? "ur-PK" : "en-US", { month: "short" }),
      isToday: i === 0,
      isTomorrow: i === 1,
    };
  });

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setTimeout(() => {
      onChange({
        area: "Hayatabad",
        address: "Phase 3, Sector D-2, Street 8",
        city: "Peshawar",
        landmark: "Near Tatara Park",
        latitude: 33.9934,
        longitude: 71.4398,
      });
      setIsLocating(false);
    }, 600);
  };

  const handleAreaSelectChange = (selectedArea: string) => {
    const match = PESHAWAR_HOTSPOTS.find(
      (h) => h.areaKey.toLowerCase() === selectedArea.toLowerCase()
    );
    if (match) {
      onChange({
        area: match.areaKey,
        landmark: match.landmark,
        address: match.addressPrefix,
        latitude: match.lat,
        longitude: match.lng,
        city: "Peshawar",
      });
    } else {
      onChange({ area: selectedArea });
    }
  };

  const handleProceed = () => {
    if (!data.address.trim()) {
      setError(
        isUrdu
          ? "براہ کرم اپنا گلی یا مکان نمبر درج کریں۔"
          : "Please enter your street address or house number."
      );
      return;
    }
    if (!data.area.trim()) {
      setError(
        isUrdu
          ? "براہ کرم اپنا سروس ایریا منتخب کریں۔"
          : "Please select your service area / neighborhood."
      );
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-4">
      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Map & Address (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-3.5">
          <div className="bg-white rounded-2xl shadow-sm p-3.5 space-y-3">
            <PeshawarMapPicker
              data={data}
              onChange={onChange}
              isLocating={isLocating}
              onAutoDetect={handleUseCurrentLocation}
            />

            {/* Service Area Selector & Address Input */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {isUrdu ? "علاقہ / نیبرہڈ" : "Area / Neighborhood"}
                </label>
                <select
                  value={data.area}
                  onChange={(e) => handleAreaSelectChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F766E]/20"
                >
                  <option value="">{isUrdu ? "علاقہ منتخب کریں" : "Select Area"}</option>
                  {SERVICE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {isUrdu ? "گلی کا پتہ / مکان نمبر" : "Street Address / House #"}
                </label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => onChange({ address: e.target.value })}
                  placeholder={isUrdu ? "مثلاً مکان 12، گلی 4" : "e.g. House 12, Street 4"}
                  className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F766E]/20"
                />
              </div>

              {/* City & Nearest Landmark */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {isUrdu ? "شہر" : "City"}
                  </label>
                  <input
                    type="text"
                    value={data.city || "Peshawar"}
                    onChange={(e) => onChange({ city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    {isUrdu ? "قریبی مشہور جگہ / لینڈ مارک" : "Nearest Landmark"}
                  </label>
                  <input
                    type="text"
                    value={data.landmark || ""}
                    onChange={(e) => onChange({ landmark: e.target.value })}
                    placeholder={isUrdu ? "مثلاً اسلامیہ کالج گیٹ کے قریب" : "e.g. Near Islamia College Gate"}
                    className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F766E]/20"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-2.5 border border-slate-100 rounded-xl text-[11px] text-slate-500 flex items-center gap-1.5 bg-white">
            <Lock className="size-3.5 text-[#0F766E]" />
            <span>
              {isUrdu
                ? "مکمل پتہ صرف تصدیق شدہ اور منظور شدہ ورکر کے ساتھ شیئر کیا جاتا ہے۔"
                : "Exact street address is shared only with confirmed booked pro"}
            </span>
          </div>
        </div>

        {/* Right Column: Date & Time Panels (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3.5">
          {/* ASAP vs Scheduled Mode Selector */}
          <div className="bg-white rounded-2xl shadow-sm p-3.5 space-y-2">
            <label className="block text-xs font-bold text-[#123B5D]">
              {isUrdu ? "آپ کو ورکر کب چاہیے؟" : "When do you need the technician?"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ scheduleType: "asap" })}
                className={`p-2.5 rounded-xl text-start flex flex-col gap-1 transition-all cursor-pointer ${
                  data.scheduleType === "asap"
                    ? "bg-[#0F766E]/10 ring-2 ring-[#0F766E]"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#0F766E]">
                  <Zap className="size-3.5 fill-[#0F766E]" />
                  <span>{isUrdu ? "فوری / ASAP" : "Immediate / ASAP"}</span>
                </div>
                <span className="text-[10.5px] text-slate-500">
                  {isUrdu ? "30-60 منٹ کے اندر پہنچیں" : "Arrival within 30-60 mins"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onChange({ scheduleType: "scheduled" })}
                className={`p-2.5 rounded-xl text-start flex flex-col gap-1 transition-all cursor-pointer ${
                  data.scheduleType === "scheduled"
                    ? "bg-[#0F766E]/10 ring-2 ring-[#0F766E]"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs text-[#123B5D]">
                  <CalendarIcon className="size-3.5 text-[#0F766E]" />
                  <span>{isUrdu ? "طے شدہ وقت" : "Scheduled Visit"}</span>
                </div>
                <span className="text-[10.5px] text-slate-500">
                  {isUrdu ? "تاریخ اور وقت منتخب کریں" : "Pick date & time window"}
                </span>
              </button>
            </div>
          </div>

          {/* Date Selector Card */}
          <div className="bg-white rounded-2xl shadow-sm p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="size-4 text-[#0F766E]" />
                <h2 className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "پسندیدہ تاریخ" : "Preferred Date"}
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-[#0F766E]">
                {data.preferredDate
                  ? new Date(data.preferredDate).toLocaleDateString(isUrdu ? "ur-PK" : "en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : isUrdu
                    ? "آج"
                    : "Today"}
              </span>
            </div>

            {/* Horizontal Scrollable Mini Date Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {calendarDays.map((day) => {
                const isSelected = data.preferredDate === day.dateString;
                return (
                  <button
                    key={day.dateString}
                    type="button"
                    onClick={() => onChange({ preferredDate: day.dateString })}
                    className={`flex flex-col items-center justify-center min-w-[50px] py-2 px-1.5 rounded-xl text-center transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-[#0F766E] text-white shadow-2xs font-bold"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold">
                      {day.isToday ? (isUrdu ? "آج" : "Today") : day.dayName}
                    </span>
                    <span className="text-sm font-bold mt-0.5">
                      {day.dayNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Window Card */}
          <div className="bg-white rounded-2xl shadow-sm p-3.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <Clock className="size-4 text-[#0F766E]" />
              <h2 className="text-xs font-bold text-[#123B5D]">
                {isUrdu ? "وقت کا سلاٹ" : "Time Window"}
              </h2>
            </div>

            <div className="space-y-1.5">
              {timeWindows.map((slot) => {
                const isSelected = data.preferredTimeSlot === slot.time;
                return (
                  <label
                    key={slot.id}
                    onClick={() => onChange({ preferredTimeSlot: slot.time })}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0F766E]/10 text-[#0F766E] font-bold ring-2 ring-[#0F766E]"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span>{slot.label}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      {slot.time}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-3 border-t border-slate-200 flex justify-between items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2 rounded-full border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          <span>{isUrdu ? "پیچھے" : "Back"}</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="px-6 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-semibold text-white shadow-sm bg-[#0F766E] hover:bg-[#115E59] active:scale-[0.99] cursor-pointer"
        >
          <span>{isUrdu ? "اگلا مرحلہ: جائزہ لیں" : "Next Step: Review"}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
