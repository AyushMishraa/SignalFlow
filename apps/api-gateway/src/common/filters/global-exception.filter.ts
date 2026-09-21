import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AppException } from '../exceptions/app.exception';
import { ErrorCode } from '../exceptions/error-codes.enum';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest();
    const response = context.getResponse();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_ERROR;
    let message = 'An unexpected error occurred';
    let details: unknown = undefined;

    if (exception instanceof AppException) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();

      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const body = exceptionResponse as Record<string, unknown>;

        message =
          typeof body.message === 'string'
            ? body.message
            : Array.isArray(body.message)
              ? body.message.join('; ')
              : exception.message;

        if (Array.isArray(body.message)) {
          details = body.message;
        } else if (body.details) {
          details = body.details;
        }

        if (body.code && typeof body.code === 'string') {
          code = body.code;
        } else {
          switch (status) {
            case HttpStatus.BAD_REQUEST:
              code = ErrorCode.VALIDATION_ERROR;
              break;
            case HttpStatus.UNAUTHORIZED:
              code = ErrorCode.UNAUTHORIZED;
              break;
            case HttpStatus.FORBIDDEN:
              code = ErrorCode.FORBIDDEN;
              break;
            case HttpStatus.NOT_FOUND:
              code = ErrorCode.NOTIFICATION_NOT_FOUND;
              break;
            case HttpStatus.CONFLICT:
              code = ErrorCode.RESOURCE_CONFLICT;
              break;
            case HttpStatus.TOO_MANY_REQUESTS:
              code = ErrorCode.RATE_LIMIT_EXCEEDED;
              break;
            case HttpStatus.SERVICE_UNAVAILABLE:
              code = ErrorCode.SERVICE_UNAVAILABLE;
              break;
            default:
              code = ErrorCode.INTERNAL_ERROR;
          }
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      error: {
        code,
        message,
        ...(details !== undefined ? { details } : {}),
      },
      meta: {
        requestId: request.requestId || 'unknown',
        correlationId: request.correlationId || 'unknown',
        timestamp: new Date().toISOString(),
      },
    });
  }
}