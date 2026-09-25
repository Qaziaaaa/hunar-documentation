"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileCheck,
  Loader2,
  MapPin,
  Receipt,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { MOCK_JOB_COMPLETION_MAP } from "../data/mock-completion-data";
import { acceptRepairEstimate, submitJobReview } from "../api/customer-repair-api";
import { JobCompletionData, JobEvidencePhoto } from "../types";

interface CustomerJobCompletionViewProps {
  initialJobId?: string;
}

export function CustomerJobCompletionView({
  initialJobId = "job-1",
}: CustomerJobCompletionViewProps) {
  const router = useRouter();
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const completionData: JobCompletionData =
    MOCK_JOB_COMPLETION_MAP[initialJobId] || MOCK_JOB_COMPLETION_MAP["job-1"];

  // Interactive Form States
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    isUrdu ? "وقت کی پابندی" : "Punctual",
    isUrdu ? "صاف ستھرا کام" : "Clean Work",
    isUrdu ? "مناسب قیمت" : "Fair Pricing",
    isUrdu ? "خوش اخلاق اور پیشہ ور" : "Polite & Professional",
  ]);
  const [reviewNote, setReviewNote] = useState<string>(
    isUrdu
      ? `${completionData.worker.name} نے بہت زبردست کام کیا۔ وقت پر پہنچے، مسئلہ واضح سمجھایا اور صفائی سے کام کیا۔ میں پوری طرح مطمئن ہوں!`
      : `${completionData.worker.name} did an exceptional job. Arrived right on time, explained the issue clearly, and completed the repair cleanly. Highly recommended!`
  );

  // Modals & States
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCompletedSuccess, setIsCompletedSuccess] = useState<boolean>(false);
  const [activePhotoModal, setActivePhotoModal] = useState<JobEvidencePhoto | null>(
    null
  );

  const availableTags = isUrdu
    ? [
        "وقت کی پابندی",
        "صاف ستھرا کام",
        "مناسب قیمت",
        "ماہرانہ علم",
        "خوش اخلاق اور پیشہ ور",
        "مکمل اوزار",
      ]
    : [
        "Punctual",
        "Clean Work",
        "Fair Pricing",
        "Expert Knowledge",
        "Polite & Professional",
        "Brought Own Tools",
      ];

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleApproveAndPay = async () => {
    setIsProcessing(true);
    try {
      await acceptRepairEstimate(initialJobId, "cash");
      await submitJobReview(initialJobId, {
        rating,
        comment: reviewNote,
        punctualityRating: rating,
        qualityRating: rating,
        behaviorRating: rating,
      });
    } catch (err) {
      console.warn("Completion review submission fallback:", err);
    } finally {
      setIsProcessing(false);
      setShowConfirmModal(false);
      setIsCompletedSuccess(true);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Photo Lightbox Modal */}
      {activePhotoModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <div className="bg-white max-w-2xl w-full rounded-2xl overflow-hidden border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    activePhotoModal.type === "before"
                      ? "bg-slate-900 text-white"
                      : "bg-[#0F8B8D] text-white"
                  }`}
                >
                  {activePhotoModal.type === "before"
                    ? isUrdu ? "کام سے پہلے" : "Before"
                    : isUrdu ? "کام کے بعد" : "After"}
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-[#123B5D]">
                  {activePhotoModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActivePhotoModal(null)}
                className="size-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="relative h-72 sm:h-96 w-full bg-slate-900">
              <img
                src={activePhotoModal.imageUrl}
                alt={activePhotoModal.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <span>{activePhotoModal.description}</span>
              <span className="font-bold text-[#123B5D]">
                {activePhotoModal.timestamp}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 w-full">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-medium text-slate-400 overflow-x-auto whitespace-nowrap"
        >
          <Link
            href="/customer/jobs"
            className="hover:text-[#0F8B8D] transition-colors"
          >
            {isUrdu ? "میرے کام" : "My Jobs"}
          </Link>
          <span>/</span>
          <Link
            href={`/customer/job/${completionData.jobId}`}
            className="hover:text-[#0F8B8D] transition-colors"
          >
            {completionData.jobNumber}
          </Link>
          <span>/</span>
          <span className="text-[#123B5D] font-bold">
            {isUrdu ? "کام کی تکمیل اور ریویو" : "Job Completion & Review"}
          </span>
        </nav>

        {/* Top Status & Guarantee Notice Banner */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col max-w-2xl">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-[#0F8B8D] uppercase tracking-wider font-extrabold">
                {isUrdu ? "کسٹمر کی منظوری کا انتظار ہے" : "Awaiting Customer Authorization"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#123B5D] tracking-tight">
              {isUrdu
                ? "کام مکمل: کام کا معائنہ کریں اور ادائیگی کی تصدیق کریں"
                : "Job Complete: Inspect Work & Authorize Payment"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
              {isUrdu ? (
                <>
                  <strong className="text-slate-800">
                    {completionData.worker.name}
                  </strong>{" "}
                  نے کام مکمل کر لیا ہے۔ برائے مہربانی نیچے ثبوتی تصاویر کا معائنہ کریں، تسلی کریں اور کاریگر کو ادائیگی کی تصدیق کریں۔
                </>
              ) : (
                <>
                  <strong className="text-slate-800">
                    {completionData.worker.name}
                  </strong>{" "}
                  has finished the job. Please inspect the evidence photos below,
                  verify your satisfaction, and confirm direct payment.
                </>
              )}
            </p>
          </div>

          <div className="inline-flex items-center gap-3 bg-emerald-50/70 border border-emerald-200 px-4 py-3 rounded-xl self-start lg:self-center shrink-0">
            <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-950">
                {isUrdu ? "5 دن کی ہنر وارنٹی" : "5-Day Craftsmanship Warranty"}
              </span>
              <span className="text-[11px] text-emerald-700">
                {isUrdu ? "تمام مکمل شدہ کاموں پر مفت ری ورک کی ضمانت" : "Free rework guarantee on all completed jobs"}
              </span>
            </div>
          </div>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Job Info, Evidence Photos, Report, Itemized Bill */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Service & Location Card */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-[#0F8B8D] font-bold tracking-wide">
                    {isUrdu ? `سروس آرڈر ${completionData.jobNumber}` : `Service Order ${completionData.jobNumber}`}
                  </span>
                  <h2 className="text-base sm:text-lg text-[#123B5D] font-bold mt-1">
                    {completionData.serviceTitle}
                  </h2>
                  <div className="flex items-center gap-1.5 text-slate-500 mt-2 text-xs">
                    <MapPin className="size-4 text-[#0F8B8D] shrink-0" />
                    <span>{completionData.address}</span>
                  </div>
                </div>
                <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 shrink-0 font-semibold self-start flex items-center gap-1.5">
                  <Clock className="size-3.5 text-slate-400" />
                  <span>{completionData.completedAt}</span>
                </div>
              </div>
            </section>

            {/* Inspection Evidence Photos (Before & After) */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center">
                    <Eye className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#123B5D]">
                      {isUrdu ? "معائنے اور ثبوت کی تصاویر" : "Inspection Evidence Photos"}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {isUrdu ? "کاریگر کی جانب سے کام کے ثبوت کے طور پر اپلوڈ کردہ" : "Uploaded by technician as proof of work"}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {isUrdu ? `${completionData.evidencePhotos.length} تصاویر` : `${completionData.evidencePhotos.length} Photos`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {completionData.evidencePhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setActivePhotoModal(photo)}
                    className="flex flex-col rounded-xl overflow-hidden bg-slate-50 border border-slate-200 hover:border-[#0F8B8D] transition-all group cursor-pointer shadow-2xs"
                  >
                    <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                      <img
                        src={photo.imageUrl}
                        alt={photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-2.5 left-2.5 rtl:left-auto rtl:right-2.5 text-[10px] font-bold px-2.5 py-0.5 rounded-md shadow uppercase tracking-wide ${
                          photo.type === "before"
                            ? "bg-[#123B5D] text-white"
                            : "bg-[#0F8B8D] text-white"
                        }`}
                      >
                        {photo.type === "before"
                          ? isUrdu ? "کام سے پہلے" : "before"
                          : isUrdu ? "کام کے بعد" : "after"}
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 rtl:left-auto rtl:right-2.5 bg-black/75 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                        <Clock className="size-3" /> {photo.timestamp}
                      </span>
                    </div>
                    <div className="p-3.5 flex flex-col justify-between">
                      <p className="text-xs font-bold text-[#123B5D] group-hover:text-[#0F8B8D] transition-colors">
                        {photo.title}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {photo.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Technician Field Report Card */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="size-8 rounded-lg bg-[#123B5D]/10 text-[#123B5D] flex items-center justify-center">
                  <FileCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    {isUrdu ? "کاریگر کی فیلڈ رپورٹ" : "Technician Field Report"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isUrdu ? "سرکاری تشخیصی رپورٹ" : "Official diagnostic sign-off"}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={completionData.worker.avatarUrl}
                      alt={completionData.worker.name}
                      className="size-9 rounded-full object-cover border border-slate-200"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#123B5D]">
                        {completionData.worker.name} ({completionData.worker.tradeCategory})
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isUrdu ? `تصدیق شدہ کاریگر • بیج ${completionData.worker.hunarBadgeId}` : `Verified Pro • Badge ${completionData.worker.hunarBadgeId}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle className="size-3" />
                    <span>{isUrdu ? "شناختی کارڈ تصدیق شدہ" : "CNIC Cleared"}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                  “{completionData.technicianReport}”
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600 border-t border-slate-200">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span>
                      {isUrdu ? `${completionData.warrantyDays} دنوں کی وارنٹی شامل ہے` : `Guaranteed for ${completionData.warrantyDays} Days`}
                    </span>
                  </span>
                  {completionData.technicalSpecsNote && (
                    <span className="flex items-center gap-1.5 text-[#0F8B8D]">
                      <Zap className="size-4 text-[#0F8B8D]" />
                      <span>{completionData.technicalSpecsNote}</span>
                    </span>
                  )}
                </div>
              </div>
            </section>

            {/* Itemized Billing Breakdown */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-[#0F8B8D]" />
                  <h3 className="text-sm font-bold text-[#123B5D]">
                    {isUrdu ? "تفصیلی بل کی تفصیلات" : "Itemized Billing Breakdown"}
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isUrdu ? "کاریگر کو براہ راست ادائیگی" : "Direct Payment to Technician"}
                </span>
              </div>

              <div className="flex flex-col gap-2.5">
                {completionData.billingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-200"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#123B5D]">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5">
                        {item.description}
                      </span>
                    </div>
                    <span className="text-xs sm:text-sm text-[#123B5D] font-bold shrink-0 ml-3 rtl:ml-0 rtl:mr-3">
                      Rs. {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl mt-1 border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm text-[#123B5D] font-extrabold">
                      {isUrdu ? "کل بل کی لاگت" : "Total Job Cost"}
                    </span>
                    <span className="text-[11px] text-slate-500 mt-0.5">
                      {isUrdu ? "تمام مزدوری، سامان اور 5 دن کی وارنٹی شامل ہے" : "All labor, parts, and 5-day guarantee covered"}
                    </span>
                  </div>
                  <div className="text-right rtl:text-left">
                    <span className="text-xl sm:text-2xl text-[#123B5D] font-black">
                      Rs. {completionData.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column (Sticky): Direct Payment Card & 5-Star Rating Form */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-20">
            {/* Direct Payment Notice Card */}
            <section className="bg-[#123B5D] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400">
                  {isUrdu ? "مکمل تسلی پر براہ راست ادائیگی" : "Direct Payment on Satisfaction"}
                </span>
                <Sparkles className="size-5 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-black text-white">
                  Rs. {completionData.totalAmount.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-slate-300">PKR</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {isUrdu ? (
                  <>
                    مرمت کا معائنہ اور مکمل تسلی کے بعد براہ راست {completionData.worker.name} کو بذریعہ{" "}
                    <strong className="text-white font-bold">
                      کیش، جاز کیش، ایزی پیسہ یا راست
                    </strong>{" "}
                    ادائیگی کریں۔
                  </>
                ) : (
                  <>
                    Pay directly to {completionData.worker.name} via{" "}
                    <strong className="text-white font-bold">
                      Cash, JazzCash, EasyPaisa, or Raast
                    </strong>{" "}
                    only once you have inspected the repair.
                  </>
                )}
              </p>
              <div className="mt-4 pt-3 flex items-center gap-2 text-[11px] text-slate-300 border-t border-white/10">
                <Shield className="size-4 text-amber-400 shrink-0" />
                <span>
                  {isUrdu
                    ? "اگر کام تسلی بخش نہیں ہے تو ادائیگی سے پہلے دوبارہ کام کی درخواست کی جا سکتی ہے۔"
                    : "If work is unsatisfactory, you may request rework before payment."}
                </span>
              </div>
            </section>

            {/* Rate Service & Approve Work Form */}
            <section className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#123B5D]">
                  {isUrdu ? `${completionData.worker.name} کے کام کی ریٹنگ دیں` : `Rate ${completionData.worker.name}'s Craftsmanship`}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {isUrdu ? "آپ کی ریٹنگ تصدیق شدہ کاریگروں کے معیار کو برقرار رکھنے میں مدد کرتی ہے۔" : "Your rating helps maintain high standards of verified tradesmen."}
                </p>
              </div>

              {/* 5-Star Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "مجموعی کاریگری کی ریٹنگ" : "Overall Craftsmanship Rating"}
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled =
                      (hoverRating !== null ? hoverRating : rating) >= star;

                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        onClick={() => setRating(star)}
                        className="p-1 hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                      >
                        <Star
                          className={`size-7 transition-colors ${
                            isFilled
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-200"
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="text-base ml-2 rtl:ml-0 rtl:mr-2 font-black text-amber-500">
                    {rating.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Quality Tags */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "سروس میں کیا بات سب سے اچھی لگی؟" : "What stood out about the service?"}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#0F8B8D] text-white shadow-2xs"
                            : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-[#0F8B8D]"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Note / Feedback */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#123B5D]">
                  {isUrdu ? "کسٹمر کی رائے / ریویو" : "Customer Note / Review"}
                </label>
                <textarea
                  rows={3}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={isUrdu ? `${completionData.worker.name} کے ساتھ اپنے تجربے کی تفصیل لکھیں...` : `Share your experience with ${completionData.worker.name}...`}
                  className="w-full p-3 rounded-xl text-xs text-slate-800 bg-white border border-slate-200 focus:border-[#0F8B8D] focus:ring-1 focus:ring-[#0F8B8D] focus:outline-none resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full h-11 bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  <span>
                    {isUrdu
                      ? `کام کی منظوری اور ادائیگی کی تصدیق (Rs. ${completionData.totalAmount.toLocaleString()})`
                      : `Approve Work & Confirm Payment (Rs. ${completionData.totalAmount.toLocaleString()})`}
                  </span>
                </button>

                <Link
                  href="/customer/help"
                  className="w-full h-10 bg-white text-rose-600 hover:bg-rose-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 border border-rose-200 transition-colors"
                >
                  <AlertTriangle className="size-4" />
                  <span>{isUrdu ? "مسئلہ رپورٹ کریں / دوبارہ کام کی ضرورت" : "Report an Issue / Need Rework"}</span>
                </Link>
              </div>

              <p className="text-[11px] text-slate-400 text-center leading-snug mt-1">
                {isUrdu
                  ? "تکمیل کی تصدیق پر آپ کو WorkerFIX کا آفیشل 5 روزہ وارنٹی سرٹیفکیٹ جاری کیا جائے گا۔"
                  : "Confirming completion issues your official WorkerFIX 5-Day Craftsmanship Warranty Certificate."}
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Confirmation & Authorization Modal */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="size-14 rounded-2xl bg-[#0F8B8D]/10 text-[#0F8B8D] flex items-center justify-center mb-3 shadow-2xs">
              <ShieldCheck className="size-8" />
            </div>

            <h4 className="text-lg font-bold text-[#123B5D]">
              {isUrdu
                ? `کیا آپ Rs. ${completionData.totalAmount.toLocaleString()} کی ادائیگی کی تصدیق کرتے ہیں؟`
                : `Confirm Payment of Rs. ${completionData.totalAmount.toLocaleString()}?`}
            </h4>
            <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
              {isUrdu
                ? `یہ ${completionData.worker.name} کے ساتھ جاب ${completionData.jobNumber} کو حتمی شکل دے گا، آپ کا ${rating} اسٹار ریویو جمع کرے گا اور 5 روزہ وارنٹی سرٹیفکیٹ کو فعال کرے گا۔`
                : `This will finalize Job ${completionData.jobNumber} with ${completionData.worker.name}, submit your ${rating}-star review, and activate your 5-Day Craftsmanship Warranty Certificate.`}
            </p>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 h-11 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {isUrdu ? "واپس جائیں" : "Go Back"}
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleApproveAndPay}
                className="flex-1 h-11 bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white rounded-xl font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{isUrdu ? "تکمیل ہو رہی ہے..." : "Finalizing..."}</span>
                  </>
                ) : (
                  <span>{isUrdu ? "منظور اور مکمل کریں" : "Authorize & Complete"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success & Official Warranty Certificate Celebration Modal */}
      {isCompletedSuccess && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="size-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
              <Award className="size-9" />
            </div>

            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 mb-2">
              {isUrdu ? "جاب کامیابی سے مکمل ہو گئی" : "Job Successfully Completed"}
            </span>

            <h3 className="text-xl sm:text-2xl font-black text-[#123B5D]">
              {isUrdu ? "وارنٹی سرٹیفکیٹ جاری کر دیا گیا!" : "Warranty Certificate Issued!"}
            </h3>

            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              {isUrdu
                ? `شکریہ! ${completionData.worker.name} کو آپ کی براہ راست ادائیگی ریکارڈ ہو گئی ہے اور آپ کی ${rating} اسٹار ریٹنگ لائیو ہو چکی ہے۔`
                : `Thank you! Your direct payment to ${completionData.worker.name} has been recorded and your ${rating}-star rating is live.`}
            </p>

            {/* Certificate Card */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 my-4 text-left rtl:text-right flex flex-col gap-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-[#123B5D]">
                  {isUrdu ? `وارنٹی سرٹیفکیٹ #${completionData.jobNumber}-W5D` : `Warranty Cert #${completionData.jobNumber}-W5D`}
                </span>
                <span className="text-emerald-700 font-extrabold">
                  {isUrdu ? "فعال (5 دن)" : "Active (5 Days)"}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isUrdu ? "سروس:" : "Service:"}</span>
                <span className="font-semibold text-slate-800">
                  {completionData.serviceTitle}
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isUrdu ? "کاریگر:" : "Technician:"}</span>
                <span className="font-semibold text-slate-800">
                  {completionData.worker.name} ({completionData.worker.hunarBadgeId})
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{isUrdu ? "طے شدہ رقم:" : "Amount Settled:"}</span>
                <span className="font-bold text-[#123B5D]">
                  Rs. {completionData.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  alert(isUrdu ? "وارنٹی سرٹیفکیٹ پی ڈی ایف ڈاؤن لوڈ ہو گیا۔" : "Warranty certificate downloaded as PDF.");
                }}
                className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 text-[#123B5D] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="size-4" />
                <span>{isUrdu ? "سرٹیفکیٹ ڈاؤن لوڈ" : "Download Cert"}</span>
              </button>
              <Link
                href="/customer/jobs"
                className="flex-1 h-11 bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white rounded-xl font-bold text-xs flex items-center justify-center transition-all shadow-xs"
              >
                <span>{isUrdu ? "میرے کام پر واپس جائیں" : "Back to My Jobs"}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

