import { BadRequestException, ValidationPipe } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { ErrorCode } from '../errors/error-code';
import { ErrorDetail } from '../http/api-response';

/** Flattens nested class-validator errors into `{ field: 'a.b', message }` entries. */
function toDetails(errors: ValidationError[], parent = ''): ErrorDetail[] {
  return errors.flatMap((err) => {
    const field = parent ? `${parent}.${err.property}` : err.property;
    const own = Object.values(err.constraints ?? {}).map((message) => ({
      field,
      message,
    }));
    return [...own, ...toDetails(err.children ?? [], field)];
  });
}

export function createValidationPipe() {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) =>
      new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: toDetails(errors),
      }),
  });
}
