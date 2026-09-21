import {
  Injectable,
  ConflictException,
  Logger,
} from '@nestjs/common';

export interface IdempotencyRecord {
  key: string;
  tenantId?: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  response?: any;
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly store = new Map<string, IdempotencyRecord>();
  private readonly defaultTtlMs = 24 * 60 * 60 * 1000; // 24 hours

  private getCompositeKey(key: string, tenantId?: string): string {
    return tenantId ? `${tenantId}:${key}` : key;
  }

  async acquireLock(key: string, tenantId?: string, ttlMs: number = this.defaultTtlMs): Promise<IdempotencyRecord | null> {
    const compositeKey = this.getCompositeKey(key, tenantId);
    const existing = this.store.get(compositeKey);
    const now = Date.now();

    if (existing) {
      if (existing.expiresAt < now) {
        this.store.delete(compositeKey);
      } else {
        if (existing.status === 'IN_PROGRESS') {
          throw new ConflictException(
            `An identical request with idempotency key "${key}" is currently in progress. Please retry shortly.`,
          );
        }
        return existing;
      }
    }

    const record: IdempotencyRecord = {
      key,
      tenantId,
      status: 'IN_PROGRESS',
      createdAt: now,
      expiresAt: now + ttlMs,
    };

    this.store.set(compositeKey, record);
    return null;
  }

  async saveResponse(key: string, response: any, tenantId?: string, ttlMs: number = this.defaultTtlMs): Promise<void> {
    const compositeKey = this.getCompositeKey(key, tenantId);
    const now = Date.now();

    this.store.set(compositeKey, {
      key,
      tenantId,
      status: 'COMPLETED',
      response,
      createdAt: now,
      expiresAt: now + ttlMs,
    });
  }

  async removeLock(key: string, tenantId?: string): Promise<void> {
    const compositeKey = this.getCompositeKey(key, tenantId);
    this.store.delete(compositeKey);
  }
}

