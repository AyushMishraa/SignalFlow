import { Module } from '@nestjs/common';
import { AppConfigModule } from '@app/config';
import { LoggingModule } from '@app/logging';
import { DatabaseModule } from '@app/database';
import { MessagingModule } from '@app/messaging';
import { RedisModule } from '@app/redis';
import { ScheduledNotificationsJob } from './jobs/scheduled-notifications.job';

@Module({
  imports: [
    AppConfigModule,
    LoggingModule,
    DatabaseModule,
    MessagingModule,
    RedisModule,
  ],
  providers: [ScheduledNotificationsJob],
})
export class SchedulerModule {}

