"use client";

import type {
  JobRequest,
  Job,
  JobStatus,
  JobUrgency,
  CustomerSummary,
} from "@/types/job";
import type { VisitOffer } from "@/types/offer";
import {
  extractTimeSlotFromVisitTime,
  formatJobDate,
  isDateOnlyTimestamp,
  parseDisplayDate,
  toLocalDateString,
} from "@/lib/format";

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
  "Cleaning & Sanitary": "Home Cleaner",
  Cleaning: "Home Cleaner",
  Masonry: "Mason (Mistri)",
  "Pest Control": "Pest Control",
  "General Handyman": "Handyman",
  Handyman: "Handyman",
  "Solar & UPS": "Solar & UPS",
  "Solar Energy": "Solar & UPS",
  "Solar Technician": "Solar & UPS",
  "CCTV & Security": "CCTV & Security",
  Gardener: "Gardener",
  "Gardener (Mali)": "Gardener",
  Welder: "Welder",
  "Movers & Packers": "Movers & Packers",
};

function inferCategoryFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (/cctv|camera|dvr|nvr|video doorbell|intercom/.test(lower)) return "CCTV & Security";
  if (/solar|inverter|battery|ups/.test(lower)) return "Solar & UPS";
  if (/pruning|grass|lawn|garden|plant|mali|fertilizer/.test(lower)) return "Gardener";
  if (/welding|welder|iron gate|grill/.test(lower)) return "Welder";
  if (/sofa|carpet|vacuum|deep clean|tank clean/.test(lower)) return "Home Cleaner";
  if (/tile|grouting|plaster|mistri/.test(lower)) return "Mason (Mistri)";
  if (/pipe|leak|drain|faucet|tap|mixer|commode|sanitary|geyser/.test(lower)) return "Plumber";
  if (/wiring|circuit|breaker|switchboard|light|fan/.test(lower)) return "Electrician";
  if (/ac |split|inverter ac|compressor|cooling|refriger/.test(lower)) return "AC Technician";
  if (/paint|putty|primer|whitewash/.test(lower)) return "Painter";
  if (/door|cabinet|drawer|wardrobe|furniture|wood|carpenter/.test(lower)) return "Carpenter";
  if (/pest|termite|cockroach|fumigation|deemak/.test(lower)) return "Pest Control";
  if (/mover|shifting|luggage|pickup/.test(lower)) return "Movers & Packers";
  return null;
}

function displayCategory(name?: string | null, title?: string, description?: string): string {
  const isGeneric = !name || name === "General Handyman" || name === "General" || name === "General Service" || name === "Handyman";
  if (title || description) {
    const inferred = inferCategoryFromText(`${title ?? ""} ${description ?? ""}`);
    if (inferred && (isGeneric || (name === "Plumbing" && inferred !== "Plumber"))) {
      return inferred;
    }
  }

  if (!name) return "General Service";
  return CATEGORY_DISPLAY[name] ?? name;
}

function displayUrgency(raw?: string | null): JobUrgency {
  if (!raw) return "standard";
  return DISPLAY_URGENCY[raw] ?? (raw as JobUrgency);
}

function toDisplayStatus(raw: string): JobStatus {
  return DISPLAY_STATUS[raw] ?? (raw as JobStatus);
}

const UPCOMING_DISPLAY_STATUSES: string[] = [
  "accepted",
  "visit_in_progress",
];

export function isUpcomingRawStatus(rawStatus?: string | null): boolean {
  if (!rawStatus) return false;
  const display = toDisplayStatus(String(rawStatus).toUpperCase());
  return UPCOMING_DISPLAY_STATUSES.includes(display);
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

function visitWindow(preferred?: string | null, created?: string, isUrgent?: boolean): {
  date: string;
  timeSlot: string;
} {
  if (isUrgent) {
    return {
      date: "Today",
      timeSlot: "⚡ Immediate",
    };
  }

  const preferredDate = parseDisplayDate(preferred);
  const createdDate = parseDisplayDate(created);
  const now = new Date();

  if (preferredDate) {
    const isToday =
      preferredDate.getFullYear() === now.getFullYear() &&
      preferredDate.getMonth() === now.getMonth() &&
      preferredDate.getDate() === now.getDate();
    const label = formatJobDate(preferred);
    const extractedSlot = extractTimeSlotFromVisitTime(preferred);
    return {
      date: isToday ? `Today, ${label}` : label,
      timeSlot: extractedSlot || "Flexible Timing",
    };
  }

  const base = createdDate ?? now;
  return {
    date: `Today, ${formatJobDate(toLocalDateString(now))}`,
    timeSlot: base.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
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
  const isUrgent =
    job.urgency === "EMERGENCY" ||
    job.urgency === "HIGH" ||
    (job as any).urgency === "URGENT";
  return {
    id: job.id,
    title: job.title,
    category: displayCategory(job.category?.name, job.title, job.description) as JobRequest["category"],
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
    preferredVisitWindow: visitWindow(preferred, job.createdAt, isUrgent),
    customerSuggestedPrice: job.suggestedVisitCharge ?? job.lockedVisitCharge ?? undefined,
    photos: job.images ?? [],
    customer: customerFrom(job),
    totalOffers: 0,
    status: toDisplayStatus(job.status),
    completedAt:
      job.completedAt ??
      (job as any).completed_at ??
      (toDisplayStatus(job.status) === "completed" ? (job.updatedAt ?? job.createdAt) : undefined),
    visitCharge: job.visitCharge ?? job.lockedVisitCharge ?? job.suggestedVisitCharge ?? undefined,
    platformCommission: job.platformCommission ?? undefined,
    workerNetEarnings: job.workerNetEarnings ?? undefined,
    customerReview:
      job.customerReview && job.customerReview.rating
        ? {
            rating: Number(job.customerReview.rating),
            comment: job.customerReview.comment || "",
            date: job.customerReview.date || "",
          }
        : undefined,
    repairCharge:
      job.repairCharge ??
      (job as any).repairCharge ??
      (job as any).repairEstimate ??
      undefined,
    nextVisit: extras.nextVisit ?? job.nextVisit ?? undefined,
    visitId: extras.nextVisit?.id ?? job.visitId ?? job.nextVisit?.id ?? undefined,
  };
}