"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { clearTokens, getAccessToken, getStoredUser } from "@/lib/api-client";
import { useRouter } from "@/i18n/navigation";
import type { WizardStep, WorkerProfileFormData } from "../types";
import { fetchWorkerOnboardingProfile, submitWorkerProfile } from "../api/onboarding-api";
import { PESHAWAR_AREAS } from "../components/step4-service-areas";

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

export function isPlaceholderOrDummyDoc(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed === "" ||
    trimmed.startsWith("data:") ||
    trimmed.includes("placehold.co") ||
    trimmed.includes("unsplash.com") ||
    trimmed.includes("placeholder") ||
    trimmed.includes("text=cnic") ||
    trimmed.includes("mock") ||
    trimmed.includes("dummy")
  );
}

export function useWorkerWizard() {
  const tVal = useTranslations("WorkerOnboarding.Validation");
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [formData, setFormData] = useState<WorkerProfileFormData>(cleanDefaultFormData);
  const [stepError, setStepError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Initialize from storage and sync with server draft
  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/worker/sign-up");
      return;
    }

    const storedUser = getStoredUser();
    const savedDraft = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    const validAreaNames = new Set<string>(PESHAWAR_AREAS);

    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Sanitize skills: preserve valid strings and clean out seed/phantom test keys
        let sanitizedSkills: string[] = [];
        if (Array.isArray(parsed.skills)) {
          sanitizedSkills = parsed.skills.filter(
            (s: string) => typeof s === "string" && s.trim().length > 0 && !s.startsWith("seed-category-"),
          );
        }

        // Sanitize service areas: only keep valid PESHAWAR_AREAS; ignore invalid/phantom entries
        let sanitizedAreas: string[] = [];
        if (Array.isArray(parsed.serviceAreas)) {
          const filtered = parsed.serviceAreas.filter((a: string) => validAreaNames.has(a));
          if (filtered.length > 0 && filtered.length < PESHAWAR_AREAS.length) {
            sanitizedAreas = filtered;
          }
        }

        const cleanDraftName = typeof parsed.fullName === "string" ? parsed.fullName : "";

        // Ensure face portrait is not pre-filled by default: only keep if explicitly uploaded with a fileName
        const cleanDraftPhoto =
          parsed.profilePhoto && !parsed.profilePhotoName
            ? ""
            : parsed.profilePhoto?.startsWith("data:")
            ? ""
            : isPlaceholderOrDummyDoc(parsed.profilePhoto)
            ? ""
            : parsed.profilePhoto || "";

        // Ensure CNIC documents are not pre-filled with seed placeholder images
        const cleanCnicFront = isPlaceholderOrDummyDoc(parsed.cnicFront) ? "" : parsed.cnicFront;
        const cleanCnicFrontName = cleanCnicFront ? parsed.cnicFrontName || "" : "";
        const cleanCnicBack = isPlaceholderOrDummyDoc(parsed.cnicBack) ? "" : parsed.cnicBack;
        const cleanCnicBackName = cleanCnicBack ? parsed.cnicBackName || "" : "";
        const cleanCert = isPlaceholderOrDummyDoc(parsed.certificateFile) ? "" : parsed.certificateFile;
        const cleanCertName = cleanCert ? parsed.certificateName || "" : "";

        const nextData = {
          ...cleanDefaultFormData,
          ...parsed,
          skills: sanitizedSkills,
          serviceAreas: sanitizedAreas,
          profilePhoto: cleanDraftPhoto,
          cnicFront: cleanCnicFront,
          cnicFrontName: cleanCnicFrontName,
          cnicBack: cleanCnicBack,
          cnicBackName: cleanCnicBackName,
          certificateFile: cleanCert,
          certificateName: cleanCertName,
          phone: storedUser?.phone || parsed.phone || cleanDefaultFormData.phone,
          fullName: cleanDraftName,
        };

        setFormData(nextData);

        // Update localStorage if skills, photo, areas or fullName had test values
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
        }
      } catch {
        // use defaults
      }
    } else if (storedUser?.phone) {
      setFormData((prev) => ({
        ...prev,
        phone: storedUser.phone,
        fullName: "",
        profilePhoto: "",
        skills: [],
        serviceAreas: [],
        cnicFront: "",
        cnicFrontName: "",
        cnicBack: "",
        cnicBackName: "",
        certificateFile: "",
        certificateName: "",
      }));
    }

    // Server profile sync & route guard
    fetchWorkerOnboardingProfile().then((serverData) => {
      if (!serverData) {
        setIsCheckingAuth(false);
        return;
      }

      const vStatus = serverData.workerProfile?.verificationStatus;

      // Guard 1: Already APPROVED workers must NOT re-run onboarding (protects profile & jobs)
      if (vStatus === "APPROVED") {
        router.replace("/worker/dashboard");
        return;
      }

      // Guard 2: Workers who completed all 5 steps and are waiting for admin review belong on status page
      if (vStatus === "PENDING" && serverData.progress?.complete === true) {
        router.replace("/worker/verification-status");
        return;
      }

      setIsCheckingAuth(false);

      setFormData((prev) => {
        const cnicFrontDoc = serverData.documents?.find((d) => d.type === "CNIC_FRONT");
        const cnicBackDoc = serverData.documents?.find((d) => d.type === "CNIC_BACK");
        const certDoc = serverData.documents?.find((d) => d.type === "CERTIFICATE");
        const areaLabels = serverData.serviceAreas?.map((a) => a.label) || [];

        // Clean server skills: filter out phantom or seed-categories
        let serverSkills: string[] = [];
        if (Array.isArray(serverData.workerProfile?.skills)) {
          serverSkills = serverData.workerProfile.skills.filter(
            (s: string) => typeof s === "string" && s.trim().length > 0 && !s.startsWith("seed-category-"),
          );
        }

        const activeSkills =
          prev.skills && prev.skills.length > 0
            ? prev.skills
            : serverSkills;

        // Validate server service areas against PESHAWAR_AREAS
        let serverAreas: string[] = [];
        if (Array.isArray(areaLabels)) {
          const filtered = areaLabels.filter((a: string) => validAreaNames.has(a));
          if (filtered.length > 0 && filtered.length < PESHAWAR_AREAS.length) {
            serverAreas = filtered;
          }
        }

        // Service areas must strictly be 0 selected unless worker previously chose an explicit subset
        const activeAreas =
          prev.serviceAreas && prev.serviceAreas.length > 0
            ? prev.serviceAreas.filter((a) => validAreaNames.has(a))
            : serverAreas;

        const cleanServerName = serverData.user?.name || "";

        // Clean out seed placeholder CNIC documents from server
        const cleanServerFront = isPlaceholderOrDummyDoc(cnicFrontDoc?.url) ? "" : cnicFrontDoc!.url;
        const cleanServerBack = isPlaceholderOrDummyDoc(cnicBackDoc?.url) ? "" : cnicBackDoc!.url;
        const cleanServerCert = isPlaceholderOrDummyDoc(certDoc?.url) ? "" : certDoc!.url;

        const activeFront = cleanServerFront || (isPlaceholderOrDummyDoc(prev.cnicFront) ? "" : prev.cnicFront);
        const activeFrontName = activeFront
          ? (cleanServerFront ? (cnicFrontDoc?.fileName || "") : prev.cnicFrontName)
          : "";

        const activeBack = cleanServerBack || (isPlaceholderOrDummyDoc(prev.cnicBack) ? "" : prev.cnicBack);
        const activeBackName = activeBack
          ? (cleanServerBack ? (cnicBackDoc?.fileName || "") : prev.cnicBackName)
          : "";

        const activeCert = cleanServerCert || (isPlaceholderOrDummyDoc(prev.certificateFile) ? "" : prev.certificateFile);
        const activeCertName = activeCert
          ? (cleanServerCert ? (certDoc?.fileName || "") : prev.certificateName)
          : "";

        const nextSyncedData = {
          ...prev,
          fullName: prev.fullName || cleanServerName || "",
          phone: serverData.user?.phone || prev.phone,
          profilePhoto: isPlaceholderOrDummyDoc(prev.profilePhoto) ? "" : prev.profilePhoto,
          skills: activeSkills,
          experienceYears: serverData.workerProfile?.experienceYears ? String(serverData.workerProfile.experienceYears) : prev.experienceYears,
          bio: serverData.workerProfile?.bio || prev.bio,
          serviceAreas: activeAreas,
          cnicFront: activeFront,
          cnicFrontName: activeFrontName,
          cnicBack: activeBack,
          cnicBackName: activeBackName,
          certificateFile: activeCert,
          certificateName: activeCertName,
        };

        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSyncedData));
          } catch {
            // ignore storage quota issues
          }
        }

        return nextSyncedData;
      });
    }).catch((err) => {
      setIsCheckingAuth(false);
      // Sync is best-effort: local draft stays authoritative if the server is unreachable
      console.warn("[useWorkerWizard] server profile sync skipped:", err);
    });
  }, [router]);

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
        if (!formData.cnicFront || formData.cnicFront.trim() === "" || isPlaceholderOrDummyDoc(formData.cnicFront)) {
          setStepError(tVal("cnicFrontRequired"));
          return false;
        }
        if (!formData.cnicBack || formData.cnicBack.trim() === "" || isPlaceholderOrDummyDoc(formData.cnicBack)) {
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

  const logoutAndSwitchWorker = useCallback(() => {
    clearTokens("WORKER");
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    router.replace("/worker/sign-up");
  }, [router]);


  return {
    currentStep,
    formData,
    stepError,
    isSubmitting,
    isCheckingAuth,
    logoutAndSwitchWorker,
    updateFormData,
    goToStep,
    nextStep,
    prevStep,
    submitFinalProfile,
  };
}

