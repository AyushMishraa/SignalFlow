import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, BadRequestException, HttpStatus, NotFoundException } from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes.enum';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: ArgumentsHost;
  let mockRequest: any;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRequest = {
      requestId: 'req-123',
      correlationId: 'corr-456',
    };

    mockHost = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
        getResponse: () => ({
          status: mockStatus,
        }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle standard BadRequestException (Validation Error)', () => {
    const exception = new BadRequestException(['recipient must be an email']);

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'recipient must be an email',
          details: ['recipient must be an email'],
        },
        meta: expect.objectContaining({
          requestId: 'req-123',
          correlationId: 'corr-456',
        }),
      }),
    );
  });

  it('should handle AppException with custom error code', () => {
    const exception = new AppException(
      ErrorCode.TENANT_NOT_FOUND,
      'Tenant does not exist',
      HttpStatus.NOT_FOUND,
    );

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: ErrorCode.TENANT_NOT_FOUND,
          message: 'Tenant does not exist',
        },
      }),
    );
  });

  it('should handle unhandled Error with 500 INTERNAL_ERROR', () => {
    const exception = new Error('Database connection failed');

    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Database connection failed',
        },
      }),
    );
  });
});

