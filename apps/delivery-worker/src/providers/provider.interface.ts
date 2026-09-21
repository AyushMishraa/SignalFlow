import { NotificationChannel } from '@app/contracts';

export interface ProviderSendOptions {
  notificationId: string;
  tenantId: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string | null;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface ProviderSendResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  isRetryable?: boolean;
  latencyMs: number;
}

export interface INotificationProvider {
  readonly name: string;
  readonly channel: NotificationChannel;
  isHealthy(): Promise<boolean>;
  send(options: ProviderSendOptions): Promise<ProviderSendResult>;
}

