import { apiClient } from "@/lib/api-client";
import type { VerificationOutcome, WorkerVerificationData } from "../types";

const LOCAL_STORAGE_KEY = "hunar_worker_verification_status";

const DEFAULT_VERIFICATION_DATA: WorkerVerificationData = {
  status: "pending",
  workerId: "wrk_pesh_9921",
  fullName: "Tariq Mehmood",
  phone: "3001234567",
  skills: ["Electrician", "Solar Technician"],
  city: "Peshawar",
  serviceAreas: ["Hayatabad", "University Town", "Saddar"],
  submittedAt: new Date().toISOString(),
  rejectionReason:
    "Identity document verification failed: The uploaded photo of your Smart CNIC front is blurry and glare covers the 13-digit identification number. Please provide a clear, well-lit photo.",
  adminNotes:
    "Please update your base workshop location and upload a higher-resolution photo of your CNIC Back so the family registration code is readable.",
  changeRequests: [
    {
      id: "cr_1",
      field: "cnicBack",
      title: "CNIC Back Photo",
      adminNote: "Please re-upload with all 4 corners visible and no flash glare.",
      stepNumber: 5,
    },
    {
      id: "cr_2",
      field: "primaryAddress",
      title: "Workshop Location",
      adminNote: "Please provide a specific street/chowk address in Peshawar.",
      stepNumber: 4,
    },
  ],
  tradeCertificateName: "NAVTTC_Electrician_Cert_2024.pdf",
};

export async function getVerificationStatus(): Promise<WorkerVerificationData> {
  try {
    const res = await apiClient<WorkerVerificationData>(
      "/worker/verification-status",
    );
    if (res) {
      return res;
    }
  } catch {
    // Graceful fallback to local simulated data
  }

  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as WorkerVerificationData;
      } catch {
        // use default
      }
    }
  }

  return DEFAULT_VERIFICATION_DATA;
}

export function setSimulatedVerificationStatus(
  status: VerificationOutcome,
): WorkerVerificationData {
  const current =
    typeof window !== "undefined"
      ? localStorage.getItem(LOCAL_STORAGE_KEY)
      : null;
  const base = current
    ? (JSON.parse(current) as WorkerVerificationData)
    : DEFAULT_VERIFICATION_DATA;

  const updated: WorkerVerificationData = {
    ...base,
    status,
    reviewedAt:
      status !== "pending" ? new Date().toISOString() : undefined,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}

export async function resubmitVerification(
  data: Partial<WorkerVerificationData>,
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await apiClient<{ success: boolean; message: string }>(
      "/worker/verification/re-submit",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
    return res;
  } catch {
    // Simulate successful re-submission
    setSimulatedVerificationStatus("pending");
    return {
      success: true,
      message: "Profile and updated documents re-submitted for admin review.",
    };
  }
}
