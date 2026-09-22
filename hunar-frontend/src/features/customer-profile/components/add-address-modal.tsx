"use client";

import { useLocale } from "next-intl";
import { useState } from "react";
import {
  Building2,
  Check,
  Home,
  MapPin,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import type { SavedAddress } from "../types";

const PESHAWAR_AREAS = [
  "University Town",
  "Hayatabad Phase 1",
  "Hayatabad Phase 2",
  "Hayatabad Phase 3",
  "Hayatabad Phase 4",
  "Hayatabad Phase 5",
  "Hayatabad Phase 6",
  "Hayatabad Phase 7",
  "Saddar & Cantt",
  "DHA Peshawar",
  "Regi Model Town",
  "Warsak Road",
  "Gulbahar & City",
  "Dalazak Road",
  "Charsadda Road",
  "Kohat Road",
];

const PESHAWAR_AREAS_URDU: Record<string, string> = {
  "University Town": "یونیورسٹی ٹاؤن",
  "Hayatabad Phase 1": "حیات آباد فیز 1",
  "Hayatabad Phase 2": "حیات آباد فیز 2",
  "Hayatabad Phase 3": "حیات آباد فیز 3",
  "Hayatabad Phase 4": "حیات آباد فیز 4",
  "Hayatabad Phase 5": "حیات آباد فیز 5",
  "Hayatabad Phase 6": "حیات آباد فیز 6",
  "Hayatabad Phase 7": "حیات آباد فیز 7",
  "Saddar & Cantt": "صدر اور کینٹ",
  "DHA Peshawar": "ڈی ایچ اے پشاور",
  "Regi Model Town": "ریگی ماڈل ٹاؤن",
  "Warsak Road": "ورسک روڈ",
  "Gulbahar & City": "گلبہار اور اندرون شہر",
  "Dalazak Road": "دلازاک روڈ",
  "Charsadda Road": "چارسدہ روڈ",
  "Kohat Road": "کوہاٹ روڈ",
};

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAddress: (address: SavedAddress) => void;
  initialAddress?: SavedAddress | null;
}

export function AddAddressModal({
  isOpen,
  onClose,
  onSaveAddress,
  initialAddress,
}: AddAddressModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [label, setLabel] = useState(initialAddress?.label || "");
  const [tag, setTag] = useState<SavedAddress["tag"]>(
    initialAddress?.tag || "home"
  );
  const [fullAddress, setFullAddress] = useState(
    initialAddress?.fullAddress || ""
  );
  const [area, setArea] = useState(initialAddress?.area || "University Town");
  const [city] = useState("Peshawar");
  const [landmark, setLandmark] = useState(initialAddress?.landmark || "");
  const [isDefault, setIsDefault] = useState(
    initialAddress?.isDefault || false
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !fullAddress.trim()) return;

    const newAddress: SavedAddress = {
      id: initialAddress?.id || `addr-${Date.now()}`,
      label: label.trim(),
      tag,
      fullAddress: fullAddress.trim(),
      area,
      city,
      landmark: landmark.trim() || (isUrdu ? "پشاور قریبی نشانی" : "Peshawar landmark"),
      latitude: initialAddress?.latitude || 34.0043,
      longitude: initialAddress?.longitude || 71.5034,
      isDefault,
    };

    onSaveAddress(newAddress);
    onClose();
  };

  const tagCategories = [
    { id: "home", label: isUrdu ? "گھر" : "Home", icon: Home },
    { id: "office", label: isUrdu ? "دفتر" : "Office", icon: Building2 },
    { id: "parents", label: isUrdu ? "والدین" : "Parents", icon: Users },
    { id: "other", label: isUrdu ? "دیگر" : "Other", icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto rtl:text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
              <MapPin className="size-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#123B5D]">
                {initialAddress
                  ? (isUrdu ? "ایڈریس تبدیل کریں" : "Edit Service Address")
                  : (isUrdu ? "نیا سروس ایڈریس شامل کریں" : "Add New Service Address")}
              </h3>
              <p className="text-xs text-slate-500">
                {isUrdu ? "پشاور، خیبر پختونخوا" : "Peshawar, Khyber Pakhtunkhwa"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="size-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pt-4 space-y-4">
          {/* Tag Selector */}
          <div>
            <label className="text-xs font-bold text-[#123B5D] block mb-1.5">
              {isUrdu ? "ایڈریس کی کیٹیگری" : "Address Category"}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {tagCategories.map((item) => {
                const Icon = item.icon;
                const isSelected = tag === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTag(item.id as SavedAddress["tag"])}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#0F766E] text-white border-[#0F766E] shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className="text-xs font-bold text-[#123B5D] block mb-1">
              {isUrdu ? "پتے کا عنوان / نام" : "Address Label / Title"}
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={
                isUrdu
                  ? "مثلاً: گھر (یونیورسٹی ٹاؤن)، اسٹوڈیو آفس"
                  : "e.g. Home (University Town), Studio Office"
              }
              required
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all placeholder:text-slate-400 shadow-2xs rtl:text-right"
            />
          </div>

          {/* Area & City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#123B5D] block mb-1">
                {isUrdu ? "پشاور کا سیکٹر / علاقہ" : "Peshawar Sector / Area"}
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs bg-white rtl:text-right"
              >
                {PESHAWAR_AREAS.map((a) => (
                  <option key={a} value={a}>
                    {isUrdu ? (PESHAWAR_AREAS_URDU[a] || a) : a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-[#123B5D] block mb-1">
                {isUrdu ? "شہر" : "City"}
              </label>
              <input
                type="text"
                disabled
                value={isUrdu ? "پشاور، خیبر پختونخوا" : "Peshawar, KP"}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-400 bg-slate-50 cursor-not-allowed rtl:text-right"
              />
            </div>
          </div>

          {/* Full Street Address */}
          <div>
            <label className="text-xs font-bold text-[#123B5D] block mb-1">
              {isUrdu ? "مکمل گلی اور مکان کا پتہ" : "Full Street Address"}
            </label>
            <textarea
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder={
                isUrdu
                  ? "مکان نمبر، گلی نمبر، فیز یا بلاک کی تفصیلات..."
                  : "House #, Street #, Block / Sector details"
              }
              required
              rows={2}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all placeholder:text-slate-400 shadow-2xs resize-none rtl:text-right"
            />
          </div>

          {/* Landmark */}
          <div>
            <label className="text-xs font-bold text-[#123B5D] block mb-1">
              {isUrdu ? "قریبی مشہور نشانی" : "Nearby Landmark"}
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder={
                isUrdu
                  ? "اسلامیہ کالج گیٹ / تاتارا پارک / قریبی مارکیٹ"
                  : "Near Islamia College Gate / Tatara Park / Market"
              }
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-xs font-medium text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all placeholder:text-slate-400 shadow-2xs rtl:text-right"
            />
          </div>

          {/* Set as Default Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="size-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span className="text-xs font-bold text-[#123B5D]">
                {isUrdu
                  ? "نئی بکنگز کے لیے اس پتے کو بنیادی (Default) مقرر کریں"
                  : "Set as default primary address for new bookings"}
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isUrdu ? "منسوخ کریں" : "Cancel"}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Check className="size-4" />
              <span>{isUrdu ? "پتہ محفوظ کریں" : "Save Address"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

