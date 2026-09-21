import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { AuditEvent } from '@app/contracts';

export interface QueryAuditDto {
  tenantId?: string;
  notificationId?: string;
  event?: AuditEvent;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(query: QueryAuditDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.tenantId) {
      where.tenantId = query.tenantId;
    }
    if (query.notificationId) {
      where.notificationId = query.notificationId;
    }
    if (query.event) {
      where.event = query.event;
    }

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
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
}

