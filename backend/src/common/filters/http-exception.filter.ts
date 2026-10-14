import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ErrorCode } from '../errors/error-code';
import { ErrorDetail, ErrorResponse } from '../http/api-response';

const CODE_BY_STATUS: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: ErrorCode.BAD_REQUEST,
  [HttpStatus.UNAUTHORIZED]: ErrorCode.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: ErrorCode.FORBIDDEN,
  [HttpStatus.NOT_FOUND]: ErrorCode.NOT_FOUND,
  [HttpStatus.CONFLICT]: ErrorCode.CONFLICT,
  [HttpStatus.TOO_MANY_REQUESTS]: ErrorCode.TOO_MANY_REQUESTS,
};

/** Shape we accept from `new XxxException({ code, message, details })`, plus Nest's default `{ message }`. */
interface ExceptionBody {
  code?: string;
  message?: string | string[];
  details?: ErrorDetail[];
}

/** Formats every error as `{ success: false, message, code, details? }`. Unknown errors become a generic 500. */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toErrorResponse(exception);
    res.status(status).json(body);
  }

  private toErrorResponse(exception: unknown): {
    status: number;
    body: ErrorResponse;
  } {
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        'Unhandled exception',
        exception instanceof Error ? exception.stack : exception,
      );
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        body: {
          success: false,
          message: 'Internal server error',
          code: ErrorCode.INTERNAL_ERROR,
        },
      };
    }

    const status = exception.getStatus();
    const raw = exception.getResponse();
    const parsed: ExceptionBody =
      typeof raw === 'string' ? { message: raw } : raw;

    const message = Array.isArray(parsed.message)
      ? parsed.message.join('; ')
      : (parsed.message ?? exception.message);

    return {
      status,
      body: {
        success: false,
        message,
        code:
          parsed.code ??
          CODE_BY_STATUS[status] ??
          (status >= 500 ? ErrorCode.INTERNAL_ERROR : ErrorCode.BAD_REQUEST),
        ...(parsed.details?.length && { details: parsed.details }),
      },
    };
  }
}
