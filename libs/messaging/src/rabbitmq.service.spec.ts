import { RabbitMQService } from './rabbitmq.service';
import { ConfigService } from '@nestjs/config';

describe('RabbitMQService', () => {
  let service: RabbitMQService;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    config = {
      get: jest.fn().mockReturnValue('amqp://localhost:5672'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new RabbitMQService(config);
  });

  it('should create standardized EventEnvelope', () => {
    const payload = { notificationId: 'notif-1', channel: 'EMAIL' };
    const envelope = service.createEnvelope('notification.queued', payload, {
      tenantId: 'tenant-1',
      aggregateId: 'notif-1',
      correlationId: 'corr-123',
    });

    expect(envelope.eventId).toBeDefined();
    expect(envelope.eventType).toBe('notification.queued');
    expect(envelope.tenantId).toBe('tenant-1');
    expect(envelope.aggregateId).toBe('notif-1');
    expect(envelope.correlationId).toBe('corr-123');
    expect(envelope.payload).toEqual(payload);
  });

  it('should publish to subscribed handlers matching routing pattern', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    service.subscribe('notification.delivery.#', handler);

    const envelope = service.createEnvelope('notification.queued', {}, {
      tenantId: 't-1',
      aggregateId: 'a-1',
    });

    await service.publish('notification.exchange', 'notification.delivery.email', envelope);

    expect(handler).toHaveBeenCalledWith(envelope);
  });
});

