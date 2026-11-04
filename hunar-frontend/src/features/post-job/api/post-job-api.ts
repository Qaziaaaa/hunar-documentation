import { http } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import { generateMockOrderCode } from "@/lib/order-code";
import { compressImage } from "@/lib/image-compression";
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
    const d = new Date(year, month, day, 9, 0, 0, 0);
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

  const d = new Date(year, month, day, 9, 0, 0, 0);
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

export const CATEGORY_ID_MAP: Record<string, string> = {
  plumbing: "seed-category-1",
  plumber: "seed-category-1",
  geyser: "seed-category-1",
  "geyser-heating": "seed-category-1",
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
  "water-tank": "seed-category-6",
  "water-tank-clean": "seed-category-6",
  masonry: "seed-category-7",
  "mason-mistry": "seed-category-7",
  "pest-control": "seed-category-8",
  "solar-technician": "seed-category-10",
  solar: "seed-category-10",
  "cctv-security": "seed-category-11",
  cctv: "seed-category-11",
  welder: "seed-category-12",
  gardener: "seed-category-13",
  gardening: "seed-category-13",
  movers: "seed-category-14",
  "movers-packers": "seed-category-14",
  handyman: "seed-category-9",
  "general-handyman": "seed-category-9",
  "general handyman": "seed-category-9",
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
  const compressed = await compressImage(file, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
  const formData = new FormData();
  formData.append("file", compressed || file);
  return await http.upload<{ key: string; url: string }>("/uploads/job-photo", formData);
}

/**
 * Resolves a blob audio URL into a persistent backend URL (via /uploads/voice-note).
 * Direct Base64 database fallbacks are removed (AUDIT-003).
 */
async function resolveAudioForSubmission(url?: string): Promise<string | undefined> {
  if (!url || !url.startsWith("blob:")) return url?.startsWith("data:") ? undefined : url;
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const formData = new FormData();
    const file = new File([blob], `job-voice-${Date.now()}.webm`, {
      type: blob.type || "audio/webm",
    });
    formData.append("file", file);
    const uploadRes = await http.upload<{ key: string; url: string }>("/uploads/voice-note", formData);
    if (uploadRes?.url) {
      return uploadRes.url;
    }
    return undefined;
  } catch (err) {
    console.warn("Could not upload voice note to storage service:", err);
    return undefined;
  }
}

/**
 * Resolves blob image URLs into upload URLs via /uploads/job-photo.
 * Direct Base64 database fallbacks are removed (AUDIT-003).
 */
async function resolveImagesForSubmission(urls: string[]): Promise<string[]> {
  const resolved: string[] = [];
  for (const url of urls) {
    if (url.startsWith("blob:")) {
      try {
        const res = await fetch(url);
        const rawBlob = await res.blob();
        const blob = await compressImage(rawBlob, { maxWidth: 1280, maxHeight: 1280, quality: 0.8 });
        const formData = new FormData();
        const file = new File([blob], `job-photo-${Date.now()}.jpg`, {
          type: blob.type || "image/jpeg",
        });
        formData.append("file", file);
        const uploadRes = await http.upload<{ key: string; url: string }>("/uploads/job-photo", formData);
        if (uploadRes?.url) {
          resolved.push(uploadRes.url);
        }
      } catch (err) {
        console.warn("Could not upload job photo to storage service:", err);
      }
    } else if (!url.startsWith("data:")) {
      resolved.push(url);
    }
  }
  return resolved.filter((u) => !u.startsWith("blob:") && !u.startsWith("data:"));
}

export interface BackendCategory {
  id: string;
  name: string;
  nameUrdu?: string;
  imageUrl?: string | null;
  defaultVisitCharge?: number | null;
  suggestedFee?: number | null;
  commonIssues?: string[] | null;
}

let cachedCategories: BackendCategory[] | null = null;

export async function fetchServiceCategories(): Promise<BackendCategory[]> {
  try {
    const res = await http.get<any>("/categories");
    const items = Array.isArray(res) ? res : res?.data ?? [];
    cachedCategories = items;
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
    const rawSlug = data.category.toLowerCase();
    const cleanSlug = rawSlug.replace(/[^a-z0-9]/g, "");
    const dynamicMatch = cachedCategories?.find(
      (c) =>
        c.id.toLowerCase() === rawSlug ||
        c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === cleanSlug ||
        c.name.toLowerCase().includes(rawSlug) ||
        rawSlug.includes(c.name.toLowerCase())
    );
    categoryId = dynamicMatch ? dynamicMatch.id : (CATEGORY_ID_MAP[rawSlug] || "seed-category-1");
  } else {
    categoryId = "seed-category-1";
  }

  const resolvedVoiceNoteUrl = await resolveAudioForSubmission(data.voiceNoteUrl);
  const resolvedImages = await resolveImagesForSubmission(data.photos || []);

  const payload: CreateJobPayload = {
    categoryId,
    title: data.title?.trim() || "Home Repair Request",
    description:
      data.description?.trim() ||
      (data.voiceNoteUrl ? "Voice note attached" : undefined),
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
    suggestedVisitCharge:
      data.suggestedVisitFee != null && !isNaN(Number(data.suggestedVisitFee))
        ? Number(data.suggestedVisitFee)
        : undefined,
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
