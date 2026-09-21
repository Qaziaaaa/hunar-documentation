"use client";

import { useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  Copy,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MOCK_SCHEDULED_VISITS } from "@/features/customer-visits/data/mock-customer-visits";

export function ActiveVisitBanner() {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();
  const t = useTranslations("CustomerPortal.Visits");
  const liveVisit = MOCK_SCHEDULED_VISITS[0]; // Active visit

  if (!liveVisit) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(liveVisit.securityPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="relative overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-[#0F766E]/20 shadow-sm p-4 sm:p-5 transition-all duration-200 hover:shadow-md">
      {/* Top Gradient Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#16A34A]" />

      {/* Top Section: Live Dispatch Status & Service Details */}
      <div className="flex items-start gap-3.5 min-w-0">
        {/* Pulsing Motorcycle / Van Icon */}
        <div className="relative size-11 sm:size-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
          <Navigation className="size-5 sm:size-6 stroke-[2.2]" />
          <span className="absolute -top-1 -right-1 size-3 bg-[#16A34A] rounded-full ring-2 ring-white animate-ping" />
        </div>

        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("technicianOnTheWay")}
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs font-semibold text-[#0F766E]">
              {t("arrivingIn")} ~{liveVisit.etaMinutes} {locale === "ur" ? "منٹ" : "mins"} ({liveVisit.remainingDistanceKm} {locale === "ur" ? "کلومیٹر دور" : "km away"})
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-[#123B5D] truncate">
            {locale === "ur" ? (liveVisit.jobTitleUr ?? liveVisit.jobTitle) : liveVisit.jobTitle}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="size-3.5 text-[#0F766E] shrink-0" />
            <span className="truncate">
              {locale === "ur" ? (liveVisit.customerAreaUr ?? liveVisit.customerArea) : liveVisit.customerArea}
            </span>
          </div>
        </div>
      </div>

      {/* 2x2 Grid Section */}
      <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2.5">
        {/* Row 1: Pro Name (Left) ---------------- Visit Charges (Right) */}
        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
          {/* Left: Technician Name */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs text-slate-500 font-medium shrink-0">
              {locale === "ur" ? "کاریگر:" : "Technician:"}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#123B5D] truncate">
              {locale === "ur" ? (liveVisit.technician.nameUr ?? liveVisit.technician.name) : liveVisit.technician.name}
            </span>
          </div>

          {/* Right: Visit Charges */}
          <div className="flex items-center gap-1.5 shrink-0 ms-auto">
            <span className="text-xs text-slate-500 font-medium">
              {locale === "ur" ? "وزٹ فیس:" : "Visit Charges:"}
            </span>
            <span className="inline-flex items-center font-bold text-xs sm:text-sm text-[#0F766E] bg-[#0F766E]/10 px-2.5 py-0.5 rounded-lg border border-[#0F766E]/20">
              {locale === "ur" ? `روپے ${liveVisit.visitCharges ?? 300}` : `Rs. ${liveVisit.visitCharges ?? 300}`}
            </span>
          </div>
        </div>

        {/* Row 2: Doorstep OTP (Left) ---------------- Track Live (Right) */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Doorstep OTP Badge */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
            <ShieldCheck className="size-4 text-[#0F766E] shrink-0" />
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
              {locale === "ur" ? "ڈور سٹیپ OTP:" : "Doorstep OTP:"}
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-[#123B5D] tracking-widest leading-none bg-white px-2 py-0.5 rounded border border-slate-200">
              {liveVisit.securityPin}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="ml-1 rtl:ml-0 rtl:mr-1 p-1 rounded-lg hover:bg-white text-slate-400 hover:text-[#0F766E] transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Copy Doorstep OTP PIN"
            >
              {copied ? (
                <Check className="size-3.5 text-[#16A34A]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          {/* Right: Track Live CTA Button */}
          <Link
            href="/customer/visits"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer shrink-0 whitespace-nowrap ms-auto"
          >
            <span>{locale === "ur" ? "لائیو ٹریک کریں" : "Track Live"}</span>
            <ArrowRight className="size-3.5 sm:size-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
