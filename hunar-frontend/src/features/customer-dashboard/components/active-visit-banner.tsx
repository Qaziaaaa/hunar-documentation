"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  MapPin,
  Navigation,
  ShieldCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";

export function ActiveVisitBanner() {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();
  const t = useTranslations("CustomerPortal.Visits");

  const { data: visits } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
  });

  const liveVisit = (visits ?? [])[0];

  if (!liveVisit) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(liveVisit.securityPin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Link
      href="/customer/visits"
      className="group relative block overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-[#0F8B8D]/25 shadow-2xs p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-[#0F8B8D] cursor-pointer"
    >
      {/* Top Gradient Accent Bar */}
      <div className="absolute top-0 start-0 end-0 h-1.5 bg-gradient-to-r from-[#0F8B8D] via-[#14B8A6] to-[#16A34A]" />

      {/* Top Section: Live Dispatch Status & Service Details */}
      <div className="flex items-start gap-3.5 min-w-0">
        {/* Pulsing Motorcycle / Van Icon */}
        <div className="relative size-11 sm:size-12 rounded-2xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
          <Navigation className="size-5 sm:size-6 stroke-[2.2]" />
          <span className="absolute -top-1 -end-1 size-3 bg-[#16A34A] rounded-full ring-2 ring-white animate-ping" />
        </div>

        <div className="space-y-1 min-w-0 flex-1 text-left rtl:text-right">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t("technicianOnTheWay")}
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs font-bold text-[#0F8B8D]">
              {t("arrivingIn")} ~{liveVisit.etaMinutes} {locale === "ur" ? "منٹ" : "mins"} ({liveVisit.remainingDistanceKm} {locale === "ur" ? "کلومیٹر دور" : "km away"})
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-[#123B5D] truncate group-hover:text-[#0F8B8D] transition-colors">
            {locale === "ur" ? (liveVisit.jobTitleUr ?? liveVisit.jobTitle) : liveVisit.jobTitle}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <MapPin className="size-3.5 text-[#0F8B8D] shrink-0" />
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
            <span className="text-xs text-slate-600 font-semibold shrink-0">
              {locale === "ur" ? "کاریگر:" : "Technician:"}
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-[#123B5D] truncate">
              {locale === "ur" ? (liveVisit.technician.nameUr ?? liveVisit.technician.name) : liveVisit.technician.name}
            </span>
          </div>

          {/* Right: Visit Charges */}
          <div className="flex items-center gap-1.5 shrink-0 ms-auto">
            <span className="text-xs text-slate-600 font-semibold">
              {locale === "ur" ? "وزٹ فیس:" : "Visit Charges:"}
            </span>
            <span className="inline-flex items-center font-bold text-xs sm:text-sm text-[#0F8B8D] bg-[#0F8B8D]/10 px-2.5 py-0.5 rounded-lg border border-[#0F8B8D]/20">
              {locale === "ur" ? `روپے ${liveVisit.visitCharges ?? 300}` : `Rs. ${liveVisit.visitCharges ?? 300}`}
            </span>
          </div>
        </div>

        {/* Row 2: Doorstep OTP */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Doorstep OTP Badge */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
            <ShieldCheck className="size-4 text-[#0F8B8D] shrink-0" />
            <span className="text-[11px] sm:text-xs text-slate-600 font-bold">
              {locale === "ur" ? "ڈور اسٹیپ OTP:" : "Doorstep OTP:"}
            </span>
            <span className="font-mono text-xs sm:text-sm font-extrabold text-[#123B5D] tracking-widest leading-none bg-white px-2 py-0.5 rounded border border-slate-200">
              {liveVisit.securityPin}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="ms-1 p-1 rounded-lg hover:bg-white text-slate-400 hover:text-[#0F8B8D] transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Copy Doorstep OTP PIN"
            >
              {copied ? (
                <Check className="size-3.5 text-[#16A34A]" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
