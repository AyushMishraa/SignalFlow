import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '@app/contracts';
import { ProviderRegistry } from './provider.registry';
import { INotificationProvider } from './provider.interface';

@Injectable()
export class ProviderSelectionService {
  private readonly logger = new Logger(ProviderSelectionService.name);

  constructor(private readonly registry: ProviderRegistry) {}

  async selectProviders(channel: NotificationChannel): Promise<INotificationProvider[]> {
    const candidates = this.registry.getProvidersForChannel(channel);

    if (candidates.length === 0) {
      throw new Error(`No notification providers registered for channel: ${channel}`);
    }

    // Filter by health
    const healthy: INotificationProvider[] = [];
    for (const candidate of candidates) {
      try {
        if (await candidate.isHealthy()) {
          healthy.push(candidate);
        }
      } catch (err) {
        this.logger.warn(`Provider ${candidate.name} health check failed: ${err}`);
      }
    }

    return healthy.length > 0 ? healthy : candidates;
  }
}

