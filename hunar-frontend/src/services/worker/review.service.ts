import { http } from "@/lib/api-client";
import { isMockMode, simulateLatency } from "@/lib/data-source";
import type { PageResult } from "@/types/pagination";
import type { Review, WorkerRatingSummary } from "@/types/review";
import { mockRatingSummary, mockReviews } from "@/mocks/reviews.mock";
import { MOCK_WORKER_ID } from "@/mocks/jobs.mock";

export async function getRatingSummary(
  workerId: string = MOCK_WORKER_ID,
): Promise<WorkerRatingSummary> {
  if (isMockMode()) {
    return simulateLatency({ ...mockRatingSummary });
  }
  const page = await http.get<PageResult<Review>>(
    `/reviews/worker/${workerId}?limit=100`,
  );
  const reviews = page.items;
  const totalReviews = reviews.length;
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as WorkerRatingSummary["breakdown"];
  for (const r of reviews) {
    if (r.rating >= 1 && r.rating <= 5) {
      breakdown[r.rating as 1 | 2 | 3 | 4 | 5] += 1;
    }
  }
  return {
    average:
      totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0,
    totalReviews,
    breakdown,
  };
}

export async function getWorkerReviews(
  workerId: string = MOCK_WORKER_ID,
  page = 1,
  limit = 20,
): Promise<PageResult<Review>> {
  if (isMockMode()) {
    await simulateLatency(undefined, 300, 700);
    const total = mockReviews.length;
    const start = (page - 1) * limit;
    return {
      items: mockReviews.slice(start, start + limit),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  return http.get<PageResult<Review>>(
    `/reviews/worker/${workerId}?page=${page}&limit=${limit}`,
  );
}

export const queryKeys = {
  rating: (workerId: string) =>
    ["worker", "reviews", "rating", workerId] as const,
  reviews: (workerId: string, page: number) =>
    ["worker", "reviews", "list", workerId, page] as const,
};