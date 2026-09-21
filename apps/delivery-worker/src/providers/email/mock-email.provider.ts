import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NotificationChannel } from '@app/contracts';
import { INotificationProvider, ProviderSendOptions, ProviderSendResult } from '../provider.interface';

@Injectable()
export class MockEmailProvider implements INotificationProvider {
  readonly name = 'mock-sendgrid';
  readonly channel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(MockEmailProvider.name);

  async isHealthy(): Promise<boolean> {
    return true;
  }

  async send(options: ProviderSendOptions): Promise<ProviderSendResult> {
    const startedAt = Date.now();
    this.logger.log(
      `[${this.name}] Sending EMAIL to: ${options.recipient}, Subject: "${options.subject || 'No Subject'}"`,
    );

    // Simulate simulated network call
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Support simulated test failure trigger
    if (options.recipient.includes('fail-primary@')) {
      return {
        success: false,
        provider: this.name,
        errorCode: 'SENDGRID_RATE_LIMIT',
        errorMessage: 'Simulated 429 rate limit reached on SendGrid',
        isRetryable: true,
        latencyMs: Date.now() - startedAt,
      };
    }

    if (options.recipient.includes('invalid-recipient@')) {
      return {
        success: false,
        provider: this.name,
        errorCode: 'INVALID_RECIPIENT',
        errorMessage: 'Email address does not exist on remote MX server',
        isRetryable: false,
        latencyMs: Date.now() - startedAt,
      };
    }

    return {
      success: true,
      provider: this.name,
      providerMessageId: `msg_sg_${randomUUID()}`,
      latencyMs: Date.now() - startedAt,
    };
  }
}

