import { registerAs } from '@nestjs/config';

export default registerAs('apiGateway', () => ({
  port: parseInt(process.env.API_GATEWAY_PORT ?? '3000', 10),
  notificationServiceUrl:
    process.env.NOTIFICATION_SERVICE_URL ??
    'http://localhost:3001',
  timeout: parseInt(process.env.NOTIFICATION_SERVICE_TIMEOUT ?? '30000', 10),
}));