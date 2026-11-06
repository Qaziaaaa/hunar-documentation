import { http } from "@/lib/api-client";
import type { VerificationOutcome, WorkerVerificationData } from "../types";

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

export async function getVerificationStatus(): Promise<WorkerVerificationData> {
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
      city: (data.user as any)?.city || (profile as any)?.city || "Peshawar",
      serviceAreas: data.serviceAreas?.length
        ? data.serviceAreas.map((a: any) => (typeof a === "string" ? a : a.label || a.address || "")).filter(Boolean)
        : [],
      submittedAt: profile?.submittedAt || profile?.updatedAt || new Date().toISOString(),
      reviewedAt: profile?.verifiedAt || undefined,
      rejectionReason: profile?.rejectionReason || undefined,
      adminNotes: profile?.adminNote || undefined,
      profilePhoto: data.user.avatarUrl || undefined,
      tradeCertificateName: certDoc?.fileName || undefined,
    };

    return parsed;
  }

  throw new Error("Unable to retrieve worker profile from backend.");
}

export async function resubmitVerification(
  _data?: Partial<WorkerVerificationData>,
): Promise<{ success: boolean; message: string }> {
  const raw = await http.post<any>("/users/worker/submit");
  const res = raw?.data ?? raw;
  return {
    success: true,
    message: res?.message || "Profile and updated documents re-submitted for admin review.",
  };
}
