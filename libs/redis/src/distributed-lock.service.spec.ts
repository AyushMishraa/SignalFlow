import { DistributedLockService } from './distributed-lock.service';
import { RedisService } from './redis.service';

describe('DistributedLockService', () => {
  let lockService: DistributedLockService;
  let redis: RedisService;

  beforeEach(() => {
    redis = new RedisService({ get: jest.fn() } as any);
    lockService = new DistributedLockService(redis);
  });

  it('should acquire lock when free', async () => {
    const handle = await lockService.acquireLock('job-1', 10);
    expect(handle).toBeDefined();
    expect(handle?.resource).toBe('job-1');
  });

  it('should reject acquisition when already held', async () => {
    await lockService.acquireLock('job-1', 10);
    const secondTry = await lockService.acquireLock('job-1', 10);
    expect(secondTry).toBeNull();
  });

  it('should release lock successfully', async () => {
    const handle = await lockService.acquireLock('job-1', 10);
    expect(handle).not.toBeNull();

    const released = await lockService.releaseLock(handle!);
    expect(released).toBe(true);

    const reacquired = await lockService.acquireLock('job-1', 10);
    expect(reacquired).not.toBeNull();
  });
});

