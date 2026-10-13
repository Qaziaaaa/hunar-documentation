import { http } from "@/lib/api-client";
import type { PostJobData } from "../types";

/**
 * Builds an ISO timestamp from a calendar date and chosen slot or specific time.
 */
export function buildPreferredVisitTime(
  preferredDate?: string,
  preferredTimeSlot?: string,
): string | undefined {
  if (!preferredDate || !preferredDate.trim()) return undefined;
  const rawDate = preferredDate.trim();
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(rawDate);
  if (!dateMatch) return undefined;

  const year = parseInt(dateMatch[1], 10);
  const month = parseInt(dateMatch[2], 10) - 1;
  const day = parseInt(dateMatch[3], 10);

  if (!preferredTimeSlot || !preferredTimeSlot.trim()) {
    const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    return d.toISOString();
  }

  const slot = preferredTimeSlot.trim();

  // Preset window slots (seconds = 1 identifies standard preset windows)
  if (
    slot === "8:00 AM – 12:00 PM" ||
    slot === "8:00 AM - 12:00 PM" ||
    /morning|صبح/i.test(slot)
  ) {
    const d = new Date(year, month, day, 9, 0, 1, 0);
    return d.toISOString();
  }

  if (
    slot === "12:00 PM – 4:00 PM" ||
    slot === "12:00 PM - 4:00 PM" ||
    /afternoon|دوپہر/i.test(slot)
  ) {
    const d = new Date(year, month, day, 13, 0, 1, 0);
    return d.toISOString();
  }

  if (
    slot === "4:00 PM – 8:00 PM" ||
    slot === "4:00 PM - 8:00 PM" ||
    /evening|شام/i.test(slot)
  ) {
    const d = new Date(year, month, day, 17, 0, 1, 0);
    return d.toISOString();
  }

  // Specific time (e.g., "5:30 PM", "11:00 AM", "17:30")
  const timeMatch = slot.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const meridiem = (timeMatch[3] || "").toLowerCase();

    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;

    const d = new Date(year, month, day, hours, minutes, 0, 0);
    return d.toISOString();
  }

  const d = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  return d.toISOString();
}

export interface CreateJobPayload {
  categoryId: string;
  title: string;
  description?: string;
  images?: string[];
  voiceNoteUrl?: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area?: string;
  urgency?: "NORMAL" | "HIGH" | "EMERGENCY";
  suggestedVisitCharge?: number;
  preferredVisitTime?: string;
}

export interface CreatedJobResponse {
  id: string;
  customerId: string;
  categoryId: string;
  title: string;
  description?: string;
  status: string;
  address: string;
  city: string;
  area?: string;
  suggestedVisitCharge?: number;
  createdAt: string;
}

const CATEGORY_ID_MAP: Record<string, string> = {
  plumbing: "seed-category-1",
  plumber: "seed-category-1",
  electrical: "seed-category-2",
  electrician: "seed-category-2",
  "ac-repair": "seed-category-3",
  ac: "seed-category-3",
  "ac-technician": "seed-category-3",
  carpentry: "seed-category-4",
  carpenter: "seed-category-4",
  painting: "seed-category-5",
  painter: "seed-category-5",
  appliance: "seed-category-5",
  cleaning: "seed-category-6",
  cleaner: "seed-category-6",
  masonry: "seed-category-7",
  "mason-mistry": "seed-category-7",
  "pest-control": "seed-category-8",
  "solar-technician": "seed-category-9",
  welder: "seed-category-9",
  "cctv-security": "seed-category-9",
  gardener: "seed-category-9",
  movers: "seed-category-9",
  general: "seed-category-9",
};

export function saveCreatedJobLocally(_job: any) {
  // Deprecated: server database is the authoritative store
}

export function getLocallyCreatedJobs(): any[] {
  // Server is authoritative source of truth
  return [];
}
/**
 * Upload a job photo to the backend S3/MinIO bucket.
 */
export async function uploadJobPhoto(file: File): Promise<{ key: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    return await http.upload<{ key: string; url: string }>("/uploads/job-photo", formData);
  } catch (err) {
    console.warn("Upload photo endpoint offline, using local object URL fallback", err);
    return {
      key: `local-job-photo-${Date.now()}`,
      url: URL.createObjectURL(file),
    };
  }
}

/**
 * Resolves a blob audio URL into a persistent backend URL (via /uploads/voice-note) or Base64 data URI.
 */
