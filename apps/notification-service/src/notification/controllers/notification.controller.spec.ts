import { NotificationDomainController } from './notification.controller';
import { NotificationDomainService } from '../services/notification.service';
import {
  CreateNotificationDto,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
} from '@app/contracts';

describe('NotificationDomainController', () => {
  let controller: NotificationDomainController;
  let service: jest.Mocked<NotificationDomainService>;

  beforeEach(() => {
    service = {
      createNotification: jest.fn(),
      getNotificationById: jest.fn(),
      getNotifications: jest.fn(),
      cancelNotification: jest.fn(),
      getAuditLogs: jest.fn(),
      getDeliveryAttempts: jest.fn(),
      transitionStatus: jest.fn(),
    } as unknown as jest.Mocked<NotificationDomainService>;

    controller = new NotificationDomainController(service);
  });

  it('should call service.createNotification with DTO and actor', async () => {
    const dto: CreateNotificationDto = {
      tenantId: 'tenant-123',
      type: NotificationType.ORDER_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      recipient: 'buyer@example.com',
      content: 'Your order was confirmed',
      priority: NotificationPriority.NORMAL,
    };
    const expected = { id: 'notif-1', ...dto, status: NotificationStatus.PENDING };
    service.createNotification.mockResolvedValue(expected as any);

    const result = await controller.createNotification(dto, 'custom-actor');

    expect(service.createNotification).toHaveBeenCalledWith(dto, 'custom-actor');
    expect(result).toBe(expected);
  });

  it('should call service.getNotificationById', async () => {
    const expected = { id: 'notif-1' };
    service.getNotificationById.mockResolvedValue(expected as any);

    const result = await controller.getNotificationById('notif-1');

    expect(service.getNotificationById).toHaveBeenCalledWith('notif-1');
    expect(result).toBe(expected);
  });

  it('should call service.cancelNotification', async () => {
    const expected = { id: 'notif-1', status: NotificationStatus.CANCELLED };
    service.cancelNotification.mockResolvedValue(expected as any);

    const result = await controller.cancelNotification('notif-1', 'admin', 'duplicate');

    expect(service.cancelNotification).toHaveBeenCalledWith('notif-1', 'admin', 'duplicate');
    expect(result).toBe(expected);
  });
});

