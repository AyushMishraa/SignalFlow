import { registerAs } from '@nestjs/config';

export const messagingConfig = registerAs('messaging', () => ({
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  exchange: process.env.RABBITMQ_EXCHANGE || 'notification.exchange',
  deadLetterExchange: process.env.RABBITMQ_DLX || 'notification.dlx',
  deliveryQueue: process.env.RABBITMQ_DELIVERY_QUEUE || 'notification.delivery.queue',
  retryQueue: process.env.RABBITMQ_RETRY_QUEUE || 'notification.retry.queue',
  deadLetterQueue: process.env.RABBITMQ_DLQ || 'notification.dead-letter.queue',
}));

