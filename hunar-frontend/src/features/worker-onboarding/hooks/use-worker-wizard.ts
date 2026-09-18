"use client";

import { useCallback, useEffect, useState } from "react";
import { getStoredUser } from "@/lib/api-client";
import type { WizardStep, WorkerProfileFormData } from "../types";
import {
  step1PersonalSchema,
  step2SkillsSchema,
  step3ExperienceSchema,
  step4ServiceAreasSchema,
  step5DocumentsSchema,
} from "../schemas";
import { submitWorkerProfile } from "../api/onboarding-api";

const STORAGE_KEY = "hunar.worker_onboarding_draft";

const cleanDefaultFormData: WorkerProfileFormData = {
  fullName: "",
  email: "",
  phone: "",
  city: "Peshawar",
  profilePhoto: "",
  profilePhotoName: "",
  skills: [],
  experienceYears: "",
  bio: "",
  certificateFile: "",
  certificateName: "",
  serviceAreas: [],
  coverageRadius: "20 km",
  primaryAddress: "",
  cnicFront: "",
  cnicFrontName: "",
  cnicBack: "",
  cnicBackName: "",
  cnicNumber: "",
};

export function useWorkerWizard() {
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<WorkerProfileFormData>(cleanDefaultFormData);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from storage or logged in user phone
  useEffect(() => {
    const storedUser = getStoredUser();
    const savedDraft = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          phone: storedUser?.phone || parsed.phone || prev.phone,
          fullName: parsed.fullName || storedUser?.name || prev.fullName,
        }));
      } catch {
        // use defaults
      }
    } else if (storedUser?.phone) {
      setFormData((prev) => ({
        ...prev,
        phone: storedUser.phone,
        fullName: storedUser.name || prev.fullName,
      }));
    }
  }, []);

  const updateFormData = useCallback((partial: Partial<WorkerProfileFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore storage quota issues
        }
      }
      return next;
    });
    setStepError(null);
  }, []);

  const validateStep = useCallback(
    (step: WizardStep): boolean => {
      setStepError(null);
      try {
        if (step === 1) {
          step1PersonalSchema.parse({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            city: formData.city,
            profilePhoto: formData.profilePhoto,
          });
        } else if (step === 2) {
          step2SkillsSchema.parse({
            skills: formData.skills,
          });
        } else if (step === 3) {
          step3ExperienceSchema.parse({
            experienceYears: formData.experienceYears,
            bio: formData.bio,
            certificateFile: formData.certificateFile,
          });
        } else if (step === 4) {
          step4ServiceAreasSchema.parse({
            serviceAreas: formData.serviceAreas,
            coverageRadius: formData.coverageRadius,
            primaryAddress: formData.primaryAddress,
          });
        } else if (step === 5) {
          step5DocumentsSchema.parse({
            cnicFront: formData.cnicFront,
            cnicBack: formData.cnicBack,
            cnicNumber: formData.cnicNumber,
          });
        }
        return true;
      } catch (err: unknown) {
        if (err && typeof err === "object" && "issues" in err) {
          const issues = (err as { issues: { message: string }[] }).issues;
          if (issues.length > 0) {
            setStepError(issues[0].message);
          }
        } else {
          setStepError("Please check all required fields.");
        }
        return false;
      }
    },
    [formData],
  );

  const goToStep = useCallback(
    (step: WizardStep) => {
      setStepError(null);
      setCurrentStep(step);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [],
  );

  const nextStep = useCallback(() => {
    if (typeof currentStep === "number") {
      if (!validateStep(currentStep)) {
        return;
      }
      if (currentStep < 6) {
        goToStep((currentStep + 1) as WizardStep);
      }
    }
  }, [currentStep, validateStep, goToStep]);

  const prevStep = useCallback(() => {
    if (typeof currentStep === "number" && currentStep > 1) {
      goToStep((currentStep - 1) as WizardStep);
    }
  }, [currentStep, goToStep]);

  const submitFinalProfile = useCallback(async () => {
    setIsSubmitting(true);
    setStepError(null);
    try {
      const res = await submitWorkerProfile(formData);
      if (res.success) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(STORAGE_KEY);
        }
        goToStep("success");
      } else {
        setStepError(res.message || "Failed to submit profile.");
      }
    } catch (e: unknown) {
      setStepError(e instanceof Error ? e.message : "Error submitting profile.");
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, goToStep]);

  return {
    currentStep,
    formData,
    stepError,
    isSubmitting,
    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    submitFinalProfile,
  };
}
