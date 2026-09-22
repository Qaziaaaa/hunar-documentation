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
      setError("Please provide a title for the job request.");
      return;
    }
    if (!data.description.trim()) {
      setError("Please provide a brief description of what needs repair or installation.");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 animate-in fade-in-50 duration-300">
      {/* Container Card (Pure White, No Border) */}
      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#123B5D]">
                Describe the job
              </h1>
             
            </div>
          </div>

          {/* Selected Category Header Banner (White BG, No Border) */}
          {selectedCategory && (
            <div className="flex items-center p-3.5 rounded-xl bg-white shadow-2xs">
              <div className="flex items-center gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${selectedCategory.iconBg} ${selectedCategory.iconColor}`}
                >
                  <Icon className="size-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-[#123B5D]">
                      {selectedCategory.name}
                    </span>
                    {isUrdu && (
                      <span className="text-xs text-slate-400 font-urdu font-medium">
                        {selectedCategory.urduName}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onBack}
                      className="text-[11px] font-semibold text-[#0F766E] hover:underline inline-flex items-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2 py-0.5 rounded-md transition-colors"
                    >
                      <Edit2 className="size-2.5" />
                      <span>Change Service</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {data.subCategory || selectedCategory.subtitle}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Subcategory Switcher Chips (Compact single-line scroll on mobile) */}
          {selectedCategory && selectedCategory.subCategories.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">
                  Common issues:
                </span>
                <span className="text-[10px] text-slate-400 sm:hidden">
                  Swipe for more &rarr;
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-[#0F766E] text-white font-bold shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700"
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
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label
              htmlFor="job-title"
              className="block text-xs font-semibold text-[#123B5D] mb-1"
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
                  ? "مثلاً: کچن کا پائپ لیک ہو رہا ہے یا اے سی کولنگ نہیں کر رہا"
                  : "e.g., Leaking pipe under kitchen sink or AC not cooling"
              }
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50/70 text-xs sm:text-sm text-[#1A1A2E] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0F766E]/20 transition-all outline-none"
            />
          </div>

          {/* Job Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="job-description"
                className="block text-xs font-semibold text-[#123B5D]"
              >
                {isUrdu ? "تفصیلی وضاحت" : "Detailed Description"} <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
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
                  ? "مسئلے کی مکمل تفصیل بیان کریں تاکہ کاریگر درست اوزار اور سامان لا سکے..."
                  : "Provide as much detail as possible. What needs fixing? When did it start? Are there any specific requirements or access issues?"
              }
              className="w-full p-3 rounded-xl bg-slate-50/70 text-xs sm:text-sm text-[#1A1A2E] placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#0F766E]/20 transition-all outline-none resize-none"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{isUrdu ? "ماڈل یا فلور نمبر کی وضاحت کریں" : "Mention any specific brand, model, or floor number"}</span>
              {data.description.length > 0 && data.description.length < 30 ? (
                <span className="text-amber-600 font-medium">
                  {isUrdu ? "مزید تفصیل شامل کرنے سے درست اندازہ ملتا ہے" : "Adding more details helps pros quote accurately"}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Media Section */}
        <section className="space-y-3 pt-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#123B5D]">
              {isUrdu ? "تصاویر یا وائس نوٹ شامل کریں (اختیاری)" : "Add Media (Optional but recommended)"}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
            {/* Image Upload Dropzone (Left column) */}
            <div className="rounded-2xl bg-white shadow-2xs p-3 sm:p-4 flex flex-col justify-between min-h-[140px] sm:min-h-[160px] group transition-all">
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
                  <div className="size-8 sm:size-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[#0F766E]/10 group-hover:text-[#0F766E] transition-colors">
                    <Upload className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-[#0F766E]">
                      {isUrdu ? "تصاویر اپلوڈ کریں" : "Upload Photos"}
                    </span>
                    <p className="text-[10px] sm:text-[11px] text-slate-400">
                      {isUrdu ? "زیادہ سے زیادہ 5 تصاویر" : "PNG, JPG up to 5 photos"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      {isUrdu ? `منسلک تصاویر (${data.photos.length}/5)` : `Photos (${data.photos.length}/5)`}
                    </span>
                    {data.photos.length < 5 && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-[#0F766E] hover:underline inline-flex items-center gap-0.5"
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
            <div className="rounded-2xl bg-white shadow-2xs p-3 sm:p-4 min-h-[140px] sm:min-h-[160px] flex flex-col justify-between">
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="px-4 sm:px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            <span>{isUrdu ? "واپس" : "Back"}</span>
          </button>

          <button
            type="button"
            onClick={handleProceed}
            className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{isUrdu ? "اگلا مرحلہ: وقت اور مقام" : "Continue to Schedule"}</span>
            <ArrowRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
