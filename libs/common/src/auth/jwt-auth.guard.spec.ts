import { JwtAuthGuard } from './jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    config = {
      get: jest.fn(),
    } as unknown as jest.Mocked<ConfigService>;
    guard = new JwtAuthGuard(config);
  });

  it('should throw UnauthorizedException when header is missing', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as unknown as ExecutionContext;

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('should attach user and allow access when valid bearer token is present', () => {
    const req: any = {
      headers: {
        authorization: 'Bearer valid-test-token',
        'x-tenant-id': 'tenant-999',
      },
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    } as unknown as ExecutionContext;

    expect(guard.canActivate(context)).toBe(true);
    expect(req.user).toBeDefined();
    expect(req.user.tenantId).toBe('tenant-999');
  });
});

