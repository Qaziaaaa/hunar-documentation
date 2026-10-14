"use client";

import { useEffect, useState } from "react";
import {
  AirVent,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BrickWall,
  Briefcase,
  Bug,
  Check,
  Droplets,
  Flame,
  Hammer,
  Loader2,
  Paintbrush,
  RefreshCw,
  Sparkles,
  Sun,
  Tv,
  Wrench,
  Zap,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { BackendCategory, fetchCategories } from "../api/onboarding-api";
import type { WorkerProfileFormData } from "../types";

export function getCategoryIcon(name: string) {
  const lower = (name || "").toLowerCase();
  if (lower.includes("plumb")) return Droplets;
  if (lower.includes("electr")) return Zap;
  if (lower.includes("ac") || lower.includes("refrig") || lower.includes("air")) return AirVent;
  if (lower.includes("carpent") || lower.includes("wood")) return Hammer;
  if (lower.includes("paint")) return Paintbrush;
  if (lower.includes("clean")) return Sparkles;
  if (lower.includes("mason")) return BrickWall;
  if (lower.includes("pest")) return Bug;
  if (lower.includes("solar")) return Sun;
  if (lower.includes("weld")) return Flame;
  if (lower.includes("appliance")) return Tv;
  return Wrench;
}

export function Step2Skills({
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
  const t = useTranslations("WorkerOnboarding.Step2");
  const locale = useLocale();
  const isUrdu = locale === "ur";

  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadCategories = () => {
    setIsLoading(true);
    setFetchError(null);

    fetchCategories()
      .then((items) => {
        // Only active categories from DB, ordered by sortOrder
        const active = (items || [])
          .filter((c) => c.isActive !== false)
          .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        setCategories(active);
      })
      .catch((err) => {
        console.error("[Step2Skills] Failed to fetch categories from DB:", err);
        setFetchError("Unable to load categories from database.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const selectedSkills = formData.skills || [];
  const selectedCount = selectedSkills.length;

  const toggleCategory = (cat: BackendCategory) => {
    // Check match either by name or ID
    const isSelected =
      selectedSkills.includes(cat.name) || selectedSkills.includes(cat.id);

    if (isSelected) {
      updateFormData({
        skills: selectedSkills.filter((s) => s !== cat.name && s !== cat.id),
      });
    } else {
      updateFormData({
        skills: [...selectedSkills.filter((s) => s !== cat.name && s !== cat.id), cat.name],
      });
    }
  };

  return (
    <div className="flex flex-col justify-between flex-1 space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
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
          <span className="shrink-0 self-start rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
            {t("selectedCount", { count: selectedCount })}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 py-1">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="flex animate-pulse flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 text-center min-h-[105px]"
              >
                <div className="size-10 rounded-full bg-slate-200 mb-2" />
                <div className="h-3.5 w-16 rounded-md bg-slate-200 mb-1.5" />
                <div className="h-2.5 w-12 rounded-md bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!isLoading && fetchError && categories.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="size-8 text-error mb-2" />
            <p className="text-sm font-semibold text-slate-800">{fetchError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadCategories}
              className="mt-3 gap-1.5 rounded-full border-teal text-teal hover:bg-teal/10"
            >
              <RefreshCw className="size-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        )}

        {/* Database Categories Grid (3-col, no scrollbar) */}
        {!isLoading && categories.length > 0 && (
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3 py-1">
            {categories.map((cat) => {
              const isSelected =
                selectedSkills.includes(cat.name) || selectedSkills.includes(cat.id);
              const Icon = getCategoryIcon(cat.name);
              const displayName = isUrdu && cat.nameUrdu ? cat.nameUrdu : cat.name;

              return (
                <div
                  key={cat.id}
                  onClick={() => toggleCategory(cat)}
                  className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl p-3 text-center transition-all shadow-2xs ${
                    isSelected
                      ? "border-2 border-teal bg-teal/10 shadow-xs"
                      : "border border-slate-200 bg-white hover:border-teal/50 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`mb-2 flex size-10 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                      isSelected
                        ? "bg-navy text-white shadow-xs"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <Icon className="size-4.5" />
                  </div>

                  <span className="text-xs sm:text-sm font-bold text-navy truncate w-full" title={displayName}>
                    {displayName}
                  </span>

                  {isSelected ? (
                    <span className="mt-1.5 flex items-center justify-center gap-1 text-[11px] font-bold text-teal">
                      <Check className="size-3" /> {t("selected")}
                    </span>
                  ) : (
                    <span className="mt-1.5 text-[11px] font-medium text-slate-400">
                      {t("tapToSelect")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

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
