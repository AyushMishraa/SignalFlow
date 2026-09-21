export const RabbitMQConstants = {
  EXCHANGES: {
    NOTIFICATION: 'notification.exchange',
    DEAD_LETTER: 'notification.dlx',
    RETRY: 'notification.retry.exchange',
  },
  QUEUES: {
    DELIVERY: 'notification.delivery.queue',
    EMAIL: 'notification.email.queue',
    SMS: 'notification.sms.queue',
    PUSH: 'notification.push.queue',
    RETRY: 'notification.retry.queue',
    DEAD_LETTER: 'notification.dead-letter.queue',
  },
  ROUTING_KEYS: {
    NOTIFICATION_CREATED: 'notification.created',
    NOTIFICATION_QUEUED: 'notification.queued',
    NOTIFICATION_DELIVERY: 'notification.delivery.#',
    NOTIFICATION_EMAIL: 'notification.delivery.email',
    NOTIFICATION_SMS: 'notification.delivery.sms',
    NOTIFICATION_PUSH: 'notification.delivery.push',
    NOTIFICATION_DELIVERED: 'notification.delivered',
    NOTIFICATION_FAILED: 'notification.failed',
    NOTIFICATION_RETRY: 'notification.retry',
    NOTIFICATION_DLQ: 'notification.dlq',
  },
};

