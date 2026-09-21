import { Module } from '@nestjs/common';
import { DatabaseModule } from '@app/database';
import { NotificationDomainController } from './controllers/notification.controller';
import { NotificationDomainService } from './services/notification.service';
import { TenantVerificationService } from './services/tenant-verification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { NOTIFICATION_REPOSITORY_TOKEN } from './repositories/notification.repository.interface';

@Module({
  imports: [DatabaseModule],
  controllers: [NotificationDomainController],
  providers: [
    NotificationDomainService,
    TenantVerificationService,
    NotificationRepository,
    {
      provide: NOTIFICATION_REPOSITORY_TOKEN,
      useExisting: NotificationRepository,
    },
  ],
  exports: [NotificationDomainService, NOTIFICATION_REPOSITORY_TOKEN],
})
export class NotificationModule {}

