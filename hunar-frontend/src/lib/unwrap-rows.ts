/**
 * Normalise every list-shaped response into a plain row array.
 *
 * `apiClient` unwraps the backend's `{ success, data, meta }` envelope into a
 * bare array when there is no `meta`, and into `{ data, meta }` when there is
 * (paginated endpoints). Callers that only checked `.items` silently saw an
 * empty list for paginated endpoints, so every list reader should go through
 * this helper instead.
 */
export function unwrapRows<T = unknown>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  const page = res as { data?: T[]; items?: T[] } | null | undefined;
  return page?.data ?? page?.items ?? [];
}
