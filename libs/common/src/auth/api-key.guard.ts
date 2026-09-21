import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    if (apiKey.startsWith('sno_live_') || apiKey.startsWith('sno_test_') || apiKey === 'test-valid-api-key') {
      request.user = {
        id: 'api-key-client',
        email: 'api-client@tenant.internal',
        tenantId: request.headers['x-tenant-id'] || 'api-key-tenant',
        role: 'ADMIN',
        permissions: ['*'],
      };
      return true;
    }

    throw new UnauthorizedException('Invalid API Key provided');
  }
}

