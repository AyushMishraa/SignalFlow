import { BadRequestException } from '@nestjs/common';
import { NotificationChannel } from '@app/contracts';

export class RecipientValidator {
  private static readonly EMAIL_REGEX =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

  private static readonly PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

  static validate(channel: NotificationChannel, recipient: string): void {
    if (!recipient || typeof recipient !== 'string' || recipient.trim().length === 0) {
      throw new BadRequestException('Recipient identifier must not be empty');
    }

    const trimmed = recipient.trim();

    switch (channel) {
      case NotificationChannel.EMAIL:
        if (!this.EMAIL_REGEX.test(trimmed)) {
          throw new BadRequestException(
            `Invalid email format for recipient: "${trimmed}"`,
          );
        }
        break;

      case NotificationChannel.SMS:
        if (!this.PHONE_REGEX.test(trimmed.replace(/[\s-()]/g, ''))) {
          throw new BadRequestException(
            `Invalid phone number format for SMS recipient: "${trimmed}". Must follow E.164 format (e.g. +1234567890).`,
          );
        }
        break;

      case NotificationChannel.PUSH:
        if (trimmed.length < 10) {
          throw new BadRequestException(
            `Invalid push device token: "${trimmed}". Token length is insufficient.`,
          );
        }
        break;

      default:
        throw new BadRequestException(`Unsupported notification channel: ${channel}`);
    }
  }
}

