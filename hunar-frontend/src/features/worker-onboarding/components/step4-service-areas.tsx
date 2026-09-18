"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkerProfileFormData } from "../types";

const PESHAWAR_AREAS = [
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
];

const RADIUS_OPTIONS = [
  "Up to 5 km",
  "Up to 10 km",
  "Up to 20 km",
  "Up to 35 km",
  "Entire City",
];

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
  const toggleArea = (area: string) => {
    const current = formData.serviceAreas || [];
    if (current.includes(area)) {
      updateFormData({ serviceAreas: current.filter((a) => a !== area) });
    } else {
      updateFormData({ serviceAreas: [...current, area] });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-navy leading-tight">
            Service Areas in Peshawar
          </h2>
          <span className="shrink-0 whitespace-nowrap rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-teal">
            Matching Radar
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Select the Peshawar localities you can visit for client jobs.
        </p>
      </div>

      {/* Localities Selection Pills */}
      <div className="rounded-2xl bg-white p-1">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Select Towns / Localities <span className="text-error">*</span>
          </label>
          <span className="text-xs font-bold text-teal">
            {formData.serviceAreas?.length || 0} Selected
          </span>
        </div>

        <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
          {PESHAWAR_AREAS.map((area) => {
            const isSelected = formData.serviceAreas?.includes(area);
            return (
              <button
                key={area}
                type="button"
                onClick={() => toggleArea(area)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "border border-teal bg-teal text-white shadow-2xs"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-teal/50 hover:bg-slate-50"
                }`}
              >
                {isSelected && <Check className="size-3" />}
                <span>{area}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Base Address & Coverage Radius */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div className="sm:col-span-8 space-y-1">
          <label
            htmlFor="primary-address"
            className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
          >
            Base Workshop Location <span className="text-error">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              id="primary-address"
              type="text"
              value={formData.primaryAddress}
              onChange={(e) => updateFormData({ primaryAddress: e.target.value })}
              placeholder="e.g. Phase 3 Chowk, Hayatabad"
              className="h-10 pl-9 rounded-full text-xs sm:text-sm shadow-2xs"
            />
          </div>
        </div>

        <div className="sm:col-span-4 space-y-1">
          <label
            htmlFor="coverage-radius"
            className="ml-1 block text-[11px] font-bold uppercase tracking-wider text-navy"
          >
            Radius
          </label>
          <div className="relative">
            <Compass className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <select
              id="coverage-radius"
              value={formData.coverageRadius}
              onChange={(e) => updateFormData({ coverageRadius: e.target.value })}
              className="h-10 w-full rounded-full border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs sm:text-sm font-medium text-slate-800 shadow-2xs focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-teal/20 bg-teal/5 p-2.5 text-xs text-slate-600">
        <span className="font-bold text-navy">📍 GPS Matching:</span> Nearby jobs within your chosen radius in Peshawar will match automatically.
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
          <span>Continue to Documents</span>
          <ArrowRight className="ml-1 size-3.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
