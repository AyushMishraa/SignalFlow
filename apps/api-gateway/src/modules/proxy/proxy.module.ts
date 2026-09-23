import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationProxyService } from './notifications-proxy.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('apiGateway.timeout') || 30000,
        maxRedirects: 0,
      }),
    }),
  ],
  providers: [NotificationProxyService],
  exports: [NotificationProxyService],
})
export class ProxyModule {}
