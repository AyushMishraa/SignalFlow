import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationType } from '@app/contracts';

export interface UserPreference {
  recipient: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  marketingOptIn: boolean;
  quietHoursStart?: number; // 0-23 hour
  quietHoursEnd?: number; // 0-23 hour
}

@Injectable()
export class PreferenceService {
  private readonly logger = new Logger(PreferenceService.name);
  private readonly preferences = new Map<string, UserPreference>();

  setPreference(tenantId: string, preference: UserPreference): void {
    const key = `${tenantId}:${preference.recipient}`;
    this.preferences.set(key, preference);
    this.logger.log(`Updated preference for recipient: ${preference.recipient}`);
  }

  getPreference(tenantId: string, recipient: string): UserPreference {
    const key = `${tenantId}:${recipient}`;
    return (
      this.preferences.get(key) || {
        recipient,
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        marketingOptIn: true,
      }
    );
  }

  canDeliver(
    tenantId: string,
    recipient: string,
    channel: NotificationChannel,
    type: NotificationType,
  ): { allowed: boolean; reason?: string } {
    // Transactional alerts and OTPs are always delivered
    if (
      type === NotificationType.OTP ||
      type === NotificationType.PASSWORD_RESET ||
      type === NotificationType.SYSTEM_ALERT
    ) {
      return { allowed: true };
    }

    const pref = this.getPreference(tenantId, recipient);

    // Channel level check
    if (channel === NotificationChannel.EMAIL && !pref.emailEnabled) {
      return { allowed: false, reason: 'User disabled email notifications' };
    }
    if (channel === NotificationChannel.SMS && !pref.smsEnabled) {
      return { allowed: false, reason: 'User disabled SMS notifications' };
    }
    if (channel === NotificationChannel.PUSH && !pref.pushEnabled) {
      return { allowed: false, reason: 'User disabled push notifications' };
    }

    // Marketing check
    if (type === NotificationType.MARKETING && !pref.marketingOptIn) {
      return { allowed: false, reason: 'User opted out of marketing communications' };
    }

    // Quiet hours check
    if (pref.quietHoursStart !== undefined && pref.quietHoursEnd !== undefined) {
      const currentHour = new Date().getUTCHours();
      const inQuietHours =
        pref.quietHoursStart <= pref.quietHoursEnd
          ? currentHour >= pref.quietHoursStart && currentHour < pref.quietHoursEnd
          : currentHour >= pref.quietHoursStart || currentHour < pref.quietHoursEnd;

      if (inQuietHours) {
        return { allowed: false, reason: 'Current time is within recipient quiet hours' };
      }
    }

    return { allowed: true };
  }
}

