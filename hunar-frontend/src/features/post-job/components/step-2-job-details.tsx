"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Edit2,
  Image as ImageIcon,
  Layers,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useLocale } from "next-intl";
import { CATEGORY_OPTIONS } from "../data/categories";
import type { PostJobData } from "../types";
import { VoiceNoteRecorder } from "./voice-note-recorder";

interface Step2JobDetailsProps {
  data: PostJobData;
  onChange: (updates: Partial<PostJobData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2JobDetails({
  data,
  onChange,
  onNext,
  onBack,
}: Step2JobDetailsProps) {
  const locale = useLocale();
  const isUrdu = locale === "ur";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = CATEGORY_OPTIONS.find((c) => c.id === data.category);
  const Icon = selectedCategory?.icon || Layers;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: string[] = [...data.photos];
    for (let i = 0; i < files.length; i++) {
      if (newPhotos.length >= 5) break;
      const file = files[i];
      const objectUrl = URL.createObjectURL(file);
      newPhotos.push(objectUrl);
    }
    onChange({ photos: newPhotos });
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
    if (!data.description.trim()) {
      setError(isUrdu ? "برائے مہربانی کام کی تفصیلی وضاحت درج کریں۔" : "Please provide a brief description of what needs repair or installation.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in-50 duration-300 pb-20 lg:pb-8">
      {/* Container Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#123B5D]">
                {isUrdu ? "کام کی تفصیل بیان کریں" : "Describe the job"}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                {isUrdu ? "کاریگر کو اپنے مسئلے کے بارے میں بتائیں تاکہ وہ درست اندازہ لگا سکے" : "Tell the pro what needs fixing or installing for accurate estimates"}
              </p>
            </div>
          </div>

          {/* Selected Category Header Banner */}
          {selectedCategory && (
            <div className="flex items-center p-3.5 rounded-xl bg-slate-50 border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${selectedCategory.iconBg} ${selectedCategory.iconColor}`}
                >
                  <Icon className="size-5 stroke-[2.2]" />
                </div>
                <div>
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
                  <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                    {data.subCategory || selectedCategory.subtitle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Subcategory Switcher Chips */}
          {selectedCategory && selectedCategory.subCategories.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-700">
                  {isUrdu ? "عام مسائل:" : "Common issues:"}
                </span>
                <span className="text-[10px] text-slate-500 font-medium sm:hidden">
                  {isUrdu ? "مزید کے لیے سکرول کریں ←" : "Swipe for more →"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {selectedCategory.subCategories.map((sub) => {
                  const isCurrent = data.subCategory === sub;
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() =>
                        onChange({
                          subCategory: sub,
                          title: sub,
                        })
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#0F8B8D] text-white shadow-2xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {sub}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="job-title"
              className="block text-sm sm:text-base font-extrabold text-[#123B5D] mb-1.5"
            >
              {isUrdu ? "کام کا عنوان" : "Job Title"} <span className="text-red-500">*</span>
            </label>
            <input
              id="job-title"
              type="text"
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
                {isUrdu ? "تفصیلی وضاحت" : "Detailed Description"} <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-600 font-bold">
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

        {/* Media Section */}
        <section className="space-y-3 pt-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#123B5D]">
              {isUrdu ? "تصاویر یا وائس نوٹ شامل کریں (اختیاری)" : "Add Media (Optional but recommended)"}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
            {/* Image Upload Dropzone (Left column) */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:p-4 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group transition-all">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {data.photos.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center text-center cursor-pointer py-2 sm:py-3 space-y-1.5"
                >
                  <div className="size-9 sm:size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0F8B8D] group-hover:bg-[#0F8B8D]/10 transition-colors shadow-2xs">
                    <Upload className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0F8B8D]">
                      {isUrdu ? "تصاویر اپلوڈ کریں" : "Upload Photos"}
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-slate-600 font-medium">
                      {isUrdu ? "زیادہ سے زیادہ 5 تصاویر" : "PNG, JPG up to 5 photos"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {isUrdu ? `منسلک تصاویر (${data.photos.length}/5)` : `Photos (${data.photos.length}/5)`}
                    </span>
                    {data.photos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-[#0F8B8D] hover:underline inline-flex items-center gap-0.5"
                      >
                        <Plus className="size-3" />
                        <span>{isUrdu ? "مزید شامل کریں" : "Add more"}</span>
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-1">
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
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Voice Note Recorder (Right column) */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-3 sm:p-4 min-h-[140px] sm:min-h-[160px] flex flex-col justify-between">
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
        </section>

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{isUrdu ? "واپس" : "Back"}</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#0F8B8D] hover:bg-[#0F8B8D]/90 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>{isUrdu ? "وقت اور مقام کی طرف بڑھیں" : "Continue to Schedule"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
