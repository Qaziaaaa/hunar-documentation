"use client";

import { useEffect, useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import {
  CATEGORY_OPTIONS,
  resolveCategoryOption,
  createCustomCategoryOption,
} from "../data/categories";
import type { PostJobData, PostJobStep, ServiceCategory } from "../types";
import { createJob } from "../api/post-job-api";
import { buildPostJobSignInHref } from "../lib/return-url";
import { ApiError, getAccessToken, getStoredUser } from "@/lib/api-client";
import { toLocalDateString } from "@/lib/format";
import { JobPostedSuccessModal } from "./job-posted-success-modal";
import { Step2JobDetails } from "./step-2-job-details";
import { Step3LocationSchedule } from "./step-3-location-schedule";
import { Step4ReviewPost } from "./step-4-review-post";
import { WizardProgressStepper } from "./wizard-progress-stepper";
import { WorkerFixLogo } from "@/components/shared/workerfix-logo";

const DRAFT_STORAGE_KEY = "workerfix_customer_post_job_draft";
const ALT_DRAFT_KEY = "workerfix_draft_job";

function getStoredDraft(): Partial<PostJobData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      sessionStorage.getItem(DRAFT_STORAGE_KEY) ??
      localStorage.getItem(DRAFT_STORAGE_KEY) ??
      sessionStorage.getItem(ALT_DRAFT_KEY) ??
      localStorage.getItem(ALT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PostJobData>;
  } catch {
    return null;
  }
}

