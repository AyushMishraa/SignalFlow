import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@app/contracts';
import { INotificationProvider } from './provider.interface';
import { MockEmailProvider } from './email/mock-email.provider';
import { SesEmailProvider } from './email/ses.provider';
import { NodemailerEmailProvider } from './email/nodemailer.provider';
import { MockSmsProvider } from './sms/mock-sms.provider';
import { SnsSmsProvider } from './sms/sns.provider';
import { MockPushProvider } from './push/mock-push.provider';
import { ApnsPushProvider } from './push/apns.provider';

@Injectable()
export class ProviderRegistry {
  private readonly logger = new Logger(ProviderRegistry.name);
  private readonly providers = new Map<NotificationChannel, INotificationProvider[]>();

  constructor(
    nodemailerEmail: NodemailerEmailProvider,
    mockEmail: MockEmailProvider,
    sesEmail: SesEmailProvider,
    mockSms: MockSmsProvider,
    snsSms: SnsSmsProvider,
    mockPush: MockPushProvider,
    apnsPush: ApnsPushProvider,
  ) {
    this.register(NotificationChannel.EMAIL, [mockEmail, sesEmail]);
    this.register(NotificationChannel.EMAIL, [nodemailerEmail, mockEmail, sesEmail]);
    this.register(NotificationChannel.SMS, [mockSms, snsSms]);
    this.register(NotificationChannel.PUSH, [mockPush, apnsPush]);
  }

  register(channel: NotificationChannel, providers: INotificationProvider[]): void {
    this.providers.set(channel, providers);
    this.logger.log(
      `Registered ${providers.length} provider(s) for channel: ${channel} [${providers.map((p) => p.name).join(', ')}]`,
    );
  }

  getProvidersForChannel(channel: NotificationChannel): INotificationProvider[] {
    return this.providers.get(channel) || [];
  }
}

