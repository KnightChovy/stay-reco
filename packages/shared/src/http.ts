import type { ErrorCode } from './errors';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Body of every successful response. */
export interface APIResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: PageMeta;
}

export interface ErrorDetail {
  field: string;
  message: string;
}

/** Body of every error response. Branch on `code`, never on `message`. */
export interface APIError {
  success: false;
  message: string;
  code: ErrorCode | (string & {});
  details?: ErrorDetail[];
}
