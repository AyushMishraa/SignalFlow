import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification unique ID (UUID)' })
  id!: string;

  @ApiProperty({ description: 'Tenant ID' })
  tenantId!: string;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ enum: NotificationChannel })
  channel!: NotificationChannel;

  @ApiProperty({ description: 'Recipient' })
  recipient!: string;

  @ApiPropertyOptional({ description: 'Subject' })
  subject?: string | null;

  @ApiProperty({ description: 'Content' })
  content!: string;

  @ApiProperty({ enum: NotificationPriority })
  priority!: NotificationPriority;

  @ApiProperty({ enum: NotificationStatus })
  status!: NotificationStatus;

  @ApiPropertyOptional({ description: 'Scheduled delivery time' })
  scheduledAt?: Date | string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date | string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date | string;
}

