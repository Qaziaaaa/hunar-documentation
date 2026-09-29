"use client";

import { useState, useEffect } from "react";
import {
  Check,
  MapPin,
  Navigation,
  Phone,
  MessageSquare,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { arrivalService } from "@/features/jobs/services/arrival-verification-service";
import { useQuery } from "@tanstack/react-query";
import { getCustomerVisits } from "@/features/customer-visits/api/customer-visits-api";
import type { ScheduledVisit } from "@/features/customer-visits/types";

interface ActiveVisitBannerProps {
  visit?: ScheduledVisit | null;
}

export function ActiveVisitBanner({ visit: propVisit }: ActiveVisitBannerProps = {}) {
  const router = useRouter();
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const t = useTranslations("CustomerPortal.Visits");

  const { data: visits } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
    enabled: !propVisit,
  });

  const liveVisit = propVisit ?? (visits ?? [])[0];

  const [isVerified, setIsVerified] = useState<boolean>(() => {
    const session = arrivalService.getSession();
    return session?.status === "otp_verified";
  });

  useEffect(() => {
    const unsubscribe = arrivalService.subscribe((session, eventType) => {
      if (eventType === "OTP_VERIFIED" || session?.status === "otp_verified") {
        setIsVerified(true);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!liveVisit) return null;

  const technician = liveVisit.technician;
  const legacyWorker = liveVisit as unknown as {
    workerName?: string;
    workerPhone?: string;
    address?: string;
  };

  const technicianName =
    isUrdu && technician?.nameUr
      ? technician.nameUr
      : technician?.name || legacyWorker.workerName || (isUrdu ? "ٹیکنیشن" : "Technician");

  const technicianPhone = technician?.phone || legacyWorker.workerPhone || "03001234567";

  const visitCharges = liveVisit.visitCharges ?? 300;

  const area = isUrdu
    ? liveVisit.customerAreaUr ?? liveVisit.customerArea ?? legacyWorker.address
    : liveVisit.customerArea ?? legacyWorker.address;

  return (
    <div
      onClick={() => router.push("/customer/visits")}
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
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                <Check className="size-3 text-emerald-600 stroke-[3]" />
                {isUrdu ? "کاریگر احاطے میں موجود ہے" : "Technician Inside Premises"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t("technicianOnTheWay")}
              </span>
            )}
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-xs font-bold text-[#0F8B8D]">
              {isVerified
                ? isUrdu
                  ? "OTP تصدیق شدہ • معائنہ جاری ہے"
                  : "OTP Verified • Diagnosis in progress"
                : `${t("arrivingIn")} ~${liveVisit.etaMinutes ?? 12} ${isUrdu ? "منٹ" : "mins"} (${liveVisit.remainingDistanceKm ?? 2.4} ${isUrdu ? "کلومیٹر دور" : "km away"})`}
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-[#123B5D] truncate group-hover:text-[#0F8B8D] transition-colors">
            {isUrdu ? (liveVisit.jobTitleUr ?? liveVisit.jobTitle) : liveVisit.jobTitle}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <MapPin className="size-3.5 text-[#0F8B8D] shrink-0" />
            <span className="truncate">{area}</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Technician Info, Visit Charges & Contact Actions */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Technician Details & Visit Charges */}
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            {/* Technician Name */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-slate-500 font-semibold shrink-0">
                {isUrdu ? "کاریگر:" : "Technician:"}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-[#123B5D] truncate">
                {technicianName}
              </span>
            </div>

            <span className="text-slate-300 text-xs hidden sm:inline">•</span>

            {/* Visit Charges */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                {isUrdu ? "وزٹ فیس:" : "Visit Charges:"}
              </span>
              <span className="inline-flex items-center font-bold text-xs sm:text-sm text-[#0F8B8D] bg-[#0F8B8D]/10 px-2.5 py-0.5 rounded-lg border border-[#0F8B8D]/20">
                {isUrdu ? `روپے ${visitCharges}` : `Rs. ${visitCharges}`}
              </span>
            </div>
          </div>

          {/* Right: Contact Actions (Message & Call) */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {/* Message Button */}
            <Link
              role="button"
              aria-label={isUrdu ? "کاریگر کو پیغام بھیجیں" : "Message Worker"}
              href="/customer/chat"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F8B8D]/10 hover:bg-[#0F8B8D] text-[#0F8B8D] hover:text-white border border-[#0F8B8D]/25 text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-98 cursor-pointer"
            >
              <MessageSquare className="size-4 shrink-0" />
              <span>{isUrdu ? "پیغام" : "Message"}</span>
            </Link>

            {/* Call Button */}
            <a
              role="button"
              aria-label={isUrdu ? "کاریگر کو کال کریں" : "Call Worker"}
              href={`tel:${technicianPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-98 cursor-pointer"
            >
              <Phone className="size-4 shrink-0" />
              <span>{isUrdu ? "کال کریں" : "Call"}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
