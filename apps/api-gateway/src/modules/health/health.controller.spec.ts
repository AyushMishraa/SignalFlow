import { HealthController } from './health.controller';
import { HealthCheckService, HttpHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: jest.Mocked<HealthCheckService>;
  let httpHealthIndicator: jest.Mocked<HttpHealthIndicator>;

  beforeEach(() => {
    healthCheckService = {
      check: jest.fn().mockImplementation((indicators) =>
        Promise.resolve({
          status: 'ok',
          info: {},
          error: {},
          details: {},
        }),
      ),
    } as unknown as jest.Mocked<HealthCheckService>;

    httpHealthIndicator = {
      pingCheck: jest.fn().mockResolvedValue({ 'notification-service': { status: 'up' } }),
    } as unknown as jest.Mocked<HttpHealthIndicator>;

    controller = new HealthController(healthCheckService, httpHealthIndicator);
  });

  it('should return basic health status', () => {
    const res = controller.check();
    expect(res.status).toBe('ok');
    expect(res.service).toBe('api-gateway');
  });

  it('should execute liveness check', async () => {
    const res = await controller.liveness();
    expect(healthCheckService.check).toHaveBeenCalledWith([]);
    expect(res.status).toBe('ok');
  });

  it('should execute readiness check with downstream ping', async () => {
    const res = await controller.readiness();
    expect(healthCheckService.check).toHaveBeenCalled();
    expect(res.status).toBe('ok');
  });
});

