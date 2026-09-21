import { BadRequestException } from '@nestjs/common';
import { NotificationStatus, AuditEvent } from '@app/contracts';

export class InvalidStateTransitionException extends BadRequestException {
  constructor(from: NotificationStatus, to: NotificationStatus) {
    super(
      `Invalid notification state transition from "${from}" to "${to}". This transition is not allowed by the domain state machine.`,
    );
  }
}

export class NotificationStateMachine {
  private static readonly VALID_TRANSITIONS: Record<
    NotificationStatus,
    NotificationStatus[]
  > = {
    [NotificationStatus.PENDING]: [
      NotificationStatus.QUEUED,
      NotificationStatus.CANCELLED,
    ],
    [NotificationStatus.QUEUED]: [
      NotificationStatus.PROCESSING,
      NotificationStatus.CANCELLED,
    ],
    [NotificationStatus.PROCESSING]: [
      NotificationStatus.SENT,
      NotificationStatus.FAILED,
    ],
    [NotificationStatus.FAILED]: [
      NotificationStatus.RETRYING,
      NotificationStatus.DEAD_LETTERED,
    ],
    [NotificationStatus.RETRYING]: [
      NotificationStatus.PROCESSING,
      NotificationStatus.DEAD_LETTERED,
    ],
    [NotificationStatus.SENT]: [],
    [NotificationStatus.CANCELLED]: [],
    [NotificationStatus.DEAD_LETTERED]: [],
  };

  private static readonly STATUS_TO_AUDIT_EVENT: Partial<
    Record<NotificationStatus, AuditEvent>
  > = {
    [NotificationStatus.PENDING]: AuditEvent.NOTIFICATION_CREATED,
    [NotificationStatus.QUEUED]: AuditEvent.NOTIFICATION_QUEUED,
    [NotificationStatus.PROCESSING]: AuditEvent.NOTIFICATION_PROCESSING,
    [NotificationStatus.SENT]: AuditEvent.NOTIFICATION_SENT,
    [NotificationStatus.FAILED]: AuditEvent.NOTIFICATION_FAILED,
    [NotificationStatus.RETRYING]: AuditEvent.NOTIFICATION_RETRYING,
    [NotificationStatus.DEAD_LETTERED]: AuditEvent.NOTIFICATION_DEAD_LETTERED,
    [NotificationStatus.CANCELLED]: AuditEvent.NOTIFICATION_CANCELLED,
  };

  static canTransition(from: NotificationStatus, to: NotificationStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  static validateTransition(from: NotificationStatus, to: NotificationStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidStateTransitionException(from, to);
    }
  }

  static getAuditEventForStatus(status: NotificationStatus): AuditEvent | undefined {
    return this.STATUS_TO_AUDIT_EVENT[status];
  }
}

