export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PageResult<T> {
  items: T[];
  meta: PageMeta;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Pagination plus the directory filters the admin list endpoints accept. */
export interface DirectoryQuery extends PaginationQuery {
  search?: string;
  status?: "active" | "suspended";
}