import type { WizardStep } from "../types";

const STEP_LABELS: Record<number, string> = {
  1: "Personal Details",
  2: "Trade Skills",
  3: "Experience & Cert",
  4: "Service Areas",
  5: "CNIC Verification",
  6: "Review & Submit",
};

export function StepProgressHeader({
  currentStep,
}: {
  currentStep: WizardStep;
}) {
  if (currentStep === "success") return null;

  const stepNumber = typeof currentStep === "number" ? currentStep : 1;
  const badgeLabel = STEP_LABELS[stepNumber] ?? "Onboarding";

  return (
    <div className="mb-4" id="progress-header-container">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-navy">
          Step {stepNumber} of 6
        </span>
        <span className="rounded-full border border-teal/20 bg-teal/10 px-2.5 py-0.5 text-[11px] font-bold text-teal">
          {badgeLabel}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((step) => {
          const isCompletedOrCurrent = step <= stepNumber;
          return (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isCompletedOrCurrent ? "bg-teal shadow-xs" : "bg-slate-200"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
