import type { Job, Visit, JobCategory } from "@/types/job";
import { isoDaysAgo, isoHoursAgo } from "./utils";

export const MOCK_WORKER_ID = "worker-demo-1";
export const MOCK_CUSTOMER_ID = "customer-demo-1";
export const MOCK_VISIT_ID = "visit-elc-101";
export const MOCK_JOB_ID = "job-elc-101";
export const MOCK_REPAIR_ID = "repair-elc-101";
export const MOCK_SECOND_REPAIR_ID = "repair-plumb-202";

export const mockCategories: JobCategory[] = [
  { id: "cat-electrical", name: "Electrical" },
  { id: "cat-plumbing", name: "Plumbing" },
  { id: "cat-ac", name: "AC Technician" },
  { id: "cat-carpentry", name: "Carpentry" },
];

export const mockJobs: Job[] = [
  {
    id: MOCK_JOB_ID,
    customerId: MOCK_CUSTOMER_ID,
    customer: { id: MOCK_CUSTOMER_ID, name: "Ayesha Khan", avatarUrl: "" },
    categoryId: "cat-electrical",
    category: { id: "cat-electrical", name: "Electrical" },
    title: "Wiring fault in living room",
    description:
      "The living room power sockets stopped working. One socket has a burnt smell. Need an electrician to inspect and fix.",
    images: [],
    latitude: 34.0131,
    longitude: 71.5736,
    address: "House 12, Street 4, University Road",
    city: "Peshawar",
    area: "University Town",
    status: "REPAIR_NEGOTIATING",
    urgency: "HIGH",
    suggestedVisitCharge: 300,
    lockedVisitCharge: 300,
    preferredVisitTime: isoFromNowLocal(6),
    createdAt: isoDaysAgo(2, 9),
    updatedAt: isoHoursAgo(3),
  },
  {
    id: "job-ac-202",
    customerId: MOCK_CUSTOMER_ID,
    customer: { id: MOCK_CUSTOMER_ID, name: "Imran Ali" },
    categoryId: "cat-ac",
    category: { id: "cat-ac", name: "AC Technician" },
    title: "AC not cooling",
    description: "Split AC runs but does not cool. Gas top-up may be required.",
    images: [],
    latitude: 34.0177,
    longitude: 71.5447,
    address: "Flat B-3, Khyber Heights",
    city: "Peshawar",
    area: "Hayatabad",
    status: "REPAIR_APPROVED",
    urgency: "NORMAL",
    lockedVisitCharge: 500,
    preferredVisitTime: isoFromNowLocal(2),
    createdAt: isoDaysAgo(5, 11),
    updatedAt: isoHoursAgo(26),
  },
  {
    id: "job-plumb-303",
    customerId: "customer-demo-2",
    customer: { id: "customer-demo-2", name: "Sana Malik" },
    categoryId: "cat-plumbing",
    category: { id: "cat-plumbing", name: "Plumbing" },
    title: "Kitchen sink leaking",
    description: "Water leaking under the kitchen sink, cabinet is getting damaged.",
    images: [],
    latitude: 34.0085,
    longitude: 71.5172,
    address: "House 88, Phase 4",
    city: "Peshawar",
    area: "Hayatabad",
    status: "COMPLETED",
    urgency: "NORMAL",
    lockedVisitCharge: 300,
    createdAt: isoDaysAgo(14, 10),
    updatedAt: isoDaysAgo(9, 16),
    completedAt: isoDaysAgo(9, 16),
  },
];

export const mockVisits: Visit[] = [
  {
    id: MOCK_VISIT_ID,
    jobId: MOCK_JOB_ID,
    workerId: MOCK_WORKER_ID,
    offerId: "offer-elc-101",
    scheduledDate: isoFromNowLocal(6),
    status: "COMPLETED",
    diagnosis: "Burnt socket wiring; needs replacement of two sockets and junction box.",
    repairPlan: "Replace damaged sockets, rewire the junction box, test all outlets.",
    repairEstimate: 1500,
    inspectionPhotos: [],
    estimatedRepairTimeMin: 90,
    inspectionSubmittedAt: isoHoursAgo(5),
    createdAt: isoDaysAgo(1, 12),
  },
  {
    id: "visit-ac-202",
    jobId: "job-ac-202",
    workerId: MOCK_WORKER_ID,
    offerId: "offer-ac-202",
    scheduledDate: isoFromNowLocal(2),
    status: "COMPLETED",
    diagnosis: "Refrigerant low, compressor working fine.",
    repairPlan: "Leak test, top up refrigerant, clean filters.",
    repairEstimate: 2500,
    inspectionPhotos: [],
    estimatedRepairTimeMin: 60,
    inspectionSubmittedAt: isoHoursAgo(26),
    createdAt: isoDaysAgo(4, 15),
  },
];

function isoFromNowLocal(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date.toISOString();
}