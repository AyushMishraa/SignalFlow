import { RateLimiterService } from './rate-limiter.service';
import { RedisService } from './redis.service';

describe('RateLimiterService', () => {
  let rateLimiter: RateLimiterService;
  let redis: RedisService;

  beforeEach(() => {
    redis = new RedisService({ get: jest.fn() } as any);
    rateLimiter = new RateLimiterService(redis);
  });

  it('should allow requests within limit and track remaining tokens', async () => {
    const result1 = await rateLimiter.checkRateLimit('tenant-alpha', 5, 60);
    expect(result1.allowed).toBe(true);
    expect(result1.current).toBe(1);
    expect(result1.remaining).toBe(4);

    const result2 = await rateLimiter.checkRateLimit('tenant-alpha', 5, 60);
    expect(result2.allowed).toBe(true);
    expect(result2.current).toBe(2);
    expect(result2.remaining).toBe(3);
  });

  it('should deny requests when limit is exceeded', async () => {
    for (let i = 0; i < 3; i++) {
      await rateLimiter.checkRateLimit('tenant-beta', 3, 60);
    }

    const denied = await rateLimiter.checkRateLimit('tenant-beta', 3, 60);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
  });
});

