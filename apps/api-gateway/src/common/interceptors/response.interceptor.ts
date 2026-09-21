import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((data) => {
        // If data is already formatted with success and meta (e.g. from downstream proxy), pass through or wrap
        if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
          return data;
        }

        return {
          success: true,
          data: data ?? null,
          meta: {
            requestId: request.requestId || 'unknown',
            correlationId: request.correlationId || 'unknown',
            timestamp: new Date().toISOString(),
          },
        };
      }),
    );
  }
}