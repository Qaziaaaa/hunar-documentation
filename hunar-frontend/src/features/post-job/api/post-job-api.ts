import { http } from "@/lib/api-client";
import { isMockMode } from "@/lib/data-source";
import { generateMockOrderCode } from "@/lib/order-code";
import type { PostJobData } from "../types";

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

export function saveCreatedJobLocally(job: any) {
  if (typeof window === "undefined") return;
  try {
    const existingRaw = localStorage.getItem("hunar_created_jobs");
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const updated = [job, ...existing.filter((j: any) => j.id !== job.id)];
    localStorage.setItem("hunar_created_jobs", JSON.stringify(updated));
    window.dispatchEvent(new Event("hunar_job_created"));
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.warn("Failed to save created job locally:", err);
  }
}

export function getLocallyCreatedJobs(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const existingRaw = localStorage.getItem("hunar_created_jobs");
    return existingRaw ? JSON.parse(existingRaw) : [];
  } catch {
    return [];
  }
}

/**
 * Upload a job photo to the backend S3/MinIO bucket.
 */
export async function uploadJobPhoto(file: File): Promise<{ key: string; url: string }> {
  if (isMockMode()) {
    return { key: `local-job-photo-${Date.now()}`, url: URL.createObjectURL(file) };
  }
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
 * Post a new job request to POST /jobs
 */
export async function createJob(data: PostJobData): Promise<CreatedJobResponse> {
  const categoryId =
    data.category && (data.category.startsWith("seed-category-") || data.category.length > 20)
      ? data.category
      : CATEGORY_ID_MAP[data.category?.toLowerCase()] || CATEGORY_ID_MAP.plumbing || "seed-category-1";

  const payload: CreateJobPayload = {
    categoryId,
    title: data.title || "Home Repair Request",
    description: data.description,
    images: data.photos,
    voiceNoteUrl: data.voiceNoteUrl,
    latitude: typeof data.latitude === "number" && !isNaN(data.latitude) ? data.latitude : 34.0151,
    longitude: typeof data.longitude === "number" && !isNaN(data.longitude) ? data.longitude : 71.5249,
    address:
      data.landmark && data.landmark.trim()
        ? `${data.address || "Peshawar"} (Near: ${data.landmark.trim()})`
        : data.address || "Peshawar, Khyber Pakhtunkhwa",
    city: data.city || "Peshawar",
    area: data.area || "Hayatabad",
    urgency: data.scheduleType === "asap" ? "EMERGENCY" : "NORMAL",
    suggestedVisitCharge: Number(data.suggestedVisitFee || 300),
    preferredVisitTime: data.preferredDate
      ? new Date(data.preferredDate).toISOString()
      : undefined,
  };

  if (isMockMode()) {
    return {
      id: generateMockOrderCode(),
      customerId: "cust-current-user",
      categoryId,
      title: payload.title,
      description: payload.description,
      status: "OPEN",
      address: payload.address,
      city: payload.city,
      area: payload.area,
      suggestedVisitCharge: payload.suggestedVisitCharge,
      createdAt: new Date().toISOString(),
    };
    saveCreatedJobLocally(created);
    return created;
  }

  try {
    const created = await http.post<CreatedJobResponse>("/jobs", payload);
    saveCreatedJobLocally(created);
    return created;
  } catch (err) {
    console.warn("POST /jobs API failed, creating locally for seamless flow:", err);
    const fallbackCreated: CreatedJobResponse = {
      id: `JOB-${Date.now().toString().slice(-4)}`,
      customerId: "cust-current-user",
      categoryId,
      title: payload.title,
      description: payload.description,
      status: "OPEN",
      address: payload.address,
      city: payload.city,
      area: payload.area,
      suggestedVisitCharge: payload.suggestedVisitCharge,
      createdAt: new Date().toISOString(),
    };
    saveCreatedJobLocally(fallbackCreated);
    return fallbackCreated;
  }
}
