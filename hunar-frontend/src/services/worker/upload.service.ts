import { isMockMode, simulateLatency } from "@/lib/data-source";
import { ApiError, API_BASE_URL, getAccessToken } from "@/lib/api-client";

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImage(file: File): string | null {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    return "UNSUPPORTED_FILE_TYPE";
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "FILE_TOO_LARGE";
  }
  return null;
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  if (isMockMode()) {
    await simulateLatency(undefined, 700, 1500);
    return {
      url: URL.createObjectURL(file),
    };
  }
  const formData = new FormData();
  formData.append("file", file);
  const headers = new Headers();
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    const res = await fetch(`${API_BASE_URL}/uploads`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      throw new ApiError("Upload failed.", res.status);
    }
    return (await res.json()) as { url: string };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Upload failed.", 0);
  }
}