"use client";

import type {
  JobRequest,
  Job,
  JobStatus,
  JobUrgency,
  CustomerSummary,
} from "@/types/job";
import type { VisitOffer } from "@/types/offer";

const DISPLAY_STATUS: Record<string, JobRequest["status"]> = {
  OPEN: "open",
  OFFERS_RECEIVED: "open",
  OFFER_ACCEPTED: "accepted",
  WORKER_ASSIGNED: "accepted",
  VISIT_SCHEDULED: "accepted",
  VISIT_IN_PROGRESS: "visit_in_progress",
  VISIT_COMPLETED: "visit_completed",
  INSPECTION_DONE: "inspection_submitted",
  REPAIR_NEGOTIATING: "repair_negotiating",
  REPAIR_APPROVED: "repair_approved",
  IN_PROGRESS: "repair_in_progress",
  COMPLETED: "completed",
  PAID: "completed",
  REVIEWED: "completed",
  CANCELLED: "cancelled",
  DISPUTED: "completed",
};

const DISPLAY_URGENCY: Record<string, JobUrgency> = {
  LOW: "flexible",
  NORMAL: "standard",
  HIGH: "emergency",
  EMERGENCY: "emergency",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  Plumbing: "Plumber",
  Electrical: "Electrician",
  "AC & Refrigeration": "AC Technician",
  Carpentry: "Carpenter",
  Painting: "Painter",
  Mechanics: "Mechanic",
  "Cleaning & Sanitary": "Cleaning & Sanitary",
};

function displayCategory(name?: string | null): string {
  if (!name) return "Plumber";
  return CATEGORY_DISPLAY[name] ?? name;
}

function displayUrgency(raw?: string | null): JobUrgency {
  if (!raw) return "standard";
  return DISPLAY_URGENCY[raw] ?? (raw as JobUrgency);
}

function toDisplayStatus(raw: string): JobStatus {
  return DISPLAY_STATUS[raw] ?? (raw as JobStatus);
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function visitWindow(preferred?: string | null, created?: string): {
  date: string;
  timeSlot: string;
} {
  if (preferred) {
    const d = new Date(preferred);
    if (!Number.isNaN(d.getTime())) {
      return {
        date: d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }),
        timeSlot: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      };
    }
  }
  const base = created ? new Date(created) : new Date();
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return {
    date: `Today, ${todayLabel}`,
    timeSlot: base.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
}

function customerFrom(row: {
  customer?: { id: string; name?: string | null; phone?: string | null } | null;
  customerId?: string;
  area?: string | null;
  city?: string | null;
}): CustomerSummary {
  const name = row.customer?.name || "Customer";
  const phone = row.customer?.phone || "";
  return {
    id: row.customer?.id ?? row.customerId ?? "",
    name,
    phone,
    rating: 0,
    totalReviews: 0,
    avatarUrl: undefined,
    area: row.area ?? row.city ?? "",
    isVerified: false,
  };
}

export interface BackendJobExtras {
  nextVisit?: { id: string; status?: string | null; scheduledDate?: string | null } | null;
  distanceKm?: number | null;
  offerId?: string | null;
}

export function mapJobToRequest(
  job: Job,
  extras: BackendJobExtras = {},
): JobRequest {
  const preferred = job.preferredVisitTime ?? undefined;
  return {
    id: job.id,
    title: job.title,
    category: displayCategory(job.category?.name) as JobRequest["category"],
    urgency: displayUrgency(job.urgency as unknown as string),
    problemSummary: job.description?.slice(0, 140) ?? job.title,
    description: job.description ?? job.title,
    location: {
      area: job.area ?? job.city,
      city: job.city,
      distanceKm: extras.distanceKm ?? 0,
      fullAddress: job.address,
      coordinates: {
        lat: job.latitude || 0,
        lng: job.longitude || 0,
      },
    },
    postedAt: job.createdAt,
    postedAgo: timeAgo(job.createdAt),
    preferredVisitWindow: visitWindow(preferred, job.createdAt),
    customerSuggestedPrice: job.suggestedVisitCharge ?? job.lockedVisitCharge ?? undefined,
    photos: job.images ?? [],
    customer: customerFrom(job),
    totalOffers: 0,
    status: toDisplayStatus(job.status),
    visitCharge: job.lockedVisitCharge ?? job.suggestedVisitCharge ?? undefined,
  };
}