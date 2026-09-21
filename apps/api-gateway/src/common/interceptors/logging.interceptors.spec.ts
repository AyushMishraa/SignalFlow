import { LoggingInterceptor } from './logging.interceptors';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockContext: ExecutionContext;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
    mockRequest = {
      method: 'POST',
      originalUrl: '/api/v1/notifications',
      requestId: 'req-1',
      correlationId: 'corr-1',
    };
    mockResponse = {
      statusCode: 201,
    };

    mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as unknown as ExecutionContext;
  });

  it('should intercept successful requests without altering stream', (done) => {
    const callHandler: CallHandler = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(mockContext, callHandler).subscribe({
      next: (val) => {
        expect(val).toEqual({ ok: true });
      },
      complete: () => done(),
    });
  });

  it('should intercept error requests and rethrow', (done) => {
    const error = new Error('Gateway timeout');
    const callHandler: CallHandler = {
      handle: () => throwError(() => error),
    };

    interceptor.intercept(mockContext, callHandler).subscribe({
      error: (err) => {
        expect(err).toBe(error);
        done();
      },
    });
  });
});

