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
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { WorkerProfileFormData } from "../types";

const EXP_OPTIONS = [
  {
    key: "expUnder1" as const,
    subKey: "expUnder1Sub" as const,
    rawValue: "< 1 Year (Beginner)",
    icon: "🌱",
  },
  {
    key: "exp1to3" as const,
    subKey: "exp1to3Sub" as const,
    rawValue: "1 - 3 Years (Intermediate)",
    icon: "⚡",
  },
  {
    key: "exp4to7" as const,
    subKey: "exp4to7Sub" as const,
    rawValue: "4 - 7 Years (Skilled Pro)",
    icon: "🏆",
  },
  {
    key: "exp8Plus" as const,
    subKey: "exp8PlusSub" as const,
    rawValue: "8+ Years (Master)",
    icon: "👑",
  },
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
  const t = useTranslations("WorkerOnboarding.Step3");
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
    <div className="flex flex-col justify-between flex-1 space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-teal mb-1">
                {t("badge")}
              </span>
              <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl leading-snug">
                {t("title")}
              </h2>
            </div>
            <span className="shrink-0 self-start rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
              {t("credentialBadge")}
            </span>
          </div>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Years of Experience Selector */}
        <div className="rounded-2xl bg-white p-1">
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-navy">
            {t("experienceYears")} <span className="text-error">*</span>
          </label>
          <div className="grid grid-cols-4 gap-2 text-center">
            {EXP_OPTIONS.map((opt) => {
              const isSelected =
                formData.experienceYears === opt.rawValue ||
                formData.experienceYears?.includes(opt.rawValue.split(" ")[0]);
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() =>
                    updateFormData({
                      experienceYears: opt.rawValue,
                    })
                  }
                  className={`flex flex-col items-center justify-center rounded-xl p-3 text-sm transition-all ${
                    isSelected
                      ? "border-2 border-teal bg-teal/10 font-bold text-navy shadow-xs"
                      : "border border-slate-200 bg-white font-medium text-slate-700 hover:border-teal/50 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span className="text-xs sm:text-sm font-bold leading-tight text-navy mt-1">
                    {t(opt.key)}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {t(opt.subKey)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Short Bio / Summary Textarea */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="bio"
              className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
            >
              {t("bioLabel")} <span className="text-error">*</span>
            </label>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {t("bioHint")}
            </span>
          </div>
          <textarea
            id="bio"
            rows={3}
            value={formData.bio}
            onChange={(e) => updateFormData({ bio: e.target.value })}
            placeholder={t("bioPlaceholder")}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3.5 text-sm sm:text-base leading-relaxed text-slate-800 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
        </div>

        {/* Trade Certificate Upload Dropzone */}
        <div className="rounded-2xl bg-white p-1">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <span className="flex items-center gap-1.5 text-sm font-bold text-navy">
                <FileText className="size-4.5 text-teal" />
                {t("certificateTitle")}
              </span>
              <p className="text-xs text-muted-foreground">
                {t("certificateHint")}
              </p>
            </div>
            <span className="rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal">
              {formData.certificateName ? t("certificateAttached") : t("certificateOptional")}
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
            <div className="flex items-center justify-between gap-2 rounded-xl border border-teal/30 bg-white p-3 shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-teal text-white">
                  <FileCheck className="size-5" />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="truncate text-sm font-bold text-navy">
                    {formData.certificateName}
                  </p>
                  <p className="text-xs font-semibold text-teal">
                    {t("priorityVerification")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 rounded-full border-teal/40 px-3 text-xs font-bold text-teal hover:bg-teal/10"
                >
                  {t("replace")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeCertificate}
                  className="h-8 rounded-full px-2 text-xs text-error hover:bg-error/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-teal/40 bg-white p-3.5 text-center transition-all hover:border-teal hover:bg-teal/10"
            >
              <div className="mb-1 flex size-8 items-center justify-center rounded-full bg-teal/10 text-teal group-hover:scale-105 transition-transform">
                <Upload className="size-4.5" />
              </div>
              <p className="text-sm font-bold text-navy">
                <span className="text-teal underline">{t("clickToUpload")}</span> {t("certificateText")}
              </p>
              <p className="text-xs text-muted-foreground">{t("fileLimits")}</p>
            </div>
          )}
        </div>

        {stepError && (
          <div className="flex items-center gap-2 rounded-xl bg-error/10 p-2.5 text-sm font-medium text-error">
            <AlertCircle className="size-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 pt-4 pb-1">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onPrev}
          className="h-12 sm:h-13 w-1/3 rounded-full border-2 border-navy text-sm sm:text-base font-bold text-navy hover:bg-slate-50"
        >
          <ArrowLeft className="mr-1.5 size-4 rtl:rotate-180" />
          <span>{t("backBtn")}</span>
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          className="h-12 sm:h-13 flex-1 rounded-full bg-teal text-sm sm:text-base font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 transition-all"
        >
          <span>{t("continueBtn")}</span>
          <ArrowRight className="ml-1.5 size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
