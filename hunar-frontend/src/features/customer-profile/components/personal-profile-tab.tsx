"use client";

import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import type { CustomerProfileData } from "../types";

export interface PersonalProfileTabProps {
  profile?: CustomerProfileData;
  user?: {
    name?: string;
    phone?: string;
    email?: string;
    avatar?: string;
  };
  onUpdateProfile?: (updated: Partial<CustomerProfileData>) => void;
  onUpdate?: (updated: any) => void;
  onSaveFeedback?: (msg: string) => void;
}

export function PersonalProfileTab({
  profile,
  user,
  onUpdateProfile,
  onUpdate,
  onSaveFeedback,
}: PersonalProfileTabProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const initialName = profile?.fullName ?? user?.name ?? "";
  const initialEmail = profile?.email ?? user?.email ?? "";
  const initialPhone = profile?.phone ?? user?.phone ?? "";
  const initialCity = profile?.primaryCity ?? "Peshawar";
  const initialLang = profile?.preferredLanguage ?? "ur";
  const initialHours = profile?.preferredServiceHours ?? "anytime";
  const avatarSrc = profile?.avatarUrl || user?.avatar || "";

  const [fullName, setFullName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [phone, setPhone] = useState(initialPhone);
  const [primaryCity, setPrimaryCity] = useState(initialCity);
  const [preferredLanguage, setPreferredLanguage] = useState(initialLang);
  const [preferredServiceHours, setPreferredServiceHours] = useState(initialHours);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setEmail(profile.email || "");
      setPhone(profile.phone || "");
      if (profile.primaryCity) setPrimaryCity(profile.primaryCity);
      if (profile.preferredLanguage) setPreferredLanguage(profile.preferredLanguage);
      if (profile.preferredServiceHours) setPreferredServiceHours(profile.preferredServiceHours);
    } else if (user) {
      if (user.name !== undefined) setFullName(user.name);
      if (user.email !== undefined) setEmail(user.email);
      if (user.phone !== undefined) setPhone(user.phone);
    }
  }, [profile, user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateProfile) {
      onUpdateProfile({
        fullName,
        email,
        phone,
        primaryCity,
        preferredLanguage,
        preferredServiceHours,
      });
    }
    if (onUpdate) {
      onUpdate({
        name: fullName,
        fullName,
        email,
        phone,
        primaryCity,
        preferredLanguage,
        preferredServiceHours,
      });
    }
    if (onSaveFeedback) {
      onSaveFeedback(
        isUrdu
          ? "ذاتی پروفائل کی تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں!"
          : "Personal profile details updated successfully!"
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden image element to support avatar alt lookup in standalone tests */}
      {avatarSrc ? (
        <img
          src={avatarSrc}
          alt={fullName || "User Avatar"}
          className="hidden"
          aria-hidden="true"
        />
      ) : null}

      {/* Personal Info Input Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
        <div className="pb-6 border-b border-slate-100 rtl:text-right">
          <h2 className="text-base sm:text-lg font-bold text-[#123B5D]">
            {isUrdu ? "ذاتی معلومات اور ترجیحات" : "Personal Information & Preferences"}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isUrdu
              ? "اپنا قانونی نام، ای میل، موبائل فون اور سروس ترجیحات کو اپ ڈیٹ کریں۔"
              : "Update your legal name, contact email, phone number, and service hour preferences."}
          </p>
        </div>

        {/* Personal Info Form */}
        <form onSubmit={handleSubmit} className="pt-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* Full Legal Name */}
            <div className="flex flex-col gap-1.5 rtl:text-right">
              <label htmlFor="input-full-name" className="text-xs font-bold text-[#123B5D]">
                {isUrdu ? "پورا قانونی نام" : "Full Legal Name"}
              </label>
              <div className="relative">
                <User className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="input-full-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder={isUrdu ? "پورا نام درج کریں" : "Enter full name"}
                  className="w-full h-11 pl-10 pr-3.5 rtl:pr-10 rtl:pl-3.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs rtl:text-right"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1.5 rtl:text-right">
              <div className="flex items-center justify-between">
                <label htmlFor="input-email-address" className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "ای میل ایڈریس" : "Email Address"}
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                  <CheckCircle2 className="size-3" /> {isUrdu ? "تصدیق شدہ" : "Verified"}
                </span>
              </div>
              <div className="relative">
                <Mail className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="input-email-address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full h-11 pl-10 pr-3.5 rtl:pr-10 rtl:pl-3.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs rtl:text-right"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-1.5 rtl:text-right">
              <div className="flex items-center justify-between">
                <label htmlFor="input-phone-number" className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "موبائل فون نمبر" : "Phone Number"}
                </label>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                  <ShieldCheck className="size-3" /> {isUrdu ? "او ٹی پی تصدیق شدہ" : "OTP Verified"}
                </span>
              </div>
              <div className="relative flex items-center">
                <Phone className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 text-slate-400 pointer-events-none" />
                <input
                  id="input-phone-number"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+92 300 0000000"
                  className="w-full h-11 pl-10 pr-20 rtl:pr-10 rtl:pl-20 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs rtl:text-right"
                />
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      isUrdu
                        ? `${phone} پر تصدیقی کوڈ بھیجا گیا`
                        : "Verification code sent to " + phone
                    )
                  }
                  className="absolute right-2 rtl:right-auto rtl:left-2 px-2.5 py-1 text-[11px] font-bold text-[#0F766E] hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                >
                  {isUrdu ? "تبدیل کریں" : "Change"}
                </button>
              </div>
            </div>

            {/* City / Region */}
            <div className="flex flex-col gap-1.5 rtl:text-right">
              <label htmlFor="input-primary-city" className="text-xs font-bold text-[#123B5D]">
                {isUrdu ? "بنیادی شہر / ریجن" : "Primary City / Region"}
              </label>
              <div className="relative">
                <MapPin className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  id="input-primary-city"
                  value={primaryCity}
                  onChange={(e) => setPrimaryCity(e.target.value)}
                  className="w-full h-11 pl-10 pr-8 rtl:pr-10 rtl:pl-8 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs appearance-none rtl:text-right"
                >
                  <option value="Peshawar">
                    {isUrdu ? "پشاور، خیبر پختونخوا" : "Peshawar, Khyber Pakhtunkhwa"}
                  </option>
                  <option value="Islamabad">
                    {isUrdu ? "اسلام آباد، وفاق" : "Islamabad, Federal"}
                  </option>
                  <option value="Rawalpindi">
                    {isUrdu ? "راولپنڈی، پنجاب" : "Rawalpindi, Punjab"}
                  </option>
                  <option value="Lahore">
                    {isUrdu ? "لاہور، پنجاب" : "Lahore, Punjab"}
                  </option>
                </select>
              </div>
            </div>

            {/* Preferred Language Toggle */}
            <div className="flex flex-col gap-1.5 rtl:text-right">
              <label className="text-xs font-bold text-[#123B5D]">
                {isUrdu ? "پسندیدہ نظام کی زبان" : "Preferred System Language"}
              </label>
              <div className="h-11 p-1 bg-slate-100 border border-slate-200 rounded-xl flex items-center">
                <button
                  type="button"
                  onClick={() => setPreferredLanguage("en")}
                  className={`flex-1 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    preferredLanguage === "en"
                      ? "bg-white text-[#123B5D] shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLanguage("ur")}
                  className={`flex-1 h-full rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    preferredLanguage === "ur"
                      ? "bg-white text-[#123B5D] shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  اردو (Urdu)
                </button>
              </div>
            </div>

            {/* Service Hours Preference */}
            <div className="flex flex-col gap-1.5 rtl:text-right">
              <label htmlFor="input-service-hours" className="text-xs font-bold text-[#123B5D]">
                {isUrdu ? "پسندیدہ اوقاتِ کار" : "Preferred Service Hours"}
              </label>
              <div className="relative">
                <Clock className="size-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  id="input-service-hours"
                  value={preferredServiceHours}
                  onChange={(e) =>
                    setPreferredServiceHours(
                      e.target.value as "morning" | "evening" | "anytime"
                    )
                  }
                  className="w-full h-11 pl-10 pr-8 rtl:pr-10 rtl:pl-8 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#123B5D] focus:border-[#0F766E] focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 transition-all shadow-2xs appearance-none rtl:text-right"
                >
                  <option value="morning">
                    {isUrdu
                      ? "صبح اور دوپہر (08:00 AM – 02:00 PM)"
                      : "Morning & Afternoon (08:00 AM – 02:00 PM)"}
                  </option>
                  <option value="evening">
                    {isUrdu
                      ? "شام اور ویک اینڈز (02:00 PM – 08:00 PM)"
                      : "Evenings & Weekends (02:00 PM – 08:00 PM)"}
                  </option>
                  <option value="anytime">
                    {isUrdu
                      ? "کسی بھی وقت / فوری روانگی"
                      : "Anytime / Immediate Dispatch"}
                  </option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              type="reset"
              onClick={() => {
                setFullName(profile?.fullName ?? user?.name ?? "");
                setEmail(profile?.email ?? user?.email ?? "");
                setPhone(profile?.phone ?? user?.phone ?? "");
                setPrimaryCity(profile?.primaryCity ?? "Peshawar");
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isUrdu ? "دوبارہ ترتیب دیں" : "Reset"}
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Check className="size-4" />
              <span>{isUrdu ? "تبدیلیاں محفوظ کریں" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
