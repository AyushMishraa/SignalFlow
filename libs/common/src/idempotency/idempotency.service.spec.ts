import { IdempotencyService } from './idempotency.service';
import { ConflictException } from '@nestjs/common';

describe('IdempotencyService', () => {
  let service: IdempotencyService;

  beforeEach(() => {
    service = new IdempotencyService();
  });

  it('should acquire lock when key is new', async () => {
    const existing = await service.acquireLock('key-1', 'tenant-1');
    expect(existing).toBeNull();
  });

  it('should throw ConflictException when key is already in progress', async () => {
    await service.acquireLock('key-1', 'tenant-1');
    await expect(service.acquireLock('key-1', 'tenant-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should return cached record when status is COMPLETED', async () => {
    await service.acquireLock('key-1', 'tenant-1');
    await service.saveResponse('key-1', { id: 'notif-1', status: 'PENDING' }, 'tenant-1');

    const result = await service.acquireLock('key-1', 'tenant-1');
    expect(result).toBeDefined();
    expect(result?.status).toBe('COMPLETED');
    expect(result?.response).toEqual({ id: 'notif-1', status: 'PENDING' });
  });

  it('should allow re-acquiring lock after removal', async () => {
    await service.acquireLock('key-1', 'tenant-1');
    await service.removeLock('key-1', 'tenant-1');

    const result = await service.acquireLock('key-1', 'tenant-1');
    expect(result).toBeNull();
  });
});

