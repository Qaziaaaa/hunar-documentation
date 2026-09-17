import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Wraps successful responses in the standard { success: true, data, meta } envelope.
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Record<string, unknown>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<Record<string, unknown>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'meta' in data) {
          const { meta, items, ...rest } = data as {
            meta?: Record<string, unknown>;
            items?: T;
            [k: string]: unknown;
          };
          return { success: true, data: (items ?? rest) as T, meta };
        }
        return { success: true, data: data as T };
      }),
    );
  }
}
