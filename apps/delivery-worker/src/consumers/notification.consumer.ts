import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import {
  RabbitMQService,
  RabbitMQConstants,
  EventEnvelope,
  NotificationQueuedPayload,
} from '@app/messaging';
import { PrismaService } from '@app/database';
import { NotificationStatus } from '@app/contracts';
import { DeliveryService } from '../delivery/delivery.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationConsumer.name);
  private readonly processedEventIds = new Set<string>();
  private pollInterval?: NodeJS.Timeout;
  private isPolling = false;

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly deliveryService: DeliveryService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing NotificationConsumer subscribers and queue poller...');

    // Subscribe to all delivery events matching notification.delivery.#
    this.rabbitMQ.subscribe<NotificationQueuedPayload>(
      RabbitMQConstants.ROUTING_KEYS.NOTIFICATION_DELIVERY,
      async (envelope: EventEnvelope<NotificationQueuedPayload>) => {
        await this.handleMessage(envelope);
      },
    );

    // Start background poller to process persistent QUEUED notifications
    this.pollInterval = setInterval(async () => {
      await this.pollQueuedNotifications();
    }, 3000);
  }

  onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async pollQueuedNotifications(): Promise<void> {
    if (this.isPolling) return;
    this.isPolling = true;

    try {
      const queuedNotifications = await this.prisma.notification.findMany({
        where: {
          status: NotificationStatus.QUEUED as any,
        },
        take: 20,
        orderBy: { createdAt: 'asc' },
      });

      for (const notif of queuedNotifications) {
        // Atomic status transition check to prevent duplicate concurrent processing
        const updated = await this.prisma.notification.updateMany({
          where: {
            id: notif.id,
            status: NotificationStatus.QUEUED as any,
          },
          data: {
            status: NotificationStatus.PROCESSING as any,
          },
        });

        if (updated.count === 0) {
          continue; // Already claimed by another worker tick
        }

        this.logger.log(`[Worker Poller] Claimed QUEUED notification ${notif.id} for delivery`);

        const payload: NotificationQueuedPayload = {
          notificationId: notif.id,
          tenantId: notif.tenantId,
          type: notif.type as any,
          channel: notif.channel as any,
          recipient: notif.recipient,
          subject: notif.subject ?? undefined,
          content: notif.content,
          priority: notif.priority as any,
          attemptNumber: 1,
          scheduledAt: notif.scheduledAt ? notif.scheduledAt.toISOString() : null,
        };

        await this.deliveryService.processDelivery(payload, 1);
      }
    } catch (err: any) {
      this.logger.error(`Error in queue poller: ${err.message}`);
    } finally {
      this.isPolling = false;
    }
  }

  async handleMessage(envelope: EventEnvelope<NotificationQueuedPayload>): Promise<void> {
    // 1. Consumer-side Idempotency check
    if (this.processedEventIds.has(envelope.eventId)) {
      this.logger.warn(`[Deduplication] Event ${envelope.eventId} already processed. Skipping duplicate delivery.`);
      return;
    }

    this.processedEventIds.add(envelope.eventId);

    // Keep set bounded
    if (this.processedEventIds.size > 50000) {
      const firstEntries = Array.from(this.processedEventIds.keys()).slice(0, 10000);
      for (const k of firstEntries) this.processedEventIds.delete(k);
    }

    try {
      this.logger.log(`[Consumer] Processing delivery event: ${envelope.eventId} for notification: ${envelope.aggregateId}`);
      await this.deliveryService.processDelivery(envelope.payload, envelope.payload.attemptNumber || 1);
    } catch (err: any) {
      this.logger.error(`[Poison Message] Error processing event ${envelope.eventId}: ${err.message}`, err.stack);
    }
  }
}


