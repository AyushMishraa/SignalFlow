import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { TenantStatus } from '@app/contracts';

@Injectable()
export class TenantVerificationService {
  private readonly logger = new Logger(TenantVerificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  async verifyTenant(tenantId: string): Promise<void> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      this.logger.warn(`Tenant not found: ${tenantId}`);
      throw new NotFoundException(`Tenant with id "${tenantId}" not found`);
    }

    if (tenant.status !== TenantStatus.ACTIVE) {
      this.logger.warn(
        `Tenant "${tenantId}" is not active. Status: ${tenant.status}`,
      );
      throw new ForbiddenException(
        `Tenant "${tenantId}" is currently ${tenant.status}. Only ACTIVE tenants may process notifications.`,
      );
    }
  }
}

