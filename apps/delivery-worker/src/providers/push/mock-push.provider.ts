import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@app/contracts';
import { INotificationProvider, ProviderSendOptions, ProviderSendResult } from '../provider.interface';

@Injectable()
export class MockPushProvider implements INotificationProvider {
  readonly name = 'mock-fcm';
  readonly channel = NotificationChannel.PUSH;
  private readonly logger = new Logger(MockPushProvider.name);

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async send(options: ProviderSendOptions): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    this.logger.log(
      `[${this.name}] Sending Push Notification via FCM to: ${options.recipient}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 35));

    return {
      success: true,
      provider: this.name,
      providerMessageId: `projects/sno/messages/${randomUUID()}`,
      latencyMs: Date.now() - startedAt,
    };
  }
}

