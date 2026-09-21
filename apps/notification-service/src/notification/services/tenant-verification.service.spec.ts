import { TenantVerificationService } from './tenant-verification.service';
import { PrismaService } from '@app/database';
import { TenantStatus } from '@app/contracts';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('TenantVerificationService', () => {
  let service: TenantVerificationService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    service = new TenantVerificationService(prisma);
  });

  it('should pass when tenant exists and is ACTIVE', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      id: 'tenant-123',
      name: 'Acme Corp',
      status: TenantStatus.ACTIVE,
    });

    await expect(service.verifyTenant('tenant-123')).resolves.not.toThrow();
  });

  it('should throw NotFoundException when tenant does not exist', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(service.verifyTenant('unknown-tenant')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should throw ForbiddenException when tenant is SUSPENDED', async () => {
    (prisma.tenant.findUnique as jest.Mock).mockResolvedValue({
      id: 'suspended-tenant',
      name: 'Suspended Corp',
      status: TenantStatus.SUSPENDED,
    });

    await expect(service.verifyTenant('suspended-tenant')).rejects.toThrow(
      ForbiddenException,
    );
  });
});

