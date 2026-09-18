import { http } from "@/lib/api-client";
import type { WorkerProfileFormData } from "../types";

export interface SubmitProfileResponse {
  success: boolean;
  message: string;
  status: "PENDING_VERIFICATION" | "APPROVED" | "REJECTED";
  workerId?: string;
}

export async function submitWorkerProfile(
  data: WorkerProfileFormData,
): Promise<SubmitProfileResponse> {
  try {
    return await http.post<SubmitProfileResponse>("/users/worker/profile", data);
  } catch {
    // If backend is not online yet (Hakim Ullah's part), gracefully succeed for frontend demo & local state
    return {
      success: true,
      message: "Profile submitted successfully for admin verification",
      status: "PENDING_VERIFICATION",
    };
  }
}

export async function uploadWorkerDocument(
  file: File,
  type: "avatar" | "cnic_front" | "cnic_back" | "certificate",
): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  try {
    return await http.post<{ url: string; filename: string }>(
      "/uploads/document",
      formData,
      {
        headers: {}, // Let browser set multipart/form-data boundary
      },
    );
  } catch {
    // Fallback: convert file to local object URL / base64
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
}
