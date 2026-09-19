import type { Review, WorkerRatingSummary } from "@/types/review";
import { isoDaysAgo } from "./utils";

export const mockRatingSummary: WorkerRatingSummary = {
  average: 4.8,
  totalReviews: 12,
  breakdown: { 5: 10, 4: 1, 3: 1, 2: 0, 1: 0 },
};

export const mockReviews: Review[] = [
  {
    id: "review-001",
    jobId: "job-faucet-501",
    job: {
      id: "job-faucet-501",
      title: "Bathroom faucet install",
      status: "REVIEWED",
      city: "Peshawar",
      area: "Hayatabad",
    },
    reviewerId: "customer-demo-3",
    reviewerName: "Hassan Raza",
    rating: 5,
    comment:
      "Very professional and quick. The bathroom faucet was installed perfectly and the area was cleaned up afterwards.",
    createdAt: isoDaysAgo(23, 18),
  },
  {
    id: "review-002",
    jobId: "job-plumb-303",
    job: {
      id: "job-plumb-303",
      title: "Kitchen sink leaking",
      status: "REVIEWED",
      city: "Peshawar",
      area: "Hayatabad",
    },
    reviewerId: "customer-demo-2",
    reviewerName: "Sana Malik",
    rating: 5,
    comment: "Fast response and fair price. The leak is fully fixed.",
    createdAt: isoDaysAgo(8, 17),
  },
  {
    id: "review-003",
    jobId: "job-light-499",
    job: {
      id: "job-light-499",
      title: "Light fixture repair",
      status: "REVIEWED",
      city: "Peshawar",
      area: "University Town",
    },
    reviewerId: "customer-demo-4",
    reviewerName: "Bilal Ahmad",
    rating: 4,
    comment: undefined,
    createdAt: isoDaysAgo(40, 14),
  },
  {
    id: "review-004",
    jobId: "job-carpet-500",
    job: {
      id: "job-carpet-500",
      title: "Carpentry shelf fix",
      status: "REVIEWED",
      city: "Peshawar",
      area: "Defence",
    },
    reviewerId: "customer-demo-5",
    reviewerName: "Rabia Tariq",
    rating: 3,
    comment: "Work was okay but the visit was a bit late.",
    createdAt: isoDaysAgo(32, 12),
  },
];