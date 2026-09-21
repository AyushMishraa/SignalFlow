import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ApiGatewayController } from './api-gateway.controller';
import { ApiGatewayService } from './api-gateway.service';
import { CorrelationIdMiddleware } from './common/middlewares/correlation-id.middleware';
import { ConfigModule } from '@nestjs/config';
import gatewayConfig from './config/gateway.config';
import { AppConfigModule } from '@app/config';
import { RedisModule } from '@app/redis';
import { IdempotencyModule } from '@app/common';
import { ProxyModule } from './modules/proxy/proxy.module';
import { HealthModule } from './modules/health/health.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RateLimitGuard } from './common/guards/rate-limit.guard';

@Module({
  imports: [
    AppConfigModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [gatewayConfig],
    }),
    RedisModule,
    IdempotencyModule,
    ProxyModule,
    HealthModule,
    NotificationsModule,
  ],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService, RateLimitGuard],
})
export class ApiGatewayModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
