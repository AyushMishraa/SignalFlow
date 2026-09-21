export interface OutboxRecord {
  id: string;
  tenantId: string;
  eventType: string;
  routingKey: string;
  exchange: string;
  payload: any;
  status: 'PENDING' | 'PUBLISHED' | 'FAILED';
  retryCount: number;
  createdAt: Date;
  publishedAt?: Date | null;
  error?: string | null;
}

