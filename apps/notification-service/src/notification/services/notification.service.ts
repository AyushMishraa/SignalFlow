import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  NotificationStatus,
  AuditEvent,
} from '@app/contracts';
import {
  INotificationRepository,
  NOTIFICATION_REPOSITORY_TOKEN,
  NotificationRecord,
  PaginatedResult,
} from '../repositories/notification.repository.interface';
import { TenantVerificationService } from './tenant-verification.service';
import { RecipientValidator } from '../domain/recipient-validator';
import { NotificationStateMachine } from '../domain/notification-state-machine';

@Injectable()
export class NotificationDomainService {
  private readonly logger = new Logger(NotificationDomainService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repository: INotificationRepository,
    private readonly tenantService: TenantVerificationService,
  ) {}

  async createNotification(
    dto: CreateNotificationDto,
    actor: string = 'api-client',
  ): Promise<NotificationRecord> {
    this.logger.log(
      `Creating notification for tenant: ${dto.tenantId}, channel: ${dto.channel}, type: ${dto.type}`,
    );

    // 1. Verify tenant exists and is active
    await this.tenantService.verifyTenant(dto.tenantId);

    // 2. Validate recipient format for given channel
    RecipientValidator.validate(dto.channel, dto.recipient);

    // 3. Persist notification in database
    const initialStatus = NotificationStatus.PENDING;
    const notification = await this.repository.create(dto, initialStatus);

    // 4. Record audit log
    await this.repository.createAuditLog(
      dto.tenantId,
      notification.id,
      AuditEvent.NOTIFICATION_CREATED,
      actor,
      {
        channel: dto.channel,
        type: dto.type,
        priority: dto.priority,
        scheduledAt: dto.scheduledAt ?? null,
      },
    );

    this.logger.log(`Notification created with ID: ${notification.id}`);
    return notification;
  }

  async getNotificationById(id: string): Promise<NotificationRecord> {
    const notification = await this.repository.findById(id);

    if (!notification) {
      this.logger.warn(`Notification not found: ${id}`);
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    return notification;
  }

  async getNotifications(
    query: QueryNotificationsDto,
  ): Promise<PaginatedResult<NotificationRecord>> {
    return this.repository.findMany(query);
  }

  async cancelNotification(
    id: string,
    actor: string = 'api-client',
    reason?: string,
  ): Promise<NotificationRecord> {
    const notification = await this.getNotificationById(id);
    const currentStatus = notification.status as NotificationStatus;

    // Validate state transition through state machine
    NotificationStateMachine.validateTransition(
      currentStatus,
      NotificationStatus.CANCELLED,
    );

    const updated = await this.repository.updateStatus(
      id,
      NotificationStatus.CANCELLED,
    );

    await this.repository.createAuditLog(
      notification.tenantId,
      id,
      AuditEvent.NOTIFICATION_CANCELLED,
      actor,
      { reason: reason || 'User requested cancellation' },
    );

    this.logger.log(`Notification ${id} cancelled`);
    return updated;
  }

  async transitionStatus(
    id: string,
    targetStatus: NotificationStatus,
    actor: string = 'system',
    metadata: Record<string, unknown> = {},
  ): Promise<NotificationRecord> {
    const notification = await this.getNotificationById(id);
    const currentStatus = notification.status as NotificationStatus;

    NotificationStateMachine.validateTransition(currentStatus, targetStatus);

    const updated = await this.repository.updateStatus(id, targetStatus);

    const auditEvent =
      NotificationStateMachine.getAuditEventForStatus(targetStatus);

    if (auditEvent) {
      await this.repository.createAuditLog(
        notification.tenantId,
        id,
        auditEvent,
        actor,
        metadata,
      );
    }

    return updated;
  }

  async getAuditLogs(id: string): Promise<any[]> {
    await this.getNotificationById(id);
    return this.repository.findAuditLogs(id);
  }

  async getDeliveryAttempts(id: string): Promise<any[]> {
    await this.getNotificationById(id);
    return this.repository.findDeliveryAttempts(id);
  }
}

