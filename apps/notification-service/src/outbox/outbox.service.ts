import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RabbitMQService, RabbitMQConstants, EventEnvelope } from '@app/messaging';
import { OutboxRecord } from './outbox-event.interface';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private readonly outboxStore: OutboxRecord[] = [];

  constructor(private readonly rabbitMQ: RabbitMQService) {}

  async createOutboxEvent<T>(
    tenantId: string,
    eventType: string,
    routingKey: string,
    payload: T,
    aggregateId: string,
    correlationId?: string,
  ): Promise<OutboxRecord> {
    const envelope = this.rabbitMQ.createEnvelope(eventType, payload, {
      tenantId,
      aggregateId,
      correlationId,
    });

    const record: OutboxRecord = {
      id: randomUUID(),
      tenantId,
      eventType,
      routingKey,
      exchange: RabbitMQConstants.EXCHANGES.NOTIFICATION,
      payload: envelope,
      status: 'PENDING',
      retryCount: 0,
      createdAt: new Date(),
    };

    this.outboxStore.push(record);
    this.logger.log(`Outbox record created with ID: ${record.id} for event: ${eventType}`);

    // Immediately dispatch pending event to RabbitMQ
    await this.publishEvent(record);

    return record;
  }

  async publishEvent(record: OutboxRecord): Promise<void> {
    try {
      await this.rabbitMQ.publish(
        record.exchange,
        record.routingKey,
        record.payload as EventEnvelope,
      );
      record.status = 'PUBLISHED';
      record.publishedAt = new Date();
      this.logger.log(`Outbox event ${record.id} successfully published to broker`);
    } catch (err: any) {
      record.status = 'FAILED';
      record.retryCount += 1;
      record.error = err.message;
      this.logger.error(
        `Failed to publish outbox event ${record.id}: ${err.message}`,
        err.stack,
      );
    }
  }

  getPendingEvents(): OutboxRecord[] {
    return this.outboxStore.filter((r) => r.status === 'PENDING' || r.status === 'FAILED');
  }
}

