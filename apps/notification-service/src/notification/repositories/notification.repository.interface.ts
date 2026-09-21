import {
  CreateNotificationDto,
  QueryNotificationsDto,
  NotificationStatus,
  AuditEvent,
} from '@app/contracts';

export interface NotificationRecord {
  id: string;
  tenantId: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  content: string;
  priority: string;
  status: string;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deliveryAttempts?: any[];
  auditLogs?: any[];
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface INotificationRepository {
  create(
    data: CreateNotificationDto,
    initialStatus: NotificationStatus,
  ): Promise<NotificationRecord>;

  findById(id: string): Promise<NotificationRecord | null>;

  findMany(query: QueryNotificationsDto): Promise<PaginatedResult<NotificationRecord>>;

  updateStatus(
    id: string,
    status: NotificationStatus,
  ): Promise<NotificationRecord>;

  createAuditLog(
    tenantId: string,
    notificationId: string,
    event: AuditEvent,
    actor?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void>;

  findAuditLogs(notificationId: string): Promise<any[]>;

  findDeliveryAttempts(notificationId: string): Promise<any[]>;
}

export const NOTIFICATION_REPOSITORY_TOKEN = 'INotificationRepository';

