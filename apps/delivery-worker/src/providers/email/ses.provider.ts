import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@app/contracts';
import { INotificationProvider, ProviderSendOptions, ProviderSendResult } from '../provider.interface';

@Injectable()
export class SesEmailProvider implements INotificationProvider {
  readonly name = 'mock-ses';
  readonly channel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(SesEmailProvider.name);

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async send(options: ProviderSendOptions): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    this.logger.log(
      `[${this.name}] [Fallback] Sending EMAIL to: ${options.recipient}, Subject: "${options.subject || 'No Subject'}"`,
    );

    await new Promise((resolve) => setTimeout(resolve, 60));

    return {
      success: true,
      provider: this.name,
      providerMessageId: `msg_ses_${randomUUID()}`,
      latencyMs: Date.now() - startedAt,
    };
  }
}

