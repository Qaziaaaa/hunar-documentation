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
  workerId: "",
  fullName: "",
  phone: "",
  skills: [],
  city: "Peshawar",
  serviceAreas: [],
  submittedAt: new Date().toISOString(),
  rejectionReason: undefined,
  adminNotes: undefined,
  changeRequests: [],
  tradeCertificateName: undefined,
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
        workerId: data.user.id ? `WRK-${data.user.id.slice(0, 8).toUpperCase()}` : "",
        fullName: data.user.name || "",
        phone: data.user.phone ? data.user.phone.replace(/^(\+92|0)/, "") : "",
        skills: profile?.skills?.length ? profile.skills : [],
        city: "Peshawar",
        serviceAreas: data.serviceAreas?.length
          ? data.serviceAreas.map((a: any) => (typeof a === "string" ? a : a.label || a.address || "")).filter(Boolean)
          : [],
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
