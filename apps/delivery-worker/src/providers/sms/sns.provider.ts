import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@app/contracts';
import { INotificationProvider, ProviderSendOptions, ProviderSendResult } from '../provider.interface';

@Injectable()
export class SnsSmsProvider implements INotificationProvider {
  readonly name = 'mock-sns';
  readonly channel = NotificationChannel.SMS;
  private readonly logger = new Logger(SnsSmsProvider.name);

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async send(options: ProviderSendOptions): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    this.logger.log(
      `[${this.name}] [Fallback] Sending SMS via AWS SNS to: ${options.recipient}`,
    );

    await new Promise((resolve) => setTimeout(resolve, 50));

    return {
      success: true,
      provider: this.name,
      providerMessageId: `sns_msg_${randomUUID()}`,
      latencyMs: Date.now() - startedAt,
    };
  }
}

