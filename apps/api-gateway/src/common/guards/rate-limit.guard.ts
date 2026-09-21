import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { RateLimiterService } from '@app/redis';
import { ErrorCode } from '../exceptions/error-codes.enum';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private readonly rateLimiter: RateLimiterService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const identifier =
      (request.headers['x-api-key'] as string) ||
      (request.headers['x-tenant-id'] as string) ||
      request.ip ||
      'anonymous';

    const limit = 100;
    const windowSeconds = 60;

    const result = await this.rateLimiter.checkRateLimit(
      identifier,
      limit,
      windowSeconds,
    );

    response.setHeader('X-RateLimit-Limit', result.limit.toString());
    response.setHeader('X-RateLimit-Remaining', result.remaining.toString());

    if (!result.allowed) {
      throw new HttpException(
        {
          code: ErrorCode.RATE_LIMIT_EXCEEDED,
          message: 'Rate limit exceeded. Please slow down your requests.',
          details: {
            limit: result.limit,
            retryAfterSeconds: result.ttlSeconds,
          },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

