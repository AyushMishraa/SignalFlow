import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  value: string;
  expiresAt: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly memoryStore = new Map<string, CacheEntry>();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('redis.url') || 'redis://localhost:6379';
    this.logger.log(`Initializing Redis client connecting to: ${url}`);

    // Periodic TTL cleanup
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.memoryStore.entries()) {
        if (entry.expiresAt > 0 && entry.expiresAt < now) {
          this.memoryStore.delete(key);
        }
      }
    }, 10000);
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async get(key: string): Promise<string | null> {
    const entry = this.memoryStore.get(key);
    if (!entry) return null;

    if (entry.expiresAt > 0 && entry.expiresAt < Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0;
    this.memoryStore.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.memoryStore.delete(key);
  }

  async incr(key: string, ttlSeconds: number = 60): Promise<number> {
    const current = await this.get(key);
    const count = current ? parseInt(current, 10) + 1 : 1;
    await this.set(key, count.toString(), ttlSeconds);
    return count;
  }
}

