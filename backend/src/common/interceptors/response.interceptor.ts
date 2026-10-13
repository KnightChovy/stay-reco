import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Paginated, SuccessResponse } from '../http/api-response';

/** Wraps handler results as `{ success, message, data, meta? }`. Void handlers (204) send no body. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown> | undefined> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (result === undefined) return undefined;
        if (result instanceof Paginated) {
          return {
            success: true,
            message: 'OK',
            data: result.items,
            meta: result.meta,
          };
        }
        return { success: true, message: 'OK', data: result };
      }),
    );
  }
}
