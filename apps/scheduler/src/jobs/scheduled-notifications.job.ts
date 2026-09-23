import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { DistributedLockService } from '@app/redis';
import { RabbitMQService, RabbitMQConstants, NotificationQueuedPayload } from '@app/messaging';
import { NotificationStatus, AuditEvent } from '@app/contracts';

@Injectable()
export class ScheduledNotificationsJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScheduledNotificationsJob.name);
  private timer?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly lockService: DistributedLockService,
    private readonly rabbitMQ: RabbitMQService,
  ) {}

  onModuleInit() {
    this.logger.log('Starting ScheduledNotificationsJob timer (runs every 5s)...');
    this.timer = setInterval(async () => {
      await this.runJob();
    }, 5000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async runJob(): Promise<number> {
    if (this.isRunning) return 0;
    this.isRunning = true;

    const lock = await this.lockService.acquireLock('scheduler:notifications', 15);
    if (!lock) {
      this.logger.debug('Scheduler lock held by another instance. Skipping tick.');
      this.isRunning = false;
      return 0;
    }

    let processedCount = 0;

    try {
      const now = new Date();

      // Find due pending notifications (future scheduled that are now due OR pending immediate notifications)
      const dueNotifications = await this.prisma.notification.findMany({
        where: {
          status: NotificationStatus.PENDING as any,
          OR: [
            {
              scheduledAt: {
                lte: now,
              },
            },
            {
              scheduledAt: null,
            },
          ],
        },
        take: 50,
      });

      if (dueNotifications.length > 0) {
        this.logger.log(`Found ${dueNotifications.length} due scheduled notification(s)`);

        for (const notification of dueNotifications) {
          // Transition status to QUEUED
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: { status: NotificationStatus.QUEUED as any },
          });

          // Record audit log
          await this.prisma.auditLog.create({
            data: {
              tenantId: notification.tenantId,
              notificationId: notification.id,
              event: AuditEvent.NOTIFICATION_QUEUED as any,
              actor: 'scheduler',
              metadata: {
                scheduledAt: notification.scheduledAt,
                dispatchedAt: now.toISOString(),
              },
            },
          });

          // Publish to RabbitMQ
          const payload: NotificationQueuedPayload = {
            notificationId: notification.id,
            tenantId: notification.tenantId,
            type: notification.type as any,
            channel: notification.channel as any,
            recipient: notification.recipient,
            subject: notification.subject,
            content: notification.content,
            priority: notification.priority as any,
            attemptNumber: 1,
            scheduledAt: notification.scheduledAt ? notification.scheduledAt.toISOString() : null,
          };

          const routingKey = `notification.delivery.${notification.channel.toLowerCase()}`;
          const envelope = this.rabbitMQ.createEnvelope(
            'notification.queued',
            payload,
            {
              tenantId: notification.tenantId,
              aggregateId: notification.id,
            },
          );

          await this.rabbitMQ.publish(
            RabbitMQConstants.EXCHANGES.NOTIFICATION,
            routingKey,
            envelope,
          );

          processedCount++;
        }
      }
    } catch (err: any) {
      this.logger.error(`Error executing scheduled notifications job: ${err.message}`, err.stack);
    } finally {
      await this.lockService.releaseLock(lock);
      this.isRunning = false;
    }

    return processedCount;
  }
}
