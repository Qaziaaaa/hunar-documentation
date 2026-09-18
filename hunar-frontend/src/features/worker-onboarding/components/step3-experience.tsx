"use client";

import { useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  FileCheck,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkerProfileFormData } from "../types";

const EXP_OPTIONS = [
  { label: "< 1 Year", sub: "Beginner", icon: "🌱" },
  { label: "1 - 3 Years", sub: "Intermediate", icon: "⚡" },
  { label: "4 - 7 Years", sub: "Skilled Pro", icon: "🏆" },
  { label: "8+ Years", sub: "Master", icon: "👑" },
];

export function Step3Experience({
  formData,
  updateFormData,
  onNext,
  onPrev,
  stepError,
}: {
  formData: WorkerProfileFormData;
  updateFormData: (partial: Partial<WorkerProfileFormData>) => void;
  onNext: () => void;
  onPrev: () => void;
  stepError: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateFormData({
        certificateFile: event.target?.result as string,
        certificateName: file.name,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeCertificate = () => {
    updateFormData({
      certificateFile: "",
      certificateName: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-navy leading-tight">
            Experience & Qualifications
          </h2>
          <span className="shrink-0 whitespace-nowrap rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-teal">
            Pro Credential
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Tell clients how long you&apos;ve worked in your trade and attach any skill proof.
        </p>
      </div>

      {/* Years of Experience Selector */}
      <div className="rounded-2xl bg-white p-1">
        <label className="mb-2 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Years of Experience <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2 text-center">
          {EXP_OPTIONS.map((opt) => {
            const isSelected = formData.experienceYears?.includes(opt.label);
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() =>
                  updateFormData({
                    experienceYears: `${opt.label} (${opt.sub})`,
                  })
                }
                className={`flex flex-col items-center justify-center rounded-xl p-2.5 text-xs transition-all ${
                  isSelected
                    ? "border-2 border-teal bg-teal/10 font-bold text-navy shadow-xs"
                    : "border border-slate-200 bg-white font-medium text-slate-700 hover:border-teal/50 hover:bg-slate-50"
                }`}
              >
                <span className="text-base">{opt.icon}</span>
                <span className="text-[11px] font-bold leading-tight text-navy mt-1">
                  {opt.label}
                </span>
                <span className="text-[9px] text-muted-foreground mt-0.5">
                  {opt.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Short Bio / Summary Textarea */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="bio"
            className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
          >
            Work Summary / Bio <span className="text-error">*</span>
          </label>
          <span className="text-[11px] text-muted-foreground">
            Shown on your visit quotes
          </span>
        </div>
        <textarea
          id="bio"
          rows={3}
          value={formData.bio}
          onChange={(e) => updateFormData({ bio: e.target.value })}
          placeholder="Tell clients about your hands-on experience, equipment, and reliability in Peshawar..."
          className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs sm:text-sm leading-relaxed text-slate-800 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
        />
      </div>

      {/* Trade Certificate Upload Dropzone */}
      <div className="rounded-2xl bg-white p-1">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <span className="flex items-center gap-1.5 text-xs font-bold text-navy">
              <FileText className="size-4 text-teal" />
              Trade Certificate
            </span>
            <p className="text-[10px] text-muted-foreground">
              NAVTTC, TEVTA, apprenticeship letter or trade proof
            </p>
          </div>
          <span className="rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 text-[9.5px] font-bold text-teal">
            {formData.certificateName ? "✓ Attached" : "Optional"}
          </span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*,.pdf"
          className="hidden"
          onChange={handleCertUpload}
        />

        {formData.certificateName ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-teal/30 bg-white p-2.5 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-teal text-white">
                <FileCheck className="size-4.5" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-bold text-navy">
                  {formData.certificateName}
                </p>
                <p className="text-[10px] font-semibold text-teal">
                  Attached for priority verification
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-7 rounded-full border-teal/40 px-2.5 text-[11px] font-bold text-teal hover:bg-teal/10"
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={removeCertificate}
                className="h-7 rounded-full px-2 text-xs text-error hover:bg-error/10"
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-teal/40 bg-white p-3 text-center transition-all hover:border-teal hover:bg-teal/10"
          >
            <div className="mb-1 flex size-7 items-center justify-center rounded-full bg-teal/10 text-teal group-hover:scale-105 transition-transform">
              <Upload className="size-4" />
            </div>
            <p className="text-xs font-bold text-navy">
              <span className="text-teal underline">Click to upload</span> certificate
            </p>
            <p className="text-[10px] text-muted-foreground">PDF, JPG, PNG (Max 10MB)</p>
          </div>
        )}
      </div>

      {stepError && (
        <div className="flex items-center gap-1.5 rounded-xl bg-error/10 p-2 text-xs font-medium text-error">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onPrev}
          className="h-11 sm:h-12 w-1/3 rounded-full border-2 border-navy text-sm font-bold text-navy hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1 size-3.5 rtl:rotate-180" />
          <span>Back</span>
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          className="h-11 sm:h-12 flex-1 rounded-full bg-teal text-sm font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90"
        >
          <span>Continue to Service Areas</span>
          <ArrowRight className="ml-1 size-3.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
