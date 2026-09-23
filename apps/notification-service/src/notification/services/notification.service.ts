import {
  Injectable,
  Inject,
  NotFoundException,
  Logger,
  Optional,
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
import { OutboxService } from '../../outbox/outbox.service';
import { NotificationQueuedPayload } from '@app/messaging';

@Injectable()
export class NotificationDomainService {
  private readonly logger = new Logger(NotificationDomainService.name);

  constructor(
    @Inject(NOTIFICATION_REPOSITORY_TOKEN)
    private readonly repository: INotificationRepository,
    private readonly tenantService: TenantVerificationService,
    @Optional()
    private readonly outboxService?: OutboxService,
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

    // 3. Persist notification in database with initial status PENDING
    const initialStatus = NotificationStatus.PENDING;
    const notification = await this.repository.create(dto, initialStatus);

    // 4. Record audit log for creation
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

    // 5. If immediate notification (not scheduled for future), transition to QUEUED and dispatch to Outbox/Queue
    const isFutureScheduled =
      dto.scheduledAt && new Date(dto.scheduledAt).getTime() > Date.now();

    if (!isFutureScheduled) {
      const queuedNotification = await this.transitionStatus(
        notification.id,
        NotificationStatus.QUEUED,
        actor,
        { reason: 'Auto-queued for asynchronous delivery' },
      );

      if (this.outboxService) {
        const payload: NotificationQueuedPayload = {
          notificationId: notification.id,
          tenantId: dto.tenantId,
          type: dto.type,
          channel: dto.channel,
          recipient: dto.recipient,
          subject: dto.subject,
          content: dto.content,
          priority: dto.priority || ('NORMAL' as any),
          attemptNumber: 1,
          scheduledAt: dto.scheduledAt ?? null,
        };

        const routingKey = `notification.delivery.${dto.channel.toLowerCase()}`;
        await this.outboxService.createOutboxEvent(
          dto.tenantId,
          'notification.queued',
          routingKey,
          payload,
          notification.id,
        );
      }

      return queuedNotification;
    }

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
