import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  NotificationStatus,
  DeliveryAttemptStatus,
  AuditEvent,
} from '@app/contracts';
import {
  RabbitMQService,
  RabbitMQConstants,
  NotificationQueuedPayload,
} from '@app/messaging';
import { ProviderSelectionService } from '../providers/provider-selection.service';
import { RetryClassifier } from '../retry/retry-classifier';
import { BackoffCalculator } from '../retry/backoff-calculator';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
  private readonly maxAttempts = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerSelection: ProviderSelectionService,
    private readonly rabbitMQ: RabbitMQService,
  ) {}

  async processDelivery(payload: NotificationQueuedPayload, attemptNumber: number = 1): Promise<void> {
    const { notificationId, tenantId, channel, recipient, subject, content } = payload;
    this.logger.log(
      `[Delivery] Starting delivery for notification: ${notificationId}, channel: ${channel}, attempt: ${attemptNumber}`,
    );

    // 1. Update notification status to PROCESSING
    await this.updateNotificationStatus(notificationId, NotificationStatus.PROCESSING);
    await this.recordAudit(tenantId, notificationId, AuditEvent.NOTIFICATION_PROCESSING, { attemptNumber });

    // 2. Select providers (primary + fallback)
    const providers = await this.providerSelection.selectProviders(channel);

    let deliverySuccess = false;
    let lastError: { code?: string; message?: string; isRetryable?: boolean } = {};
    let chosenProviderName = '';
    let chosenMessageId = '';

    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      const isFallback = i > 0;

      if (isFallback) {
        this.logger.warn(`[Failover] Falling back to secondary provider: ${provider.name}`);
      }

      const startedAt = new Date();
      const sendResult = await provider.send({
        notificationId,
        tenantId,
        channel,
        recipient,
        subject,
        content,
      });

      const completedAt = new Date();

      // Record DeliveryAttempt in PostgreSQL
      try {
        await this.prisma.deliveryAttempt.create({
          data: {
            notificationId,
            attemptNumber,
            provider: provider.name,
            status: sendResult.success
              ? DeliveryAttemptStatus.SUCCESS
              : DeliveryAttemptStatus.FAILED,
            errorCode: sendResult.errorCode ?? null,
            errorMessage: sendResult.errorMessage ?? null,
            providerMessageId: sendResult.providerMessageId ?? null,
            startedAt,
            completedAt,
          },
        });
      } catch (err: any) {
        this.logger.error(`Failed to record delivery attempt in DB: ${err.message}`);
      }

      if (sendResult.success) {
        deliverySuccess = true;
        chosenProviderName = provider.name;
        chosenMessageId = sendResult.providerMessageId || '';
        break;
      } else {
        lastError = {
          code: sendResult.errorCode,
          message: sendResult.errorMessage,
          isRetryable: sendResult.isRetryable ?? RetryClassifier.isRetryable(sendResult.errorCode, sendResult.errorMessage),
        };
      }
    }

    if (deliverySuccess) {
      // 3. Update status to SENT
      await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);
      await this.recordAudit(tenantId, notificationId, AuditEvent.NOTIFICATION_SENT, {
        provider: chosenProviderName,
        providerMessageId: chosenMessageId,
        attemptNumber,
      });

      this.logger.log(`[Delivery] Notification ${notificationId} successfully delivered via ${chosenProviderName}`);
    } else {
      // 4. Handle failure & retry policy
      const isRetryable = lastError.isRetryable ?? true;
      const canRetry = isRetryable && attemptNumber < this.maxAttempts;

      if (canRetry) {
        const nextAttempt = attemptNumber + 1;
        const delayMs = BackoffCalculator.calculateDelayMs(attemptNumber);

        await this.updateNotificationStatus(notificationId, NotificationStatus.RETRYING);
        await this.recordAudit(tenantId, notificationId, AuditEvent.NOTIFICATION_RETRYING, {
          attemptNumber,
          nextAttempt,
          delayMs,
          error: lastError.message,
        });

        this.logger.warn(
          `[Retry] Scheduling retry attempt ${nextAttempt}/${this.maxAttempts} in ${delayMs}ms for notification ${notificationId}`,
        );

        // Schedule / publish to retry queue
        setTimeout(async () => {
          await this.processDelivery(payload, nextAttempt);
        }, delayMs);
      } else {
        // Exceeded retries or non-retryable failure -> DEAD_LETTERED
        await this.updateNotificationStatus(notificationId, NotificationStatus.DEAD_LETTERED);
        await this.recordAudit(tenantId, notificationId, AuditEvent.NOTIFICATION_DEAD_LETTERED, {
          attemptNumber,
          error: lastError.message,
          reason: isRetryable ? 'Max retry attempts exhausted' : 'Non-retryable error',
        });

        this.logger.error(
          `[DLQ] Notification ${notificationId} moved to DEAD_LETTERED. Error: ${lastError.message}`,
        );
      }
    }
  }

  private async updateNotificationStatus(id: string, status: NotificationStatus): Promise<void> {
    try {
      await this.prisma.notification.update({
        where: { id },
        data: { status: status as any },
      });
    } catch (err: any) {
      this.logger.error(`Error updating notification ${id} status to ${status}: ${err.message}`);
    }
  }

  private async recordAudit(
    tenantId: string,
    notificationId: string,
    event: AuditEvent,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          tenantId,
          notificationId,
          event: event as any,
          actor: 'delivery-worker',
          metadata: metadata as any,
        },
      });
    } catch (err: any) {
      this.logger.error(`Error recording audit log for notification ${notificationId}: ${err.message}`);
    }
  }
}

