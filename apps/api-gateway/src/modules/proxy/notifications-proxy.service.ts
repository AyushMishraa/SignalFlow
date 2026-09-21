import {
  Injectable,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class NotificationProxyService {
  private readonly logger = new Logger(NotificationProxyService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private getBaseUrl(): string {
    return (
      this.config.get<string>('apiGateway.notificationServiceUrl') ||
      this.config.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://localhost:3001'
    );
  }

  async createNotification(payload: unknown, headers: Record<string, string> = {}) {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await firstValueFrom(
        this.http.post(`${baseUrl}/api/v1/notifications`, payload, {
          headers: this.buildHeaders(headers),
        }),
      );

      return response.data;
    } catch (error) {
      this.handleProxyError(error, 'Failed to proxy create notification');
    }
  }

  async getNotificationById(id: string, headers: Record<string, string> = {}) {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await firstValueFrom(
        this.http.get(`${baseUrl}/api/v1/notifications/${id}`, {
          headers: this.buildHeaders(headers),
        }),
      );

      return response.data;
    } catch (error) {
      this.handleProxyError(error, `Failed to proxy get notification by id: ${id}`);
    }
  }

  async getNotifications(query: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await firstValueFrom(
        this.http.get(`${baseUrl}/api/v1/notifications`, {
          params: query,
          headers: this.buildHeaders(headers),
        }),
      );

      return response.data;
    } catch (error) {
      this.handleProxyError(error, 'Failed to proxy get notifications');
    }
  }

  async cancelNotification(id: string, headers: Record<string, string> = {}) {
    const baseUrl = this.getBaseUrl();

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${baseUrl}/api/v1/notifications/${id}/cancel`,
          {},
          { headers: this.buildHeaders(headers) },
        ),
      );

      return response.data;
    } catch (error) {
      this.handleProxyError(error, `Failed to proxy cancel notification: ${id}`);
    }
  }

  private buildHeaders(headers: Record<string, string>): Record<string, string> {
    const forwardHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (headers['x-correlation-id']) {
      forwardHeaders['x-correlation-id'] = headers['x-correlation-id'];
    }
    if (headers['x-request-id']) {
      forwardHeaders['x-request-id'] = headers['x-request-id'];
    }
    if (headers['idempotency-key']) {
      forwardHeaders['idempotency-key'] = headers['idempotency-key'];
    }
    if (headers['authorization']) {
      forwardHeaders['authorization'] = headers['authorization'];
    }
    if (headers['x-api-key']) {
      forwardHeaders['x-api-key'] = headers['x-api-key'];
    }

    return forwardHeaders;
  }

  private handleProxyError(error: unknown, contextMessage: string): never {
    const axiosError = error as AxiosError<{
      success?: boolean;
      error?: { code?: string; message?: string; details?: unknown };
      message?: string | string[];
    }>;

    if (axiosError.response) {
      const status = axiosError.response.status;
      const data = axiosError.response.data;

      this.logger.warn(
        `${contextMessage}: Downstream returned status ${status} - ${JSON.stringify(data)}`,
      );

      throw new HttpException(
        data || {
          code: 'DOWNSTREAM_ERROR',
          message: axiosError.message,
        },
        status,
      );
    }

    this.logger.error(`${contextMessage}: Network or unreachable service - ${axiosError.message}`);

    throw new ServiceUnavailableException(
      'Notification service is temporarily unavailable',
    );
  }
}