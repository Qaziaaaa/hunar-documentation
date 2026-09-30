"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
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
import { CustomerArrivalOtpModal } from "./customer-arrival-otp-modal";
import type { ScheduledVisit } from "../types";
import {
  arrivalService,
  SUCCESS_VERIFICATION_MESSAGE,
  SUCCESS_VERIFICATION_MESSAGE_UR,
  type ArrivalSession,
} from "@/features/jobs/services/arrival-verification-service";

interface CustomerVisitsViewProps {
  initialVisits: ScheduledVisit[];
}

export function CustomerVisitsView({ initialVisits }: CustomerVisitsViewProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const [visits, setVisits] = useState<ScheduledVisit[]>(initialVisits);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [selectedVisitForReschedule, setSelectedVisitForReschedule] = useState<ScheduledVisit | null>(null);
  const [selectedVisitForChat, setSelectedVisitForChat] = useState<ScheduledVisit | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // In-premises progression and OTP modal states
  const [arrivalSession, setArrivalSession] = useState<ArrivalSession | null>(() => arrivalService.getSession());
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [inPremisesStep, setInPremisesStep] = useState<"diagnosing" | "quote_proposed" | "repair_in_progress" | "work_completed">("diagnosing");

  // Sync with arrival service state
  useEffect(() => {
    const session = arrivalService.getSession();
    if (session && session.status === "otp_verified") {
      setVisits((prev) =>
        prev.map((v) =>
          v.jobId === session.jobId || v.id === session.visitId
            ? { ...v, status: "inspection_in_progress" as const }
            : v
        )
      );
    }

    const unsubscribe = arrivalService.subscribe((s, eventType) => {
      setArrivalSession(s);
      if (s && (eventType === "OTP_VERIFIED" || s.status === "otp_verified")) {
        setVisits((prev) =>
          prev.map((v) =>
            v.jobId === s.jobId || v.id === s.visitId
              ? { ...v, status: "inspection_in_progress" as const }
              : v
          )
        );
      }
    });

    return () => unsubscribe();
  }, []);

  // Live en-route or in-premises visit
  const liveVisit = useMemo(() => {
    return (
      visits.find(
        (v) =>
          v.status === "en_route" ||
          v.status === "dispatched" ||
          v.status === "arrived" ||
          v.status === "inspection_in_progress"
      ) || visits[0]
    );
  }, [visits]);

  const isVerifiedInside =
    liveVisit.status === "inspection_in_progress" || liveVisit.status === "arrived";

  // Upcoming scheduled visits
  const upcomingVisits = useMemo(() => {
    return visits.filter(
      (v) =>
        v.status === "dispatched" ||
        v.status === "en_route" ||
        v.status === "arrived" ||
        v.status === "inspection_in_progress"
    );
  }, [visits]);

  // Past completed visits
  const pastVisits = useMemo(() => {
    return visits.filter((v) => v.status === "completed" || v.status === "cancelled");
  }, [visits]);


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
                  {/* Arrival Doorstep OTP Action Banner */}
                  {!isVerifiedInside && (
                    <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in-50">
                      <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <MapPin className="size-5 animate-bounce" />
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                            {isUrdu ? `${liveVisit.technician.name} آپ کی دہلیز پر پہنچ چکے ہیں!` : `${liveVisit.technician.name} has arrived at your doorstep!`}
                          </h4>
                          <p className="text-[11px] text-amber-800">
                            {isUrdu ? "احاطے میں داخلے کی اجازت دینے کے لیے 4 ہندسوں کا دہلیز PIN درج کریں۔" : "Enter the 4-digit Doorstep PIN provided by technician to grant entry."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOtpModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
                      >
                        {isUrdu ? "دہلیز PIN درج کریں" : "Enter Doorstep PIN"}
                      </button>
                    </div>
                  )}

                  {/* Live Status Header */}
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex size-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#16A34A] opacity-75" />
                      <span className="relative inline-flex rounded-full size-3.5 bg-[#16A34A]" />
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#123B5D] leading-tight">
                      {isVerifiedInside
                        ? isUrdu
                          ? "کاریگر احاطے کے اندر موجود ہے - معائنہ جاری ہے!"
                          : "Technician Inside Premises — Inspection in Progress!"
                        : isUrdu
                        ? "کاریگر راستے میں ہے!"
                        : "Technician On The Way!"}
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
                        <CheckCircle2 className="size-4" />
                        {isUrdu ? "2. راستے میں" : "2. En Route"}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-bold ${
                          isVerifiedInside ? "text-[#0F766E]" : "text-amber-600"
                        }`}
                      >
                        {isVerifiedInside ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <MapPin className="size-4 text-amber-500 animate-bounce" />
                        )}
                        {isUrdu ? "3. دہلیز پر PIN" : "3. Doorstep PIN"}
                      </span>
                      <span
                        className={`flex items-center gap-1 font-bold ${
                          isVerifiedInside ? "text-[#0F766E]" : "text-slate-400"
                        }`}
                      >
                        <Wrench className="size-4" />
                        {isUrdu ? "4. معائنہ و کام" : "4. Diagnosis & Work"}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0F766E] to-[#16A34A] rounded-full transition-all duration-500"
                        style={{ width: isVerifiedInside ? "100%" : "65%" }}
                      />
                    </div>
                  </div>

                  {/* IN-PREMISES DIAGNOSIS & WORK PROGRESSION CARD */}
                  {isVerifiedInside && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-white border-2 border-[#0F766E]/30 shadow-sm space-y-4 animate-in fade-in-50">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-xl bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center">
                            <Wrench className="size-4" />
                          </div>
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-[#123B5D]">
                              {isUrdu ? "احاطے میں معائنہ اور کام کی پیش رفت" : "In-Premises Diagnosis & Work Progress"}
                            </h4>
                            <span className="text-[11px] text-slate-500">
                              {isUrdu ? "کاریگر احاطے کے اندر کام کر رہا ہے" : "Technician is on-site inside premises"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right rtl:text-left">
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {isUrdu ? "طے شدہ وزٹ فیس" : "Agreed Visit Fee"}
                          </span>
                          <span className="text-sm font-extrabold text-[#0F766E]">
                            Rs. {liveVisit.visitCharges ?? 300}
                          </span>
                        </div>
                      </div>

                      {/* Stage 1: Diagnosing */}
                      {inPremisesStep === "diagnosing" && (
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-[#123B5D]">
                            <span className="size-2 rounded-full bg-[#0F766E] animate-ping" />
                            <span>{isUrdu ? "کاریگر مسئلے کا معائنہ کر رہا ہے..." : "Technician is diagnosing the issue..."}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">
                            {isUrdu
                              ? "کاریگر مسئلے کی تشخیص کر کے آن سائٹ کوٹیشن پیش کرے گا۔ مرمت صرف آپ کی منظوری کے بعد شروع ہوگی۔"
                              : "The technician will inspect the fault and provide an on-site estimate. Work only proceeds after your approval."}
                          </p>
                          <button
                            type="button"
                            onClick={() => setInPremisesStep("quote_proposed")}
                            className="text-xs font-bold text-[#0F766E] hover:underline cursor-pointer"
                          >
                            {isUrdu ? "کاریگر کی کوٹیشن دیکھیں ←" : "View Technician Quote / Additional Work →"}
                          </button>
                        </div>
                      )}

                      {/* Stage 2: Quote / Additional Work Proposed */}
                      {inPremisesStep === "quote_proposed" && (
                        <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200/80 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#123B5D]">
                              {isUrdu ? "کاریگر کی تجویز کردہ مرمت و سامان" : "Proposed Repair & Materials"}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F766E] text-white">
                              {isUrdu ? "آپ کی منظوری درکار ہے" : "Approval Required"}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-teal-100 space-y-1">
                            <p className="font-semibold text-[#123B5D]">
                              {isUrdu ? "تشخیص: " : "Diagnosis: "}
                              <span className="font-normal">
                                {isUrdu
                                  ? "مین بریکر اوور ہیٹ ہو رہا ہے اور ٹرمینل لگز ڈی گریڈ ہو چکے ہیں۔"
                                  : "Main breaker overheating under load. Terminal insulation degraded."}
                              </span>
                            </p>
                            <p className="font-semibold text-[#123B5D]">
                              {isUrdu ? "مرمت کا منصوبہ: " : "Proposed Fix: "}
                              <span className="font-normal">
                                {isUrdu
                                  ? "63A شنائیڈر بریکر کی تبدیلی اور کیبل ٹرمینل کرمپنگ۔"
                                  : "Install 63A Schneider modular breaker and re-crimp copper terminals."}
                              </span>
                            </p>
                          </div>

                          {/* Financial Separation */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-600">
                              <span>{isUrdu ? "وزٹ و معائنہ فیس:" : "Visit & Diagnostic Fee:"}</span>
                              <span>Rs. {liveVisit.visitCharges ?? 300}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>{isUrdu ? "مرمت و کاریگری مزدوری:" : "Repair & Labor:"}</span>
                              <span>Rs. 1,100</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>{isUrdu ? "اصل پرزہ (Schneider 63A DP):" : "Parts (Schneider 63A DP):"}</span>
                              <span>Rs. 800</span>
                            </div>
                            <div className="flex justify-between font-bold text-sm text-[#123B5D] pt-1.5 border-t border-teal-200">
                              <span>{isUrdu ? "کل متوقع لاگت:" : "Updated Total:"}</span>
                              <span className="text-[#0F766E]">Rs. 2,200</span>
                            </div>
                          </div>

                          {/* Customer Approval Actions */}
                          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setInPremisesStep("repair_in_progress")}
                              className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                            >
                              {isUrdu ? "منظور کریں اور کام شروع کروائیں" : "Approve Quote & Start Work"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInPremisesStep("work_completed")}
                              className="w-full sm:w-auto py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 cursor-pointer"
                            >
                              {isUrdu ? "صرف وزٹ فیس ادا کریں" : "Decline (Pay Visit Fee Only)"}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Stage 3: Work in Progress */}
                      {inPremisesStep === "repair_in_progress" && (
                        <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-emerald-900">
                              <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                              <span>{isUrdu ? "کام جاری ہے — کاریگر مرمت مکمل کر رہا ہے" : "Work in Progress — Technician is performing the repair"}</span>
                            </div>
                            <span className="text-[11px] text-emerald-700 font-semibold">
                              {isUrdu ? "منظور شدہ کوٹیشن: Rs. 2,200" : "Approved Quote: Rs. 2,200"}
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-800/80">
                            {isUrdu
                              ? "کاریگر کام مکمل کرنے کے بعد آپ کو معائنہ کروائے گا اور حتمی بل پیش کرے گا۔"
                              : "Once the technician completes the work, you will inspect the repair before final settlement."}
                          </p>
                          <button
                            type="button"
                            onClick={() => setInPremisesStep("work_completed")}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          >
                            {isUrdu ? "کام کی تکمیل کا معائنہ کریں ←" : "Mark Work Completed & Inspect →"}
                          </button>
                        </div>
                      )}

                      {/* Stage 4: Work Completed */}
                      {inPremisesStep === "work_completed" && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-300 space-y-3">
                          <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                            <span>{isUrdu ? "کاریگر نے کام مکمل کر لیا ہے!" : "Work Completed by Technician!"}</span>
                          </div>
                          <p className="text-xs text-emerald-800">
                            {isUrdu
                              ? "مرمت کا معائنہ کریں، بل کی تفصیلات چیک کریں اور اطمینان کے بعد براہ راست ادائیگی کریں۔"
                              : "Inspect the repair, review itemized billing, and confirm direct payment on your satisfaction."}
                          </p>
                          <Link
                            href={`/customer/job/${liveVisit.jobId}/complete`}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
                          >
                            <span>{isUrdu ? "مکمل شدہ کام کا معائنہ اور ادائیگی کی تصدیق ←" : "Inspect Completed Work & Confirm Payment →"}</span>
                            <ArrowRight className="size-4 rtl:rotate-180" />
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

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
                        {isUrdu ? "2. PIN کوڈ طلب کریں" : "2. Demand PIN Code"}
                      </span>
                      <p className="text-xs text-[#64748B]">
                        {isUrdu
                          ? "کاریگر کو گیٹ کھولنے سے پہلے یہ کوڈ بتانا لازمی ہے۔"
                          : "Technician must state code before unlocking your premises."}
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

      {/* Doorstep Arrival OTP Modal */}
      <CustomerArrivalOtpModal
        isOpen={isOtpModalOpen}
        session={arrivalSession}
        onSuccess={(msg) => {
          setIsOtpModalOpen(false);
          setSuccessToast(msg);
          setTimeout(() => setSuccessToast(null), 5000);
        }}
        onClose={() => setIsOtpModalOpen(false)}
        isUrdu={isUrdu}
      />
    </div>
  );
}

