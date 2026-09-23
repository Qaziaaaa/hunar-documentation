import { http, type StoredUser } from "@/lib/api-client";
import type { WorkerProfileFormData } from "../types";

export interface SubmitProfileResponse {
  success: boolean;
  message: string;
  status: "PENDING_VERIFICATION" | "APPROVED" | "REJECTED" | "NOT_SUBMITTED";
  workerId?: string;
  error?: string;
}

export interface WorkerOnboardingApiResponse {
  user: {
    id: string;
    phone: string;
    name?: string | null;
    avatarUrl?: string | null;
    role: string;
  };
  workerProfile: {
    skills: string[];
    experienceYears?: number | null;
    bio?: string | null;
    isAvailable: boolean;
    serviceRadiusKm: number;
    verificationStatus: string;
    submittedAt?: string | null;
    verifiedAt?: string | null;
    rejectionReason?: string | null;
    adminNote?: string | null;
  } | null;
  serviceAreas: Array<{
    id: string;
    label: string;
    address: string;
    latitude: number;
    longitude: number;
  }>;
  documents: Array<{
    type: "CNIC_FRONT" | "CNIC_BACK" | "CERTIFICATE";
    url: string;
    fileName?: string;
  }>;
  progress?: {
    totalSteps: number;
    completedSteps: number;
    complete: boolean;
    missingSteps: string[];
  };
}

/**
 * Fetch existing worker onboarding progress & saved draft from backend
 */
export async function fetchWorkerOnboardingProfile(): Promise<WorkerOnboardingApiResponse | null> {
  try {
    const raw = await http.get<any>("/users/worker/me");
    const data = raw?.data ?? raw;
    if (data?.user) {
      return data as WorkerOnboardingApiResponse;
    }
  } catch (err) {
    console.warn("[fetchWorkerOnboardingProfile] Server not reached or unauthenticated:", err);
  }
  return null;
}

/**
 * Upload profile photo, CNIC document, or trade certificate to dedicated backend upload endpoints
 */
export async function uploadWorkerDocument(
  file: File,
  type: "avatar" | "cnic_front" | "cnic_back" | "certificate",
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);

  let endpoint = "/uploads/profile-photo";
  if (type === "cnic_front" || type === "cnic_back") {
    endpoint = "/uploads/cnic-document";
  } else if (type === "certificate") {
    endpoint = "/uploads/worker-document";
  }

  try {
    const raw = await http.upload<any>(endpoint, formData);
    const res = raw?.data ?? raw;
    if (res?.url) {
      return {
        url: res.url,
        filename: file.name,
      };
    }
  } catch (err) {
    console.warn(`[uploadWorkerDocument] Backend upload failed for ${type}, using local preview fallback:`, err);
  }

  // Fallback: convert file to local Data URL for seamless client preview if offline
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        url: e.target?.result as string,
        filename: file.name,
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Persist Step 1, 2, and 3 (Basic Details, Skills, Experience & Bio)
 */
export async function saveWorkerBasicProfile(data: {
  fullName?: string;
  profilePhoto?: string;
  skills?: string[];
  experienceYears?: string | number;
  bio?: string;
}) {
  const payload: Record<string, unknown> = {};
  if (data.fullName?.trim()) payload.name = data.fullName.trim();
  if (data.profilePhoto?.trim()) payload.avatarUrl = data.profilePhoto.trim();
  if (Array.isArray(data.skills)) payload.skills = data.skills;
  if (data.experienceYears !== undefined && data.experienceYears !== "") {
    payload.experienceYears = Number(data.experienceYears) || 0;
  }
  if (data.bio?.trim()) payload.bio = data.bio.trim();

  const raw = await http.put<any>("/users/worker/me", payload);
  return raw?.data ?? raw;
}

/**
 * Persist Step 4 (Service Areas with addresses & coordinates)
 */
export async function saveWorkerServiceAreas(areas: string[], city = "Peshawar", primaryAddress?: string) {
  const serviceAreas = (areas.length > 0 ? areas : [primaryAddress || city]).map((label) => ({
    label,
    address: `${label}, ${city}`,
  }));

  const raw = await http.put<any>("/users/worker/service-areas", { serviceAreas });
  return raw?.data ?? raw;
}

/**
 * Persist Step 5 (Verification Documents: CNIC Front, CNIC Back, Certificate)
 */
export async function saveWorkerDocuments(docs: {
  cnicFrontUrl: string;
  cnicFrontName?: string;
  cnicBackUrl: string;
  cnicBackName?: string;
  certificateUrl?: string;
  certificateName?: string;
}) {
  const payload: Record<string, unknown> = {
    cnicFront: {
      url: docs.cnicFrontUrl,
      fileName: docs.cnicFrontName || "cnic_front.jpg",
      mimeType: "image/jpeg",
    },
    cnicBack: {
      url: docs.cnicBackUrl,
      fileName: docs.cnicBackName || "cnic_back.jpg",
      mimeType: "image/jpeg",
    },
  };

  if (docs.certificateUrl?.trim()) {
    payload.certificate = {
      url: docs.certificateUrl,
      fileName: docs.certificateName || "certificate.pdf",
      mimeType: "application/pdf",
    };
  }

  const raw = await http.put<any>("/users/worker/documents", payload);
  return raw?.data ?? raw;
}

/**
 * Step 6: Full submission for Admin Verification
 */
export async function submitWorkerProfile(
  data: WorkerProfileFormData,
): Promise<SubmitProfileResponse> {
  try {
    // 1. Persist Step 1, 2, 3
    await saveWorkerBasicProfile({
      fullName: data.fullName,
      profilePhoto: data.profilePhoto,
      skills: data.skills,
      experienceYears: data.experienceYears,
      bio: data.bio,
    });

    // 2. Persist Step 4 (Service Areas)
    await saveWorkerServiceAreas(data.serviceAreas, data.city, data.primaryAddress);

    // 3. Persist Step 5 (Documents)
    if (data.cnicFront && data.cnicBack) {
      await saveWorkerDocuments({
        cnicFrontUrl: data.cnicFront,
        cnicFrontName: data.cnicFrontName,
        cnicBackUrl: data.cnicBack,
        cnicBackName: data.cnicBackName,
        certificateUrl: data.certificateFile,
        certificateName: data.certificateName,
      });
    }

    // 4. Submit for verification
    const submitRaw = await http.post<any>("/users/worker/submit");
    const result = submitRaw?.data ?? submitRaw;

    return {
      success: true,
      message: "Profile submitted successfully for admin verification",
      status: (result?.verificationStatus as any) || "PENDING_VERIFICATION",
    };
  } catch (err: any) {
    console.warn("[submitWorkerProfile] Backend verification submission error:", err);
    // If backend returns a specific error message, return it
    const message = err?.message || err?.payload?.message || "Failed to submit profile for verification.";
    return {
      success: false,
      message,
      status: "NOT_SUBMITTED",
      error: message,
    };
  }
}
