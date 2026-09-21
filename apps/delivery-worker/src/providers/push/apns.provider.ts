import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@app/contracts';
import { INotificationProvider, ProviderSendOptions, ProviderSendResult } from '../provider.interface';

@Injectable()
export class ApnsPushProvider implements INotificationProvider {
  readonly name = 'mock-apns';
  readonly channel = NotificationChannel.PUSH;
  private readonly logger = new Logger(ApnsPushProvider.name);

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async send(options: ProviderSendOptions): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    this.logger.log(
      `[${this.name}] [Fallback] Sending Push Notification via APNs to: ${options.recipient}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 45));

    return {
      success: true,
      provider: this.name,
      providerMessageId: `apns-${randomUUID()}`,
      latencyMs: Date.now() - startedAt,
    };
  }
}

