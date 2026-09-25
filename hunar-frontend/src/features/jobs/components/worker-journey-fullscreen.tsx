"use client";

import React, { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { JobRequest } from "@/types/job";
import { VisitOffer } from "@/types/offer";
import { formatRs } from "@/lib/design-tokens";
import { workerStore, useWorkerJobs } from "@/stores/worker-jobs-store";
import { WorkerVisitTrackingView } from "./worker-visit-tracking-view";
import { WorkerChatModal } from "./worker-chat-modal";
import {
  Phone,
  MessageCircle,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wrench,
  Headphones,
  PhoneCall,
  X,
  BadgeCheck,
  Star,
  Clock,
  Check,
  XCircle,
  HelpCircle,
  Camera,
  Upload,
  Plus,
  Trash2,
} from "lucide-react";

interface WorkerJourneyFullscreenProps {
  job: JobRequest;
  offer?: VisitOffer;
}

export function WorkerJourneyFullscreen({
  job,
  offer,
}: WorkerJourneyFullscreenProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const isUrdu = locale === "ur";
  const { walletBalance } = useWorkerJobs();

  const [showCallModal, setShowCallModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [customerRating, setCustomerRating] = useState(5);
  const [selectedReviewTags, setSelectedReviewTags] = useState<string[]>([
    "Polite & Cooperative",
    "Fast Payment",
  ]);
  const [cancelReason, setCancelReason] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form fields for inspection
  const [diagnosis, setDiagnosis] = useState(
    "Faulty main breaker overheating under peak load. Terminal lug insulation degraded."
  );
  const [repairPrice, setRepairPrice] = useState<number>(1500);
  const [photos, setPhotos] = useState<string[]>([
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  ]);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const agreedVisitCharge =
    offer?.agreedVisitCharge ??
    offer?.visitCharge ??
    job.visitCharge ??
    job.customerSuggestedPrice ??
    800;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // 1. Handle Submit Inspection
  const handleSubmitInspection = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!diagnosis.trim() || !repairPrice) {
      setErrorMsg("Please fill in diagnosis and price estimate.");
      return;
    }
    if (photos.length === 0) {
      setErrorMsg(isUrdu ? "کم از کم ایک فوٹو منسلک کریں۔" : "Please attach at least one fault photo.");
      return;
    }

    setIsSubmitting(true);
    workerStore.submitInspection(job.id, {
      diagnosis: diagnosis.trim(),
      repairPlan: "Standard on-site repair and parts replacement",
      repairPriceEstimate: repairPrice,
      estimatedRepairTime: "Standard",
      photos: photos,
    });
    setIsSubmitting(false);
  };

  // 2. Handle Start Repair
  const handleStartRepair = () => {
    workerStore.startRepair(job.id);
  };

  // 3. Handle Complete Job (Full repair)
  const handleCompleteRepairJob = () => {
    workerStore.completeJob(job.id, repairPrice);
    setShowSettlementModal(true);
  };

  // 4. Handle Settle Visit Fee Only (When customer declined repair)
  const handleSettleVisitOnlyJob = () => {
    workerStore.completeJob(job.id, 0);
    setShowSettlementModal(true);
  };

  // 5. Handle Exit back to jobs hub
  const handleFinishAndExit = () => {
    setShowSettlementModal(false);
    router.push("/worker/jobs");
  };

  const handleCancelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    workerStore.cancelJob(job.id, cancelReason || "Cancelled by worker");
    setShowCancelModal(false);
    router.push("/worker/jobs");
  };

  const toggleReviewTag = (tag: string) => {
    setSelectedReviewTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Determine current active workflow stage (Streamlined 3-Step Flow)
  const isEnRoute = job.status === "accepted" || job.status === "visit_in_progress";
  const isInspecting = job.status === "visit_completed" || job.status === "inspecting";
  const isDecisionOrExecution =
    job.status === "inspection_submitted" ||
    job.status === "repair_negotiating" ||
    job.status === "repair_approved" ||
    job.status === "repair_in_progress" ||
    job.status === "repair_declined" ||
    job.status === "completed";

  const isAwaitingDecision =
    job.status === "inspection_submitted" || job.status === "repair_negotiating";
  const isApproved = job.status === "repair_approved";
  const isInRepair = job.status === "repair_in_progress";
  const isDeclined = job.status === "repair_declined";
  const isCompleted = job.status === "completed";

  // When En Route or starting visit to customer doorstep, render the dedicated Visit Tracking Screen (Step 1)
  if (isEnRoute) {
    return <WorkerVisitTrackingView job={job} offer={offer} />;
  }

  // Get current step number and label for 3-Step Journey
  const getStepInfo = () => {
    if (isInspecting) {
      return { step: 2, title: isUrdu ? "تشخیص و کوٹیشن" : "Diagnosis & Quote" };
    }
    if (isCompleted) {
      return { step: 3, title: isUrdu ? "ادائیگی و ریٹنگ" : "Settlement & Rating" };
    }
    return { step: 3, title: isUrdu ? "فیصلہ و مرمت" : "Decision & Execution" };
  };

  const stepInfo = getStepInfo();

  // Financial calculations
  const finalRepairAmount = isDeclined ? 0 : repairPrice;
  const grossJobValue = agreedVisitCharge + finalRepairAmount;
  const platformFee = Math.round(grossJobValue * 0.1);
  const netEarnings = grossJobValue - platformFee;

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased select-none flex flex-col w-full max-w-3xl sm:max-w-4xl mx-auto shadow-2xl relative border-x border-slate-200/70">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (Cancel visit on left, Headphone Support on right) */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-2xs">
        {/* Left: Cancel visit Button */}
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="text-xs sm:text-sm font-bold text-slate-800 hover:text-red-600 bg-slate-50 hover:bg-red-50 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs transition-colors cursor-pointer"
        >
          {isUrdu ? "وزٹ منسوخ کریں" : "Cancel visit"}
        </button>

        {/* Center: Stage Step Badge (3-Step Flow) */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-extrabold text-[#123B5D]">
          <span className="size-1.5 rounded-full bg-[#0F8B8D] animate-pulse" />
          <span>
            {stepInfo.step}/3 {stepInfo.title}
          </span>
        </div>

        {/* Right: Headphone Support Button */}
        <button
          type="button"
          onClick={() => setShowSupportModal(true)}
          className="size-9 rounded-full bg-slate-50 hover:bg-teal-50 border border-slate-200 shadow-2xs flex items-center justify-center text-[#123B5D] hover:text-[#0F8B8D] active:scale-95 transition-all cursor-pointer"
          title={isUrdu ? "WorkerFIX سپورٹ" : "WorkerFIX 24/7 Support"}
        >
          <Headphones className="size-4.5" />
        </button>
      </header>

      {/* 2. Customer & Doorstep Verified Mini-Bar */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-[#123B5D] overflow-hidden shrink-0">
            {job.customer.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={job.customer.avatarUrl}
                alt={job.customer.name}
                className="size-full object-cover"
              />
            ) : (
              job.customer.name.slice(0, 2).toUpperCase()
            )}
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-center gap-1">
              <span className="text-xs font-extrabold text-slate-900 truncate">
                {job.customer.name}
              </span>
              <BadgeCheck className="size-3.5 text-emerald-600 shrink-0" />
            </div>
            <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
              {job.location.area}
            </p>
          </div>
        </div>

        {/* Quick Direct Call & Message */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowCallModal(true)}
            className="size-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 shadow-2xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Call Customer"
          >
            <Phone className="size-4 stroke-[2.2]" />
          </button>
          <button
            type="button"
            onClick={() => setShowChatModal(true)}
            className="size-9 rounded-full bg-slate-100 border border-slate-200 text-[#123B5D] hover:bg-[#123B5D] hover:text-white hover:border-[#123B5D] shadow-2xs flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Message Customer"
          >
            <MessageCircle className="size-4 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 mx-4 mt-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MAIN WORKFLOW CONTENT BODY */}
      {/* ======================================================== */}
      <main className="flex-1 p-4 space-y-4 pb-12 overflow-y-auto">
        {/* ======================================================== */}
        {/* MERGED STEP 4: INSTANT EARNINGS SETTLEMENT & CUSTOMER RATING */}
        {/* ======================================================== */}
        {isCompleted ? (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 text-center">
              <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50/60">
                <CheckCircle2 className="size-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">
                  {isUrdu ? "جاب کامیابی سے مکمل ہو گئی! 🎉" : "Job Completed & Settled! 🎉"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Payment settled and net earnings credited to your worker wallet.
                </p>
              </div>

              {/* Transparent Financial Settlement Breakdown */}
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 space-y-2 text-xs text-left">
                <div className="flex justify-between items-center text-emerald-950 font-bold">
                  <span>Gross Job Value:</span>
                  <span>{formatRs(grossJobValue)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 text-[11px]">
                  <span>Platform Commission (10%):</span>
                  <span className="text-red-600 font-bold">−{formatRs(platformFee)}</span>
                </div>
                <div className="border-t border-emerald-200 pt-2 flex justify-between items-center text-emerald-950 font-black text-sm">
                  <span>Net Credited to Wallet:</span>
                  <span className="text-base text-emerald-800 font-mono">+{formatRs(netEarnings)}</span>
                </div>
              </div>

              {/* Customer Rating Section */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Rate your experience with {job.customer.name}
                </span>
                <div className="flex justify-center gap-1.5 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCustomerRating(star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`size-6 ${
                          star <= customerRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Review Tags */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {["Polite & Cooperative", "Fast Payment", "Clear Directions", "Safe Environment"].map(
                    (tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleReviewTag(tag)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all cursor-pointer ${
                          selectedReviewTags.includes(tag)
                            ? "bg-[#123B5D] text-white border-[#123B5D]"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {tag}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Return CTA */}
              <button
                type="button"
                onClick={handleFinishAndExit}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] hover:opacity-95 active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-[#0F8B8D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isUrdu ? "جابز ہب پر واپس جائیں" : "Return to Jobs Hub"}</span>
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        ) : null}
        {/* ======================================================== */}
        {/* STEP 2: ON-SITE DIAGNOSTIC INSPECTION & QUOTATION */}
        {/* ======================================================== */}
        {isInspecting && (
          <form onSubmit={handleSubmitInspection} className="space-y-4 animate-in fade-in">
            {/* Header Context Card */}
            <div className="bg-gradient-to-br from-[#123B5D] to-[#0F8B8D] text-white p-4 rounded-3xl shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-teal-200">
                  {isUrdu ? "موقع پر معائنہ" : "On-Site Diagnostic"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                  {isUrdu ? "دہلیز کی تصدیق شدہ" : "Doorstep PIN Verified"}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-white leading-snug">
                {job.title}
              </h2>
              <div className="flex items-center justify-between pt-1 border-t border-white/20 text-xs">
                <span className="text-teal-100">{isUrdu ? "طے شدہ وزٹ فیس:" : "Agreed Visit Fee:"}</span>
                <span className="font-mono font-black text-white">{formatRs(agreedVisitCharge)}</span>
              </div>
            </div>

            {/* Diagnostic Form (Clean Direct Inputs) */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-4">
              {/* Field 1: Fault Diagnosis */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="size-4.5 rounded-md bg-teal-50 text-[#0F8B8D] text-[10px] font-black flex items-center justify-center">
                    1
                  </span>
                  <span>{isUrdu ? "خرابی کی تفصیل (Diagnosis)" : "Fault Diagnosis"}</span>
                </label>

                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-all placeholder:text-slate-400"
                  placeholder={isUrdu ? "خرابی کی تفصیل درج کریں..." : "Describe root cause of fault (e.g., burnt circuit breaker, loose wiring joint)..."}
                  required
                />
              </div>

              {/* Field 2: Repair Cost */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="size-4.5 rounded-md bg-teal-50 text-[#0F8B8D] text-[10px] font-black flex items-center justify-center">
                    2
                  </span>
                  <span>{isUrdu ? "مرمت لاگت (روپے)" : "Repair Cost (Rs.)"}</span>
                </label>
                <input
                  type="number"
                  value={repairPrice}
                  onChange={(e) => setRepairPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-[#123B5D] focus:bg-white focus:ring-2 focus:ring-[#0F8B8D] focus:outline-none transition-all placeholder:text-slate-400"
                  placeholder="1500"
                  required
                />
              </div>

              {/* Field 3: Fault Photo Evidence */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <span className="size-4.5 rounded-md bg-teal-50 text-[#0F8B8D] text-[10px] font-black flex items-center justify-center">
                      3
                    </span>
                    <span>{isUrdu ? "ثبوت فوٹو (On-Site Photo)" : "Fault Photo Evidence"}</span>
                  </label>
                  <span className="text-[10.5px] font-semibold text-slate-500">
                    {photos.length} {isUrdu ? "تصاویر" : photos.length === 1 ? "photo" : "photos"}
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                  id="fault-photo-upload"
                />

                {/* Grid of uploaded fault photos */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {photos.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100 shadow-2xs"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoUrl}
                        alt={`Fault evidence ${idx + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 size-6 rounded-full bg-slate-900/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                        title={isUrdu ? "حذف کریں" : "Remove photo"}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Add Photo Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-[#0F8B8D] bg-slate-50 hover:bg-teal-50/50 text-slate-500 hover:text-[#0F8B8D] transition-all cursor-pointer p-2"
                  >
                    <div className="size-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-2xs mb-1">
                      <Camera className="size-4 text-[#0F8B8D]" />
                    </div>
                    <span className="text-[10px] font-bold text-center leading-tight">
                      {isUrdu ? "فوٹو اپ لوڈ کریں" : "+ Upload Photo"}
                    </span>
                  </button>
                </div>

                <p className="text-[10.5px] text-slate-500 flex items-center gap-1 pt-0.5">
                  <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                  <span>
                    {isUrdu
                      ? "کسٹمر اور WorkerFIX سپورٹ اس فوٹو کو دیکھ سکتے ہیں۔"
                      : "Clear photos help customer approve quote instantly."}
                  </span>
                </p>
              </div>
            </div>

            {/* Total Quotation Summary */}
            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/90 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>{isUrdu ? "وزٹ فیس:" : "Agreed Visit Fee:"}</span>
                <span className="font-bold text-slate-800">{formatRs(agreedVisitCharge)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>{isUrdu ? "مرمت لاگت:" : "Proposed Repair Estimate:"}</span>
                <span className="font-bold text-slate-800">{formatRs(repairPrice)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-[#123B5D]">
                <span>{isUrdu ? "کل کسٹمر انوائس:" : "Total Job Value:"}</span>
                <span className="text-base text-[#0F8B8D]">
                  {formatRs(agreedVisitCharge + repairPrice)}
                </span>
              </div>
            </div>

            {/* Primary Submit CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] hover:opacity-95 active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-[#0F8B8D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isUrdu ? "کسٹمر کو کوٹیشن بھیجیں" : "Submit Quotation to Customer"}</span>
              <ArrowRight className="size-4" />
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 3: CUSTOMER DECISION & REPAIR EXECUTION */}
        {/* ======================================================== */}
        {isDecisionOrExecution && !isCompleted && (
          <div className="space-y-4 animate-in fade-in">
            {/* Status & Decision Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  {isAwaitingDecision ? (
                    <Clock className="size-4 text-amber-500 shrink-0 animate-spin" />
                  ) : isDeclined ? (
                    <XCircle className="size-4 text-red-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  )}
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                    {isAwaitingDecision
                      ? isUrdu
                        ? "کسٹمر منظوری کا انتظار..."
                        : "Quotation Sent — Awaiting Customer"
                      : isDeclined
                      ? isUrdu
                        ? "کسٹمر نے مرمت رد کر دی"
                        : "Customer Declined Repair"
                      : isInRepair
                      ? isUrdu
                        ? "مرمت کا کام جاری ہے"
                        : "Repair Work In Progress"
                      : isUrdu
                      ? "کوٹیشن منظور شدہ"
                      : "Quotation Approved"}
                  </h3>
                </div>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border shrink-0 ${
                    isAwaitingDecision
                      ? "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                      : isDeclined
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {isAwaitingDecision
                    ? isUrdu
                      ? "انتظار"
                      : "PENDING"
                    : isDeclined
                    ? isUrdu
                      ? "صرف وزٹ"
                      : "VISIT ONLY"
                    : isUrdu
                    ? "منظور شدہ"
                    : "APPROVED"}
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Diagnostic Visit Fee</span>
                  <span className="font-bold text-slate-900">{formatRs(agreedVisitCharge)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Repair Cost</span>
                  <span
                    className={`font-bold ${
                      isDeclined ? "line-through text-slate-400" : "text-slate-900"
                    }`}
                  >
                    {formatRs(repairPrice)} {isDeclined && "(Declined)"}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black text-[#123B5D]">
                  <span>Total Due</span>
                  <span className="text-base text-[#0F8B8D]">
                    {formatRs(grossJobValue)}
                  </span>
                </div>
              </div>

              {/* Message if Declined */}
              {isDeclined && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="size-4 text-amber-700 shrink-0" />
                    <span>Customer chose not to proceed with repair.</span>
                  </p>
                  <p className="text-[11px] text-amber-800">
                    You will receive the full agreed diagnostic visit fee of {formatRs(agreedVisitCharge)}.
                  </p>
                </div>
              )}

              {/* In-Repair Execution checklist */}
              {(isApproved || isInRepair) && (
                <div className="space-y-2.5 pt-1">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Repair Progress
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span>Distribution panel safely de-energized</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2
                        className={`size-4 shrink-0 ${
                          isInRepair ? "text-emerald-600" : "text-slate-300"
                        }`}
                      />
                      <span>Breaker replacement &amp; terminal torque</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700">
                      <CheckCircle2
                        className={`size-4 shrink-0 ${
                          isInRepair ? "text-emerald-600" : "text-slate-300"
                        }`}
                      />
                      <span>Circuit load test &amp; safety inspection</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Interactive Simulation Controls (For quick testing/demoing) */}
              {isAwaitingDecision && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Customer Response Simulator (Demo)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => workerStore.approveRepair(job.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <Check className="size-3.5" />
                      <span>Customer Accepts</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => workerStore.declineRepair(job.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <X className="size-3.5" />
                      <span>Customer Declines</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ACTION CTAs */}
            {isAwaitingDecision ? (
              <button
                type="button"
                disabled
                className="w-full py-4 rounded-2xl bg-slate-200 text-slate-400 font-extrabold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-not-allowed"
              >
                <Clock className="size-4 animate-spin" />
                <span>Waiting for Customer Approval...</span>
              </button>
            ) : isDeclined ? (
              <button
                type="button"
                onClick={handleSettleVisitOnlyJob}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] hover:opacity-95 active:scale-[0.99] text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="size-5 text-teal-300" />
                <span>{isUrdu ? "وزٹ فیس وصول کریں اور مکمل کریں" : `Settle Visit Fee (${formatRs(agreedVisitCharge)}) & Close Job`}</span>
              </button>
            ) : isApproved ? (
              <button
                type="button"
                onClick={handleStartRepair}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#123B5D] to-[#0F8B8D] hover:opacity-95 active:scale-[0.99] text-white font-extrabold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Wrench className="size-4 text-teal-200" />
                <span>{isUrdu ? "مرمت کا کام شروع کریں" : "Start Repair Work"}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCompleteRepairJob}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 active:scale-[0.99] text-white font-extrabold text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="size-5 text-white" />
                <span>{isUrdu ? "مرمت مکمل کریں اور ادائیگی وصول کریں" : "Complete Repair & Settle Invoice"}</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 4. AUXILIARY MODALS (Support, Call, and Cancel) */}
      {/* ======================================================== */}

      {/* 24/7 WorkerFIX Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center">
                  <Headphones className="size-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {isUrdu ? "WorkerFIX ہیلپ لائن" : "WorkerFIX Support"}
                  </h3>
                  <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    24/7 Priority Assistance
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Job Reference</span>
                <span className="text-xs font-mono font-bold text-[#123B5D]">#{job.id}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                <span className="text-xs text-slate-500 font-medium">Customer</span>
                <span className="text-xs font-bold text-slate-800">{job.customer.name}</span>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href="tel:0800-WORKERFIX"
                className="w-full py-3 px-4 rounded-xl bg-[#0F8B8D] hover:bg-[#0B7F74] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <PhoneCall className="size-4" />
                <span>{isUrdu ? "ہیلپ لائن پر کال کریں" : "Call Helpline (0800-WORKERFIX)"}</span>
              </a>

              <a
                href="https://wa.me/923000000000?text=Salam%20Hunar%20Support%2C%20I%20am%20a%20technician%20on%20job%20"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#123B5D] hover:bg-[#0E2E49] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <ShieldCheck className="size-4 text-teal-300" />
                <span>{isUrdu ? "واٹس ایپ سپورٹ" : "WhatsApp Dispatcher"}</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowSupportModal(false)}
              className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              {isUrdu ? "بند کریں" : "Close"}
            </button>
          </div>
        </div>
      )}

      {/* Direct Call Customer Modal */}
      {showCallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-teal-50 text-[#0F8B8D] flex items-center justify-center shrink-0">
                <Phone className="size-5 fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-900 text-base truncate">
                  Contact {job.customer.name}
                </h3>
                <p className="text-xs text-slate-500">{job.location.area}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                Direct Phone Line
              </span>
              <p className="text-lg font-mono font-bold text-[#123B5D]">
                {job.customer.phone}
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
              <a
                href={`tel:${job.customer.phone}`}
                className="flex-1 py-2.5 rounded-xl bg-[#0F8B8D] text-white text-xs font-bold text-center hover:bg-[#0B7F74] transition-colors"
              >
                Dial Now
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Visit Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleCancelSubmit}
            className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base">Cancel Visit</h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Are you sure you want to cancel this visit with {job.customer.name}?
            </p>

            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Reason for cancellation (optional)..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-400"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Confirm Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer-Matched Worker Chat Modal */}
      <WorkerChatModal
        job={job}
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        onCallCustomer={() => {
          setShowChatModal(false);
          setShowCallModal(true);
        }}
      />
    </div>
  );
}
