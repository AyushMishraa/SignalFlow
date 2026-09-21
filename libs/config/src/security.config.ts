import { registerAs } from '@nestjs/config';

export const securityConfig = registerAs('security', () => ({
  jwtSecret: process.env.JWT_SECRET || 'super-secret-jwt-key-for-development-only-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-for-development-only',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  apiKeyHeader: 'x-api-key',
}));

