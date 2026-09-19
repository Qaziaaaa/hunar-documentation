export type JobStatus =
  | "OPEN"
  | "OFFERS_RECEIVED"
  | "OFFER_ACCEPTED"
  | "WORKER_ASSIGNED"
  | "VISIT_SCHEDULED"
  | "VISIT_IN_PROGRESS"
  | "VISIT_COMPLETED"
  | "INSPECTION_DONE"
  | "REPAIR_NEGOTIATING"
  | "REPAIR_APPROVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PAID"
  | "REVIEWED"
  | "CANCELLED"
  | "DISPUTED";

export type VisitStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface JobReference {
  id: string;
  title: string;
  status: JobStatus;
  city: string;
  area?: string;
}

export interface JobCategory {
  id: string;
  name: string;
}

export interface JobCustomer {
  id: string;
  name?: string;
  avatarUrl?: string;
}

export interface Job {
  id: string;
  customerId: string;
  customer?: JobCustomer;
  categoryId: string;
  category?: JobCategory;
  title: string;
  description?: string;
  images: string[];
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  area?: string;
  status: JobStatus;
  urgency: "LOW" | "NORMAL" | "HIGH" | "EMERGENCY";
  suggestedVisitCharge?: number;
  lockedVisitCharge?: number;
  preferredVisitTime?: string;
  cancelReason?: string;
  cancelledAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Visit {
  id: string;
  jobId: string;
  workerId: string;
  offerId: string;
  scheduledDate: string;
  actualDate?: string;
  status: VisitStatus;
  diagnosis?: string;
  repairPlan?: string;
  repairEstimate?: number;
  inspectionPhotos: string[];
  estimatedRepairTimeMin?: number;
  inspectionSubmittedAt?: string;
  createdAt: string;
}

export interface CreateVisitOfferInput {
  jobId: string;
  visitCharge: number;
  note?: string;
}