"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  MapPin,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { http } from "@/lib/api-client";
import type { WorkerProfileFormData } from "../types";

export const PESHAWAR_AREAS = [
  "Hayatabad",
  "University Town",
  "Peshawar Cantt",
  "Saddar",
  "Gulbahar",
  "Warsak Road",
  "Ring Road",
  "Board Bazaar",
  "Dalazak Road",
  "Kohat Road",
  "City Center",
  "Charsadda Road",
] as const;

const RADIUS_OPTIONS = [
  "Up to 5 km",
  "Up to 10 km",
  "Up to 20 km",
  "Up to 35 km",
  "Entire City",
] as const;

export function Step4ServiceAreas({
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
  const t = useTranslations("WorkerOnboarding.Step4");
  const tAreas = useTranslations("WorkerOnboarding.Areas");
  const tRadii = useTranslations("WorkerOnboarding.Radii");

  // Active localities loaded dynamically from database, fallback to initial PESHAWAR_AREAS
  const [availableAreas, setAvailableAreas] = useState<string[]>([...PESHAWAR_AREAS]);

  useEffect(() => {
    let alive = true;
    http.get<any[]>("/locations/areas")
      .then((res) => {
        if (!alive) return;
        const list = Array.isArray(res) ? res : ((res as any)?.data ?? []);
        if (list && list.length > 0) {
          setAvailableAreas(list.map((a: any) => a.name));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const selectedAreas = formData.serviceAreas || [];

  const toggleArea = (area: string) => {
    if (selectedAreas.includes(area)) {
      updateFormData({ serviceAreas: selectedAreas.filter((a) => a !== area) });
    } else {
      updateFormData({ serviceAreas: [...selectedAreas, area] });
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
              {t("radarBadge")}
            </span>
          </div>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Localities Selection Pills */}
        <div className="rounded-2xl bg-white p-1">
          <div className="mb-2.5 flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">
              {t("selectTowns")} <span className="text-error">*</span>
            </label>
            <span className="text-sm font-bold text-teal">
              {t("selectedCount", { count: selectedAreas.length })}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 max-h-[190px] overflow-y-auto pr-1">
            {availableAreas.map((area) => {
              const isSelected = selectedAreas.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleArea(area)}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                    isSelected
                      ? "border border-teal bg-teal text-white shadow-2xs"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-teal/50 hover:bg-slate-50"
                  }`}
                >
                  {isSelected && <Check className="size-3.5" />}
                  <span>{tAreas.has(area) ? tAreas(area) : area}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Base Address & Coverage Radius */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <div className="sm:col-span-8 space-y-1.5">
            <label
              htmlFor="primary-address"
              className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
            >
              {t("baseLocation")} <span className="text-error">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="primary-address"
                type="text"
                value={formData.primaryAddress}
                onChange={(e) => updateFormData({ primaryAddress: e.target.value })}
                placeholder={t("baseLocationPlaceholder")}
                className="h-11 sm:h-12 pl-10 rounded-full text-sm sm:text-base shadow-2xs"
              />
            </div>
          </div>

          <div className="sm:col-span-4 space-y-1.5">
            <label
              htmlFor="coverage-radius"
              className="ml-1 block text-xs font-bold uppercase tracking-wider text-navy"
            >
              {t("radiusLabel")}
            </label>
            <div className="relative">
              <Compass className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <select
                id="coverage-radius"
                value={formData.coverageRadius}
                onChange={(e) => updateFormData({ coverageRadius: e.target.value })}
                className="h-11 sm:h-12 w-full rounded-full border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-sm sm:text-base font-medium text-slate-800 shadow-2xs focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {tRadii(r)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-teal/20 bg-teal/5 p-3 text-xs sm:text-sm text-slate-700">
          <span className="font-bold text-navy">📍 {t("gpsMatching")}:</span> {t("gpsMatchingDesc")}
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
