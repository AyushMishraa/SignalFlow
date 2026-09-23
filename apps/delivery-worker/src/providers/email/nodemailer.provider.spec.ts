import { NodemailerEmailProvider } from './nodemailer.provider';
import { ConfigService } from '@nestjs/config';
import { NotificationChannel } from '@app/contracts';

describe('NodemailerEmailProvider', () => {
  let provider: NodemailerEmailProvider;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    configService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'SMTP_HOST') return 'smtp.gmail.com';
        if (key === 'SMTP_PORT') return '587';
        if (key === 'SMTP_USER') return 'test@gmail.com';
        if (key === 'SMTP_PASS') return 'secret-app-password';
        if (key === 'SMTP_FROM') return 'Smart Orchestrator <test@gmail.com>';
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    provider = new NodemailerEmailProvider(configService);
  });

  it('should initialize and report healthy when credentials exist', async () => {
    expect(provider.name).toBe('nodemailer-smtp');
    expect(provider.channel).toBe(NotificationChannel.EMAIL);
    const healthy = await provider.isHealthy();
    expect(healthy).toBe(true);
  });

  it('should report unhealthy when credentials are missing', async () => {
    const emptyConfig = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<ConfigService>;
    const unconfiguredProvider = new NodemailerEmailProvider(emptyConfig);
    const healthy = await unconfiguredProvider.isHealthy();
    expect(healthy).toBe(false);
  });

  it('should return error result if sending without configured transporter', async () => {
    const emptyConfig = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as jest.Mocked<ConfigService>;
    const unconfiguredProvider = new NodemailerEmailProvider(emptyConfig);

    const result = await unconfiguredProvider.send({
      notificationId: 'notif-1',
      tenantId: 'tenant-1',
      channel: NotificationChannel.EMAIL,
      recipient: 'user@example.com',
      subject: 'Hello',
      content: 'World',
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('SMTP_CONFIG_MISSING');
  });
});

