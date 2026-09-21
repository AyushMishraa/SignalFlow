import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/database';
import {
  INotificationRepository,
  NotificationRecord,
  PaginatedResult,
} from './notification.repository.interface';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  NotificationStatus,
  AuditEvent,
  NotificationType,
  NotificationChannel,
  NotificationPriority,
} from '@app/contracts';

@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: CreateNotificationDto,
    initialStatus: NotificationStatus = NotificationStatus.PENDING,
  ): Promise<NotificationRecord> {
    const created = await this.prisma.notification.create({
      data: {
        tenantId: data.tenantId,
        type: data.type as unknown as any,
        channel: data.channel as unknown as any,
        recipient: data.recipient,
        subject: data.subject ?? null,
        content: data.content,
        priority: (data.priority || NotificationPriority.NORMAL) as unknown as any,
        status: initialStatus as unknown as any,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
    });

    return created as unknown as NotificationRecord;
  }

  async findById(id: string): Promise<NotificationRecord | null> {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        deliveryAttempts: {
          orderBy: { attemptNumber: 'asc' },
        },
      },
    });

    return notification as unknown as NotificationRecord | null;
  }

  async findMany(
    query: QueryNotificationsDto,
  ): Promise<PaginatedResult<NotificationRecord>> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.channel) {
      where.channel = query.channel;
    }
    if (query.type) {
      where.type = query.type;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.recipient) {
      where.recipient = {
        contains: query.recipient,
        mode: 'insensitive',
      };
    }
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [total, items] = await Promise.all([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items as unknown as NotificationRecord[],
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async updateStatus(
    id: string,
    status: NotificationStatus,
  ): Promise<NotificationRecord> {
    const updated = await this.prisma.notification.update({
      where: { id },
      data: { status: status as unknown as any },
    });

    return updated as unknown as NotificationRecord;
  }

  async createAuditLog(
    tenantId: string,
    notificationId: string,
    event: AuditEvent,
    actor: string = 'system',
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        tenantId,
        notificationId,
        event: event as unknown as any,
        actor,
        metadata: metadata as any,
      },
    });
  }

  async findAuditLogs(notificationId: string): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { notificationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findDeliveryAttempts(notificationId: string): Promise<any[]> {
    return this.prisma.deliveryAttempt.findMany({
      where: { notificationId },
      orderBy: { attemptNumber: 'asc' },
    });
  }
}

