import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  StreamableFile,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { Paginated, SuccessResponse } from '../http/api-response';

/** Wraps handler results as `{ success, message, data, meta? }`. Void handlers (204) send no body. */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<SuccessResponse<unknown> | StreamableFile | undefined> {
    return next.handle().pipe(
      map((result: unknown) => {
        if (result === undefined) return undefined;
        // File downloads (e.g. an Excel export) are sent as they are.
        if (result instanceof StreamableFile) return result;
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
