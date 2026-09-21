import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  ttlSeconds: number;
}

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(private readonly redis: RedisService) {}

  async checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowSeconds: number = 60,
  ): Promise<RateLimitResult> {
    const key = `ratelimit:${identifier}`;
    const current = await this.redis.incr(key, windowSeconds);
    const allowed = current <= limit;
    const remaining = Math.max(0, limit - current);

    if (!allowed) {
      this.logger.warn(`Rate limit exceeded for "${identifier}". Current: ${current}, Limit: ${limit}`);
    }

    return {
      allowed,
      current,
      limit,
      remaining,
      ttlSeconds: windowSeconds,
    };
  }
}

