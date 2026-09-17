// Offset/limit pagination helper (src/common/helpers/pagination.util.ts).
export interface PageOptions {
  page?: number;
  limit?: number;
}

export interface PageResult<T> {
  items: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export function normalizePage(
  options: PageOptions,
  maxLimit = 50,
): { page: number; limit: number; skip: number } {
  const page = Math.max(Number.isFinite(options.page) ? options.page : 1, 1);
  const rawLimit = Number.isFinite(options.limit) ? options.limit : 20;
  const limit = Math.min(Math.max(rawLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export function toPageResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PageResult<T> {
  return {
    items,
    meta: {
      page,
      limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    },
  };
}
