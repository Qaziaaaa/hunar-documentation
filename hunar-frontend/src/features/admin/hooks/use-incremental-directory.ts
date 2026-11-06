"use client";

import { useCallback, useEffect, useState } from "react";
import type { RefObject } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryKey,
} from "@tanstack/react-query";
import type { DirectoryQuery, PageResult } from "@/types/pagination";

export const DIRECTORY_PAGE_SIZE = 10;

type DirectoryData<T> = InfiniteData<PageResult<T>, number>;

/**
 * Loads an admin directory page by page so the first rows paint quickly and
 * the rest stream in as the user scrolls, instead of blocking on one large
 * `limit=50` response.
 */
export function useIncrementalDirectory<T>({
  queryKey,
  fetchPage,
  pageSize = DIRECTORY_PAGE_SIZE,
}: {
  queryKey: QueryKey;
  fetchPage: (query: DirectoryQuery) => Promise<PageResult<T>>;
  pageSize?: number;
}) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) =>
      fetchPage({ page: pageParam as number, limit: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last: PageResult<T>) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    staleTime: 30_000,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const meta =
    query.data && query.data.pages.length > 0
      ? query.data.pages[query.data.pages.length - 1].meta
      : null;

  // Optimistic row updates (suspend/reactivate) without refetching every page.
  const updateItems = useCallback(
    (updater: (items: T[]) => T[]) => {
      queryClient.setQueryData<DirectoryData<T>>(queryKey, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: updater(page.items),
          })),
        };
      });
    },
    [queryClient, queryKey],
  );

  return {
    items,
    meta,
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load"
      : null,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    updateItems,
  };
}

/** Fires `fetchNextPage` when the sentinel row scrolls near the viewport. */
export function useLoadMoreOnVisible(
  sentinelRef: RefObject<Element | null>,
  hasNextPage: boolean,
  isFetchingNextPage: boolean,
  fetchNextPage: () => void,
) {
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) fetchNextPage();
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage]);
}

/** Debounces fast-changing input (e.g. a search box) before a query fires. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
