import { registerAs } from '@nestjs/config';

export const providerConfig = registerAs('providers', () => ({
  email: {
    primary: process.env.EMAIL_PRIMARY_PROVIDER || 'mock-sendgrid',
    fallback: process.env.EMAIL_FALLBACK_PROVIDER || 'mock-ses',
    timeoutMs: parseInt(process.env.EMAIL_TIMEOUT_MS || '5000', 10),
  },
  sms: {
    primary: process.env.SMS_PRIMARY_PROVIDER || 'mock-twilio',
    fallback: process.env.SMS_FALLBACK_PROVIDER || 'mock-sns',
    timeoutMs: parseInt(process.env.SMS_TIMEOUT_MS || '5000', 10),
  },
  push: {
    primary: process.env.PUSH_PRIMARY_PROVIDER || 'mock-fcm',
    fallback: process.env.PUSH_FALLBACK_PROVIDER || 'mock-apns',
    timeoutMs: parseInt(process.env.PUSH_TIMEOUT_MS || '5000', 10),
  },
}));