async function resolveAudioForSubmission(url?: string): Promise<string | undefined> {
  if (!url || !url.startsWith("blob:")) return url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();

    try {
      const formData = new FormData();
      const file = new File([blob], `job-voice-${Date.now()}.webm`, {
        type: blob.type || "audio/webm",
      });
      formData.append("file", file);
      const uploadRes = await http.upload<{ key: string; url: string }>("/uploads/voice-note", formData);
      if (uploadRes?.url) {
        return uploadRes.url;
      }
    } catch (uploadErr) {
      console.warn("Direct upload to /uploads/voice-note failed, using base64 fallback:", uploadErr);
    }

    return await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (result && result.startsWith("data:")) {
          resolve(result);
        } else {
          resolve(undefined);
        }
      };
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not resolve blob audio URL:", err);
    return undefined;
  }
}

/**
 * Resolves blob image URLs into upload URLs or Base64 data URIs.
 */
async function resolveImagesForSubmission(urls: string[]): Promise<string[]> {
  const resolved: string[] = [];
  for (const url of urls) {
    if (url.startsWith("blob:")) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        try {
          const formData = new FormData();
          const file = new File([blob], `job-photo-${Date.now()}.jpg`, {
            type: blob.type || "image/jpeg",
          });
          formData.append("file", file);
          const uploadRes = await http.upload<{ key: string; url: string }>("/uploads/job-photo", formData);
          if (uploadRes?.url) {
            resolved.push(uploadRes.url);
            continue;
          }
        } catch {}
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(url);
          reader.readAsDataURL(blob);
        });
        resolved.push(dataUrl);
      } catch {
        resolved.push(url);
      }
    } else {
      resolved.push(url);
    }
  }
  return resolved;
}

export interface BackendCategory {
  id: string;
  name: string;
  nameUrdu?: string;
  defaultVisitCharge?: number | null;
  suggestedFee?: number | null;
}

let cachedCategories: BackendCategory[] | null = null;

export async function fetchServiceCategories(): Promise<BackendCategory[]> {
  try {
    const res = await http.get<any>("/categories");
    const items = Array.isArray(res) ? res : res?.data ?? [];
    if (items.length > 0) {
      cachedCategories = items;
    }
    return items;
  } catch (err) {
    console.warn("[post-job-api] Failed to fetch service categories:", err);
    return cachedCategories ?? [];
  }
}

/**
 * Post a new job request to POST /jobs
 */
export async function createJob(data: PostJobData): Promise<CreatedJobResponse> {
  if (!data.category) {
    throw new Error("CATEGORY_REQUIRED: Please select a valid service category.");
  }
  let categoryId: string = data.category;
  if (data.category && (data.category.startsWith("seed-category-") || data.category.length > 20)) {
    categoryId = data.category;
  } else if (data.category) {
    if (!cachedCategories || cachedCategories.length === 0) {
      await fetchServiceCategories();
    }
    const slug = data.category.toLowerCase();
    const dynamicMatch = cachedCategories?.find(
      (c) =>
        c.id.toLowerCase() === slug ||
        c.name.toLowerCase().includes(slug) ||
        slug.includes(c.name.toLowerCase())
    );
    categoryId = dynamicMatch ? dynamicMatch.id : (CATEGORY_ID_MAP[slug] || "seed-category-1");
  } else {
    categoryId = "seed-category-1";
  }

  const resolvedVoiceNoteUrl = await resolveAudioForSubmission(data.voiceNoteUrl);
  const resolvedImages = await resolveImagesForSubmission(data.photos || []);

  const payload: CreateJobPayload = {
    categoryId,
    title: data.title?.trim() || "Home Repair Request",
    description: data.description?.trim() || undefined,
    images: resolvedImages,
    voiceNoteUrl: resolvedVoiceNoteUrl,
    latitude: typeof data.latitude === "number" && !isNaN(data.latitude) && data.latitude !== 0 ? data.latitude : 34.0151,
    longitude: typeof data.longitude === "number" && !isNaN(data.longitude) && data.longitude !== 0 ? data.longitude : 71.5249,
    address:
      data.landmark && data.landmark.trim()
        ? `${data.address || ""} (Near: ${data.landmark.trim()})`.trim()
        : data.address || "",
    city: data.city || "Peshawar",
    area: data.area || "",
    urgency: data.scheduleType === "asap" ? "EMERGENCY" : "NORMAL",
    suggestedVisitCharge: data.suggestedVisitFee ? Number(data.suggestedVisitFee) : undefined,
    preferredVisitTime:
      data.scheduleType === "asap"
        ? undefined
        : buildPreferredVisitTime(data.preferredDate, data.preferredTimeSlot),
  };

  // B9: no more silent local fallback. A failed POST previously produced a
  // phantom job with a 4-digit id (never on the backend, permanently merged
  // into every list) while the wizard celebrated success. Errors now
  // propagate; the wizard already surfaces them.
  return http.post<CreatedJobResponse>("/jobs", payload);
}
