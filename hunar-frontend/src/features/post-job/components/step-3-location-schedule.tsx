"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  ChevronRight,
  Clock,
  Crosshair,
  Home,
  Lock,
  MapPin,
  Sparkles,
  X,
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
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [specificTime, setSpecificTime] = useState("10:00");

  const formatTime24to12 = (t24: string): string => {
    if (!t24) return "10:00 AM";
    const [hStr, mStr] = t24.split(":");
    let h = parseInt(hStr, 10);
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${ampm}`;
  };

  const isMorning = data.preferredTimeSlot === "8:00 AM - 12:00 PM";
  const isAfternoon = data.preferredTimeSlot === "12:00 PM - 4:00 PM";
  const isEvening = data.preferredTimeSlot === "4:00 PM - 8:00 PM";
  const isSpecific = !isMorning && !isAfternoon && !isEvening;

  const handleSpecificTimeChange = (t24: string) => {
    if (!t24) return;
    setSpecificTime(t24);
    const formatted = formatTime24to12(t24);
    onChange({
      preferredTimeSlot: isUrdu
        ? `مخصوص وقت (${formatted})`
        : `Specific Time (${formatted})`,
    });
  };

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
      time: isSpecific && data.preferredTimeSlot
        ? data.preferredTimeSlot
        : formatTime24to12(specificTime),
    },
  ];

  const currentTimeSlotObj = (() => {
    if (isMorning) return timeWindows[0];
    if (isAfternoon) return timeWindows[1];
    if (isEvening) return timeWindows[2];
    return {
      id: "specific" as const,
      label: isUrdu ? "مخصوص وقت" : "Specific Time",
      time: data.preferredTimeSlot || formatTime24to12(specificTime),
    };
  })();

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

  const formattedSelectedDate = (() => {
    if (!data.preferredDate) return isUrdu ? "آج" : "Today";
    const d = new Date(data.preferredDate + "T00:00:00");
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    if (data.preferredDate === todayStr) {
      return isUrdu ? "آج" : "Today";
    }
    if (data.preferredDate === tomorrowStr) {
      return isUrdu ? "کل" : "Tomorrow";
    }
    return d.toLocaleDateString(isUrdu ? "ur-PK" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  })();

  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Find closest hotspot to name the neighborhood in Peshawar
          let closest = PESHAWAR_HOTSPOTS[0];
          let minDistance = Number.MAX_VALUE;
          PESHAWAR_HOTSPOTS.forEach((h) => {
            const dist = Math.hypot(h.lat - lat, h.lng - lng);
            if (dist < minDistance) {
              minDistance = dist;
              closest = h;
            }
          });

          onChange({
            latitude: lat,
            longitude: lng,
            area: closest.areaKey,
            landmark: closest.landmark,
            city: "Peshawar",
            address: `GPS Location, ${closest.areaKey}`,
          });
          setIsLocating(false);
        },
        () => {
          // Fallback to University Town, Peshawar default if location permission denied
          onChange({
            area: "University Town, Peshawar",
            address: "House 45, Street 12, Block C, University Town",
            city: "Peshawar",
            landmark: "Near Islamia College Gate",
            latitude: 34.0043,
            longitude: 71.5034,
          });
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      onChange({
        area: "University Town, Peshawar",
        address: "House 45, Street 12, Block C, University Town",
        city: "Peshawar",
        landmark: "Near Islamia College Gate",
        latitude: 34.0043,
        longitude: 71.5034,
      });
      setIsLocating(false);
    }
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
      onChange({ area: selectedArea, city: "Peshawar" });
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
    <div className="space-y-4 animate-in fade-in-50 duration-300 pb-20 lg:pb-8">
      {/* Header Section */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D] tracking-tight">
          {isUrdu ? "مقام اور شیڈول منتخب کریں" : "Set Location & Schedule"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium">
          {isUrdu
            ? "کاریگر کے لیے درست پتہ اور اپنی سہولت کے مطابق وزٹ کا وقت چنیں"
            : "Pinpoint your service location and pick the most convenient arrival time"}
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Map & Address (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-3.5">
          <div className="bg-white rounded-2xl shadow-sm p-3.5 sm:p-4 space-y-3.5 border border-slate-100">
            <PeshawarMapPicker
              data={data}
              onChange={onChange}
              isLocating={isLocating}
              onAutoDetect={handleUseCurrentLocation}
            />

            {/* Service Area Selector & Address Input */}
            <div className="space-y-3.5 pt-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
                  {isUrdu ? "پتہ اور لوکیشن کی تفصیلات" : "Address & Location Details"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  {isUrdu
                    ? "نیچے دی گئی فیلڈز میں اپنا علاقہ اور درست پتہ درج کریں"
                    : "Select your neighborhood and enter your street or house address below"}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-bold text-[#123B5D]">
                    {isUrdu ? "علاقہ / نیبرہڈ" : "Area / Neighborhood"}
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="text-xs font-bold text-[#0F8B8D] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Crosshair className={`size-3.5 ${isLocating ? "animate-spin" : ""}`} />
                    <span>{isUrdu ? "میری موجودہ لوکیشن" : "Use Live Location"}</span>
                  </button>
                </div>
                <select
                  value={data.area}
                  onChange={(e) => handleAreaSelectChange(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F8B8D]/20 font-medium"
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
                <label className="block text-sm font-bold text-[#123B5D] mb-1.5">
                  {isUrdu ? "گلی کا پتہ / مکان نمبر" : "Street Address / House #"}
                </label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => onChange({ address: e.target.value })}
                  placeholder={isUrdu ? "مثلاً مکان 12، گلی 4" : "e.g. House 12, Street 4"}
                  className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F8B8D]/20 font-medium"
                />
              </div>

              {/* City & Nearest Landmark */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-sm font-bold text-[#123B5D] mb-1.5">
                    {isUrdu ? "شہر" : "City"}
                  </label>
                  <input
                    type="text"
                    value={data.city || "Peshawar"}
                    onChange={(e) => onChange({ city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-[#123B5D] mb-1.5">
                    {isUrdu ? "قریبی مشہور جگہ / لینڈ مارک" : "Nearest Landmark"}
                  </label>
                  <input
                    type="text"
                    value={data.landmark || ""}
                    onChange={(e) => onChange({ landmark: e.target.value })}
                    placeholder={isUrdu ? "مثلاً اسلامیہ کالج کے قریب" : "e.g. Near Islamia College"}
                    className="w-full px-3 py-2.5 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-slate-50/70 border border-slate-200 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F8B8D]/20 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-2.5 border border-slate-200 rounded-xl text-[11.5px] text-slate-600 font-medium flex items-center gap-1.5 bg-white shadow-2xs">
            <Lock className="size-3.5 text-[#0F8B8D] shrink-0" />
            <span>
              {isUrdu
                ? "مکمل پتہ صرف تصدیق شدہ اور منظور شدہ ورکر کے ساتھ شیئر کیا جاتا ہے۔"
                : "Exact street address is shared only with confirmed booked pro"}
            </span>
          </div>
        </div>

        {/* Right Column: Schedule Selection (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-3.5">
          {/* ASAP vs Scheduled Mode Selector */}
          <div className="bg-white rounded-2xl shadow-sm p-3.5 sm:p-4 space-y-3 border border-slate-100">
            <label className="block text-sm sm:text-base font-bold text-[#123B5D]">
              {isUrdu ? "آپ کو ورکر کب چاہیے؟" : "When do you need the technician?"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onChange({ scheduleType: "asap" })}
                className={`p-3 rounded-xl text-start flex flex-col gap-1.5 transition-all cursor-pointer ${
                  data.scheduleType === "asap"
                    ? "bg-[#0F8B8D]/10 ring-2 ring-[#0F8B8D]"
                    : "bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#0F8B8D]">
                  <Zap className="size-4 fill-[#0F8B8D]" />
                  <span>{isUrdu ? "فوری / ASAP" : "Immediate / ASAP"}</span>
                </div>
                <span className="text-[11px] text-slate-600 font-medium">
                  {isUrdu ? "30-60 منٹ کے اندر پہنچیں" : "Arrival within 30-60 mins"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onChange({ scheduleType: "scheduled" });
                  setIsScheduleModalOpen(true);
                }}
                className={`p-3 rounded-xl text-start flex flex-col gap-1.5 transition-all cursor-pointer ${
                  data.scheduleType === "scheduled"
                    ? "bg-[#0F8B8D]/10 ring-2 ring-[#0F8B8D]"
                    : "bg-slate-50 hover:bg-slate-100 border border-slate-200/60"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#123B5D]">
                  <CalendarIcon className="size-4 text-[#0F8B8D]" />
                  <span>{isUrdu ? "طے شدہ وقت" : "Scheduled Visit"}</span>
                </div>
                <span className="text-[11px] text-slate-600 font-medium">
                  {data.scheduleType === "scheduled" && data.preferredDate
                    ? `${formattedSelectedDate} • ${currentTimeSlotObj?.label}`
                    : isUrdu
                    ? "تاریخ اور وقت منتخب کریں"
                    : "Pick date & time"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-4 border-t border-slate-200 flex justify-between items-center gap-4 pb-20 lg:pb-8">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
          <span>{isUrdu ? "پیچھے" : "Back"}</span>
        </button>

        <button
          type="button"
          onClick={handleProceed}
          className="px-6 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-bold text-white shadow-sm bg-[#0F8B8D] hover:bg-[#0D7A7C] active:scale-[0.99] cursor-pointer"
        >
          <span>{isUrdu ? "اگلا مرحلہ: جائزہ لیں" : "Next Step: Review"}</span>
          <ArrowRight className="size-4 rtl:rotate-180" />
        </button>
      </div>

      {/* Date & Time Selection Pop-up Modal */}
      {isScheduleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 p-5 sm:p-6 space-y-4 my-auto max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0">
                  <CalendarIcon className="size-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#123B5D]">
                    {isUrdu ? "تاریخ اور وقت منتخب کریں" : "Select Date & Time"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isUrdu
                      ? "کاریگر کی آمد کا دن اور موزوں وقت منتخب کریں"
                      : "Choose preferred appointment day and arrival window"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="size-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Content inside modal */}
            <div className="overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              {/* Section 1: Date Selection */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs sm:text-sm font-bold text-[#123B5D] flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5 text-[#0F8B8D]" />
                    <span>{isUrdu ? "1. وزٹ کی تاریخ منتخب کریں" : "1. Select Visit Date"}</span>
                  </label>
                  <span className="text-[11px] font-bold text-[#0F8B8D] bg-[#0F8B8D]/10 px-2.5 py-0.5 rounded-full">
                    {formattedSelectedDate}
                  </span>
                </div>

                {/* Calendar Days Horizontal Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {calendarDays.slice(0, 14).map((day) => {
                    const isSelected = data.preferredDate === day.dateString;
                    return (
                      <button
                        key={day.dateString}
                        type="button"
                        onClick={() => onChange({ preferredDate: day.dateString })}
                        className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? "bg-[#0F8B8D] text-white shadow-md font-bold ring-2 ring-[#0F8B8D]/30"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold">
                          {day.isToday ? (isUrdu ? "آج" : "Today") : day.dayName}
                        </span>
                        <span className="text-sm font-extrabold mt-0.5">
                          {day.dayNumber}
                        </span>
                        <span className="text-[9.5px] opacity-80">
                          {day.monthName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Time Window Selection */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {timeWindows.map((slot) => {
                    const isSelected =
                      slot.id === "specific"
                        ? isSpecific
                        : data.preferredTimeSlot === slot.time;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          if (slot.id === "specific") {
                            handleSpecificTimeChange(specificTime);
                          } else {
                            onChange({ preferredTimeSlot: slot.time });
                          }
                        }}
                        className={`p-3 rounded-xl border text-left rtl:text-right flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#0F8B8D] bg-[#0F8B8D]/10 ring-2 ring-[#0F8B8D]/20 shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-[#0F8B8D] text-white"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            <Clock className="size-3.5" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#123B5D] block">
                              {slot.label}
                            </span>
                            <span className="text-[10.5px] text-slate-500 block font-medium">
                              {slot.id === "specific"
                                ? isSpecific
                                  ? formatTime24to12(specificTime)
                                  : isUrdu
                                  ? "وقت منتخب کریں"
                                  : "Choose time"
                                : slot.time}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center">
                          {isSelected ? (
                            <div className="size-4.5 rounded-full bg-[#0F8B8D] text-white flex items-center justify-center shadow-xs">
                              <Check className="size-2.5 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="size-4.5 rounded-full border-2 border-slate-300" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Simple, Clean Time Input */}
                {isSpecific && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0">
                        <Clock className="size-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-[#123B5D] block">
                          {isUrdu ? "مخصوص وقت منتخب کریں:" : "Select Specific Time:"}
                        </span>
                        <span className="text-[10.5px] text-slate-500 font-medium">
                          {formatTime24to12(specificTime)}
                        </span>
                      </div>
                    </div>

                    <input
                      type="time"
                      value={specificTime}
                      onChange={(e) => handleSpecificTimeChange(e.target.value)}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/30 cursor-pointer shadow-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 font-medium">
                {formattedSelectedDate} • {currentTimeSlotObj?.label} ({currentTimeSlotObj?.time})
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange({ scheduleType: "scheduled" });
                  setIsScheduleModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#0F8B8D] hover:bg-[#0D7A7C] transition-colors cursor-pointer shadow-sm"
              >
                {isUrdu ? "محفوظ کریں اور تصدیق کریں" : "Confirm Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
