import { RecipientValidator } from './recipient-validator';
import { NotificationChannel } from '@app/contracts';
import { BadRequestException } from '@nestjs/common';

describe('RecipientValidator', () => {
  describe('EMAIL channel', () => {
    it('should accept valid email addresses', () => {
      expect(() =>
        RecipientValidator.validate(NotificationChannel.EMAIL, 'user@example.com'),
      ).not.toThrow();
      expect(() =>
        RecipientValidator.validate(NotificationChannel.EMAIL, 'john.doe+tag@sub.domain.co.uk'),
      ).not.toThrow();
    });

    it('should reject invalid email addresses', () => {
      expect(() =>
        RecipientValidator.validate(NotificationChannel.EMAIL, 'invalid-email'),
      ).toThrow(BadRequestException);
      expect(() =>
        RecipientValidator.validate(NotificationChannel.EMAIL, 'user@'),
      ).toThrow(BadRequestException);
      expect(() =>
        RecipientValidator.validate(NotificationChannel.EMAIL, ''),
      ).toThrow(BadRequestException);
    });
  });

  describe('SMS channel', () => {
    it('should accept valid international phone numbers', () => {
      expect(() =>
        RecipientValidator.validate(NotificationChannel.SMS, '+14155552671'),
      ).not.toThrow();
      expect(() =>
        RecipientValidator.validate(NotificationChannel.SMS, '+919876543210'),
      ).not.toThrow();
    });

    it('should reject invalid phone numbers', () => {
      expect(() =>
        RecipientValidator.validate(NotificationChannel.SMS, 'abc'),
      ).toThrow(BadRequestException);
      expect(() =>
        RecipientValidator.validate(NotificationChannel.SMS, '12'),
      ).toThrow(BadRequestException);
    });
  });

  describe('PUSH channel', () => {
    it('should accept valid push tokens', () => {
      expect(() =>
        RecipientValidator.validate(
          NotificationChannel.PUSH,
          'fcm_token_device_unique_1234567890',
        ),
      ).not.toThrow();
    });

    it('should reject short or empty push tokens', () => {
      expect(() =>
        RecipientValidator.validate(NotificationChannel.PUSH, 'short'),
      ).toThrow(BadRequestException);
    });
  });
});

