"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Edit2,
  Image as ImageIcon,
  Layers,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useLocale } from "next-intl";
import {
  CATEGORY_OPTIONS,
  createCustomCategoryOption,
  resolveCategoryOption,
} from "../data/categories";
import type { PostJobData } from "../types";
import {
  fetchServiceCategories,
  type BackendCategory,
} from "../api/post-job-api";
import { VoiceNoteRecorder } from "./voice-note-recorder";
import { compressImage } from "@/lib/image-compression";

interface Step2JobDetailsProps {
  data: PostJobData;
  onChange: (updates: Partial<PostJobData>) => void;
  onNext: () => void;
  onBack: () => void;
  backendCategories?: BackendCategory[];
}

const MAX_PHOTOS = 3;

export function Step2JobDetails({
  data,
  onChange,
  onNext,
  onBack,
  backendCategories: propBackendCategories,
}: Step2JobDetailsProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const hasText = Boolean(data.description.trim());
  const hasVoice = Boolean(data.voiceNoteUrl);
  const hasExplanation = hasText || hasVoice;

  const [internalCategories, setInternalCategories] = useState<BackendCategory[]>([]);

  useEffect(() => {
    if (propBackendCategories !== undefined) return;
    let mounted = true;
    fetchServiceCategories().then((cats) => {
      if (mounted && Array.isArray(cats)) {
        setInternalCategories(cats);
      }
    });
    return () => {
      mounted = false;
    };
  }, [propBackendCategories]);

  const backendCategories =
    propBackendCategories && propBackendCategories.length > 0
      ? propBackendCategories
      : internalCategories;

  const selectedCategory =
    CATEGORY_OPTIONS.find((c) => c.id === data.category) ||
    resolveCategoryOption(data.category) ||
    (data.category
      ? createCustomCategoryOption(data.category, data.title || data.category)
      : undefined);
  const Icon = selectedCategory?.icon || Layers;

  const liveCategory = useMemo(() => {
    if (!backendCategories?.length || !data.category) return null;
    const catId = data.category.toLowerCase().trim();

    return (
      backendCategories.find((b) => {
        const bId = b.id.toLowerCase();
        const bName = b.name.toLowerCase();
        return (
          bId === catId ||
          bName === catId ||
          bName.replace(/[^a-z0-9]/g, "") === catId.replace(/[^a-z0-9]/g, "")
        );
      }) ?? null
    );
  }, [backendCategories, data.category]);

  const commonIssues = useMemo(() => {
    const raw = liveCategory?.commonIssues ?? selectedCategory?.commonIssues;
    if (Array.isArray(raw)) {
      return raw.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      );
    }
    return [];
  }, [liveCategory, selectedCategory]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressing(true);
    try {
      const newPhotos: string[] = [...data.photos];
      for (let i = 0; i < files.length; i++) {
        if (newPhotos.length >= MAX_PHOTOS) break;
        const file = files[i];
        // Downscale & compress to ~150KB before creating persistent data URL
        const compressedBlob = await compressImage(file, {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.8,
        });
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
        newPhotos.push(dataUrl);
      }
      onChange({ photos: newPhotos });
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    const updated = data.photos.filter((_, i) => i !== index);
    onChange({ photos: updated });
  };

  const handleProceed = () => {
    if (!data.title.trim()) {
      setError(isUrdu ? "برائے مہربانی کام کا عنوان درج کریں۔" : "Please provide a title for the job request.");
      return;
    }
    if (!data.description.trim() && !data.voiceNoteUrl) {
      setError(
        isUrdu
          ? "برائے مہربانی کام کی تفصیلی وضاحت درج کریں یا وائس نوٹ ریکارڈ کریں۔"
          : "Please provide a brief description or record a voice note."
      );
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="w-full max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto space-y-4 lg:space-y-5 animate-in fade-in-50 duration-300 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D]">
          {isUrdu ? "کام کی تفصیل بیان کریں" : "Describe the job"}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
          {isUrdu ? "کاریگر کو اپنے مسئلے کے بارے میں بتائیں تاکہ وہ درست اندازہ لگا سکے" : "Tell the pro what needs fixing or installing for accurate estimates"}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          {error}
        </div>
      )}


      {/* Main Two-Column Desktop / Single-Column Mobile Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-start">
        {/* Left Column: Job Details */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          {/* Selected Category Header Banner */}
          {selectedCategory && (
            <div className="flex items-center p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${selectedCategory.iconBg} ${selectedCategory.iconColor}`}
                >
                  <Icon className="size-5 stroke-[2.2]" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-[#123B5D]">
                    {isUrdu ? selectedCategory.urduName : selectedCategory.name}
                  </span>
                  <button
                    type="button"
                    onClick={onBack}
                    className="text-[11px] font-bold text-[#0F8B8D] hover:underline inline-flex items-center gap-1 cursor-pointer bg-white hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md transition-colors"
                  >
                    <Edit2 className="size-2.5" />
                    <span>{isUrdu ? "سروس تبدیل کریں" : "Change Service"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Inputs */}
          <div className="space-y-4 pt-1">
            {/* Common Issues from Admin Category */}
            {commonIssues.length > 0 && (
              <div className="space-y-2 pb-1">
                <label className="text-xs sm:text-sm font-extrabold text-[#123B5D] flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#0F8B8D]" />
                  <span>
                    {isUrdu ? "عام مسائل (عنوان منتخب کریں)" : "Common Issues (Select to fill title)"}
                  </span>
                </label>

                {/* Single line slide track */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none no-scrollbar scroll-smooth">
                  {commonIssues.map((issue, idx) => {
                    const isSelected =
                      data.title.trim().toLowerCase() === issue.trim().toLowerCase();
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setError(null);
                          onChange({ title: issue });
                        }}
                        className={`shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 select-none active:scale-95 ${
                          isSelected
                            ? "bg-[#0F8B8D] text-white border-[#0F8B8D] shadow-xs scale-[1.02]"
                            : "bg-slate-50 hover:bg-teal-50/70 text-slate-700 hover:text-[#0F8B8D] border-slate-200 hover:border-[#0F8B8D]/40"
                        }`}
                      >
                        {isSelected && <Check className="size-3.5 stroke-[3]" />}
                        <span>{issue}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="job-title-field"
                className="block text-sm sm:text-base font-extrabold text-[#123B5D] mb-1.5"
              >
                {isUrdu ? "کام کا عنوان" : "Job Title"} <span className="text-red-500">*</span>
              </label>
              <input
                id="job-title-field"
                name="jobTitle"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-lpignore="true"
                data-form-type="other"
                value={data.title}
                onChange={(e) => {
                  setError(null);
                  onChange({ title: e.target.value });
                }}
                placeholder={
                  isUrdu
                    ? "مثلاً: اے سی کولنگ نہیں کر رہا یا پائپ لیک"
                    : "e.g. AC not cooling or leaking pipe"
                }
                className="w-full h-11 px-3.5 rounded-xl bg-slate-50/70 border border-slate-200 text-sm text-[#123B5D] font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 transition-all outline-none"
              />
            </div>

            {/* Job Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="job-description"
                  className="block text-sm sm:text-base font-extrabold text-[#123B5D]"
                >
                  {isUrdu ? "تفصیلی وضاحت" : "Detailed Description"}{" "}
                  {hasVoice ? (
                    <span className="text-xs font-semibold text-emerald-600">
                      ({isUrdu ? "اختیاری — وائس نوٹ منسلک ہے ✓" : "Optional — Voice note attached ✓"})
                    </span>
                  ) : hasText ? (
                    <span className="text-xs font-semibold text-emerald-600">
                      (✓ {isUrdu ? "مکمل ہے" : "Complete"})
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700">
                      <span className="text-red-500">*</span>{" "}
                      ({isUrdu ? "تفصیل یا وائس نوٹ درکار ہے" : "Text or voice note required"})
                    </span>
                  )}
                </label>
                <span className="text-xs text-slate-600 font-bold" suppressHydrationWarning>
                  {data.description.length} / 1000
                </span>
              </div>
              <textarea
                id="job-description"
                rows={4}
                value={data.description}
                onChange={(e) => {
                  setError(null);
                  onChange({ description: e.target.value });
                }}
                placeholder={
                  isUrdu
                    ? "مسئلے اور مطلوبہ کام کی مختصر تفصیل بیان کریں..."
                    : "Describe the issue, symptoms, or work required..."
                }
                className="w-full p-3.5 rounded-xl bg-slate-50/70 border border-slate-200 text-sm text-[#123B5D] font-medium placeholder:text-slate-400 focus:bg-white focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 transition-all outline-none resize-none"
              />
              <div className="flex justify-between items-center text-[11px] text-slate-600 font-medium mt-1">
                <span>{isUrdu ? "ماڈل یا فلور نمبر کی وضاحت کریں" : "Mention any specific brand, model, or floor number"}</span>
                {data.description.length > 0 && data.description.length < 30 ? (
                  <span className="text-amber-700 font-bold">
                    {isUrdu ? "مزید تفصیل شامل کرنے سے درست اندازہ ملتا ہے" : "Adding more details helps pros quote accurately"}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Media Section */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#123B5D]">
              {isUrdu ? "تصاویر اور وائس نوٹ" : "Photos & Voice Note"}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isUrdu
                ? "تصویر یا آواز سے کاریگر کو مسئلہ بہتر سمجھ آتا ہے"
                : "Photos or a voice note help pros diagnose accurately"}
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Image Upload Dropzone */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:p-4 flex flex-col justify-between min-h-[140px] group transition-all">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {isCompressing ? (
                <div className="flex flex-col items-center justify-center text-center py-5 space-y-2">
                  <span className="size-6 rounded-full border-2 border-teal border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-teal">
                    {isUrdu ? "تصاویر کا سائز بہتر بنایا جا رہا ہے..." : "Optimizing photos..."}
                  </span>
                </div>
              ) : data.photos.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center text-center cursor-pointer py-3 space-y-1.5"
                >
                  <div className="size-9 sm:size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0F8B8D] group-hover:bg-[#0F8B8D]/10 transition-colors shadow-2xs">
                    <Upload className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0F8B8D]">
                      {isUrdu ? "تصاویر اپلوڈ کریں" : "Upload Photos"}
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                      {isUrdu ? `اختیاری · زیادہ سے زیادہ ${MAX_PHOTOS} تصاویر` : `Optional · PNG, JPG up to ${MAX_PHOTOS} photos`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {isUrdu ? `منسلک تصاویر (اختیاری - ${data.photos.length}/${MAX_PHOTOS})` : `Photos (Optional - ${data.photos.length}/${MAX_PHOTOS})`}
                    </span>
                    {data.photos.length < MAX_PHOTOS && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-[#0F8B8D] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="size-3" />
                        <span>{isUrdu ? "مزید شامل کریں" : "Add more"}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                    {data.photos.map((url, index) => (
                      <div
                        key={index}
                        className="relative size-12 sm:size-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 group/img"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Job photo ${index + 1}`}
                          className="size-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice Note Recorder */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:p-4 min-h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-extrabold text-[#123B5D]">
                  {isUrdu ? "وائس نوٹ" : "Voice Note"}
                </span>
                {hasVoice ? (
                  <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    ✓ {isUrdu ? "منسلک ہے" : "Recorded"}
                  </span>
                ) : hasText ? (
                  <span className="text-[10.5px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                    {isUrdu ? "اختیاری (تفصیل درج ہے)" : "Optional (Text provided)"}
                  </span>
                ) : (
                  <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    {isUrdu ? "تفصیل یا وائس نوٹ درکار ہے *" : "Voice or Text required *"}
                  </span>
                )}
              </div>
              <VoiceNoteRecorder
                voiceNoteUrl={data.voiceNoteUrl}
                duration={data.voiceNoteDuration}
                onAudioRecorded={(url, duration) =>
                  onChange({
                    voiceNoteUrl: url,
                    voiceNoteDuration: duration,
                  })
                }
                onRemove={() =>
                  onChange({
                    voiceNoteUrl: undefined,
                    voiceNoteDuration: undefined,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3 sm:py-3.5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 sm:px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{isUrdu ? "واپس" : "Back"}</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            className="px-5 sm:px-6 py-2.5 rounded-full bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{isUrdu ? "وقت اور مقام کی طرف بڑھیں" : "Continue to Schedule"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
