"use client";

import { useWorkerWizard } from "../hooks/use-worker-wizard";
import { LeftShowcase } from "./left-showcase";
import { StepProgressHeader } from "./step-progress-header";
import { Step1PersonalDetails } from "./step1-personal-details";
import { Step2Skills } from "./step2-skills";
import { Step3Experience } from "./step3-experience";
import { Step4ServiceAreas } from "./step4-service-areas";
import { Step5Documents } from "./step5-documents";
import { Step6Review } from "./step6-review";
import { OnboardingSuccess } from "./onboarding-success";

export function WizardShell() {
  const {
    currentStep,
    formData,
    stepError,
    isSubmitting,
    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    submitFinalProfile,
  } = useWorkerWizard();

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-white text-navy flex flex-col antialiased">
      <main
        className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-screen min-h-[100dvh] w-full"
        data-purpose="worker-onboarding-wizard"
      >
        {/* Left Visual Showcase (Full-Screen Edge-to-Edge Panel) */}
        <LeftShowcase />

        {/* Right Interactive Form Container (Seamless Workspace) */}
        <section
          className="flex flex-1 flex-col justify-between bg-white px-4 py-5 sm:px-8 sm:py-8 lg:px-12 lg:py-10 lg:col-span-7 xl:col-span-7 min-h-screen min-h-[100dvh]"
          data-purpose="worker-registration-form"
        >
          <div
            className="mx-auto flex w-full max-w-[540px] flex-1 flex-col justify-between"
            id="wizard-container"
          >
            <div className="flex-1 flex flex-col justify-between">
              {/* Stepper Progress Header */}
              <StepProgressHeader currentStep={currentStep} />

              {/* Step Forms */}
              <div className="flex-1 flex flex-col justify-between pt-1 pb-2">
                {currentStep === 1 && (
                  <Step1PersonalDetails
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={nextStep}
                    stepError={stepError}
                  />
                )}

                {currentStep === 2 && (
                  <Step2Skills
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    stepError={stepError}
                  />
                )}

                {currentStep === 3 && (
                  <Step3Experience
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    stepError={stepError}
                  />
                )}

                {currentStep === 4 && (
                  <Step4ServiceAreas
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    stepError={stepError}
                  />
                )}

                {currentStep === 5 && (
                  <Step5Documents
                    formData={formData}
                    updateFormData={updateFormData}
                    onNext={nextStep}
                    onPrev={prevStep}
                    stepError={stepError}
                  />
                )}

                {currentStep === 6 && (
                  <Step6Review
                    formData={formData}
                    onPrev={prevStep}
                    onGoToStep={goToStep}
                    onSubmit={submitFinalProfile}
                    isSubmitting={isSubmitting}
                    stepError={stepError}
                  />
                )}

                {currentStep === "success" && <OnboardingSuccess />}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
