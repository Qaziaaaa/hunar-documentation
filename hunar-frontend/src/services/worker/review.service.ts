import { http } from "@/lib/api-client";
import type { PageResult } from "@/types/pagination";
import type { Review, WorkerRatingSummary } from "@/types/review";

export async function getRatingSummary(
  workerId: string = "",
): Promise<WorkerRatingSummary> {
  if (!workerId) {
    return {
      average: 0,
      totalReviews: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }
  const res = await http.get<any>(
    `/reviews/worker/${workerId}?limit=100`,
  );
  const rawReviews: any[] = Array.isArray(res?.reviews)
    ? res.reviews
    : Array.isArray(res?.items)
    ? res.items
    : Array.isArray(res)
    ? res
    : [];

  const totalReviews =
    typeof res?.totalReviews === "number"
      ? res.totalReviews
      : typeof res?.pagination?.total === "number"
      ? res.pagination.total
      : rawReviews.length;

  const totalRating = rawReviews.reduce(
    (sum, r) => sum + (Number(r.rating) || 0),
    0,
  );
  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as WorkerRatingSummary["breakdown"];
  for (const r of rawReviews) {
    const val = Math.round(Number(r.rating) || 0);
    if (val >= 1 && val <= 5) {
      breakdown[val as 1 | 2 | 3 | 4 | 5] += 1;
    }
  }

  const avg =
    totalReviews > 0
      ? typeof res?.avgRating === "number"
        ? Math.round(res.avgRating * 10) / 10
        : Math.round((totalRating / totalReviews) * 10) / 10
      : 0;

  return {
    average: avg,
    totalReviews,
    breakdown,
  };
}

export async function getWorkerReviews(
  workerId: string = "",
  page = 1,
  limit = 20,
): Promise<PageResult<Review>> {
  if (!workerId) {
    return {
      items: [],
      meta: { page: 1, limit, total: 0, totalPages: 0 },
    };
  }
  const res = await http.get<any>(
    `/reviews/worker/${workerId}?page=${page}&limit=${limit}`,
  );
  const rawReviews: any[] = Array.isArray(res?.reviews)
    ? res.reviews
    : Array.isArray(res?.items)
    ? res.items
    : Array.isArray(res)
    ? res
    : [];

  const total =
    typeof res?.totalReviews === "number"
      ? res.totalReviews
      : typeof res?.pagination?.total === "number"
      ? res.pagination.total
      : typeof res?.meta?.total === "number"
      ? res.meta.total
      : rawReviews.length;

  const items: Review[] = rawReviews.map((r: any) => {
    let tags: string[] = Array.isArray(r.tags) ? r.tags : [];
    let cleanComment = r.comment || undefined;

    if (tags.length === 0 && cleanComment) {
      const match = cleanComment.match(/(?:Positive Highlights|کاریگر کے بارے میں تاثرات):\s*([^.\n]+)/i);
      if (match) {
        tags = match[1].split(/,\s*/).map((s: string) => s.trim()).filter(Boolean);
        const stripped = cleanComment.replace(/(?:Positive Highlights|کاریگر کے بارے میں تاثرات):\s*[^.\n]+\.?\s*/i, "").trim();
        cleanComment = stripped || undefined;
      }
    }

    return {
      id: r.id || `rev-${Math.random()}`,
      jobId: r.jobId || "",
      job: r.job,
      reviewerId: r.reviewerId || r.reviewer?.id || "",
      reviewerName: r.reviewerName || r.reviewer?.name || "Customer",
      rating: Number(r.rating) || 0,
      comment: cleanComment,
      tags,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
    };
  });

  return {
    items,
    meta: {
      page: Number(res?.pagination?.page ?? res?.meta?.page ?? page),
      limit: Number(res?.pagination?.limit ?? res?.meta?.limit ?? limit),
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export const queryKeys = {
  rating: (workerId: string) =>
    ["worker", "reviews", "rating", workerId] as const,
  reviews: (workerId: string, page: number) =>
    ["worker", "reviews", "list", workerId, page] as const,
};