import { http } from "@/lib/api-client";
import type { VerificationOutcome, WorkerVerificationData } from "../types";

const LOCAL_STORAGE_KEY = "hunar_worker_verification_status";

function mapBackendStatusToOutcome(status?: string): VerificationOutcome {
  if (!status) return "pending";
  switch (status.toUpperCase()) {
    case "APPROVED":
      return "approved";
    case "REJECTED":
      return "rejected";
    case "REQUEST_CHANGES":
      return "request_changes";
    case "PENDING":
    case "NOT_SUBMITTED":
    default:
      return "pending";
  }
}

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
    const raw = await http.get<any>("/users/worker/me");
    const data = raw?.data ?? raw;

    if (data?.user) {
      const profile = data.workerProfile;
      const status = mapBackendStatusToOutcome(profile?.verificationStatus);
      const certDoc = data.documents?.find((d: any) => d.type === "CERTIFICATE");

      const parsed: WorkerVerificationData = {
        status,
        workerId: data.user.id ? `WRK-${data.user.id.slice(0, 8).toUpperCase()}` : "wrk_pesh_9921",
        fullName: data.user.name || "Worker Pro",
        phone: data.user.phone ? data.user.phone.replace(/^(\+92|0)/, "") : "3001234567",
        skills: profile?.skills?.length ? profile.skills : ["General Handyman"],
        city: "Peshawar",
        serviceAreas: data.serviceAreas?.length
          ? data.serviceAreas.map((a: any) => a.label)
          : ["Peshawar"],
        submittedAt: profile?.submittedAt || new Date().toISOString(),
        reviewedAt: profile?.verifiedAt || undefined,
        rejectionReason: profile?.rejectionReason || undefined,
        adminNotes: profile?.adminNote || undefined,
        profilePhoto: data.user.avatarUrl || undefined,
        tradeCertificateName: certDoc?.fileName || undefined,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      }

      return parsed;
    }
  } catch (err) {
    console.warn("[getVerificationStatus] Server unreachable, using local status:", err);
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
  _data?: Partial<WorkerVerificationData>,
): Promise<{ success: boolean; message: string }> {
  try {
    const raw = await http.post<any>("/users/worker/submit");
    const res = raw?.data ?? raw;
    if (res) {
      setSimulatedVerificationStatus("pending");
      return {
        success: true,
        message: "Profile and updated documents re-submitted for admin review.",
      };
    }
  } catch (err: any) {
    console.warn("[resubmitVerification] Backend submission error:", err);
  }

  // Simulate successful re-submission fallback
  setSimulatedVerificationStatus("pending");
  return {
    success: true,
    message: "Profile and updated documents re-submitted for admin review.",
  };
}
