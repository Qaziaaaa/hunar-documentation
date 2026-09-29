"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  Clock,
  Home,
  MapPin,
  Plus,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { PeshawarMapPicker, PESHAWAR_HOTSPOTS, getHotspotArea } from "./peshawar-map-picker";
import { SERVICE_AREAS } from "../data/categories";
import type { PostJobData, TimeWindowOption } from "../types";
import {
  getSavedAddresses,
  addOrUpdateSavedAddress,
} from "@/features/customer-profile/services/saved-addresses-storage";
import type { SavedAddress } from "@/features/customer-profile/types";
import { useLocale } from "next-intl";

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

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>(() => {
    if (typeof window !== "undefined") {
      return getSavedAddresses();
    }
    return [];
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showCustomLocation, setShowCustomLocation] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const list = getSavedAddresses();
      if (list.length === 0) return true;
      if (!data.address?.trim()) return false;
      const matched = list.some(
        (a) =>
          a.fullAddress.toLowerCase().trim() === data.address.toLowerCase().trim() &&
          (!data.area?.trim() || a.area.toLowerCase().trim() === data.area.toLowerCase().trim())
      );
      return !matched;
    }
    return false;
  });

  const [specificTimeInput, setSpecificTimeInput] = useState("10:00");
  const [error, setError] = useState<string | null>(null);

  // Initialize saved-address logic on mount:
  // - First time (no saved address): show map/location selection UI directly
  // - Returning user (saved address exists): show saved address first, select default
  useEffect(() => {
    const list = getSavedAddresses();
    setSavedAddresses(list);

    if (list.length === 0) {
      // First time — No saved address
      setShowCustomLocation(true);
      setSelectedAddressId(null);
    } else {
      // Returning user — Saved address exists
      if (data.address?.trim()) {
        const matched = list.find(
          (a) =>
            a.fullAddress.toLowerCase().trim() === data.address.trim().toLowerCase() &&
            (!data.area?.trim() || a.area.toLowerCase().trim() === data.area.toLowerCase().trim())
        );
        if (matched) {
          setSelectedAddressId(matched.id);
          setShowCustomLocation(false);
          return;
        }
        // Custom address previously typed in wizard session
        setShowCustomLocation(true);
        setSelectedAddressId(null);
        return;
      }

      // If no address is set yet, show saved address first and auto-select default saved address
      setShowCustomLocation(false);
      const defaultAddr = list.find((a) => a.isDefault) || list[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        onChange({
          address: defaultAddr.fullAddress,
          area: defaultAddr.area,
          city: defaultAddr.city || "Pakistan",
          landmark: defaultAddr.landmark || "",
          latitude: defaultAddr.latitude,
          longitude: defaultAddr.longitude,
        });
      }
    }
  }, []);

  // Ensure default scheduleType exists (default to asap for immediate simplicity)
  useEffect(() => {
    if (!data.scheduleType) {
      onChange({ scheduleType: "asap" });
    }
  }, []);

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setShowCustomLocation(false);
    setError(null);
    onChange({
      address: addr.fullAddress,
      area: addr.area,
      city: addr.city || "Pakistan",
      landmark: addr.landmark,
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
  };

  const getTagIcon = (tag: SavedAddress["tag"]) => {
    switch (tag) {
      case "home":
        return Home;
      case "office":
        return Building2;
      case "parents":
        return Users;
      default:
        return Sparkles;
    }
  };

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

  // Time slot options
  const timeWindows: { id: TimeWindowOption; label: string; time: string }[] = [
    {
      id: "morning",
      label: isUrdu ? "صبح" : "Morning",
      time: "8:00 AM – 12:00 PM",
    },
    {
      id: "afternoon",
      label: isUrdu ? "دوپہر" : "Afternoon",
      time: "12:00 PM – 4:00 PM",
    },
    {
      id: "evening",
      label: isUrdu ? "شام" : "Evening",
      time: "4:00 PM – 8:00 PM",
    },
    {
      id: "specific",
      label: isUrdu ? "مخصوص وقت" : "Specific time",
      time: isUrdu ? "اپنی مرضی کا وقت" : "Exact time",
    },
  ];

  const isMorning = data.preferredTimeSlot === "8:00 AM – 12:00 PM" || data.preferredTimeSlot === "8:00 AM - 12:00 PM";
  const isAfternoon = data.preferredTimeSlot === "12:00 PM – 4:00 PM" || data.preferredTimeSlot === "12:00 PM - 4:00 PM";
  const isEvening = data.preferredTimeSlot === "4:00 PM – 8:00 PM" || data.preferredTimeSlot === "4:00 PM - 8:00 PM";
  const isSpecificTime =
    Boolean(data.preferredTimeSlot) &&
    !isMorning &&
    !isAfternoon &&
    !isEvening;

  const handleSpecificTimeChange = (t24: string) => {
    if (!t24) return;
    setSpecificTimeInput(t24);
    const formatted = formatTime24to12(t24);
    onChange({ preferredTimeSlot: formatted });
  };

  // Calendar dates: next 5 days
  const today = new Date();
  const calendarDays = Array.from({ length: 5 }, (_, i) => {
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
    const d = new Date(data.preferredDate + "T00:00:00");
    return d.toLocaleDateString(isUrdu ? "ur-PK" : "en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  })();

  const handleUseCurrentLocation = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

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
            area: getHotspotArea(closest),
            landmark: "",
            city: "Pakistan",
            address: "",
          });
          setSelectedAddressId(null);
        },
        () => {
          onChange({
            area: "Central District",
            address: "",
            landmark: "",
            city: "Pakistan",
            latitude: 33.7215,
            longitude: 73.0577,
          });
          setSelectedAddressId(null);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  };

  const handleAreaSelectChange = (selectedArea: string) => {
    const match = PESHAWAR_HOTSPOTS.find(
      (h) =>
        h.areaKey.toLowerCase() === selectedArea.toLowerCase() ||
        h.name.toLowerCase() === selectedArea.toLowerCase() ||
        selectedArea.toLowerCase().includes(h.name.toLowerCase()) ||
        getHotspotArea(h).toLowerCase() === selectedArea.toLowerCase()
    );
    if (match) {
      onChange({
        area: selectedArea,
        latitude: match.lat,
        longitude: match.lng,
        city: "Pakistan",
      });
    } else {
      onChange({ area: selectedArea, city: "Pakistan" });
    }
    setSelectedAddressId(null);
  };

  // Validation
  const hasValidLocation = Boolean(data.address?.trim() && data.area?.trim());
  const hasValidSchedule =
    data.scheduleType === "asap" ||
    (data.scheduleType === "scheduled" &&
      Boolean(data.preferredDate?.trim()) &&
      Boolean(data.preferredTimeSlot?.trim()));

  const canProceed = hasValidLocation && hasValidSchedule;

  const handleProceed = () => {
    if (!data.address?.trim()) {
      setError(
        isUrdu
          ? "براہ کرم سروس کا پتہ درج یا منتخب کریں۔"
          : "Please select or enter your service address."
      );
      return;
    }
    if (!data.area?.trim()) {
      setError(
        isUrdu
          ? "براہ کرم اپنا علاقہ / سیکٹر منتخب کریں۔"
          : "Please select your area / sector."
      );
      return;
    }
    if (data.scheduleType === "scheduled") {
      if (!data.preferredDate) {
        setError(isUrdu ? "براہ کرم وزٹ کا دن چنیں۔" : "Please select a visit day.");
        return;
      }
      if (!data.preferredTimeSlot) {
        setError(
          isUrdu ? "براہ کرم آمد کا وقت چنیں۔" : "Please select an arrival time."
        );
        return;
      }
    }

    // Auto-save address to user's Profile -> Saved Addresses
    // "The first completed address must be saved to the user's profile under Saved Addresses."
    // "Do not duplicate the same address if the user uses it again."
    const currentList = getSavedAddresses();
    const existingMatch = currentList.find(
      (a) =>
        a.fullAddress.trim().toLowerCase() === data.address.trim().toLowerCase() &&
        (!data.area?.trim() || a.area.trim().toLowerCase() === data.area.trim().toLowerCase())
    );

    if (!existingMatch) {
      const isFirst = currentList.length === 0;
      const label = isFirst
        ? isUrdu ? "گھر" : "Home"
        : data.area.trim() || (isUrdu ? "نیا پتہ" : "New Address");

      const newSavedAddr: SavedAddress = {
        id: `addr_${Date.now()}`,
        label,
        tag: isFirst ? "home" : "other",
        fullAddress: data.address.trim(),
        area: data.area.trim(),
        city: data.city || "Pakistan",
        landmark: data.landmark?.trim() || "",
        latitude: typeof data.latitude === "number" ? data.latitude : 34.0151,
        longitude: typeof data.longitude === "number" ? data.longitude : 71.5249,
        isDefault: isFirst,
      };

      const updated = addOrUpdateSavedAddress(newSavedAddr);
      setSavedAddresses(updated);
      setSelectedAddressId(newSavedAddr.id);
    } else {
      setSelectedAddressId(existingMatch.id);
    }

    setError(null);
    onNext();
  };

  // Compact summary labels
  const selectedSavedObj = savedAddresses.find((a) => a.id === selectedAddressId);
  const locationSummaryText = selectedSavedObj
    ? `${selectedSavedObj.label} · ${selectedSavedObj.area}`
    : data.address
    ? `${data.address}${data.area ? ` · ${data.area}` : ""}`
    : isUrdu
    ? "پتہ منتخب کریں"
    : "Select location";

  const arrivalSummaryText =
    data.scheduleType === "asap"
      ? isUrdu
        ? "فوری طور پر · 30–60 منٹ"
        : "As soon as possible · 30–60 min"
      : `${formattedSelectedDate} · ${data.preferredTimeSlot || (isUrdu ? "وقت منتخب کریں" : "Select time")}`;

  return (
    <div className="max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 py-2 sm:py-4 space-y-6 lg:space-y-0 pb-36 lg:pb-44 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* SECTION 1 — WHERE SHOULD THE WORKER COME? */}
        <div className="lg:col-span-7 space-y-3.5">
        <div className="space-y-0.5">
          <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
            {isUrdu ? "ورکر کہاں آئے؟" : "Where should the worker come?"}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isUrdu
              ? "وہ پتہ منتخب کریں جہاں آپ کو کام کروانا ہے"
              : "Select where the service is needed"}
          </p>
        </div>

        {/* SAVED ADDRESSES LIST (Clean vertical list) */}
        {!showCustomLocation && savedAddresses.length > 0 ? (
          <div className="space-y-2.5">
            <div className="space-y-2">
              {savedAddresses.map((addr) => {
                const isSelected = selectedAddressId === addr.id;
                const TagIcon = getTagIcon(addr.tag);

                return (
                  <button
                    key={addr.id}
                    type="button"
                    onClick={() => handleSelectSavedAddress(addr)}
                    className={`w-full p-3.5 rounded-2xl border text-start flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#0F8B8D] bg-[#0F8B8D]/5 ring-1 ring-[#0F8B8D] shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#0F8B8D] text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <TagIcon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs sm:text-sm font-bold truncate ${
                              isSelected ? "text-[#0F8B8D]" : "text-[#123B5D]"
                            }`}
                          >
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                              {isUrdu ? "ڈیفالٹ" : "Default"}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {addr.fullAddress}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <div className="flex items-center gap-1 text-xs font-bold text-[#0F8B8D] shrink-0">
                        <Check className="size-4 stroke-[3]" />
                        <span className="hidden sm:inline">
                          {isUrdu ? "منتخب شدہ" : "Selected"}
                        </span>
                      </div>
                    ) : (
                      <div className="size-4.5 rounded-full border border-slate-300 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Option to add / select another address */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  setShowCustomLocation(true);
                  setSelectedAddressId(null);
                  onChange({
                    address: "",
                    landmark: "",
                  });
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F8B8D] hover:underline cursor-pointer"
              >
                <Plus className="size-3.5" />
                <span>{isUrdu ? "کوئی اور پتہ شامل / منتخب کریں" : "Add / Select another address"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* CUSTOM LOCATION INTERFACE (Clean Map + Street + Landmark) */
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {savedAddresses.length > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">
                  {isUrdu ? "نیا پتہ منتخب کریں" : "Set Custom Location"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomLocation(false);
                    const def =
                      savedAddresses.find((a) => a.id === selectedAddressId) ||
                      savedAddresses.find((a) => a.isDefault) ||
                      savedAddresses[0];
                    if (def) handleSelectSavedAddress(def);
                  }}
                  className="text-xs font-bold text-[#0F8B8D] hover:underline cursor-pointer"
                >
                  {isUrdu ? "← محفوظ پتے استعمال کریں" : "← Use a saved address"}
                </button>
              </div>
            )}

            {/* Clean Interactive Map */}
            <PeshawarMapPicker
              data={data}
              onChange={onChange}
              onAutoDetect={handleUseCurrentLocation}
            />

            {/* Address Details Fields */}
            <div className="space-y-2.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#123B5D] mb-1">
                  {isUrdu ? "علاقہ / سیکٹر" : "Area / Sector"}
                </label>
                <select
                  value={data.area || ""}
                  onChange={(e) => handleAreaSelectChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 font-medium"
                >
                  <option value="">{isUrdu ? "علاقہ منتخب کریں" : "Select Area"}</option>
                  {SERVICE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                  {data.area && !SERVICE_AREAS.includes(data.area) && (
                    <option key={data.area} value={data.area}>
                      {data.area}
                    </option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#123B5D] mb-1">
                    {isUrdu ? "گلی کا پتہ / مکان نمبر" : "Street / House No."}
                  </label>
                  <input
                    type="text"
                    value={data.address || ""}
                    onChange={(e) => {
                      onChange({ address: e.target.value });
                      setSelectedAddressId(null);
                    }}
                    placeholder={
                      isUrdu
                        ? "مکان یا فلیٹ نمبر، گلی نمبر وغیرہ..."
                        : "Enter house, street, flat, etc."
                    }
                    className="w-full h-10 px-3 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 font-medium placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#123B5D] mb-1">
                    {isUrdu ? "قریبی مشہور جگہ (اختیاری)" : "Nearest landmark (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={data.landmark || ""}
                    onChange={(e) => onChange({ landmark: e.target.value })}
                    placeholder={
                      isUrdu
                        ? "مثلاً مارکیٹ یا اسکول کے قریب"
                        : "e.g. Near XYZ Market"
                    }
                    className="w-full h-10 px-3 rounded-xl text-xs sm:text-sm text-[#1A1A2E] bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/20 font-medium placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        </div>

        <hr className="border-slate-200/80 lg:hidden" />

        {/* SECTION 2 — WHEN SHOULD THE WORKER COME? */}
        <div className="lg:col-span-5 space-y-4">
        <div className="space-y-0.5">
          <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
            {isUrdu ? "آپ کو سروس کب چاہیے؟" : "When do you need the service?"}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {isUrdu
              ? "فوری آمد یا اپنی مرضی کا وقت منتخب کریں"
              : "Choose immediate arrival or schedule for later"}
          </p>
        </div>

        {/* TWO SIMPLE PRIMARY CHOICES: ASAP vs SCHEDULE FOR LATER */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Choice 1: ASAP */}
          <button
            type="button"
            onClick={() => {
              onChange({ scheduleType: "asap" });
              setError(null);
            }}
            className={`p-3.5 rounded-2xl border text-start flex flex-col justify-between gap-2.5 transition-all cursor-pointer relative ${
              data.scheduleType === "asap"
                ? "border-[#0F8B8D] bg-[#0F8B8D]/5 ring-1 ring-[#0F8B8D] shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                    data.scheduleType === "asap"
                      ? "bg-[#0F8B8D] text-white"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <Zap className="size-4.5 fill-current" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#123B5D] block">
                    {isUrdu ? "⚡ جلد از جلد / ASAP" : "⚡ As soon as possible"}
                  </span>
                  <span className="text-xs font-semibold text-[#0F8B8D]">
                    {isUrdu ? "متوقع آمد: 30–60 منٹ" : "Estimated arrival: 30–60 minutes"}
                  </span>
                </div>
              </div>
              {data.scheduleType === "asap" && (
                <CheckCircle2 className="size-4 text-[#0F8B8D] shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {isUrdu
                ? "قریبی دستیاب کاریگروں کو فوری طور پر مطلع کیا جائے گا۔"
                : "Nearby available workers will be notified."}
            </p>
          </button>

          {/* Choice 2: Schedule for later */}
          <button
            type="button"
            onClick={() => {
              onChange({ scheduleType: "scheduled" });
              if (!data.preferredDate) {
                onChange({ preferredDate: calendarDays[0].dateString });
              }
              if (!data.preferredTimeSlot) {
                onChange({ preferredTimeSlot: "8:00 AM – 12:00 PM" });
              }
              setError(null);
            }}
            className={`p-3.5 rounded-2xl border text-start flex flex-col justify-between gap-2.5 transition-all cursor-pointer relative ${
              data.scheduleType === "scheduled"
                ? "border-[#0F8B8D] bg-[#0F8B8D]/5 ring-1 ring-[#0F8B8D] shadow-xs"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                    data.scheduleType === "scheduled"
                      ? "bg-[#0F8B8D] text-white"
                      : "bg-teal-100 text-[#0F8B8D]"
                  }`}
                >
                  <CalendarIcon className="size-4.5" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-bold text-[#123B5D] block">
                    {isUrdu ? "📅 بعد کے لیے شیڈول کریں" : "📅 Schedule for later"}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {isUrdu ? "تاریخ اور وقت چنیں" : "Choose a date & arrival time"}
                  </span>
                </div>
              </div>
              {data.scheduleType === "scheduled" && (
                <CheckCircle2 className="size-4 text-[#0F8B8D] shrink-0" />
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              {isUrdu
                ? "اپنی سہولت کے مطابق دن اور آمد کا وقت طے کریں۔"
                : "Choose a date and arrival time."}
            </p>
          </button>
        </div>

        {/* PROGRESSIVE DISCLOSURE: Only revealed if Schedule for later is chosen */}
        {data.scheduleType === "scheduled" && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* 1. Choose a day */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#123B5D] uppercase tracking-wider block">
                {isUrdu ? "دن منتخب کریں" : "Choose a day"}
              </label>
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {calendarDays.map((day) => {
                  const isSelected = data.preferredDate === day.dateString;
                  return (
                    <button
                      key={day.dateString}
                      type="button"
                      onClick={() => onChange({ preferredDate: day.dateString })}
                      className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? "border-[#0F8B8D] bg-[#0F8B8D] text-white shadow-xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold uppercase leading-tight ${
                          isSelected ? "text-white/90" : "text-slate-400"
                        }`}
                      >
                        {day.isToday
                          ? isUrdu
                            ? "آج"
                            : "Today"
                          : day.isTomorrow
                          ? isUrdu
                            ? "کل"
                            : "Tomorrow"
                          : day.dayName}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold mt-0.5 leading-none">
                        {day.dayNumber}
                      </span>
                      <span
                        className={`text-[10px] font-medium leading-tight mt-0.5 ${
                          isSelected ? "text-white/80" : "text-slate-500"
                        }`}
                      >
                        {day.monthName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Choose an arrival time */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#123B5D] uppercase tracking-wider block">
                {isUrdu ? "آمد کا وقت منتخب کریں" : "Choose an arrival time"}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {timeWindows.map((slot) => {
                  const isSelected =
                    (slot.id === "morning" && isMorning) ||
                    (slot.id === "afternoon" && isAfternoon) ||
                    (slot.id === "evening" && isEvening) ||
                    (slot.id === "specific" && isSpecificTime);

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        if (slot.id === "specific") {
                          handleSpecificTimeChange(specificTimeInput);
                        } else {
                          onChange({ preferredTimeSlot: slot.time });
                        }
                      }}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? "border-[#0F8B8D] bg-[#0F8B8D]/10 ring-1 ring-[#0F8B8D] text-[#0F8B8D]"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className="text-xs font-bold">{slot.label}</span>
                      <span className="text-[10.5px] text-slate-500 font-medium">
                        {slot.id === "specific" && isSpecificTime
                          ? data.preferredTimeSlot
                          : slot.time}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Exact time picker: ONLY shown if Specific time is chosen */}
              {isSpecificTime && (
                <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <span className="text-xs font-bold text-[#123B5D]">
                    {isUrdu ? "مخصوص وقت درج کریں:" : "Enter exact time:"}
                  </span>
                  <input
                    type="time"
                    value={specificTimeInput}
                    onChange={(e) => handleSpecificTimeChange(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-[#123B5D] focus:outline-none focus:ring-2 focus:ring-[#0F8B8D]/30"
                  />
                </div>
              )}
            </div>
          </div>
        )}

      {/* ERROR NOTICE (Small, contextual) */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl animate-in fade-in duration-150">
          {error}
        </div>
      )}

          {/* FINAL STEP 3 SUMMARY (One compact summary card) */}
          {hasValidLocation && (
            <div className="p-3.5 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-xs font-bold text-[#123B5D]">
                  <MapPin className="size-3.5 text-[#0F8B8D] shrink-0" />
                  <span className="truncate">
                    {isUrdu ? `مقام: ${locationSummaryText}` : `Location: ${locationSummaryText}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <Clock className="size-3.5 text-[#0F8B8D] shrink-0" />
                  <span className="truncate">
                    {isUrdu ? `آمد: ${arrivalSummaryText}` : `Arrival: ${arrivalSummaryText}`}
                  </span>
                </div>
              </div>

              {showCustomLocation && savedAddresses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCustomLocation(false);
                    const def = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
                    if (def) handleSelectSavedAddress(def);
                  }}
                  className="text-xs font-bold text-[#0F8B8D] hover:underline shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  {isUrdu ? "محفوظ پتے دیکھیں" : "View saved addresses"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM NAVIGATION (Fixed bottom bar) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 sm:py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="w-full max-w-2xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{isUrdu ? "پیچھے" : "Back"}</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            disabled={!canProceed}
            className={`px-6 py-2.5 rounded-full transition-all duration-200 flex items-center gap-2 text-xs sm:text-sm font-bold cursor-pointer ${
              canProceed
                ? "bg-[#0F8B8D] hover:bg-[#0D7A7C] text-white shadow-sm active:scale-[0.99]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            <span>{isUrdu ? "جائزہ پر جائیں" : "Continue to Review"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
