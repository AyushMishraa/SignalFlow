import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  RabbitMQService,
  RabbitMQConstants,
  EventEnvelope,
  NotificationQueuedPayload,
} from '@app/messaging';
import { DeliveryService } from '../delivery/delivery.service';

@Injectable()
export class NotificationConsumer implements OnModuleInit {
  private readonly logger = new Logger(NotificationConsumer.name);
  private readonly processedEventIds = new Set<string>();

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly deliveryService: DeliveryService,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing NotificationConsumer subscribers...');

    // Subscribe to all delivery events matching notification.delivery.#
    this.rabbitMQ.subscribe<NotificationQueuedPayload>(
      RabbitMQConstants.ROUTING_KEYS.NOTIFICATION_DELIVERY,
      async (envelope: EventEnvelope<NotificationQueuedPayload>) => {
        await this.handleMessage(envelope);
      },
    );
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

