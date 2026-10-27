"use client";

import { useState, useEffect, useRef } from "react";
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
import { getAccessToken, getRefreshToken } from "@/lib/api-client";
import type { ScheduledVisit } from "@/features/customer-visits/types";

interface ActiveVisitBannerProps {
  visit?: ScheduledVisit | null;
}

export function ActiveVisitBanner({ visit: propVisit }: ActiveVisitBannerProps = {}) {
  const router = useRouter();
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const t = useTranslations("CustomerPortal.Visits");

  const hasCustomerAuth = Boolean(getAccessToken("CUSTOMER") || getRefreshToken("CUSTOMER"));

  const { data: visits } = useQuery({
    queryKey: ["customer", "visits"],
    queryFn: getCustomerVisits,
    staleTime: 30_000,
    enabled: propVisit === undefined && hasCustomerAuth,
  });

  const activeVisits = (visits ?? []).filter(
    (v) =>
      v.status !== "completed" &&
      v.status !== "cancelled" &&
      v.status !== "paid"
  );

  const activeList: ScheduledVisit[] =
    propVisit !== undefined ? (propVisit ? [propVisit] : []) : activeVisits;
  const totalJobs = activeList.length;

  const [currentIndex, setCurrentIndex] = useState(0);

  // Swipe gesture tracking (touch & mouse)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [mouseStartX, setMouseStartX] = useState<number | null>(null);
  const hasDraggedRef = useRef(false);

  const validIndex = totalJobs > 0 ? Math.min(currentIndex, totalJobs - 1) : 0;
  const liveVisit = activeList[validIndex];

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

  const handleSwipeChange = (direction: "left" | "right") => {
    const isNext = (direction === "left" && !isUrdu) || (direction === "right" && isUrdu);
    if (isNext) {
      setCurrentIndex((prev) => (prev < totalJobs - 1 ? prev + 1 : 0));
    } else {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalJobs - 1));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (totalJobs <= 1) return;
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchDeltaX(0);
    hasDraggedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || totalJobs <= 1) return;
    const currentX = e.targetTouches[0].clientX;
    const diffX = currentX - touchStartX;
    setTouchDeltaX(diffX);
    if (Math.abs(diffX) > 10) {
      hasDraggedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || totalJobs <= 1) return;
    const threshold = 40;
    if (Math.abs(touchDeltaX) > threshold) {
      handleSwipeChange(touchDeltaX < 0 ? "left" : "right");
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (totalJobs <= 1) return;
    setIsMouseDown(true);
    setMouseStartX(e.clientX);
    setTouchDeltaX(0);
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || mouseStartX === null || totalJobs <= 1) return;
    const diffX = e.clientX - mouseStartX;
    setTouchDeltaX(diffX);
    if (Math.abs(diffX) > 10) {
      hasDraggedRef.current = true;
    }
  };

  const handleMouseUp = () => {
    if (!isMouseDown || mouseStartX === null || totalJobs <= 1) return;
    const threshold = 40;
    if (Math.abs(touchDeltaX) > threshold) {
      handleSwipeChange(touchDeltaX < 0 ? "left" : "right");
    }
    setIsMouseDown(false);
    setMouseStartX(null);
    setTouchDeltaX(0);
  };

  const handleMouseLeave = () => {
    if (isMouseDown) {
      handleMouseUp();
    }
  };

  const handleCardClick = () => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    const targetJobId = liveVisit.jobId || liveVisit.id;
    router.push(`/customer/job/${targetJobId}/tracking`);
  };

  if (!liveVisit) return null;

  const session = arrivalService.getSession();
  const isVisitVerified =
    liveVisit.status === "inspection_in_progress" ||
    (isVerified &&
      (!session?.visitId || session.visitId === liveVisit.id || session.jobId === liveVisit.jobId));

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

  const technicianPhone = technician?.phone || legacyWorker.workerPhone || "";

  const visitCharges =
    typeof liveVisit.visitCharges === "number" && liveVisit.visitCharges > 0
      ? liveVisit.visitCharges
      : 0;

  const area = isUrdu
    ? liveVisit.customerAreaUr ?? liveVisit.customerArea ?? legacyWorker.address
    : liveVisit.customerArea ?? legacyWorker.address;

  const hasEtaOrDistance =
    Boolean(liveVisit.etaMinutes && liveVisit.etaMinutes > 0) ||
    Boolean(liveVisit.remainingDistanceKm && liveVisit.remainingDistanceKm > 0);
  const showStatusDetail = isVisitVerified || hasEtaOrDistance;

  return (
    <div
      onClick={handleCardClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className="group relative block overflow-hidden bg-white rounded-2xl sm:rounded-3xl border border-[#0F8B8D]/25 shadow-2xs p-4 sm:p-5 transition-all duration-200 hover:shadow-md hover:border-[#0F8B8D] cursor-pointer select-none touch-pan-y"
    >
      <span className="sr-only">Active Visit: {liveVisit.status}</span>

      {/* Top Gradient Accent Bar */}
      <div className="absolute top-0 start-0 end-0 h-1.5 bg-gradient-to-r from-[#0F8B8D] via-[#14B8A6] to-[#16A34A]" />

      {/* Top Section: Live Dispatch Status, Service Details & Optional Counter Badge */}
      <div className="flex items-start justify-between gap-3 min-w-0">
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Pulsing Motorcycle / Van Icon */}
          <div className="relative size-11 sm:size-12 rounded-2xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
            <Navigation className="size-5 sm:size-6 stroke-[2.2]" />
            <span className="absolute -top-1 -end-1 size-3 bg-success rounded-full ring-2 ring-white animate-ping" />
          </div>

          <div className="space-y-1 min-w-0 flex-1 text-left rtl:text-right">
            <div className="flex items-center gap-2 flex-wrap">
              {isVisitVerified ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/10 text-success border border-success/20">
                  <Check className="size-3 text-success stroke-[3]" />
                  {isUrdu ? "کاریگر احاطے میں موجود ہے" : "Technician Inside Premises"}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success/10 text-success border border-success/20">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                  {t("technicianOnTheWay")}
                </span>
              )}
              {showStatusDetail ? (
                <>
                  <span className="text-slate-300 text-xs">•</span>
                  <span className="text-xs font-bold text-[#0F8B8D]">
                    {isVisitVerified
                      ? isUrdu
                        ? "OTP تصدیق شدہ • معائنہ جاری ہے"
                        : "OTP Verified • Diagnosis in progress"
                      : `${t("arrivingIn")}${liveVisit.etaMinutes && liveVisit.etaMinutes > 0 ? ` ~${liveVisit.etaMinutes} ${isUrdu ? "منٹ" : "mins"}` : ""}${liveVisit.remainingDistanceKm && liveVisit.remainingDistanceKm > 0 ? ` (${liveVisit.remainingDistanceKm} ${isUrdu ? "کلومیٹر دور" : "km away"})` : ""}`}
                  </span>
                </>
              ) : null}
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

        {/* Counter Badge (ONLY rendered if multiple active jobs exist) */}
        {totalJobs > 1 && (
          <span className="text-[11px] font-bold text-[#0F8B8D] bg-[#0F8B8D]/10 border border-[#0F8B8D]/20 px-2.5 py-0.5 rounded-full shrink-0 self-start select-none">
            {isUrdu ? `${totalJobs} / ${validIndex + 1}` : `${validIndex + 1} / ${totalJobs}`}
          </span>
        )}
      </div>

      {/* Bottom Section: Technician Info, Visit Charges & Contact Actions */}
      <div className="pt-3.5 mt-3 border-t border-slate-100 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Technician Details, Charges & Doorstep PIN */}
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
            {visitCharges > 0 && (
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-xs text-slate-500 font-semibold">
                  {isUrdu ? "وزٹ فیس:" : "Visit Charges:"}
                </span>
                <span className="inline-flex items-center font-bold text-xs sm:text-sm text-[#0F8B8D] bg-[#0F8B8D]/10 px-2.5 py-0.5 rounded-lg border border-[#0F8B8D]/20">
                  {isUrdu ? `روپے ${visitCharges}` : `Rs. ${visitCharges}`}
                </span>
              </div>
            )}

            {/* Doorstep Security PIN Callout if pending verification */}
            {Boolean(liveVisit.securityPin && !isVisitVerified) && (
              <>
                <span className="text-slate-300 text-xs hidden sm:inline">•</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs text-slate-500 font-semibold">
                    {isUrdu ? "آمد PIN:" : "Doorstep PIN:"}
                  </span>
                  <span className="inline-flex items-center font-mono font-bold text-xs sm:text-sm tracking-wider text-orange bg-orange/10 px-2 py-0.5 rounded-lg border border-orange/20">
                    {liveVisit.securityPin}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right: Contact Actions (Message & Call) */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {/* Message Button */}
            <Link
              role="button"
              aria-label={isUrdu ? "کاریگر کو پیغام بھیجیں" : "Message Worker"}
              href={`/customer/chat?visitId=${liveVisit.id}&jobId=${liveVisit.jobId}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0F8B8D]/10 hover:bg-[#0F8B8D] text-[#0F8B8D] hover:text-white border border-[#0F8B8D]/25 text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-98 cursor-pointer"
            >
              <MessageSquare className="size-4 shrink-0" />
              <span>{isUrdu ? "پیغام" : "Message"}</span>
            </Link>

            {/* Call Button */}
            {Boolean(technicianPhone) && (
              <a
                role="button"
                aria-label={isUrdu ? "کاریگر کو کال کریں" : "Call Worker"}
                href={`tel:${technicianPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-success hover:bg-success/90 text-white text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-98 cursor-pointer"
              >
                <Phone className="size-4 shrink-0" />
                <span>{isUrdu ? "کال کریں" : "Call"}</span>
              </a>
            )}
          </div>
        </div>

        {/* Swipe Indicator Dots (ONLY rendered if multiple active jobs exist) */}
        {totalJobs > 1 && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 pt-2"
          >
            {activeList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={isUrdu ? `کام ${idx + 1}` : `Job ${idx + 1}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === validIndex
                    ? "w-6 bg-[#0F8B8D]"
                    : "w-2 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
