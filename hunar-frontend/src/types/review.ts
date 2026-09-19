import type { JobReference } from "./job";

export interface Review {
  id: string;
  jobId: string;
  job?: JobReference;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface WorkerRatingSummary {
  average: number;
  totalReviews: number;
  breakdown: RatingBreakdown;
}