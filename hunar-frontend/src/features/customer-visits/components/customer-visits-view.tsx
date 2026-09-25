"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  History,
  MapPin,
  MessageSquare,
  Navigation,
  Phone,
  RotateCcw,
  ShieldCheck,
  Star,
  Timer,
  Wrench,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { PeshawarLiveTrackingMap } from "./peshawar-live-tracking-map";
import { RescheduleModal } from "./reschedule-modal";
import { QuickChatDrawer } from "./quick-chat-drawer";
import type { ScheduledVisit } from "../types";

interface CustomerVisitsViewProps {
  initialVisits: ScheduledVisit[];
}

export function CustomerVisitsView({ initialVisits }: CustomerVisitsViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [visits, setVisits] = useState<ScheduledVisit[]>(initialVisits);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [copiedPin, setCopiedPin] = useState(false);
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<ScheduledVisit | null>(null);
  const [selectedVisitForChat, setSelectedVisitForChat] = useState<ScheduledVisit | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Live en-route visit
  const liveVisit = useMemo(() => {
    return visits.find((v) => v.status === "en_route" || v.status === "dispatched") || visits[0];
  }, [visits]);

  // Upcoming scheduled visits
  const upcomingVisits = useMemo(() => {
    return visits.filter((v) => v.status === "dispatched" || v.status === "en_route");
  }, [visits]);

  // Past completed visits
  const pastVisits = useMemo(() => {
    return visits.filter((v) => v.status === "completed" || v.status === "cancelled");
  }, [visits]);

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(true);
    setSuccessToast(
      isUrdu
        ? `ڈور سٹیپ PIN ${pin} کاپی ہو گیا!`
        : `Doorstep PIN ${pin} copied to clipboard!`
    );
    setTimeout(() => {
      setCopiedPin(false);
      setSuccessToast(null);
    }, 3000);
  };

  const handleConfirmReschedule = (newDate: string, newSlot: string) => {
    if (!selectedVisitForReschedule) return;

    setVisits((prev) =>
      prev.map((v) => {
        if (v.id === selectedVisitForReschedule.id) {
          return {
            ...v,
            scheduledDate: newDate,
            scheduledTimeSlot: newSlot,
            updatedAt: "Just now",
          };
        }
        return v;
      })
    );

    setSuccessToast(
      isUrdu
        ? `ملاقات کا وقت ${newDate}، ${newSlot} پر تبدیل کر دیا گیا۔`
        : `Appointment rescheduled to ${newDate}, ${newSlot}.`
    );
    setTimeout(() => setSuccessToast(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 pb-16 animate-in fade-in-50 duration-300 text-[#123B5D]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 right-6 rtl:right-auto rtl:left-6 z-50 bg-[#0F766E] text-white px-5 py-3 rounded-2xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="size-5 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{successToast}</span>
        </div>
      )}

      {/* Page Header & Live Hub Status Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D] tracking-tight">
            {isUrdu ? "شیڈول وزٹس اور لائیو ٹریکر" : "Scheduled Visits & Arrival Tracker"}
          </h1>
        </div>

        {/* Interactive Tab Switcher (Upcoming & Live vs Past Visits) */}
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200 select-none self-start md:self-auto shrink-0 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("upcoming")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-[#0F766E] text-white shadow-xs"
                : "text-slate-600 hover:text-[#123B5D]"
            }`}
          >
            <Timer className="size-4" />
            <span>{isUrdu ? `آنے والے اور لائیو (${upcomingVisits.length})` : `Upcoming & Live (${upcomingVisits.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("past")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "past"
                ? "bg-[#0F766E] text-white shadow-xs"
                : "text-slate-600 hover:text-[#123B5D]"
            }`}
          >
            <History className="size-4" />
            <span>{isUrdu ? `سابقہ وزٹس (${pastVisits.length})` : `Past Visits (${pastVisits.length})`}</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: UPCOMING & LIVE ARRIVAL TRACKER                              */}
      {/* =================================================================== */}
      {activeTab === "upcoming" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: LIVE TRACKER HERO + TOMORROW'S APPOINTMENT (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* HERO DISPATCH CARD */}
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden transition-all hover:shadow-md">
                {/* Top Status Header Accent Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-[#0F766E] via-[#14B8A6] to-[#16A34A]" />

                <div className="p-5 sm:p-6 space-y-5">
                  {/* Live Status Header */}
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex size-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                      <span className="relative inline-flex rounded-full size-3.5 bg-[#16A34A]" />
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#123B5D] leading-tight">
                      {isUrdu ? "کاریگر راستے میں ہے!" : "Technician On The Way!"}
                    </h2>
                  </div>

                  {/* Job Title & Order Ref */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#E2E8F0] flex items-start gap-3">
                    <div className="size-10 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0 mt-0.5">
                      <Wrench className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-[#123B5D] truncate">
                          {isUrdu ? (liveVisit.jobTitleUr ?? liveVisit.jobTitle) : liveVisit.jobTitle}
                        </h3>
                        <Link
                          href={`/customer/jobs/${liveVisit.jobId}`}
                          className="text-[11px] font-bold text-[#0F766E] hover:underline shrink-0 flex items-center gap-0.5"
                        >
                          <span>{isUrdu ? "جاب دیکھیں" : "View Job"}</span>
                          <ArrowRight className="size-3.5 rtl:rotate-180" />
                        </Link>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B] mt-0.5">
                        <span className="font-medium text-[#123B5D]">
                          {isUrdu ? `آرڈر #${liveVisit.id}` : `Order #${liveVisit.id}`}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 font-bold text-[#0F766E]">
                          {isUrdu ? `وزٹ چارجز: ${liveVisit.visitCharges ?? 300} روپے` : `Visit Charges: Rs. ${liveVisit.visitCharges ?? 300}`}
                        </span>
                      </div>

                      {/* Service Location */}
                      <div className="flex items-center gap-2 text-xs pt-2 border-t border-slate-100 mt-2 flex-wrap">
                        <span className="text-slate-500 font-medium">
                          {isUrdu ? "سروس کا پتہ:" : "Service Location:"}
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-[#123B5D] bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          <MapPin className="size-3.5 text-[#0F766E]" />
                          {isUrdu ? (liveVisit.customerAreaUr || liveVisit.customerAddress) : liveVisit.customerAddress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Technician Credentials Card */}
                  <div className="p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        <div className="size-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm ring-2 ring-[#0F766E]/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={liveVisit.technician.avatarUrl}
                            alt={liveVisit.technician.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span
                          className="absolute bottom-0 right-0 rtl:right-auto rtl:left-0 size-3.5 bg-[#16A34A] border-2 border-white rounded-full"
                          title={isUrdu ? "جی پی ایس پر فعال" : "Active on GPS"}
                        />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-[#123B5D]">
                            {isUrdu ? (liveVisit.technician.nameUr ?? liveVisit.technician.name) : liveVisit.technician.name}
                          </h4>
                          <span
                            className="inline-flex items-center gap-0.5 text-[10.5px] font-bold px-2 py-0.5 rounded bg-[#0F766E]/10 text-[#0F766E]"
                            title={isUrdu ? "نادرا تصدیق شدہ" : "NADRA CNIC Verified"}
                          >
                            <ShieldCheck className="size-3" />
                            {liveVisit.technician.hunarBadgeId}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] font-medium">
                          {isUrdu ? (liveVisit.technician.businessNameUr ?? liveVisit.technician.businessName) : liveVisit.technician.businessName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-[#64748B] pt-0.5 flex-wrap">
                          <span className="inline-flex items-center gap-0.5 text-[#F59E0B] font-bold">
                            <Star className="size-3.5 fill-[#F59E0B]" />
                            {liveVisit.technician.rating.toFixed(1)} ({liveVisit.technician.totalReviews})
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Doorstep OTP */}
                  <div className="px-3.5 py-2 rounded-xl bg-slate-50/90 border border-[#E2E8F0] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-md bg-[#123B5D] text-white flex items-center justify-center shrink-0">
                        <ShieldCheck className="size-3.5" />
                      </div>
                      <span className="text-xs font-bold text-[#123B5D]">
                        {isUrdu ? "ڈور سٹیپ OTP" : "Doorstep OTP"}
                      </span>
                    </div>

                    {/* 4 Digit OTP Block */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-[#0F766E] shadow-2xs">
                        <span className="font-mono text-sm font-extrabold text-[#123B5D] tracking-widest">
                          {liveVisit.securityPin.split("").join(" ")}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyPin(liveVisit.securityPin)}
                          className="ml-0.5 rtl:ml-0 rtl:mr-0.5 text-slate-400 hover:text-[#0F766E] p-0.5 rounded transition-colors cursor-pointer"
                          title={isUrdu ? "OTP کاپی کریں" : "Copy OTP"}
                        >
                          <Copy className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* INTERACTIVE LEAFLET PESHAWAR TRACKING MAP */}
                  <PeshawarLiveTrackingMap visit={liveVisit} />

                  {/* 4-Stage Arrival Progress Stepper */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-[#E2E8F0] space-y-2.5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                      <span className="text-[#0F766E] font-bold flex items-center gap-1">
                        <CheckCircle2 className="size-4" />
                        {isUrdu ? "1. تصدیق شدہ" : "1. Confirmed"}
                      </span>
                      <span className="text-[#0F766E] font-bold flex items-center gap-1">
                        <span className="size-2 rounded-full bg-[#0F766E] animate-ping" />
                        {isUrdu ? "2. راستے میں" : "2. En Route"}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="size-4" />
                        {isUrdu ? "3. دہلیز پر PIN" : "3. Doorstep PIN"}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Wrench className="size-4" />
                        {isUrdu ? "4. معائنہ و کام" : "4. Diagnosis & Work"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0F766E] to-[#16A34A] rounded-full transition-all duration-500"
                        style={{ width: "55%" }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={`tel:${liveVisit.technician.phone}`}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <Phone className="size-4" />
                      <span>{isUrdu ? "کال کریں" : "Call"}</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => setSelectedVisitForChat(liveVisit)}
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-[#123B5D] hover:bg-slate-50 text-[#123B5D] text-xs sm:text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <MessageSquare className="size-4" />
                      <span>{isUrdu ? "پیغام" : "Message"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedVisitForReschedule(liveVisit)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white hover:bg-red-50 text-red-600 text-xs sm:text-sm font-bold border border-red-200 transition-colors ml-auto rtl:ml-0 rtl:mr-auto cursor-pointer"
                    >
                      <RotateCcw className="size-4" />
                      <span>{isUrdu ? "وقت تبدیل کریں" : "Reschedule"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TOMORROW'S SCHEDULED VISIT CARD */}
              {visits.length > 1 && (
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-[#123B5D] border border-[#E2E8F0]">
                        {isUrdu ? "کل" : "Tomorrow"}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
                        {visits[1].scheduledDate} • {visits[1].scheduledTimeSlot}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20">
                      <CheckCircle2 className="size-3.5" />
                      {isUrdu ? "کنفرم شدہ سلاٹ" : "Confirmed Slot"}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#E2E8F0]">
                    <div className="flex items-start gap-3.5">
                      <div className="size-12 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                        <Wrench className="size-6 stroke-[2.2]" />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-[#123B5D]">
                          {isUrdu ? (visits[1].jobTitleUr ?? visits[1].jobTitle) : visits[1].jobTitle}
                        </h4>
                        <p className="text-xs text-[#64748B]">
                          {isUrdu ? "متعین کردہ: " : "Assigned: "}
                          <strong className="text-[#123B5D]">
                            {isUrdu ? (visits[1].technician.nameUr ?? visits[1].technician.name) : visits[1].technician.name}
                          </strong> ({isUrdu ? (visits[1].technician.businessNameUr ?? visits[1].technician.businessName) : visits[1].technician.businessName})
                        </p>
                        <p className="text-xs text-[#64748B] flex items-center gap-1 pt-0.5">
                          <MapPin className="size-3.5 text-[#0F766E]" />
                          {isUrdu ? (visits[1].customerAreaUr ?? visits[1].customerAddress) : visits[1].customerAddress}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col items-start sm:items-end rtl:sm:items-start gap-1 shrink-0">
                      <span className="inline-flex items-center font-bold text-xs sm:text-sm text-[#0F766E] bg-[#0F766E]/10 px-2.5 py-1 rounded-lg border border-[#0F766E]/20">
                        {isUrdu ? `وزٹ چارجز: ${visits[1].visitCharges ?? 300} روپے` : `Visit Charges: Rs. ${visits[1].visitCharges ?? 300}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedVisitForReschedule(visits[1])}
                      className="px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:bg-slate-50 text-xs font-bold text-[#123B5D] transition-colors cursor-pointer"
                    >
                      {isUrdu ? "وقت تبدیل کریں" : "Change Time Slot"}
                    </button>

                    <Link
                      href={`/customer/jobs/${visits[1].jobId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline"
                    >
                      <span>{isUrdu ? "بکنگ کی تفصیلات دیکھیں" : "View Booking Details"}</span>
                      <ArrowRight className="size-3.5 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: SAFETY CHECKLIST & VERIFICATION SEAL (5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* DOORSTEP SAFETY & ENTRY CHECKLIST */}
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-[#E2E8F0]">
                  <div className="size-10 rounded-2xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#123B5D]">
                      {isUrdu ? "ڈور سٹیپ حفاظتی چیک لسٹ" : "Doorstep Safety Checklist"}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      {isUrdu ? "دروازہ کھولنے سے پہلے یہ 3 تصدیقیں مکمل کریں" : "Complete these 3 checks before opening the door"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E2E8F0] cursor-pointer hover:bg-slate-50 transition-all">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-0.5 size-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#123B5D]">
                        {isUrdu ? "1. شناختی کارڈ اور بیج چیک کریں" : "1. Inspect ID Badge & CNIC"}
                      </span>
                      <p className="text-xs text-[#64748B]">
                        {isUrdu
                          ? "یقینی بنائیں کہ چہرہ اور ہنر شناختی بیج #HN-4821 سے مطابقت رکھتے ہیں۔"
                          : "Ensure facial identity and government badge match ID #HN-4821."}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E2E8F0] cursor-pointer hover:bg-slate-50 transition-all">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-0.5 size-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#123B5D]">
                        {isUrdu ? `2. PIN کوڈ طلب کریں: ${liveVisit.securityPin}` : `2. Demand PIN Code: ${liveVisit.securityPin}`}
                      </span>
                      <p className="text-xs text-[#64748B]">
                        {isUrdu
                          ? `کاریگر کو گیٹ کھولنے سے پہلے یہ کوڈ ${liveVisit.securityPin} بتانا لازمی ہے۔`
                          : `Technician must state code ${liveVisit.securityPin} before unlocking your premises.`}
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 rounded-2xl bg-white border border-[#E2E8F0] cursor-pointer hover:bg-slate-50 transition-all">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-0.5 size-4 rounded text-[#0F766E] focus:ring-[#0F766E]"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-[#123B5D]">
                        {isUrdu ? "3. 100% کوالٹی اور تسلی" : "3. 100% Quality Satisfaction"}
                      </span>
                      <p className="text-xs text-[#64748B]">
                        {isUrdu
                          ? "ادائیگی کرنے سے پہلے کاریگر کے کام کا مکمل معائنہ اور تسلی کریں۔"
                          : "Confirm service satisfaction with technician before final payment settlement."}
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* VERIFICATION & SAFETY SEAL CARD */}
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-2xl bg-[#123B5D] text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="size-6 text-[#0F766E]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#123B5D]">
                      {isUrdu ? "WorkerFIX تصدیق شدہ سیکیورٹی" : "WorkerFIX Verified Security"}
                    </h4>
                    <span className="text-xs font-semibold text-[#0F766E]">
                      {isUrdu ? "نادرا بائیومیٹرک تصدیق شدہ" : "NADRA Biometric Cleared"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  {isUrdu
                    ? "تمام وزٹ کرنے والے ماہرین نادرا سی این آئی سی اور پولیس پس منظر کی سخت جانچ پڑتال سے گزرتے ہیں۔"
                    : "All visiting technicians undergo rigorous background verification and vehicle registration tracking in Khyber Pakhtunkhwa."}
                </p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-600">{isUrdu ? "شکایات و سپورٹ" : "Dispute Support"}</span>
                  <span className="text-[#0F766E]">{isUrdu ? "24/7 ہیلپ لائن فعال" : "24/7 Helpline Active"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: PAST VISITS HISTORY                                         */}
      {/* =================================================================== */}
      {activeTab === "past" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#E2E8F0]">
            <h3 className="text-base font-bold text-[#123B5D] mb-1">
              {isUrdu ? "مکمل شدہ وزٹس اور تصدیق شدہ بل" : "Completed Visits & Verified Invoices"}
            </h3>
            <p className="text-xs text-[#64748B] mb-4">
              {isUrdu
                ? "تمام سابقہ سروسز معائنہ ریکارڈز، وارنٹی اور رسیدوں کے ساتھ۔"
                : "All previous home maintenance services with inspection records, warranties, and receipts."}
            </p>

            <div className="space-y-3.5">
              {pastVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="size-11 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center shrink-0 font-bold">
                      <CheckCircle2 className="size-6" />
                    </div>
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-[#123B5D]">
                        {isUrdu ? (visit.jobTitleUr ?? visit.jobTitle) : visit.jobTitle}
                      </h4>
                      <p className="text-xs text-[#64748B]">
                        {isUrdu
                          ? `${visit.scheduledDate === "Yesterday" ? "کل" : visit.scheduledDate} • ${visit.technician.nameUr ?? visit.technician.name} (${visit.technician.businessNameUr ?? visit.technician.businessName})`
                          : `${visit.scheduledDate} • ${visit.technician.name} (${visit.technician.businessName})`}
                      </p>
                      <div className="flex items-center gap-2 text-xs pt-1 flex-wrap">
                        <span className="inline-flex items-center gap-0.5 text-[#F59E0B] font-bold">
                          <Star className="size-3.5 fill-[#F59E0B]" />
                          {visit.technician.rating.toFixed(1)} {isUrdu ? "ریٹنگ" : "Rated"}
                        </span>
                        <span>•</span>
                        <span className="text-[#16A34A] font-semibold">
                          {isUrdu ? `${visit.warrantyDays} دن کی وارنٹی فعال ہے` : `${visit.warrantyDays}-Day Warranty Active`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-start sm:items-end rtl:sm:items-start justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                    <span className="text-xs text-[#64748B]">
                      {isUrdu ? "رسید " : "Invoice "}
                      <strong className="text-[#123B5D]">#{visit.id}</strong>
                    </span>
                    <span className="text-sm font-extrabold text-[#0F766E]">
                      {isUrdu
                        ? `Rs. ${visit.escrowAmount.toLocaleString()} ادا شدہ`
                        : `Rs. ${visit.escrowAmount.toLocaleString()} Paid`}
                    </span>
                    <Link
                      href={`/customer/jobs/${visit.jobId}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0F766E] hover:underline"
                    >
                      <span>{isUrdu ? "رسید دیکھیں" : "View Receipt"}</span>
                      <ArrowRight className="size-3 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {selectedVisitForReschedule && (
        <RescheduleModal
          visit={selectedVisitForReschedule}
          isOpen={true}
          onClose={() => setSelectedVisitForReschedule(null)}
          onConfirmReschedule={handleConfirmReschedule}
        />
      )}

      {/* Quick In-Page Chat Drawer */}
      {selectedVisitForChat && (
        <QuickChatDrawer
          visit={selectedVisitForChat}
          isOpen={true}
          onClose={() => setSelectedVisitForChat(null)}
        />
      )}
    </div>
  );
}

