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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Live Dispatch Status & Service Details */}
        <div className="flex items-start gap-3.5 min-w-0">
          {/* Pulsing Motorcycle / Van Icon */}
          <div className="relative size-11 sm:size-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="size-5 sm:size-6 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 size-3 bg-[#16A34A] rounded-full ring-2 ring-white animate-ping" />
          </div>

          <div className="space-y-1 min-w-0">
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

            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700">
                {locale === "ur" ? "ماہر کاریگر:" : "Pro:"} {locale === "ur" ? (liveVisit.technician.nameUr ?? liveVisit.technician.name) : liveVisit.technician.name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3 text-[#0F766E]" />
                {locale === "ur" ? (liveVisit.customerAreaUr ?? liveVisit.customerArea) : liveVisit.customerArea}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#0F766E] bg-[#0F766E]/10 px-2 py-0.5 rounded-md">
                {locale === "ur" ? "وزٹ فیس:" : "Visit Charges:"} {locale === "ur" ? `روپے ${liveVisit.visitCharges ?? 300}` : `Rs. ${liveVisit.visitCharges ?? 300}`}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Security OTP / PIN Box & Live Track Button */}
        <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 justify-between md:justify-end">
          {/* Doorstep OTP / PIN Badge */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-[#0F766E]" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-slate-400 leading-none">
                  {t("safetyPinTitle")}
                </span>
                <span className="font-mono text-sm sm:text-base font-extrabold text-[#123B5D] tracking-widest leading-tight mt-0.5">
                  {liveVisit.securityPin}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="ml-1.5 p-1 rounded-lg hover:bg-white text-slate-400 hover:text-[#0F766E] transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Copy Doorstep OTP PIN"
            >
              {copied ? (
                <Check className="size-3.5 text-[#16A34A]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>

          {/* Track Live CTA Button */}
          <Link
            href="/customer/visits"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
          >
            <span>{t("liveTracking")}</span>
            <ArrowRight className="size-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
