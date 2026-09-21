import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
} from '@nestjs/swagger';
import { Request } from 'express';
import { NotificationProxyService } from '../proxy/notifications-proxy.service';
import {
  CreateNotificationDto,
  QueryNotificationsDto,
  NotificationResponseDto,
} from '@app/contracts';

interface RequestWithIds extends Request {
  correlationId?: string;
  requestId?: string;
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsGatewayController {
  constructor(private readonly proxyService: NotificationProxyService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and dispatch a notification' })
  @ApiHeader({
    name: 'Idempotency-Key',
    required: false,
    description: 'Unique idempotency key to prevent duplicate creation',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created and queued for delivery',
    type: NotificationResponseDto,
  })
  async createNotification(
    @Body() dto: CreateNotificationDto,
    @Req() req: RequestWithIds,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    const headers: Record<string, string> = {
      'x-correlation-id': req.correlationId || '',
      'x-request-id': req.requestId || '',
    };
    if (idempotencyKey) {
      headers['idempotency-key'] = idempotencyKey;
    }

    return this.proxyService.createNotification(dto, headers);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve notification details by ID' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification details',
    type: NotificationResponseDto,
  })
  async getNotificationById(
    @Param('id') id: string,
    @Req() req: RequestWithIds,
  ) {
    const headers: Record<string, string> = {
      'x-correlation-id': req.correlationId || '',
      'x-request-id': req.requestId || '',
    };

    return this.proxyService.getNotificationById(id, headers);
  }

  @Get()
  @ApiOperation({ summary: 'Query notifications with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'List of matching notifications with pagination metadata',
  })
  async getNotifications(
    @Query() query: QueryNotificationsDto,
    @Req() req: RequestWithIds,
  ) {
    const headers: Record<string, string> = {
      'x-correlation-id': req.correlationId || '',
      'x-request-id': req.requestId || '',
    };

    return this.proxyService.getNotifications(query as unknown as Record<string, unknown>, headers);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending or queued notification' })
  @ApiParam({ name: 'id', description: 'Notification UUID' })
  @ApiResponse({
    status: 200,
    description: 'Notification cancelled successfully',
  })
  async cancelNotification(
    @Param('id') id: string,
    @Req() req: RequestWithIds,
  ) {
    const headers: Record<string, string> = {
      'x-correlation-id': req.correlationId || '',
      'x-request-id': req.requestId || '',
    };

    return this.proxyService.cancelNotification(id, headers);
  }
}

