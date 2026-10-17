import type { PageMeta } from '@stayreco/shared';

// Response shapes live in packages/shared; aliased here to keep backend imports stable.
export type {
  APIResponse as SuccessResponse,
  APIError as ErrorResponse,
  ErrorDetail,
  PageMeta,
} from '@stayreco/shared';

/** Shape of `T` after JSON serialization: `Date` becomes an ISO string. Used to check responses against shared types. */
export type Serialized<T> = T extends Date
  ? string
  : T extends (infer U)[]
    ? Serialized<U>[]
    : T extends object
      ? { [K in keyof T]: Serialized<T[K]> }
      : T;

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
