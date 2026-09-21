import { Injectable, LoggerService, LogLevel } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly sensitiveKeys = new Set([
    'password',
    'secret',
    'token',
    'apikey',
    'api_key',
    'authorization',
    'otp',
    'jwt',
  ]);

  log(message: any, context?: string) {
    this.write('INFO', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.write('ERROR', message, context, trace);
  }

  warn(message: any, context?: string) {
    this.write('WARN', message, context);
  }

  debug(message: any, context?: string) {
    this.write('DEBUG', message, context);
  }

  verbose(message: any, context?: string) {
    this.write('VERBOSE', message, context);
  }

  setLogLevels?(_levels: LogLevel[]) {}

  private write(level: string, message: any, context?: string, trace?: string) {
    const timestamp = new Date().toISOString();
    let payload: Record<string, any>;

    if (typeof message === 'object' && message !== null) {
      payload = {
        timestamp,
        level,
        context: context || 'App',
        ...this.redactSensitive(message),
      };
    } else {
      payload = {
        timestamp,
        level,
        context: context || 'App',
        message: String(message),
      };
    }

    if (trace) {
      payload.trace = trace;
    }

    console.log(JSON.stringify(payload));
  }

  private redactSensitive(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitive(item));
    }

    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.sensitiveKeys.has(key.toLowerCase())) {
        cleaned[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = this.redactSensitive(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
}
