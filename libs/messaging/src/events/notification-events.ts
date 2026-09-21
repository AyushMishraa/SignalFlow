import { NotificationChannel, NotificationType, NotificationPriority } from '@app/contracts';

export interface NotificationQueuedPayload {
  notificationId: string;
  tenantId: string;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  subject?: string | null;
  content: string;
  priority: NotificationPriority;
  attemptNumber?: number;
  scheduledAt?: string | null;
}

export interface NotificationDeliveredPayload {
  notificationId: string;
  tenantId: string;
  provider: string;
  providerMessageId: string;
  attemptNumber: number;
  durationMs: number;
}

export interface NotificationFailedPayload {
  notificationId: string;
  tenantId: string;
  provider: string;
  attemptNumber: number;
  errorCode: string;
  errorMessage: string;
  isRetryable: boolean;
}

