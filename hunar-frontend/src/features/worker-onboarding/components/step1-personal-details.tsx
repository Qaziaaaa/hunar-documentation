"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  Check,
  Lock,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadWorkerDocument } from "../api/onboarding-api";
import { compressImage } from "@/lib/image-compression";
import {
  ALL_PAKISTAN_CITIES,
  MAJOR_PAKISTAN_CITIES,
} from "../data/pakistan-cities";
import type { WorkerProfileFormData } from "../types";

export function Step1PersonalDetails({
  formData,
  updateFormData,
  onNext,
  stepError,
}: {
  formData: WorkerProfileFormData;
  updateFormData: (partial: Partial<WorkerProfileFormData>) => void;
  onNext: () => void;
  stepError: string | null;
}) {
  const t = useTranslations("WorkerOnboarding.Step1");
  const tCities = useTranslations("WorkerOnboarding.Cities");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  // Normalize display phone (e.g. "+923010000000" -> "03010000000")
  const displayPhone = formData.phone
    ? formData.phone.startsWith("+92")
      ? formData.phone.slice(3).startsWith("0")
        ? formData.phone.slice(3)
        : `0${formData.phone.slice(3)}`
      : formData.phone
    : "";

  const getCityName = (city: string) => {
    return tCities.has(city) ? tCities(city) : city;
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setPhotoMessage(t("photoSizeError"));
      e.target.value = "";
      return;
    }

    setIsPhotoUploading(true);
    setPhotoMessage(null);
    try {
      let fileToUpload = file;
      if (file.type.startsWith("image/")) {
        const compressedBlob = await compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.85,
        });
        fileToUpload = new File([compressedBlob], file.name, {
          type: compressedBlob.type || file.type,
        });
      }

      const result = await uploadWorkerDocument(fileToUpload, "avatar");
      updateFormData({
        profilePhoto: result.url,
        profilePhotoName: file.name,
      });
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : t("photoUploadError"));
    } finally {
      setIsPhotoUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = () => {
    updateFormData({
      profilePhoto: "",
      profilePhotoName: "",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col justify-between flex-1 space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-teal mb-1">
            {t("badge")}
          </span>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl leading-snug">
            {t("title")}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Profile Photo Avatar Card */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 sm:p-4">
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              disabled={isPhotoUploading}
              onChange={handlePhotoSelect}
            />

            {/* Circular Upload Trigger with Camera + Plus Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPhotoUploading}
              className="group relative size-20 sm:size-22 shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2"
              title={formData.profilePhoto ? t("portraitLabel") : t("portraitLabel")}
            >
              {formData.profilePhoto ? (
                <div className="relative size-full overflow-hidden rounded-full border-2 border-teal bg-white shadow-xs ring-2 ring-teal/20 transition-transform group-hover:scale-102">
                  <Image
                    src={formData.profilePhoto}
                    alt={formData.fullName || "Worker Avatar"}
                    fill
                    unoptimized
                    className="object-cover object-top"
                    sizes="88px"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="size-6 text-white drop-shadow-sm" />
                  </div>
                </div>
              ) : (
                <div className="flex size-full flex-col items-center justify-center rounded-full border-2 border-dashed border-teal/40 bg-teal/5 text-teal shadow-2xs transition-all group-hover:border-teal group-hover:bg-teal/10 group-hover:scale-102">
                  <Camera className="size-7 sm:size-8 text-teal transition-transform group-hover:scale-110" />
                </div>
              )}

              {/* + Icon Badge or Checkmark */}
              <div
                className={`absolute -bottom-0.5 -end-0.5 flex size-6 sm:size-7 items-center justify-center rounded-full border-2 border-white text-white shadow-xs transition-transform group-hover:scale-110 ${formData.profilePhoto ? "bg-teal" : "bg-teal"
                  }`}
              >
                {formData.profilePhoto ? (
                  <Camera className="size-3.5 sm:size-4" />
                ) : (
                  <Plus className="size-4 sm:size-4.5 stroke-[2.5]" />
                )}
              </div>
            </button>

            {/* Actions & Guidelines */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm sm:text-base font-bold text-navy">
                  {t("portraitLabel")} <span className="text-error">*</span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${formData.profilePhoto
                      ? "border border-success/30 bg-success/10 text-success"
                      : "border border-teal/20 bg-teal/10 text-teal"
                    }`}
                >
                  {formData.profilePhoto ? t("attached") : t("required")}
                </span>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("portraitHint")}
              </p>

              {isPhotoUploading && (
                <p className="text-xs font-medium text-teal" aria-live="polite">
                  {t("photoUploading")}
                </p>
              )}

              {formData.profilePhoto && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-error hover:text-error/80 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{t("removePhoto")}</span>
                  </button>
                </div>
              )}

              {photoMessage && (
                <p className="text-xs font-medium text-error pt-1">{photoMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="full-name"
              className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
            >
              {t("fullName")} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="full-name"
                type="text"
                value={formData.fullName}
                onChange={(e) => updateFormData({ fullName: e.target.value })}
                placeholder={t("fullNamePlaceholder")}
                className="h-11 sm:h-12 rounded-full pl-10 text-sm sm:text-base shadow-2xs"
              />
            </div>
          </div>

          {/* Phone Number (Disabled - comes from registration) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="phone"
                className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
              >
                {t("phone")} <span className="text-error">*</span>
              </label>
              <span className="text-[11px] font-semibold text-teal inline-flex items-center gap-1">
                <Check className="size-3 text-teal stroke-[3]" />
                <span>{t("phoneVerified")}</span>
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 select-none border-r border-slate-300 pr-2 text-sm font-bold text-slate-500">
                +92
              </span>
              <Input
                id="phone"
                type="tel"
                value={displayPhone}
                disabled
                readOnly
                aria-disabled="true"
                tabIndex={-1}
                placeholder="03xx-xxxxxxx"
                className="h-11 sm:h-12 rounded-full pl-16 pr-10 text-sm sm:text-base font-semibold text-slate-700 bg-slate-100/90 border-slate-200 cursor-not-allowed select-none shadow-none"
              />
              <Lock className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </div>
            <p className="ml-1 text-[11px] text-muted-foreground">
              {t("phoneRegistrationNote")}
            </p>
          </div>

          {/* City & Email 2-col */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="city"
                className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
              >
                {t("city")}
              </label>
              <select
                id="city"
                value={formData.city}
                onChange={(e) => updateFormData({ city: e.target.value })}
                className="h-11 sm:h-12 w-full rounded-full border border-slate-200 bg-white px-3.5 text-sm sm:text-base font-medium text-slate-800 shadow-2xs focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                <optgroup label={t("majorCitiesGroup")}>
                  {MAJOR_PAKISTAN_CITIES.map((city) => (
                    <option key={`major-${city}`} value={city}>
                      {getCityName(city)}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t("allCitiesGroup")}>
                  {ALL_PAKISTAN_CITIES.map((city) => (
                    <option key={`all-${city}`} value={city}>
                      {getCityName(city)}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
              >
                {t("email")}
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateFormData({ email: e.target.value })}
                placeholder={t("emailPlaceholder")}
                className="h-11 sm:h-12 rounded-full px-3.5 text-sm sm:text-base shadow-2xs"
              />
            </div>
          </div>
        </div>

        {stepError && (
          <div className="flex items-center gap-2 rounded-xl bg-error/10 p-2.5 text-sm font-medium text-error">
            <AlertCircle className="size-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="pt-4 pb-1">
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          disabled={isPhotoUploading}
          className="h-12 sm:h-13 w-full rounded-full bg-teal text-base font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 transition-all"
        >
          <span>{t("continueBtn")}</span>
          <ArrowRight className="ml-2 size-4.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
