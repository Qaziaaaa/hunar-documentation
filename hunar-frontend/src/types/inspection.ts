export interface InspectionReport {
  jobId: string;
  diagnosis: string; // What is wrong (Required)
  repairPlan: string; // What will be fixed (Required)
  repairPriceEstimate: number; // In Rs. (Required, separate from visit charge)
  photos: string[]; // Inspection evidence photos (Required, at least 1)
  estimatedRepairTime: string; // e.g. "2 hours", "45 mins" (Required)
  submittedAt: string;
}

export type VisitStep =
  | "ready_to_start" // Status: accepted, worker can tap "Start Visit"
  | "en_route" // Status: visit_in_progress, GPS location sharing active
  | "arrived" // Status: visit_completed, commission hold applied
  | "inspecting" // Status: inspecting problem on site
  | "inspection_submitted"; // Status: inspection report sent, ready for repair phase
