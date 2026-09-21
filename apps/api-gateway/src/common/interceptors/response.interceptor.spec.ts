import { ResponseInterceptor } from './response.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;
  let mockContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockRequest = {
      requestId: 'req-abc-123',
      correlationId: 'corr-xyz-789',
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  });

  it('should wrap raw response data into standardized success envelope', (done) => {
    mockCallHandler = {
      handle: () => of({ id: 'notif-1', status: 'PENDING' }),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result: any) => {
      expect(result).toEqual({
        success: true,
        data: { id: 'notif-1', status: 'PENDING' },
        meta: {
          requestId: 'req-abc-123',
          correlationId: 'corr-xyz-789',
          timestamp: expect.any(String),
        },
      });
      done();
    });
  });

  it('should not double-wrap already formatted envelope', (done) => {
    const alreadyFormatted = {
      success: true,
      data: { id: 'notif-1' },
      meta: { requestId: 'downstream-req', correlationId: 'downstream-corr' },
    };

    mockCallHandler = {
      handle: () => of(alreadyFormatted),
    };

    interceptor.intercept(mockContext, mockCallHandler).subscribe((result) => {
      expect(result).toBe(alreadyFormatted);
      done();
    });
  });
});

