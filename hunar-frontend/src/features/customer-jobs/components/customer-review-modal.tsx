"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import {
  Star,
  X,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ThumbsUp,
} from "lucide-react";
import { submitJobReview } from "../api/customer-repair-api";
import type { CustomerJob } from "../types";

interface CustomerReviewModalProps {
  job: CustomerJob;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmitted: (review: { rating: number; comment?: string }) => void;
}

const QUICK_TAGS_EN = [
  "Punctual & On Time",
  "Professional Conduct",
  "High Quality Work",
  "Cleaned Worksite",
  "Fair & Honest",
  "Expert Diagnosis",
];

const QUICK_TAGS_UR = [
  "وقت کی پابندی",
  "پیشہ ورانہ انداز",
  "شاندار معیار",
  "صفائی کا خیال",
  "دیانتدار کاریگر",
  "درست تشخیص",
];

export function CustomerReviewModal({
  job,
  isOpen,
  onClose,
  onReviewSubmitted,
}: CustomerReviewModalProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const quickTags = isUrdu ? QUICK_TAGS_UR : QUICK_TAGS_EN;
  const worker = job.selectedOffer?.worker;
  const workerName = worker?.name || (isUrdu ? "کاریگر" : "Technician");
  const activeRating = hoverRating ?? rating;

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 1:
        return isUrdu ? "غیر تسلی بخش (1/5)" : "Poor Service (1/5)";
      case 2:
        return isUrdu ? "مناسب (2/5)" : "Fair Service (2/5)";
      case 3:
        return isUrdu ? "اچھا (3/5)" : "Good Service (3/5)";
      case 4:
        return isUrdu ? "بہت اچھا (4/5)" : "Very Good (4/5)";
      case 5:
        return isUrdu ? "بہترین اور شاندار (5/5)" : "Exceptional & Highly Recommended (5/5)";
      default:
        return "";
    }
  };

  const handleToggleTag = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    const newTags = isSelected
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);

    // If text area doesn't have custom long comment, auto-populate from tags
    if (newTags.length > 0 && comment.trim().length < 30) {
      const summaryPrefix = isUrdu
        ? "کاریگر کے بارے میں تاثرات: "
        : "Positive Highlights: ";
      setComment(`${summaryPrefix}${newTags.join(", ")}.`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedComment = comment.trim();
    if (trimmedComment.length > 0 && trimmedComment.length < 10) {
      setErrorMessage(
        isUrdu
          ? "تبصرہ کم از کم 10 حروف پر مشتمل ہونا چاہیے یا خالی چھوڑ دیں۔"
          : "Feedback comment must be at least 10 characters long, or left blank."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await submitJobReview(job.id, {
        rating,
        comment: trimmedComment.length >= 10 ? trimmedComment : undefined,
      });

      setIsSuccess(true);
      setTimeout(() => {
        onReviewSubmitted({
          rating,
          comment: trimmedComment.length >= 10 ? trimmedComment : undefined,
        });
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error("[CustomerReviewModal] Review submission failed:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        (isUrdu
          ? "ریویو محفوظ کرنے میں مسئلہ پیش آیا۔ براہِ کرم دوبارہ کوشش کریں۔"
          : "Could not submit review. Please check your connection and try again.");
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-[#1A1A2E] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Star className="size-6 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-[#123B5D]">
                {isUrdu ? "کاریگر کی کارکردگی کا جائزہ لیں" : "Rate & Review Service"}
              </h3>
              <p className="text-xs text-slate-500">
                {isUrdu
                  ? "آپ کی دیانتدارانہ رائے سے دوسرے صارفین کو مدد ملتی ہے"
                  : "Help others by sharing your honest experience"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 sm:p-10 text-center space-y-4 animate-in zoom-in-95">
            <div className="size-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="size-9" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-extrabold text-[#123B5D]">
                {isUrdu ? "بہت شکریہ! آپ کا ریویو درج ہو گیا ہے" : "Thank you! Review Submitted"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isUrdu
                  ? "آپ کی تصدیق اور ریٹنگ سے کاریگر کے پروفائل کو اپ ڈیٹ کر دیا گیا ہے۔"
                  : "Your rating and verified feedback have been recorded on the technician's profile."}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
            {/* Worker Mini Profile Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-11 rounded-xl overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      worker?.avatarUrl ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        workerName
                      )}&background=0F766E&color=fff`
                    }
                    alt={workerName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#123B5D] truncate">
                    {workerName}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {job.category} • {job.title}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold shrink-0">
                <ShieldCheck className="size-3.5" />
                <span>{isUrdu ? "مکمل سروس" : "Completed"}</span>
              </div>
            </div>

            {/* Star Selector */}
            <div className="text-center space-y-2 py-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                {isUrdu ? "مجموعی اطمینان کی درجہ بندی" : "Overall Satisfaction"}
              </span>

              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeRating;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1.5 transition-transform hover:scale-125 focus:outline-hidden cursor-pointer"
                      aria-label={`${starVal} Star`}
                    >
                      <Star
                        className={`size-8 sm:size-9 transition-colors ${
                          isFilled
                            ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                            : "fill-slate-100 text-slate-300"
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="h-5 flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-[#0F766E]">
                  {getRatingLabel(activeRating)}
                </span>
              </div>
            </div>

            {/* Quick Compliment Tags */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#123B5D] flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-amber-500" />
                <span>{isUrdu ? "کیا بات سب سے اچھی لگی؟" : "What went well?"}</span>
              </label>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {quickTags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleToggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#0F766E] text-white border-[#0F766E] shadow-2xs font-semibold"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Written Review Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label
                  htmlFor="customer-review-comment"
                  className="font-bold text-[#123B5D]"
                >
                  {isUrdu ? "تفصیلی رائے (اختیاری)" : "Written Feedback (Optional)"}
                </label>
                <span
                  className={`text-[11px] ${
                    comment.trim().length > 0 && comment.trim().length < 10
                      ? "text-rose-500 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {comment.length} / 500{" "}
                  {comment.trim().length > 0 && comment.trim().length < 10
                    ? isUrdu
                      ? "(کم از کم 10 حروف)"
                      : "(min 10 chars)"
                    : ""}
                </span>
              </div>
              <textarea
                id="customer-review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={
                  isUrdu
                    ? "کاریگر کے کام کی صفائی، مہارت اور وقت کی پابندی کے بارے میں بتائیں..."
                    : "Share how the technician handled the repair, punctuality, and craft..."
                }
                className="w-full rounded-2xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0F766E]/20 focus:border-[#0F766E] transition-all resize-none"
              />
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit & Cancel Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {isUrdu ? "بعد میں" : "Skip / Later"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#0F766E] hover:bg-[#115E59] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{isUrdu ? "جمع ہو رہا ہے..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <ThumbsUp className="size-4" />
                    <span>{isUrdu ? "ریویو جمع کروائیں" : "Submit Review"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
