import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { IdempotencyService } from './idempotency.service';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idempotencyService: IdempotencyService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey = request.headers['idempotency-key'] as string;
    const tenantId = request.body?.tenantId || request.headers['x-tenant-id'] as string;

    if (!idempotencyKey || request.method !== 'POST') {
      return next.handle();
    }

    const existingRecord = await this.idempotencyService.acquireLock(
      idempotencyKey,
      tenantId,
    );

    if (existingRecord && existingRecord.status === 'COMPLETED') {
      return of(existingRecord.response);
    }

    return next.handle().pipe(
      tap(async (response) => {
        await this.idempotencyService.saveResponse(
          idempotencyKey,
          response,
          tenantId,
        );
      }),
      catchError(async (err) => {
        await this.idempotencyService.removeLock(idempotencyKey, tenantId);
        throw err;
      }),
    );
  }
}

