import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Observable, Subscription } from 'rxjs';
import { createRequestMetrics, requestMetricsStorage } from '../performance/request-metrics';

interface RequestLike {
  method?: string;
  url?: string;
  path?: string;
  headers?: Record<string, unknown>;
}

interface ResponseLike {
  statusCode?: number;
  setHeader(name: string, value: string): void;
  writeHead?: (...args: unknown[]) => unknown;
  on(event: string, listener: () => void): void;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger(PerformanceInterceptor.name);
  private readonly slowThresholdMs = Number(process.env.PERF_SLOW_MS ?? 200);
  private readonly logAll = process.env.PERF_LOG_ALL === '1';

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<RequestLike>();
    const res = http.getResponse<ResponseLike>();

    const headerId = req.headers?.['x-request-id'];
    const requestId = typeof headerId === 'string' && headerId ? headerId : randomUUID();
    res.setHeader('x-request-id', requestId);

    const store = createRequestMetrics(requestId);
    const startedNs = process.hrtime.bigint();
    const elapsedMs = (): string => (Number(process.hrtime.bigint() - startedNs) / 1e6).toFixed(1);

    // Inject x-response-time before headers flush (writeHead runs before the
    // first byte is sent; setting it in 'finish' would throw).
    const originalWriteHead = res.writeHead?.bind(res);
    if (originalWriteHead) {
      res.writeHead = (...args: unknown[]) => {
        try {
          res.setHeader('x-response-time', `${elapsedMs()}ms`);
        } catch {
          // headers already committed — logging still covers it
        }
        return originalWriteHead(...args);
      };
    }

    let finished = false;
    const onFinish = (): void => {
      if (finished) return;
      finished = true;
      this.logRequest(req, res, Number(elapsedMs()), store);
    };
    res.on('finish', onFinish);
    res.on('close', onFinish);

    return new Observable<unknown>((subscriber) => {
      let inner: Subscription | undefined;
      requestMetricsStorage.run(store, () => {
        inner = next.handle().subscribe(subscriber);
      });
      return () => inner?.unsubscribe();
    });
  }

  private logRequest(
    req: RequestLike,
    res: ResponseLike,
    durationMs: number,
    store: { requestId: string; dbQueries: number; dbMs: number },
  ): void {
    const path = typeof req.path === 'string' ? req.path : String(req.url ?? '-').split('?')[0];
    const status = res.statusCode ?? 0;
    const line =
      `${req.method ?? '-'} ${path} ${status} ${durationMs.toFixed(1)}ms ` +
      `db=${store.dbQueries}q/${store.dbMs.toFixed(1)}ms req=${store.requestId}`;
    if (status >= 500 || durationMs >= this.slowThresholdMs) {
      this.logger.warn(line);
    } else if (this.logAll) {
      this.logger.log(line);
    }
  }
}
