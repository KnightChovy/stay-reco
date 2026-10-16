import { ErrorCode } from '../errors/error-code';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Body of every successful response (wrapped by ResponseInterceptor). */
export interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PageMeta;
}

export interface ErrorDetail {
  field: string;
  message: string;
}

/** Body of every error response (built by HttpExceptionFilter). */
export interface ErrorResponse {
  success: false;
  message: string;
  code: ErrorCode | string;
  details?: ErrorDetail[];
}

/** Return this from a service/controller to send a list with pagination `meta`. */
export class Paginated<T> {
  constructor(
    readonly items: T[],
    readonly meta: PageMeta,
  ) {}

  static of<T>(
    items: T[],
    { page, pageSize, total }: Omit<PageMeta, 'totalPages'>,
  ) {
    return new Paginated(items, {
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  }
}
