import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { LoggingModule } from '@app/logging';
import { DatabaseModule } from '@app/database';
import { MessagingModule } from '@app/messaging';
import { RedisModule } from '@app/redis';
import { NotificationModule } from './notification/notification.module';
import { OutboxModule } from './outbox/outbox.module';
import { AuditModule } from './audit/audit.module';
import { TemplateModule } from './templates/template.module';
import { PreferenceModule } from './preferences/preference.module';
import { NotificationServiceController } from './notification-service.controller';
import { NotificationServiceService } from './notification-service.service';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    DatabaseModule,
    MessagingModule,
    RedisModule,
    NotificationModule,
    OutboxModule,
    AuditModule,
    TemplateModule,
    PreferenceModule,
  ],
  controllers: [NotificationServiceController],
  providers: [NotificationServiceService],
})
export class NotificationServiceModule {}
