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
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { WorkerProfileFormData } from "../types";

interface SkillItemConfig {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const AVAILABLE_SKILLS: SkillItemConfig[] = [
  {
    id: "Electrician",
    nameKey: "Electrician",
    descKey: "ElectricianDesc",
    icon: Zap,
  },
  {
    id: "Plumber",
    nameKey: "Plumber",
    descKey: "PlumberDesc",
    icon: Wrench,
  },
  {
    id: "AC Technician",
    nameKey: "AC Technician",
    descKey: "AC TechnicianDesc",
    icon: AirVent,
  },
  {
    id: "Carpenter",
    nameKey: "Carpenter",
    descKey: "CarpenterDesc",
    icon: Hammer,
  },
  {
    id: "Painter",
    nameKey: "Painter",
    descKey: "PainterDesc",
    icon: Paintbrush,
  },
  {
    id: "Mechanic",
    nameKey: "Mechanic",
    descKey: "MechanicDesc",
    icon: Wrench,
  },
  {
    id: "Solar Technician",
    nameKey: "Solar Technician",
    descKey: "Solar TechnicianDesc",
    icon: SunMedium,
  },
  {
    id: "Mason",
    nameKey: "Mason",
    descKey: "MasonDesc",
    icon: Pipette,
  },
  {
    id: "Welder",
    nameKey: "Welder",
    descKey: "WelderDesc",
    icon: Flame,
  },
  {
    id: "Appliance Repair",
    nameKey: "Appliance Repair",
    descKey: "Appliance RepairDesc",
    icon: Tv,
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
  const t = useTranslations("WorkerOnboarding.Step2");
  const tSkills = useTranslations("WorkerOnboarding.Skills");

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

        {/* Grid of Skill Cards (2-col) */}
        <div className="grid grid-cols-2 gap-3 max-h-[380px] sm:max-h-[440px] overflow-y-auto pr-1 py-1">
          {AVAILABLE_SKILLS.map((skill) => {
            const isSelected = formData.skills?.includes(skill.id);
            const Icon = skill.icon;
            const skillName = tSkills(skill.nameKey);
            const skillDesc = tSkills(skill.descKey);

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
                  {skillName}
                </span>
                <span className="text-xs sm:text-[13px] text-muted-foreground line-clamp-1 mt-0.5">
                  {skillDesc}
                </span>

                {isSelected ? (
                  <span className="mt-2 flex items-center gap-1 text-xs font-bold text-teal">
                    <Check className="size-3.5" /> {t("selected")}
                  </span>
                ) : (
                  <span className="mt-2 text-xs font-medium text-slate-400">
                    {t("tapToSelect")}
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
