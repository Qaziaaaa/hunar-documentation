import type { QueryClient } from "@tanstack/react-query";
import { adminApi } from "@/features/admin/api/admin-api";

// Shared query keys + fetchers for the admin list/dashboard pages so page
// mounts and idle prefetches hit the exact same cache entries.
export const adminKeys = {
  overview: ["admin", "overview"],
  activity: ["admin", "activity"],
  transactions: ["admin", "transactions"],
  commissionRate: ["admin", "commissionRate"],
  jobsStream: ["admin", "jobs", "stream"],
  jobsList: ["admin", "jobs", "list"],
  jobsDelta: ["admin", "jobs", "delta"],
  visits: ["admin", "visits"],
  reviews: ["admin", "reviews"],
} as const;

export const JOBS_PAGE_SIZE = 10;

export function fetchJobsPage(pageParam: number) {
  return adminApi.listJobs({ page: pageParam, limit: JOBS_PAGE_SIZE });
}

// Warm the admin list caches while the browser is idle so navigating to
// Jobs/Visits/Reviews paints instantly (same keys the pages query below).
export function prefetchAdminLists(queryClient: QueryClient): void {
  const run = () => {
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
    const kick = () => {
      void Promise.allSettled([
        queryClient.prefetchInfiniteQuery({
          queryKey: adminKeys.jobsList,
          queryFn: ({ pageParam }) => fetchJobsPage(pageParam as number),
          initialPageParam: 1,
          staleTime: 20_000,
        }),
        queryClient.prefetchQuery({
          queryKey: adminKeys.visits,
          queryFn: () => adminApi.listVisits({ limit: 50 }),
          staleTime: 0,
        }),
        queryClient.prefetchQuery({
          queryKey: adminKeys.reviews,
          queryFn: () => adminApi.listReviews({ limit: 50 }),
          staleTime: 0,
        }),
      ]);
    };
    if (w.requestIdleCallback) w.requestIdleCallback(kick);
    else setTimeout(kick, 2000);
  };
  run();
}