function persistDraft(data: PostJobData) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(data);
    sessionStorage.setItem(DRAFT_STORAGE_KEY, raw);
    localStorage.setItem(DRAFT_STORAGE_KEY, raw);
    sessionStorage.setItem(ALT_DRAFT_KEY, raw);
    localStorage.setItem(ALT_DRAFT_KEY, raw);
  } catch {
    // ignore
  }
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    sessionStorage.removeItem(ALT_DRAFT_KEY);
    localStorage.removeItem(ALT_DRAFT_KEY);
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
  const queryClient = useQueryClient();
  const locale = useLocale();
  const t = useTranslations("CustomerPortal.PostJob");
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const categoryIdParam = searchParams.get("categoryId");
  const categoryNameParam = searchParams.get("categoryName");
  const categoryNameUrduParam = searchParams.get("categoryNameUrdu");
  const subCategoryParam = searchParams.get("subCategory") || searchParams.get("sub");
  const searchParam = searchParams.get("search");
  const shouldResumeReview = searchParams.get("resume") === "review";

  const resolveTargetCategory = (query: string | null | undefined) => {
    if (!query) return undefined;
    const standardMatch = resolveCategoryOption(query);
    if (standardMatch) return standardMatch;
    if (categoryNameParam || categoryParam || categoryIdParam) {
      return createCustomCategoryOption(
        categoryIdParam || categoryParam || categoryNameParam || query,
        categoryNameParam || query,
        categoryNameUrduParam || undefined
      );
    }
    return undefined;
  };

  const initialCategoryMatch = resolveTargetCategory(
    categoryParam || searchParam || categoryIdParam || categoryNameParam
  );

  const [currentStep, setCurrentStep] = useState<PostJobStep>(
    shouldResumeReview ? 4 : 2
  );
  const [maxVisitedStep, setMaxVisitedStep] = useState<PostJobStep>(
    shouldResumeReview ? 4 : 2
  );
  const [formData, setFormData] = useState<PostJobData>(() => {
    return initialCategoryMatch
      ? {
          ...INITIAL_FORM_DATA,
          category: initialCategoryMatch.id,
          subCategory: subCategoryParam || initialCategoryMatch.subCategories[0] || "",
          title: subCategoryParam || "",
          suggestedVisitFee: initialCategoryMatch.suggestedFee || 0,
        }
      : INITIAL_FORM_DATA;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postedJobId, setPostedJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isHydratedRef = useRef(false);
  const isFirstMountRef = useRef(true);

  // Restore and merge draft from storage without losing any fields
  useEffect(() => {
    const saved = getStoredDraft();
    if (saved) {
      const isDifferentCategory = Boolean(
        initialCategoryMatch &&
        saved.category &&
        saved.category.toLowerCase() !== initialCategoryMatch.id.toLowerCase()
      );

      if (isDifferentCategory) {
        // Discard old category draft state from storage so new category starts fresh
        setFormData((prev) => ({
          ...prev,
          category: initialCategoryMatch!.id,
          subCategory: subCategoryParam || initialCategoryMatch!.subCategories[0] || "",
          title: subCategoryParam || "",
          description: "",
          photos: [],
          voiceNoteUrl: undefined,
          voiceNoteDuration: undefined,
          suggestedVisitFee: initialCategoryMatch!.suggestedFee || 500,
          address: saved.address || prev.address,
          area: saved.area || prev.area,
          city: saved.city || prev.city || "Peshawar",
          landmark: saved.landmark || prev.landmark,
          latitude: saved.latitude ?? prev.latitude,
          longitude: saved.longitude ?? prev.longitude,
          scheduleType: saved.scheduleType || prev.scheduleType,
          preferredDate: saved.preferredDate || prev.preferredDate,
          preferredTimeSlot: saved.preferredTimeSlot || prev.preferredTimeSlot,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          ...saved,
          category: saved.category || initialCategoryMatch?.id || prev.category,
          subCategory: saved.subCategory || subCategoryParam || prev.subCategory,
          title: saved.title || prev.title,
          description: saved.description !== undefined ? saved.description : prev.description,
          address: saved.address !== undefined ? saved.address : prev.address,
          area: saved.area !== undefined ? saved.area : prev.area,
          city: saved.city || prev.city || "Peshawar",
          landmark: saved.landmark !== undefined ? saved.landmark : prev.landmark,
          latitude: saved.latitude !== undefined ? saved.latitude : prev.latitude,
          longitude: saved.longitude !== undefined ? saved.longitude : prev.longitude,
          scheduleType: saved.scheduleType || prev.scheduleType,
          preferredDate: saved.preferredDate || prev.preferredDate,
          preferredTimeSlot: saved.preferredTimeSlot || prev.preferredTimeSlot,
          photos:
            saved.photos && saved.photos.length > 0
              ? saved.photos.slice(0, 3)
              : prev.photos,
          voiceNoteUrl: saved.voiceNoteUrl || prev.voiceNoteUrl,
          voiceNoteDuration: saved.voiceNoteDuration || prev.voiceNoteDuration,
          suggestedVisitFee: saved.suggestedVisitFee || prev.suggestedVisitFee,
        }));
        if (shouldResumeReview) {
          setCurrentStep(4);
        }
      }
    }
    isHydratedRef.current = true;
  }, [shouldResumeReview, initialCategoryMatch?.id, subCategoryParam]);

  // If accessed directly without selecting a category, redirect to Step 1 on the dashboard.
  // Skipped when resuming at Step 4 after authentication (draft restores the category).
  useEffect(() => {
    if (initialCategoryMatch) return;
    if (shouldResumeReview && getStoredDraft()?.category) return;
    router.replace("/customer/dashboard");
  }, [initialCategoryMatch, shouldResumeReview, router]);

  // Persist form draft ONLY after hydration to prevent overwriting with initial state
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (isHydratedRef.current) {
      persistDraft(formData);
    }
  }, [formData]);

  // Sync if category search param changes dynamically without clobbering existing user inputs
  useEffect(() => {
    if (shouldResumeReview) return;
    const rawParam = categoryParam || searchParam || categoryIdParam || categoryNameParam;
    if (rawParam) {
      const match = resolveTargetCategory(rawParam);
      if (match) {
        setFormData((prev) => {
          if (prev.category === match.id) {
            return prev;
          }
          return {
            ...prev,
            category: match.id,
            subCategory: subCategoryParam || match.subCategories[0] || "",
            title: subCategoryParam || "",
            description: "",
            photos: [],
            voiceNoteUrl: undefined,
            voiceNoteDuration: undefined,
            suggestedVisitFee: match.suggestedFee || prev.suggestedVisitFee || 500,
          };
        });
      }
    }
  }, [categoryParam, subCategoryParam, searchParam, categoryIdParam, categoryNameParam, shouldResumeReview]);

  // Form Field Updaters
  const handleUpdateField = <K extends keyof PostJobData>(
    field: K,
    value: PostJobData[K]
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      persistDraft(updated);
      return updated;
    });
  };

  const updateFormData = (updatesOrField: Partial<PostJobData> | keyof PostJobData, value?: any) => {
    if (typeof updatesOrField === "string") {
      handleUpdateField(updatesOrField, value);
    } else {
      setFormData((prev) => {
        const updated = { ...prev, ...updatesOrField };
        persistDraft(updated);
        return updated;
      });
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      const next = (currentStep + 1) as PostJobStep;
      setCurrentStep(next);
      setMaxVisitedStep((prev) => Math.max(prev, next) as PostJobStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handleNextStep = handleNext;

  // Helper to reliably check for a valid customer authentication session
  const getCustomerAuthToken = (): string | null => {
    const directToken = getAccessToken("CUSTOMER");
    if (directToken) return directToken;

    const genericToken = getAccessToken();
    if (genericToken) {
      const stored = getStoredUser("CUSTOMER") ?? getStoredUser();
      if (stored?.role === "WORKER" || stored?.role === "ADMIN") {
        return null;
      }
      return genericToken;
    }
    return null;
  };

  // Step 3 -> Step 4 requires an authenticated customer. Unauthenticated users
  // are sent to sign in and returned to Step 4 with the draft preserved.
  const handleStep3Next = () => {
    persistDraft(formData);
    const customerToken = getCustomerAuthToken();
    if (customerToken) {
      setCurrentStep(4);
      setMaxVisitedStep(4);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push(buildPostJobSignInHref(formData));
  };

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
    if (step <= maxVisitedStep) {
      setCurrentStep(step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmitJob = async () => {
    const customerToken = getCustomerAuthToken();
    const storedUser = getStoredUser("CUSTOMER") ?? getStoredUser();

    if (!customerToken) {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("workerfix_draft_job", JSON.stringify(formData));
        } catch {}
      }
      if (storedUser?.role === "WORKER") {
        setSubmitError(
          locale === "ur"
            ? "آپ اس وقت کاریگر (ورکر) اکاؤنٹ میں لاگ ان ہیں۔ کسٹمر کی حیثیت سے جاب پوسٹ کرنے کے لیے براہ کرم کسٹمر اکاؤنٹ میں لاگ ان کریں۔"
            : "You are currently signed in as a Worker. Please sign in with a Customer account to post jobs."
        );
      } else {
        setSubmitError(
          locale === "ur"
            ? "جاب پوسٹ کرنے کے لیے براہ کرم کسٹمر اکاؤنٹ میں لاگ ان کریں۔"
            : "Please sign in with a Customer account to publish this job."
        );
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // Submits job with unified visit timing
      const res = await createJob(formData);
      clearDraft();
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("workerfix_draft_job");
        } catch {}
      }
      void queryClient.invalidateQueries({ queryKey: ["customer", "jobs"] });
      setPostedJobId(res.id);
    } catch (err) {
      console.error("Failed to post job:", err);
      const isAuthError = err instanceof ApiError && (err.status === 401 || err.status === 403);
      if (isAuthError) {
        setSubmitError(
          storedUser?.role === "WORKER"
            ? (locale === "ur"
                ? "ورکر اکاؤنٹ سے جاب پوسٹ نہیں ہو سکتی۔ براہ کرم کسٹمر اکاؤنٹ میں لاگ ان کریں۔"
                : "Worker accounts cannot post jobs. Please sign in with a Customer account.")
            : (locale === "ur"
                ? "آپ کا کسٹمر سیشن ختم ہو چکا ہے۔ براہ کرم دوبارہ لاگ ان کریں۔"
                : "Your customer session expired. Please sign in again.")
        );
      } else {
        const isNetworkError =
          (err instanceof TypeError && err.message?.includes("Failed to fetch")) ||
          (err instanceof Error && (err.message?.includes("NetworkError") || err.message?.includes("Failed to fetch")));
        if (isNetworkError) {
          setSubmitError(
            locale === "ur"
              ? "سرور سے رابطہ قائم نہیں ہو سکا۔ براہ کرم اپنا انٹرنیٹ چیک کریں یا یقینی بنائیں کہ بیک اینڈ فعال ہے۔"
              : "Unable to reach the server. Please check your connection or verify that the backend server is running."
          );
        } else {
          setSubmitError(
            err instanceof Error && err.message
              ? err.message
              : "Could not post your job. Please check your connection and try again.",
          );
        }
      }
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
          maxVisitedStep={maxVisitedStep}
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
              onNext={handleStep3Next}
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
