import { ScheduledNotificationsJob } from './scheduled-notifications.job';
import { PrismaService } from '@app/database';
import { DistributedLockService } from '@app/redis';
import { RabbitMQService } from '@app/messaging';
import { NotificationChannel, NotificationType, NotificationPriority, NotificationStatus } from '@app/contracts';

describe('ScheduledNotificationsJob', () => {
  let job: ScheduledNotificationsJob;
  let prisma: jest.Mocked<PrismaService>;
  let lockService: jest.Mocked<DistributedLockService>;
  let rabbitMQ: jest.Mocked<RabbitMQService>;

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    } as unknown as jest.Mocked<PrismaService>;

    lockService = {
      acquireLock: jest.fn(),
      releaseLock: jest.fn(),
    } as unknown as jest.Mocked<DistributedLockService>;

    rabbitMQ = {
      createEnvelope: jest.fn().mockReturnValue({ eventId: 'e-1' }),
      publish: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<RabbitMQService>;

    job = new ScheduledNotificationsJob(prisma, lockService, rabbitMQ);
  });

  it('should skip run when lock cannot be acquired', async () => {
    lockService.acquireLock.mockResolvedValue(null);

    const count = await job.runJob();

    expect(count).toBe(0);
    expect(prisma.notification.findMany).not.toHaveBeenCalled();
  });

  it('should process due notifications, transition status to QUEUED, and publish to broker', async () => {
    lockService.acquireLock.mockResolvedValue({ resource: 'scheduler:notifications', token: 'tok-1' });

    const dueItem = {
      id: 'notif-due-1',
      tenantId: 'tenant-1',
      type: NotificationType.MARKETING,
      channel: NotificationChannel.EMAIL,
      recipient: 'user@example.com',
      subject: 'Special Offer',
      content: 'Discount code inside',
      priority: NotificationPriority.LOW,
      status: NotificationStatus.PENDING,
      scheduledAt: new Date(Date.now() - 1000),
    };

    (prisma.notification.findMany as jest.Mock).mockResolvedValue([dueItem]);

    const count = await job.runJob();

    expect(count).toBe(1);
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-due-1' },
      data: { status: NotificationStatus.QUEUED },
    });
    expect(rabbitMQ.publish).toHaveBeenCalled();
    expect(lockService.releaseLock).toHaveBeenCalled();
  });
});

