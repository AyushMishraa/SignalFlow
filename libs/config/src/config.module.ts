import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { applicationConfig } from './application.config';
import { databaseConfig } from './database.config';
import { messagingConfig } from './messaging.config';
import { redisConfig } from './redis.config';
import { securityConfig } from './security.config';
import { providerConfig } from './provider.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        applicationConfig,
        databaseConfig,
        messagingConfig,
        redisConfig,
        securityConfig,
        providerConfig,
      ],
      envFilePath: ['.env', '.env.local'],
    }),
  ],
  exports: [ConfigModule],
})
export class AppConfigModule {}

