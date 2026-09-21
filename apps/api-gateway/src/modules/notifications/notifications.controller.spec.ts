import { NotificationsGatewayController } from './notifications.controller';
import { NotificationProxyService } from '../proxy/notifications-proxy.service';
import {
  CreateNotificationDto,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
} from '@app/contracts';

describe('NotificationsGatewayController', () => {
  let controller: NotificationsGatewayController;
  let proxyService: jest.Mocked<NotificationProxyService>;

  beforeEach(() => {
    proxyService = {
      createNotification: jest.fn(),
      getNotificationById: jest.fn(),
      getNotifications: jest.fn(),
      cancelNotification: jest.fn(),
    } as unknown as jest.Mocked<NotificationProxyService>;

    controller = new NotificationsGatewayController(proxyService);
  });

  it('should forward createNotification to proxyService with correlation headers', async () => {
    const dto: CreateNotificationDto = {
      tenantId: 'tenant-1',
      type: NotificationType.OTP,
      channel: NotificationChannel.SMS,
      recipient: '+1234567890',
      content: 'Your code is 1234',
      priority: NotificationPriority.HIGH,
    };
    const req: any = { correlationId: 'c-1', requestId: 'r-1' };
    const expected = { success: true, data: { id: 'n-1' } };

    proxyService.createNotification.mockResolvedValue(expected as any);

    const result = await controller.createNotification(dto, req, 'idemp-key-1');

    expect(proxyService.createNotification).toHaveBeenCalledWith(dto, {
      'x-correlation-id': 'c-1',
      'x-request-id': 'r-1',
      'idempotency-key': 'idemp-key-1',
    });
    expect(result).toBe(expected);
  });

  it('should forward getNotificationById to proxyService', async () => {
    const req: any = { correlationId: 'c-1', requestId: 'r-1' };
    const expected = { success: true, data: { id: 'n-1' } };

    proxyService.getNotificationById.mockResolvedValue(expected as any);

    const result = await controller.getNotificationById('n-1', req);

    expect(proxyService.getNotificationById).toHaveBeenCalledWith('n-1', {
      'x-correlation-id': 'c-1',
      'x-request-id': 'r-1',
    });
    expect(result).toBe(expected);
  });
});

