"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getStoredUser } from "@/lib/api-client";
import type { WizardStep, WorkerProfileFormData } from "../types";
import { fetchWorkerOnboardingProfile, submitWorkerProfile } from "../api/onboarding-api";

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
  coverageRadius: "Up to 20 km",
  primaryAddress: "",
  cnicFront: "",
  cnicFrontName: "",
  cnicBack: "",
  cnicBackName: "",
  cnicNumber: "",
};

export function useWorkerWizard() {
  const tVal = useTranslations("WorkerOnboarding.Validation");
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<WorkerProfileFormData>(cleanDefaultFormData);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize from storage and sync with server draft
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

    // Server profile sync
    fetchWorkerOnboardingProfile().then((serverData) => {
      if (!serverData) return;
      setFormData((prev) => {
        const cnicFrontDoc = serverData.documents?.find((d) => d.type === "CNIC_FRONT");
        const cnicBackDoc = serverData.documents?.find((d) => d.type === "CNIC_BACK");
        const certDoc = serverData.documents?.find((d) => d.type === "CERTIFICATE");
        const areaLabels = serverData.serviceAreas?.map((a) => a.label) || [];

        return {
          ...prev,
          fullName: serverData.user?.name || prev.fullName,
          phone: serverData.user?.phone || prev.phone,
          profilePhoto: serverData.user?.avatarUrl || prev.profilePhoto,
          skills: serverData.workerProfile?.skills?.length ? serverData.workerProfile.skills : prev.skills,
          experienceYears: serverData.workerProfile?.experienceYears ? String(serverData.workerProfile.experienceYears) : prev.experienceYears,
          bio: serverData.workerProfile?.bio || prev.bio,
          serviceAreas: areaLabels.length ? areaLabels : prev.serviceAreas,
          cnicFront: cnicFrontDoc?.url || prev.cnicFront,
          cnicFrontName: cnicFrontDoc?.fileName || prev.cnicFrontName,
          cnicBack: cnicBackDoc?.url || prev.cnicBack,
          cnicBackName: cnicBackDoc?.fileName || prev.cnicBackName,
          certificateFile: certDoc?.url || prev.certificateFile,
          certificateName: certDoc?.fileName || prev.certificateName,
        };
      });
    });
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
      if (step === 1) {
        if (!formData.profilePhoto || formData.profilePhoto.trim() === "") {
          setStepError(tVal("photoRequired"));
          return false;
        }
        if (!formData.fullName || formData.fullName.trim().length < 2) {
          setStepError(tVal("fullNameRequired"));
          return false;
        }
        if (!formData.phone || formData.phone.trim().length < 10) {
          setStepError(tVal("phoneRequired"));
          return false;
        }
        if (!formData.city || formData.city.trim() === "") {
          setStepError(tVal("cityRequired"));
          return false;
        }
        if (formData.email && formData.email.trim() !== "") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData.email)) {
            setStepError(tVal("validEmail"));
            return false;
          }
        }
      } else if (step === 2) {
        if (!formData.skills || formData.skills.length === 0) {
          setStepError(tVal("skillRequired"));
          return false;
        }
      } else if (step === 3) {
        if (!formData.experienceYears || formData.experienceYears.trim() === "") {
          setStepError(tVal("experienceRequired"));
          return false;
        }
        if (!formData.bio || formData.bio.trim().length < 10) {
          setStepError(tVal("bioRequired"));
          return false;
        }
      } else if (step === 4) {
        if (!formData.serviceAreas || formData.serviceAreas.length === 0) {
          setStepError(tVal("areaRequired"));
          return false;
        }
        if (!formData.primaryAddress || formData.primaryAddress.trim().length < 3) {
          setStepError(tVal("addressRequired"));
          return false;
        }
        if (!formData.coverageRadius || formData.coverageRadius.trim() === "") {
          setStepError(tVal("radiusRequired"));
          return false;
        }
      } else if (step === 5) {
        if (!formData.cnicFront || formData.cnicFront.trim() === "") {
          setStepError(tVal("cnicFrontRequired"));
          return false;
        }
        if (!formData.cnicBack || formData.cnicBack.trim() === "") {
          setStepError(tVal("cnicBackRequired"));
          return false;
        }
      }
      return true;
    },
    [formData, tVal],
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
