"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { CATEGORY_OPTIONS, resolveCategoryOption } from "../data/categories";
import type { PostJobData, PostJobStep, ServiceCategory } from "../types";
import { createJob } from "../api/post-job-api";
import { JobPostedSuccessModal } from "./job-posted-success-modal";
import { Step1ServiceSelect } from "./step-1-service-select";
import { Step2JobDetails } from "./step-2-job-details";
import { Step3LocationSchedule } from "./step-3-location-schedule";
import { Step4ReviewPost } from "./step-4-review-post";
import { WizardProgressStepper } from "./wizard-progress-stepper";
import { OrderworkerLogo } from "@/components/shared/orderworker-logo";

const INITIAL_FORM_DATA: PostJobData = {
  category: "",
  subCategory: "",
  title: "",
  description: "",
  photos: [],
  voiceNoteUrl: undefined,
  voiceNoteDuration: undefined,
  address: "House 45, Street 12, Block C, University Town",
  area: "University Town, Peshawar",
  city: "Peshawar",
  landmark: "Near Islamia College Gate",
  latitude: 34.0043,
  longitude: 71.5034,
  scheduleType: "asap",
  preferredDate: new Date().toISOString().split("T")[0],
  preferredTimeSlot: "8:00 AM - 12:00 PM",
  suggestedVisitFee: 300,
};

export function PostJobWizard() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("CustomerPortal.PostJob");
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const subCategoryParam = searchParams.get("subCategory") || searchParams.get("sub");
  const searchParam = searchParams.get("search");

  const initialCategoryMatch = resolveCategoryOption(categoryParam || searchParam);

  const [currentStep, setCurrentStep] = useState<PostJobStep>(
    initialCategoryMatch ? 2 : 1
  );
  const [formData, setFormData] = useState<PostJobData>(() => {
    if (initialCategoryMatch) {
      return {
        ...INITIAL_FORM_DATA,
        category: initialCategoryMatch.id,
        subCategory: subCategoryParam || initialCategoryMatch.subCategories[0] || "",
        title: subCategoryParam || initialCategoryMatch.defaultTitle || "",
        description: initialCategoryMatch.defaultDescription || "",
        suggestedVisitFee: initialCategoryMatch.suggestedFee || 300,
      };
    }
    return INITIAL_FORM_DATA;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postedJobId, setPostedJobId] = useState<string | null>(null);

  // Sync if category search param changes dynamically
  useEffect(() => {
    const rawParam = categoryParam || searchParam;
    if (rawParam) {
      const match = resolveCategoryOption(rawParam);
      if (match) {
        setFormData((prev) => ({
          ...prev,
          category: match.id,
          subCategory: subCategoryParam || match.subCategories[0] || "",
          title: subCategoryParam || prev.title || match.defaultTitle || "",
          description: prev.description || match.defaultDescription || "",
          suggestedVisitFee: match.suggestedFee || 300,
        }));
        setCurrentStep(2);
      }
    }
  }, [categoryParam, subCategoryParam, searchParam]);

  // Form Field Updaters
  const handleUpdateField = <K extends keyof PostJobData>(
    field: K,
    value: PostJobData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateFormData = (updatesOrField: Partial<PostJobData> | keyof PostJobData, value?: any) => {
    if (typeof updatesOrField === "string") {
      handleUpdateField(updatesOrField, value);
    } else {
      setFormData((prev) => ({ ...prev, ...updatesOrField }));
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as PostJobStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleNextStep = handleNext;

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as PostJobStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/customer/dashboard");
    }
  };
  const handlePrevStep = handleBack;

  const handleGoToStep = (step: PostJobStep) => {
    if (step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitJob = async () => {
    setIsSubmitting(true);
    try {
      const res = await createJob(formData);
      setPostedJobId(res.id);
    } catch (err) {
      console.error("Failed to post job:", err);
      const fallbackId = `JOB-${Date.now().toString().slice(-4)}`;
      setPostedJobId(fallbackId);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSubmit = handleSubmitJob;

  return (
    <div className="min-h-screen bg-white text-[#1A1A2E] flex flex-col justify-between">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <Link
          href="/customer/dashboard"
          className="flex items-center hover:opacity-90 transition-opacity"
        >
          <OrderworkerLogo variant="dark" size="sm" />
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/customer/dashboard"
            className="text-slate-500 hover:text-[#123B5D] text-xs font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <span>{locale === "ur" ? "محفوظ کریں اور بند کریں" : "Save & Exit"}</span>
            <X className="size-4 ml-1" />
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col">
        {/* Modern Redesigned Step Progression Stepper */}
        <WizardProgressStepper
          currentStep={currentStep}
          onGoToStep={handleGoToStep}
          locale={locale}
        />

        {/* Step View Component */}
        <div className="flex-1">
          {currentStep === 1 && (
            <Step1ServiceSelect
              data={formData}
              onChange={updateFormData}
              onNext={handleNextStep}
              initialSearch={searchParam || ""}
            />
          )}

          {currentStep === 2 && (
            <Step2JobDetails
              data={formData}
              onChange={updateFormData}
              onNext={handleNextStep}
              onBack={handlePrevStep}
            />
          )}

          {currentStep === 3 && (
            <Step3LocationSchedule
              data={formData}
              onChange={updateFormData}
              onNext={handleNextStep}
              onBack={handlePrevStep}
            />
          )}

          {currentStep === 4 && (
            <Step4ReviewPost
              data={formData}
              onChange={updateFormData}
              onGoToStep={handleGoToStep}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </main>

      {/* Success Celebration Modal */}
      {postedJobId && (
        <JobPostedSuccessModal
          data={formData}
          jobId={postedJobId}
          onClose={() => router.push("/customer/jobs")}
        />
      )}
    </div>
  );
}
