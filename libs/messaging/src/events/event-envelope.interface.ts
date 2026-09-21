export interface EventEnvelope<T = any> {
  eventId: string;
  eventType: string;
  occurredAt: string;
  correlationId: string;
  tenantId: string;
  aggregateId: string;
  version: number;
  payload: T;
}

