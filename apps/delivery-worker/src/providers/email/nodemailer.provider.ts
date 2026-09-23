import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificationChannel } from '@app/contracts';
import {
  INotificationProvider,
  ProviderSendOptions,
  ProviderSendResult,
} from '../provider.interface';

@Injectable()
export class NodemailerEmailProvider implements INotificationProvider {
  readonly name = 'nodemailer-smtp';
  readonly channel = NotificationChannel.EMAIL;
  private readonly logger = new Logger(NodemailerEmailProvider.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.initTransporter();
  }

  private initTransporter(): void {
    const host =
      this.config.get<string>('SMTP_HOST') ||
      process.env.SMTP_HOST ||
      'smtp.gmail.com';
    const port = parseInt(
      this.config.get<string>('SMTP_PORT') || process.env.SMTP_PORT || '587',
      10,
    );
    const user =
      this.config.get<string>('SMTP_USER') || process.env.SMTP_USER;
    const pass =
      this.config.get<string>('SMTP_PASS') || process.env.SMTP_PASS;
    const secure =
      port === 465 ||
      this.config.get<string>('SMTP_SECURE') === 'true' ||
      process.env.SMTP_SECURE === 'true';

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(
        `Nodemailer SMTP transport initialized for host: ${host}:${port} (user: ${user})`,
      );
    } else {
      this.logger.warn(
        'Nodemailer SMTP credentials (SMTP_USER / SMTP_PASS) not found in environment. Provider will be marked inactive until configured.',
      );
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.transporter) {
      // Re-check environment in case env was populated dynamically
      this.initTransporter();
    }
    return !!this.transporter;
  }

  async send(options: ProviderSendOptions): Promise<ProviderSendResult> {
    const startedAt = Date.now();

    if (!this.transporter) {
      this.initTransporter();
    }

    if (!this.transporter) {
      return {
        success: false,
        provider: this.name,
        errorCode: 'SMTP_CONFIG_MISSING',
        errorMessage:
          'Nodemailer transporter is not configured. Missing SMTP_USER / SMTP_PASS.',
        isRetryable: false,
        latencyMs: Date.now() - startedAt,
      };
    }

    const fromAddress =
      this.config.get<string>('SMTP_FROM') ||
      process.env.SMTP_FROM ||
      this.config.get<string>('SMTP_USER') ||
      process.env.SMTP_USER;

    try {
      this.logger.log(
        `[${this.name}] Sending REAL email to: ${options.recipient}, Subject: "${options.subject || 'No Subject'}"`,
      );

      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: options.recipient,
        subject: options.subject || 'Notification',
        text: options.content,
        html:
          (options.metadata?.html as string) ||
          `<p>${options.content.replace(/\n/g, '<br/>')}</p>`,
      });

      this.logger.log(
        `[${this.name}] Email successfully delivered to ${options.recipient}. MessageId: ${info.messageId}`,
      );

      return {
        success: true,
        provider: this.name,
        providerMessageId: info.messageId,
        latencyMs: Date.now() - startedAt,
      };
    } catch (err: any) {
      this.logger.error(
        `[${this.name}] Failed to send email to ${options.recipient}: ${err.message}`,
        err.stack,
      );

      const isRetryable =
        ['ETIMEDOUT', 'ECONNRESET', 'ESOCKET', 'ECONNREFUSED'].includes(
          err.code,
        ) || err.responseCode >= 400 && err.responseCode < 500;

      return {
        success: false,
        provider: this.name,
        errorCode: err.code || 'SMTP_SEND_FAILED',
        errorMessage: err.message,
        isRetryable,
        latencyMs: Date.now() - startedAt,
      };
    }
  }
}

