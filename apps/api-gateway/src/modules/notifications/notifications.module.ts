import { Module } from '@nestjs/common';
import { NotificationsGatewayController } from './notifications.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [ProxyModule],
  controllers: [NotificationsGatewayController],
})
export class NotificationsModule {}

