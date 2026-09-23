"use client";

import { useTranslations } from "next-intl";
import type { WizardStep } from "../types";

export function StepProgressHeader({
  currentStep,
}: {
  currentStep: WizardStep;
}) {
  const t = useTranslations("WorkerOnboarding.Stepper");

  if (currentStep === "success") return null;

  const stepNumber = typeof currentStep === "number" ? currentStep : 1;

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1:
        return t("step1");
      case 2:
        return t("step2");
      case 3:
        return t("step3");
      case 4:
        return t("step4");
      case 5:
        return t("step5");
      case 6:
        return t("step6");
      default:
        return t("onboarding");
    }
  };

  const badgeLabel = getStepLabel(stepNumber);

  return (
    <div className="mb-5" id="progress-header-container">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-sm font-extrabold uppercase tracking-wider text-navy">
          {t("stepOf", { current: stepNumber, total: 6 })}
        </span>
        <span className="rounded-full border border-teal/20 bg-teal/10 px-3 py-1 text-xs font-bold text-teal">
          {badgeLabel}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5, 6].map((step) => {
          const isCompletedOrCurrent = step <= stepNumber;
          return (
            <div
              key={step}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                isCompletedOrCurrent ? "bg-teal shadow-xs" : "bg-slate-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
