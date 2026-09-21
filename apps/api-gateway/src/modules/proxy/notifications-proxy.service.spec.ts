import { NotificationProxyService } from './notifications-proxy.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { ServiceUnavailableException, HttpException } from '@nestjs/common';
import { AxiosResponse, AxiosError } from 'axios';

describe('NotificationProxyService', () => {
  let service: NotificationProxyService;
  let httpService: jest.Mocked<HttpService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    httpService = {
      post: jest.fn(),
      get: jest.fn(),
    } as unknown as jest.Mocked<HttpService>;

    configService = {
      get: jest.fn().mockReturnValue('http://localhost:3001'),
      getOrThrow: jest.fn().mockReturnValue('http://localhost:3001'),
    } as unknown as jest.Mocked<ConfigService>;

    service = new NotificationProxyService(httpService, configService);
  });

  it('should forward createNotification POST request to downstream service', async () => {
    const payload = { recipient: 'user@example.com', content: 'Hello' };
    const mockAxiosResponse: AxiosResponse = {
      data: { success: true, data: { id: 'notif-1' } },
      status: 201,
      statusText: 'Created',
      headers: {},
      config: {} as any,
    };

    httpService.post.mockReturnValue(of(mockAxiosResponse));

    const result = await service.createNotification(payload, {
      'x-correlation-id': 'corr-1',
      'x-request-id': 'req-1',
    });

    expect(httpService.post).toHaveBeenCalledWith(
      'http://localhost:3001/api/v1/notifications',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': 'corr-1',
          'x-request-id': 'req-1',
        },
      },
    );
    expect(result).toEqual({ success: true, data: { id: 'notif-1' } });
  });

  it('should throw ServiceUnavailableException when downstream service is unreachable', async () => {
    httpService.post.mockReturnValue(throwError(() => new Error('ECONNREFUSED')));

    await expect(
      service.createNotification({ content: 'test' }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('should rethrow downstream HttpException when downstream returns 4xx/5xx response', async () => {
    const downstreamError = {
      response: {
        status: 400,
        data: {
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Recipient is required' },
        },
      },
      message: 'Request failed with status code 400',
    } as AxiosError;

    httpService.post.mockReturnValue(throwError(() => downstreamError));

    await expect(
      service.createNotification({ content: 'test' }),
    ).rejects.toThrow(HttpException);
  });
});

