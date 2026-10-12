import { AsyncLocalStorage } from 'node:async_hooks';

export interface RequestMetrics {
  requestId: string;
  dbQueries: number;
  dbMs: number;
}

export const requestMetricsStorage = new AsyncLocalStorage<RequestMetrics>();

export function createRequestMetrics(requestId: string): RequestMetrics {
  return { requestId, dbQueries: 0, dbMs: 0 };
}
