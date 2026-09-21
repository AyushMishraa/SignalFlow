import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NotificationChannel } from '../enums/notification-channel.enum';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationPriority } from '../enums/notification-priority.enum';

export class CreateNotificationDto {
  @ApiProperty({
    description: 'UUID of the tenant owning the notification',
    example: '018f8e02-4f32-73a1-9a74-b9fa96db9214',
  })
  @IsUUID()
  @IsNotEmpty()
  tenantId!: string;

  @ApiProperty({
    description: 'Type of notification',
    enum: NotificationType,
    example: NotificationType.ORDER_CONFIRMATION,
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @ApiProperty({
    description: 'Delivery channel',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  @IsNotEmpty()
  channel!: NotificationChannel;

  @ApiProperty({
    description: 'Recipient identifier (email address, phone number E.164, or device push token)',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(320)
  recipient!: string;

  @ApiPropertyOptional({
    description: 'Subject of notification (required or recommended for EMAIL)',
    example: 'Your order #1234 has been confirmed',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  subject?: string;

  @ApiProperty({
    description: 'Notification body content or templated text',
    example: 'Thank you for your order. Your total is $49.99.',
  })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({
    description: 'Priority level for processing',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(NotificationPriority)
  priority?: NotificationPriority = NotificationPriority.NORMAL;

  @ApiPropertyOptional({
    description: 'ISO-8601 timestamp when the notification should be delivered',
    example: '2026-09-01T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
