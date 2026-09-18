"use client";

import {
  AirVent,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Hammer,
  Paintbrush,
  Pipette,
  SunMedium,
  Tv,
  Wrench,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkerProfileFormData } from "../types";

interface SkillItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const AVAILABLE_SKILLS: SkillItem[] = [
  {
    id: "Electrician",
    name: "Electrician",
    icon: Zap,
    description: "Wiring, DBs, UPS & circuits",
  },
  {
    id: "Plumber",
    name: "Plumber",
    icon: Wrench,
    description: "Pipes, geysers & motors",
  },
  {
    id: "AC Technician",
    name: "AC Tech",
    icon: AirVent,
    description: "Inverter AC service & gas",
  },
  {
    id: "Carpenter",
    name: "Carpenter",
    icon: Hammer,
    description: "Doors, locks & cabinetry",
  },
  {
    id: "Painter",
    name: "Painter",
    icon: Paintbrush,
    description: "Interior & exterior polish",
  },
  {
    id: "Mechanic",
    name: "Mechanic",
    icon: Wrench,
    description: "Generators & home machinery",
  },
  {
    id: "Solar Technician",
    name: "Solar Tech",
    icon: SunMedium,
    description: "Panels, inverters & wiring",
  },
  {
    id: "Mason",
    name: "Mason",
    icon: Pipette,
    description: "Tiles, plaster & civil work",
  },
  {
    id: "Welder",
    name: "Welder",
    icon: Flame,
    description: "Grills & metal fabrication",
  },
  {
    id: "Appliance Repair",
    name: "Appliance",
    icon: Tv,
    description: "Washing machines & fridges",
  },
];

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
  const toggleSkill = (skillId: string) => {
    const current = formData.skills || [];
    if (current.includes(skillId)) {
      updateFormData({ skills: current.filter((s) => s !== skillId) });
    } else {
      updateFormData({ skills: [...current, skillId] });
    }
  };

  const selectedCount = formData.skills?.length || 0;

  return (
    <div className="flex flex-col justify-between flex-1 space-y-5 sm:space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-teal">
              Trade Skills
            </span>
            <h2 className="text-2xl font-extrabold tracking-tight text-navy sm:text-3xl leading-tight">
              What services do you provide?
            </h2>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              Select one or more skills to receive matching client jobs in Peshawar.
            </p>
          </div>
          <span className="shrink-0 self-start rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
            {selectedCount} Selected
          </span>
        </div>

        {/* Grid of Skill Cards (2-col) */}
        <div className="grid grid-cols-2 gap-3 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1 py-1">
          {AVAILABLE_SKILLS.map((skill) => {
            const isSelected = formData.skills?.includes(skill.id);
            const Icon = skill.icon;

            return (
              <div
                key={skill.id}
                onClick={() => toggleSkill(skill.id)}
                className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl p-3.5 text-center transition-all shadow-2xs ${
                  isSelected
                    ? "border-2 border-teal bg-teal/10 shadow-xs"
                    : "border border-slate-200 bg-white hover:border-teal/50 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`mb-2 flex size-11 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                    isSelected
                      ? "bg-navy text-white shadow-xs"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <Icon className="size-5" />
                </div>

                <span className="text-sm sm:text-base font-bold text-navy">
                  {skill.name}
                </span>
                <span className="text-xs sm:text-[13px] text-muted-foreground line-clamp-1 mt-0.5">
                  {skill.description}
                </span>

                {isSelected ? (
                  <span className="mt-2 flex items-center gap-1 text-xs font-bold text-teal">
                    <Check className="size-3.5" /> Selected
                  </span>
                ) : (
                  <span className="mt-2 text-xs font-medium text-slate-400">
                    Tap to select
                  </span>
                )}
              </div>
            );
          })}
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
          <span>Back</span>
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onNext}
          className="h-12 sm:h-13 flex-1 rounded-full bg-teal text-sm sm:text-base font-bold text-white shadow-md shadow-teal/20 hover:bg-teal/90 transition-all"
        >
          <span>Continue to Experience</span>
          <ArrowRight className="ml-1.5 size-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
