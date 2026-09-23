import { NotificationDomainService } from './notification.service';
import { INotificationRepository } from '../repositories/notification.repository.interface';
import { TenantVerificationService } from './tenant-verification.service';
import {
  CreateNotificationDto,
  NotificationChannel,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  AuditEvent,
} from '@app/contracts';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('NotificationDomainService', () => {
  let service: NotificationDomainService;
  let repository: jest.Mocked<INotificationRepository>;
  let tenantService: jest.Mocked<TenantVerificationService>;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      updateStatus: jest.fn(),
      createAuditLog: jest.fn(),
      findAuditLogs: jest.fn(),
      findDeliveryAttempts: jest.fn(),
    };

    tenantService = {
      verifyTenant: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<TenantVerificationService>;

    service = new NotificationDomainService(repository, tenantService);
  });

  describe('createNotification', () => {
    it('should verify tenant, validate recipient, persist notification, and record audit log', async () => {
      const dto: CreateNotificationDto = {
        tenantId: 'tenant-123',
        type: NotificationType.OTP,
        channel: NotificationChannel.EMAIL,
        recipient: 'test@example.com',
        subject: 'Your OTP Code',
        content: 'Your OTP is 123456',
        priority: NotificationPriority.HIGH,
      };

      const createdRecord: any = {
        id: 'notif-999',
        ...dto,
        status: NotificationStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const queuedRecord: any = {
        ...createdRecord,
        status: NotificationStatus.QUEUED,
      };

      repository.create.mockResolvedValue(createdRecord);
      repository.findById.mockResolvedValue(createdRecord);
      repository.updateStatus.mockResolvedValue(queuedRecord);

      const result = await service.createNotification(dto, 'user-actor');

      expect(tenantService.verifyTenant).toHaveBeenCalledWith('tenant-123');
      expect(repository.create).toHaveBeenCalledWith(dto, NotificationStatus.PENDING);
      expect(repository.createAuditLog).toHaveBeenCalledWith(
        'tenant-123',
        'notif-999',
        AuditEvent.NOTIFICATION_CREATED,
        'user-actor',
        expect.any(Object),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if recipient email format is invalid', async () => {
      const dto: CreateNotificationDto = {
        tenantId: 'tenant-123',
        type: NotificationType.OTP,
        channel: NotificationChannel.EMAIL,
        recipient: 'not-an-email',
        content: 'Hello',
      };

      await expect(service.createNotification(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('cancelNotification', () => {
    it('should cancel a PENDING notification and record CANCELLED audit event', async () => {
      const record: any = {
        id: 'notif-1',
        tenantId: 'tenant-1',
        status: NotificationStatus.PENDING,
      };
      const updatedRecord: any = {
        ...record,
        status: NotificationStatus.CANCELLED,
      };

      repository.findById.mockResolvedValue(record);
      repository.updateStatus.mockResolvedValue(updatedRecord);

      const result = await service.cancelNotification('notif-1', 'admin', 'User requested');

      expect(repository.updateStatus).toHaveBeenCalledWith(
        'notif-1',
        NotificationStatus.CANCELLED,
      );
      expect(repository.createAuditLog).toHaveBeenCalledWith(
        'tenant-1',
        'notif-1',
        AuditEvent.NOTIFICATION_CANCELLED,
        'admin',
        { reason: 'User requested' },
      );
      expect(result.status).toBe(NotificationStatus.CANCELLED);
    });
  });
});
