import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RateLimiterService } from './rate-limiter.service';
import { DistributedLockService } from './distributed-lock.service';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [
    RedisService,
    RateLimiterService,
    DistributedLockService,
    CacheService,
  ],
  exports: [
    RedisService,
    RateLimiterService,
    DistributedLockService,
    CacheService,
  ],
})
export class RedisModule {}

