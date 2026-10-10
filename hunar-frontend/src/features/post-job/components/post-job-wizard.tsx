"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { CATEGORY_OPTIONS, resolveCategoryOption } from "../data/categories";
import type { PostJobData, PostJobStep, ServiceCategory } from "../types";
import { createJob } from "../api/post-job-api";
import { ApiError } from "@/lib/api-client";
import { toLocalDateString } from "@/lib/format";
import { JobPostedSuccessModal } from "./job-posted-success-modal";
import { Step2JobDetails } from "./step-2-job-details";
import { Step3LocationSchedule } from "./step-3-location-schedule";
import { Step4ReviewPost } from "./step-4-review-post";
import { WizardProgressStepper } from "./wizard-progress-stepper";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";

const DRAFT_STORAGE_KEY = "workerfix_customer_post_job_draft";

function getStoredDraft(): Partial<PostJobData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function persistDraft(data: PostJobData) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

const INITIAL_FORM_DATA: PostJobData = {
  category: "",
  subCategory: "",
  title: "",
  description: "",
  photos: [],
  voiceNoteUrl: undefined,
  voiceNoteDuration: undefined,
  address: "",
  area: "",
  city: "Peshawar",
  landmark: "",
  latitude: undefined,
  longitude: undefined,
  scheduleType: "asap",
  preferredDate: toLocalDateString(),
  preferredTimeSlot: "8:00 AM - 12:00 PM",
  suggestedVisitFee: 800,
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

  const [currentStep, setCurrentStep] = useState<PostJobStep>(2);
  const [formData, setFormData] = useState<PostJobData>(() => {
    const saved = getStoredDraft();
    if (initialCategoryMatch) {
      return {
        ...INITIAL_FORM_DATA,
        ...(saved || {}),
        category: initialCategoryMatch.id,
        subCategory:
          subCategoryParam ||
          (saved?.category === initialCategoryMatch.id && saved?.subCategory
            ? saved.subCategory
            : initialCategoryMatch.subCategories[0] || ""),
        title:
          subCategoryParam ||
          (saved?.title ? saved.title : initialCategoryMatch.defaultTitle || ""),
        description:
          saved?.description || initialCategoryMatch.defaultDescription || "",
        suggestedVisitFee:
          saved?.suggestedVisitFee || initialCategoryMatch.suggestedFee || 0,
      };
    }
    return saved ? { ...INITIAL_FORM_DATA, ...saved } : INITIAL_FORM_DATA;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // If accessed directly without selecting a category, redirect to Step 1 on the dashboard
  useEffect(() => {
    if (!initialCategoryMatch) {
      router.replace("/customer/dashboard");
    }
  }, [initialCategoryMatch, router]);

  // Persist form draft in sessionStorage so navigating to dashboard and back preserves user input
  useEffect(() => {
    persistDraft(formData);
  }, [formData]);

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
          suggestedVisitFee: match.suggestedFee || 0,
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
    if (currentStep > 2) {
      setCurrentStep((prev) => (prev - 1) as PostJobStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Step 1 is the Customer Dashboard service selection
      router.push("/customer/dashboard");
    }
  };
  const handlePrevStep = handleBack;

  const handleGoToStep = (step: PostJobStep) => {
    if (step === 1) {
      // Navigate to Step 1 (Customer Dashboard service selection)
      router.push("/customer/dashboard");
      return;
    }
    if (step <= currentStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitJob = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Submits job with unified visit timing
      const res = await createJob(formData);
      clearDraft();
      setPostedJobId(res.id);
    } catch (err) {
      console.error("Failed to post job:", err);
      const isAuthError = err instanceof ApiError && err.status === 401;
      setSubmitError(
        isAuthError
          ? "Your session has expired. Please sign in again and retry."
          : err instanceof Error && err.message
            ? err.message
            : "Could not post your job. Please check your connection and try again.",
      );
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
          <WorkerFixLogo variant="dark" size="sm" />
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
      <main className="flex-grow w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-4 flex flex-col">
        {/* Modern Redesigned Step Progression Stepper */}
        <WizardProgressStepper
          currentStep={currentStep}
          onGoToStep={handleGoToStep}
          locale={locale}
        />

        {/* Step View Component */}
        <div className="flex-1">
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
              submitError={submitError}
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
