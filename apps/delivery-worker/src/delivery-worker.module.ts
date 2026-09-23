import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { LoggingModule } from '@app/logging';
import { DatabaseModule } from '@app/database';
import { MessagingModule } from '@app/messaging';
import { MockEmailProvider } from './providers/email/mock-email.provider';
import { SesEmailProvider } from './providers/email/ses.provider';
import { NodemailerEmailProvider } from './providers/email/nodemailer.provider';
import { MockSmsProvider } from './providers/sms/mock-sms.provider';
import { SnsSmsProvider } from './providers/sms/sns.provider';
import { MockPushProvider } from './providers/push/mock-push.provider';
import { ApnsPushProvider } from './providers/push/apns.provider';
import { ProviderRegistry } from './providers/provider.registry';
import { ProviderSelectionService } from './providers/provider-selection.service';
import { DeliveryService } from './delivery/delivery.service';
import { NotificationConsumer } from './consumers/notification.consumer';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    DatabaseModule,
    MessagingModule,
  ],
  providers: [
    NodemailerEmailProvider,
    MockEmailProvider,
    SesEmailProvider,
    MockSmsProvider,
    SnsSmsProvider,
    MockPushProvider,
    ApnsPushProvider,
    ProviderRegistry,
    ProviderSelectionService,
    DeliveryService,
    NotificationConsumer,
  ],
  exports: [DeliveryService, ProviderRegistry, NodemailerEmailProvider],
})
export class DeliveryWorkerModule {}

