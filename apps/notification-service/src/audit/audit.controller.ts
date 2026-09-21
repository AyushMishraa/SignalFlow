import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuditEvent } from '@app/contracts';

@ApiTags('Audit Logs')
@Controller('api/v1/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Query and paginate audit events' })
  @ApiResponse({ status: 200, description: 'Paginated audit logs' })
  async getAuditLogs(
    @Query('tenantId') tenantId?: string,
    @Query('notificationId') notificationId?: string,
    @Query('event') event?: AuditEvent,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.getAuditLogs({
      tenantId,
      notificationId,
      event,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }
}

