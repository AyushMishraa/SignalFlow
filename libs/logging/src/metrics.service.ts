import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricsService {
  private readonly counters = new Map<string, number>();

  increment(metric: string, count: number = 1, labels: Record<string, string> = {}): void {
    const key = this.formatMetricKey(metric, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + count);
  }

  getMetricsAsPrometheus(): string {
    const lines: string[] = [
      '# HELP notifications_created_total Total number of notifications created',
      '# TYPE notifications_created_total counter',
      '# HELP notifications_sent_total Total number of notifications sent successfully',
      '# TYPE notifications_sent_total counter',
      '# HELP notifications_failed_total Total number of notification failures',
      '# TYPE notifications_failed_total counter',
      '# HELP api_requests_total Total number of HTTP requests received',
      '# TYPE api_requests_total counter',
      '# HELP rate_limit_exceeded_total Total number of rate-limit violations',
      '# TYPE rate_limit_exceeded_total counter',
    ];

    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    return lines.join('\n') + '\n';
  }

  private formatMetricKey(metric: string, labels: Record<string, string>): string {
    const labelEntries = Object.entries(labels);
    if (labelEntries.length === 0) return metric;

    const labelStr = labelEntries.map(([k, v]) => `${k}="${v}"`).join(',');
    return `${metric}{${labelStr}}`;
  }
}

