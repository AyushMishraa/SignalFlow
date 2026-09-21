import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RedisService } from './redis.service';

export interface LockHandle {
  resource: string;
  token: string;
}

@Injectable()
export class DistributedLockService {
  private readonly logger = new Logger(DistributedLockService.name);

  constructor(private readonly redis: RedisService) {}

  async acquireLock(resource: string, ttlSeconds: number = 30): Promise<LockHandle | null> {
    const lockKey = `lock:${resource}`;
    const token = randomUUID();

    const existing = await this.redis.get(lockKey);
    if (existing) {
      return null;
    }

    await this.redis.set(lockKey, token, ttlSeconds);
    this.logger.debug(`Acquired distributed lock on "${resource}" with token ${token}`);
    return { resource, token };
  }

  async releaseLock(handle: LockHandle): Promise<boolean> {
    const lockKey = `lock:${handle.resource}`;
    const currentToken = await this.redis.get(lockKey);

    if (currentToken === handle.token) {
      await this.redis.del(lockKey);
      this.logger.debug(`Released distributed lock on "${handle.resource}"`);
      return true;
    }

    return false;
  }
}

