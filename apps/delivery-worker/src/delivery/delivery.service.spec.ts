import { DeliveryService } from './delivery.service';
import { PrismaService } from '@app/database';
import { ProviderSelectionService } from '../providers/provider-selection.service';
import { RabbitMQService } from '@app/messaging';
import { NotificationChannel, NotificationType, NotificationPriority, NotificationStatus } from '@app/contracts';

describe('DeliveryService', () => {
  let service: DeliveryService;
  let prisma: jest.Mocked<PrismaService>;
  let providerSelection: jest.Mocked<ProviderSelectionService>;
  let rabbitMQ: jest.Mocked<RabbitMQService>;

  beforeEach(() => {
    prisma = {
      notification: { update: jest.fn().mockResolvedValue({}) },
      deliveryAttempt: { create: jest.fn().mockResolvedValue({}) },
      auditLog: { create: jest.fn().mockResolvedValue({}) },
    } as unknown as jest.Mocked<PrismaService>;

    providerSelection = {
      selectProviders: jest.fn(),
    } as unknown as jest.Mocked<ProviderSelectionService>;

    rabbitMQ = {} as any;

    service = new DeliveryService(prisma, providerSelection, rabbitMQ);
  });

  it('should deliver notification through primary provider and update state to SENT', async () => {
    const mockProvider = {
      name: 'mock-sendgrid',
      channel: NotificationChannel.EMAIL,
      isHealthy: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue({
        success: true,
        provider: 'mock-sendgrid',
        providerMessageId: 'sg-msg-123',
        latencyMs: 30,
      }),
    };

    providerSelection.selectProviders.mockResolvedValue([mockProvider]);

    const payload = {
      notificationId: 'notif-1',
      tenantId: 'tenant-1',
      type: NotificationType.ORDER_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      recipient: 'customer@example.com',
      content: 'Order confirmation body',
      priority: NotificationPriority.NORMAL,
    };

    await service.processDelivery(payload, 1);

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { status: NotificationStatus.PROCESSING },
    });

    expect(mockProvider.send).toHaveBeenCalled();

    expect(prisma.deliveryAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationId: 'notif-1',
          provider: 'mock-sendgrid',
          status: 'SUCCESS',
        }),
      }),
    );

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-1' },
      data: { status: NotificationStatus.SENT },
    });
  });

  it('should failover to secondary provider when primary provider fails', async () => {
    const primaryProvider = {
      name: 'mock-sendgrid',
      channel: NotificationChannel.EMAIL,
      isHealthy: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue({
        success: false,
        provider: 'mock-sendgrid',
        errorCode: 'TIMEOUT',
        errorMessage: 'Connection timed out',
        latencyMs: 100,
      }),
    };

    const fallbackProvider = {
      name: 'mock-ses',
      channel: NotificationChannel.EMAIL,
      isHealthy: jest.fn().mockResolvedValue(true),
      send: jest.fn().mockResolvedValue({
        success: true,
        provider: 'mock-ses',
        providerMessageId: 'ses-msg-456',
        latencyMs: 40,
      }),
    };

    providerSelection.selectProviders.mockResolvedValue([
      primaryProvider,
      fallbackProvider,
    ]);

    const payload = {
      notificationId: 'notif-2',
      tenantId: 'tenant-1',
      type: NotificationType.ORDER_CONFIRMATION,
      channel: NotificationChannel.EMAIL,
      recipient: 'customer2@example.com',
      content: 'Order confirmation body',
      priority: NotificationPriority.NORMAL,
    };

    await service.processDelivery(payload, 1);

    expect(primaryProvider.send).toHaveBeenCalled();
    expect(fallbackProvider.send).toHaveBeenCalled();

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'notif-2' },
      data: { status: NotificationStatus.SENT },
    });
  });
});

