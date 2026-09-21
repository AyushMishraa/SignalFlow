import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { NotificationDomainService } from '../services/notification.service';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  NotificationResponseDto,
} from '@app/contracts';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationDomainController {
  constructor(private readonly service: NotificationDomainService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and enqueue a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification successfully created',
    type: NotificationResponseDto,
  })
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @Headers('x-actor-id') actorId?: string,
  ) {
    const actor = actorId || 'api-client';
    return this.service.createNotification(dto, actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  async getNotificationById(@Param('id') id: string) {
    return this.service.getNotificationById(id);
  }

  @Get()
  @ApiOperation({ summary: 'Query and paginate notifications with filters' })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of notifications',
  })
  async getNotifications(@Query() query: QueryNotificationsDto) {
    return this.service.getNotifications(query);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending or queued notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification successfully cancelled',
  })
  async cancelNotification(
    @Param('id') id: string,
    @Headers('x-actor-id') actorId?: string,
    @Body('reason') reason?: string,
  ) {
    const actor = actorId || 'api-client';
    return this.service.cancelNotification(id, actor, reason);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get audit trail for a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async getAuditLogs(@Param('id') id: string) {
    return this.service.getAuditLogs(id);
  }

  @Get(':id/attempts')
  @ApiOperation({ summary: 'Get delivery attempt history for a notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  async getDeliveryAttempts(@Param('id') id: string) {
    return this.service.getDeliveryAttempts(id);
  }
}

