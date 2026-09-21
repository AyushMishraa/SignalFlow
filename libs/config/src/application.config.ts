import { registerAs } from '@nestjs/config';

export const applicationConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'Smart_Notification_Orchestrator',
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  version: process.env.APP_VERSION || '1.0.0',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development' || !process.env.NODE_ENV,
}));

