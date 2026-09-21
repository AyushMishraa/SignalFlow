import { PreferenceService } from './preference.service';
import { NotificationChannel, NotificationType } from '@app/contracts';

describe('PreferenceService', () => {
  let service: PreferenceService;

  beforeEach(() => {
    service = new PreferenceService();
  });

  it('should always allow transactional OTP notifications', () => {
    service.setPreference('tenant-1', {
      recipient: 'user@example.com',
      emailEnabled: false,
      smsEnabled: false,
      pushEnabled: false,
      marketingOptIn: false,
    });

    const check = service.canDeliver(
      'tenant-1',
      'user@example.com',
      NotificationChannel.EMAIL,
      NotificationType.OTP,
    );

    expect(check.allowed).toBe(true);
  });

  it('should block marketing notifications when marketingOptIn is false', () => {
    service.setPreference('tenant-1', {
      recipient: 'user@example.com',
      emailEnabled: true,
      smsEnabled: true,
      pushEnabled: true,
      marketingOptIn: false,
    });

    const check = service.canDeliver(
      'tenant-1',
      'user@example.com',
      NotificationChannel.EMAIL,
      NotificationType.MARKETING,
    );

    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('opted out of marketing');
  });

  it('should block notifications when channel is disabled by user', () => {
    service.setPreference('tenant-1', {
      recipient: 'user@example.com',
      emailEnabled: false,
      smsEnabled: true,
      pushEnabled: true,
      marketingOptIn: true,
    });

    const check = service.canDeliver(
      'tenant-1',
      'user@example.com',
      NotificationChannel.EMAIL,
      NotificationType.ORDER_CONFIRMATION,
    );

    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('disabled email');
  });
});

