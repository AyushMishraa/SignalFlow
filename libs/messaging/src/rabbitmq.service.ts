import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { EventEnvelope } from './events/event-envelope.interface';
import { RabbitMQConstants } from './rabbitmq.constants';

export type MessageHandler<T = any> = (envelope: EventEnvelope<T>) => Promise<void>;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly handlers = new Map<string, MessageHandler[]>();
  private isConnected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('messaging.rabbitmqUrl') || 'amqp://localhost:5672';
    this.logger.log(`Initializing messaging client with broker: ${url}`);
    this.isConnected = true;
  }

  async onModuleDestroy() {
    this.logger.log('Closing messaging client');
    this.isConnected = false;
  }

  createEnvelope<T>(
    eventType: string,
    payload: T,
    options: {
      tenantId: string;
      aggregateId: string;
      correlationId?: string;
      version?: number;
    },
  ): EventEnvelope<T> {
    return {
      eventId: randomUUID(),
      eventType,
      occurredAt: new Date().toISOString(),
      correlationId: options.correlationId || randomUUID(),
      tenantId: options.tenantId,
      aggregateId: options.aggregateId,
      version: options.version || 1,
      payload,
    };
  }

  async publish<T>(
    exchange: string,
    routingKey: string,
    envelope: EventEnvelope<T>,
  ): Promise<boolean> {
    this.logger.log(
      `[Publish] Exchange: ${exchange}, Key: ${routingKey}, EventId: ${envelope.eventId}, Type: ${envelope.eventType}`,
    );

    // Dispatch to registered local handlers (enabling in-process / testing orchestration)
    const registered = this.handlers.get(routingKey) || [];
    const wildcardMatches = Array.from(this.handlers.entries())
      .filter(([pattern]) => pattern.includes('#') || pattern.includes('*'))
      .filter(([pattern]) => this.matchesPattern(routingKey, pattern))
      .flatMap(([, handlers]) => handlers);

    const allHandlers = [...registered, ...wildcardMatches];

    if (allHandlers.length > 0) {
      for (const handler of allHandlers) {
        try {
          await handler(envelope);
        } catch (err: any) {
          this.logger.error(
            `Handler execution failed for event ${envelope.eventId}: ${err.message}`,
            err.stack,
          );
        }
      }
    }

    return true;
  }

  subscribe<T = any>(routingKey: string, handler: MessageHandler<T>): void {
    this.logger.log(`Subscribing handler to routing key: ${routingKey}`);
    const existing = this.handlers.get(routingKey) || [];
    existing.push(handler);
    this.handlers.set(routingKey, existing);
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '[^.]+')
      .replace(/#/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(key);
  }
}

