"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CreditCard,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkerProfileFormData } from "../types";

export function Step5Documents({
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
  const t = useTranslations("WorkerOnboarding.Step5");
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleCnicUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    side: "front" | "back",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (side === "front") {
        updateFormData({
          cnicFront: result,
          cnicFrontName: file.name,
        });
      } else {
        updateFormData({
          cnicBack: result,
          cnicBackName: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCnic = (side: "front" | "back") => {
    if (side === "front") {
      updateFormData({ cnicFront: "", cnicFrontName: "" });
      if (frontInputRef.current) frontInputRef.current.value = "";
    } else {
      updateFormData({ cnicBack: "", cnicBackName: "" });
      if (backInputRef.current) backInputRef.current.value = "";
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
              {t("protectedBadge")}
            </span>
          </div>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* NADRA Security Banner */}
        <div className="flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal/10 p-3.5 text-xs sm:text-sm text-navy">
          <ShieldCheck className="size-5.5 shrink-0 text-teal" />
          <span className="leading-relaxed text-muted-foreground">
            <strong className="text-navy font-bold">{t("encryptionTitle")}</strong> {t("encryptionDesc")}
          </span>
        </div>

        {/* 13-Digit CNIC Number Input */}
        <div className="space-y-1.5">
          <label
            htmlFor="cnic-number"
            className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
          >
            {t("cnicNumberLabel")}
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="cnic-number"
              type="text"
              value={formData.cnicNumber || ""}
              onChange={(e) => updateFormData({ cnicNumber: e.target.value })}
              placeholder={t("cnicNumberPlaceholder")}
              className="h-11 sm:h-12 pl-10 rounded-full text-sm sm:text-base font-mono shadow-2xs"
            />
          </div>
        </div>

        {/* CNIC Front & Back Dropzones */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* CNIC Front Side */}
          <div className="rounded-2xl bg-white p-1.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-navy">
                🪪 {t("cnicFront")} <span className="text-error">*</span>
              </span>
              <span className="rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 text-xs font-bold text-teal">
                {formData.cnicFront ? t("attached") : t("required")}
              </span>
            </div>

            <input
              type="file"
              ref={frontInputRef}
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleCnicUpload(e, "front")}
            />

            {formData.cnicFront ? (
              <div className="space-y-2">
                <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-xl border border-teal/30 bg-slate-100">
                  <Image
                    src={formData.cnicFront}
                    alt="CNIC Front"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-medium text-navy">
                    {formData.cnicFrontName || "cnic_front.jpg"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => frontInputRef.current?.click()}
                      className="h-7 rounded-full border-teal/40 px-2.5 text-xs font-bold text-teal hover:bg-teal/10"
                    >
                      {t("replace")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCnic("front")}
                      className="h-7 rounded-full px-2 text-xs text-error hover:bg-error/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => frontInputRef.current?.click()}
                className="group flex h-28 sm:h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center transition-all hover:border-teal hover:bg-teal/5"
              >
                <Upload className="mb-1.5 size-5 text-teal group-hover:scale-105 transition-transform" />
                <p className="text-sm font-bold text-navy">
                  <span className="text-teal underline">{t("uploadFront")}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("maxSize")}</p>
              </div>
            )}
          </div>

          {/* CNIC Back Side */}
          <div className="rounded-2xl bg-white p-1.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-navy">
                🪪 {t("cnicBack")} <span className="text-error">*</span>
              </span>
              <span className="rounded-full border border-teal/20 bg-teal/10 px-2 py-0.5 text-xs font-bold text-teal">
                {formData.cnicBack ? t("attached") : t("required")}
              </span>
            </div>

            <input
              type="file"
              ref={backInputRef}
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => handleCnicUpload(e, "back")}
            />

            {formData.cnicBack ? (
              <div className="space-y-2">
                <div className="relative h-28 sm:h-32 w-full overflow-hidden rounded-xl border border-teal/30 bg-slate-100">
                  <Image
                    src={formData.cnicBack}
                    alt="CNIC Back"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-medium text-navy">
                    {formData.cnicBackName || "cnic_back.jpg"}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => backInputRef.current?.click()}
                      className="h-7 rounded-full border-teal/40 px-2.5 text-xs font-bold text-teal hover:bg-teal/10"
                    >
                      {t("replace")}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCnic("back")}
                      className="h-7 rounded-full px-2 text-xs text-error hover:bg-error/10"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => backInputRef.current?.click()}
                className="group flex h-28 sm:h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white p-3 text-center transition-all hover:border-teal hover:bg-teal/5"
              >
                <Upload className="mb-1.5 size-5 text-teal group-hover:scale-105 transition-transform" />
                <p className="text-sm font-bold text-navy">
                  <span className="text-teal underline">{t("uploadBack")}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("maxSize")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Guidelines (1 line) */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-muted-foreground flex items-center justify-between">
          <span className="text-teal font-semibold">{t("guideCorners")}</span>
          <span className="text-teal font-semibold">{t("guideGlare")}</span>
          <span className="text-teal font-semibold">{t("guideSmart")}</span>
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
