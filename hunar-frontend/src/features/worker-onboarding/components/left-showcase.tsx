"use client";

import {
  AirVent,
  BadgeCheck,
  Flame,
  Hammer,
  Paintbrush,
  Pipette,
  ShieldCheck,
  SunMedium,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { WorkerFixLogo } from "@/components/shared/workerfix-logo";

export function LeftShowcase() {
  const t = useTranslations("WorkerOnboarding.Showcase");
  const tSkills = useTranslations("WorkerOnboarding.Skills");

  return (
    <section
      className="hidden lg:flex flex-col justify-between bg-slate-50/70 p-4 lg:p-6 xl:p-8 lg:col-span-5 xl:col-span-5 min-h-full"
      data-purpose="worker-value-prop"
    >
      <div className="flex h-full flex-col justify-between rounded-3xl border border-teal-200/50 bg-gradient-to-b from-[#0F8B8D]/10 via-[#0F8B8D]/5 to-transparent p-4 lg:p-5 xl:p-7 shadow-xs">
        <div>
          {/* Header Branding and Escrow Badge */}
          <div className="mb-3.5 lg:mb-4 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <WorkerFixLogo variant="dark" size="sm" />
              <span className="block text-[10px] font-bold uppercase tracking-wider text-teal pl-0.5">
                {t("badgeVerified")}
              </span>
            </div>
            <span className="inline-flex items-center rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-xs font-bold text-teal">
              {t("badgeEscrow")}
            </span>
          </div>

          {/* Section Headline */}
          <div className="mb-3.5 lg:mb-4">
            <h1 className="text-xl lg:text-2xl xl:text-3xl font-extrabold leading-snug tracking-tight text-navy">
              {t("title")}
            </h1>
            <p className="mt-1.5 lg:mt-2.5 text-xs xl:text-sm text-muted-foreground leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Center White Enclosed Card */}
          <div className="rounded-2xl border border-teal-100/80 bg-white p-3 lg:p-3.5 shadow-xs">
            {/* Popular Skills Header */}
            <div className="mb-2 lg:mb-2.5 px-0.5 flex items-center justify-between">
              <p className="text-xs lg:text-sm font-extrabold text-navy">
                {t("popularSkills")}
              </p>
              <span className="text-[11px] lg:text-xs font-semibold text-teal flex items-center gap-1">
                <Users className="size-3.5" /> {t("peshawar")}
              </span>
            </div>

            {/* 4x2 Grid of Skill Cards */}
            <div className="grid grid-cols-4 gap-2 text-center text-slate-800">
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Zap className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("Electrician")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Wrench className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("Plumber")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <AirVent className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("AC Technician")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Hammer className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("Carpenter")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Paintbrush className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("Painter")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <SunMedium className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("Solar Technician")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Flame className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("Welder")}
                </span>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 shadow-2xs hover:border-teal hover:bg-teal/5 transition-all">
                <Pipette className="mb-1 size-4 text-teal" />
                <span className="text-[10px] sm:text-[11px] font-bold leading-tight text-navy">
                  {tSkills("Mason")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badges Bar */}
        <div className="mt-3.5 lg:mt-4 flex items-center justify-between pt-2.5 lg:pt-3 border-t border-teal-200/40 text-[11px] xl:text-xs font-bold text-navy">
          <span className="inline-flex items-center gap-1.5 text-teal">
            <BadgeCheck className="size-4 text-teal" />
            {t("nadraVerified")}
          </span>
          <span className="inline-flex items-center gap-1.5 text-success">
            <ShieldCheck className="size-4 text-success" />
            {t("escrowProtection")}
          </span>
        </div>
      </div>
    </section>
  );
}
