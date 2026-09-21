import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@app/contracts';
import { INotificationProvider, ProviderSendOptions, ProviderSendResult } from '../provider.interface';

@Injectable()
export class MockSmsProvider implements INotificationProvider {
  readonly name = 'mock-twilio';
  readonly channel = NotificationChannel.SMS;
  private readonly logger = new Logger(MockSmsProvider.name);

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async send(options: ProviderSendOptions): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    this.logger.log(
      `[${this.name}] Sending SMS to: ${options.recipient}, Content: "${options.content}"`,
    );

    await new Promise((resolve) => setTimeout(resolve, 40));

    if (options.recipient.endsWith('0000')) {
      return {
        success: false,
        provider: this.name,
        errorCode: 'CARRIER_UNREACHABLE',
        errorMessage: 'Simulated carrier unreachable on Twilio',
        isRetryable: true,
        latencyMs: Date.now() - startedAt,
      };
    }

    return {
      success: true,
      provider: this.name,
      providerMessageId: `SM_${randomUUID()}`,
      latencyMs: Date.now() - startedAt,
    };
  }
}

