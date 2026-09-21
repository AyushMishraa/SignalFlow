import { Controller, Get, Header, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
} from '@nestjs/terminus';
import { MetricsService } from '@app/logging';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly http: HttpHealthIndicator,
    @Optional()
    private readonly metrics?: MetricsService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Basic gateway health check' })
  check() {
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  liveness() {
    return this.health.check([]);
  }

  @Get('health/ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe checking downstream dependencies' })
  readiness() {
    const notificationServiceUrl =
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001';

    return this.health.check([
      () =>
        this.http.pingCheck(
          'notification-service',
          `${notificationServiceUrl}/health`,
        ),
    ]);
  }

  @Get('metrics')
  @Header('Content-Type', 'text/plain')
  @ApiOperation({ summary: 'Prometheus metrics scrape endpoint' })
  getMetrics(): string {
    return (
      this.metrics?.getMetricsAsPrometheus() ||
      '# HELP api_status API Gateway status\napi_status 1\n'
    );
  }
}
