import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { ApiGatewayModule } from '../apps/api-gateway/src/api-gateway.module';
import { GlobalExceptionFilter } from '../apps/api-gateway/src/common/filters/global-exception.filter';
import { ResponseInterceptor } from '../apps/api-gateway/src/common/interceptors/response.interceptor';

describe('ApiGateway (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ApiGatewayModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/health (GET) returns 200 and standard envelope with correlation headers', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .set('x-correlation-id', 'custom-e2e-corr-id')
      .expect(200);

    expect(response.headers['x-correlation-id']).toBe('custom-e2e-corr-id');
    expect(response.headers['x-request-id']).toBeDefined();
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'ok',
          service: 'api-gateway',
        }),
        meta: expect.objectContaining({
          correlationId: 'custom-e2e-corr-id',
          requestId: expect.any(String),
          timestamp: expect.any(String),
        }),
      }),
    );
  });

  it('/health/live (GET) returns 200 for liveness probe', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/live')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
  });

  it('/metrics (GET) returns Prometheus formatted plain text metrics', async () => {
    const response = await request(app.getHttpServer())
      .get('/metrics')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('# HELP');
  });

  it('/notifications (POST) rejects malformed body with 400 VALIDATION_ERROR envelope', async () => {
    const response = await request(app.getHttpServer())
      .post('/notifications')
      .send({
        // missing tenantId, channel, recipient, content
        type: 'INVALID_TYPE',
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
        }),
        meta: expect.objectContaining({
          requestId: expect.any(String),
          correlationId: expect.any(String),
        }),
      }),
    );
  });
});
