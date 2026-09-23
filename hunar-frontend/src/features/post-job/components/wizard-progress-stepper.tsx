"use client";

import React from "react";
import { Check, ChevronRight } from "lucide-react";
import type { PostJobStep } from "../types";

export interface WizardProgressStepperProps {
  currentStep: PostJobStep;
  onGoToStep: (step: PostJobStep) => void;
  locale: string;
}

interface StepMeta {
  step: PostJobStep;
  label: string;
  labelUr: string;
}

const STEPS: StepMeta[] = [
  { step: 1, label: "1. Service", labelUr: "1. سروس" },
  { step: 2, label: "2. Details", labelUr: "2. تفصیل" },
  { step: 3, label: "3. Schedule", labelUr: "3. وقت و مقام" },
  { step: 4, label: "4. Review", labelUr: "4. جائزہ" },
];

export function WizardProgressStepper({
  currentStep,
  onGoToStep,
  locale,
}: WizardProgressStepperProps) {
  const isUrdu = locale === "ur";
  const progressPercent = Math.round((currentStep / 4) * 100);

  return (
    <div className="w-full max-w-3xl mx-auto mb-6 px-1 sm:px-4">
      {/* Desktop & Tablet Breadcrumb Chevron Stepper */}
      <nav
        aria-label="Progress"
        className="hidden sm:flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-1.5 shadow-2xs"
      >
        <ol className="flex items-center w-full">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isActive = currentStep === s.step;
            const isUpcoming = currentStep < s.step;
            const label = isUrdu ? s.labelUr : s.label;

            return (
              <li key={s.step} className="flex-1 flex items-center">
                <button
                  type="button"
                  disabled={isUpcoming}
                  onClick={() => {
                    if (isCompleted) onGoToStep(s.step);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs transition-all select-none ${
                    isActive
                      ? "bg-[#0F766E] text-white font-bold shadow-xs"
                      : isCompleted
                      ? "bg-slate-50 hover:bg-[#0F766E]/10 text-[#0F766E] font-semibold cursor-pointer active:scale-95"
                      : "bg-transparent text-slate-400 font-medium cursor-not-allowed opacity-70"
                  }`}
                >
                  {/* Step Badge */}
                  <span
                    className={`size-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                      isActive
                        ? "bg-white text-[#0F766E] shadow-2xs"
                        : isCompleted
                        ? "bg-[#0F766E] text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="size-3.5 stroke-[3]" />
                    ) : (
                      s.step
                    )}
                  </span>

                  {/* Step Label */}
                  <span className="truncate whitespace-nowrap">{label}</span>
                </button>

                {/* Chevron Arrow between steps */}
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="size-4 text-slate-300 mx-1 shrink-0 rtl:rotate-180" />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile Breadcrumb Chevron Stepper */}
      <div className="sm:hidden bg-white border border-slate-200 rounded-2xl p-2 shadow-2xs">
        <ol className="flex items-center w-full justify-between gap-1">
          {STEPS.map((s, idx) => {
            const isCompleted = currentStep > s.step;
            const isActive = currentStep === s.step;
            const isUpcoming = currentStep < s.step;
            const label = isUrdu ? s.labelUr : s.label;

            return (
              <React.Fragment key={s.step}>
                <li className="flex-1 flex justify-center">
                  <button
                    type="button"
                    disabled={isUpcoming}
                    onClick={() => {
                      if (isCompleted) onGoToStep(s.step);
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-[11px] transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-[#0F766E] text-white font-bold shadow-2xs"
                        : isCompleted
                        ? "bg-slate-50 text-[#0F766E] font-semibold cursor-pointer active:scale-95"
                        : "text-slate-400 font-medium opacity-60"
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isActive
                          ? "bg-white text-[#0F766E]"
                          : isCompleted
                          ? "bg-[#0F766E] text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="size-3 stroke-[3]" />
                      ) : (
                        s.step
                      )}
                    </span>
                    <span className={isActive ? "inline font-bold" : "hidden xs:inline"}>
                      {label}
                    </span>
                  </button>
                </li>

                {idx < STEPS.length - 1 && (
                  <ChevronRight className="size-3.5 text-slate-300 shrink-0 rtl:rotate-180" />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>

      {/* Slim Progress Indicator Line */}
      <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mt-2 px-1">
        <div
          className="h-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
