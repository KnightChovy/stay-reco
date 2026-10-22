import { HttpStatus } from '@nestjs/common';
import { ApiExtension, ApiHeader, ApiResponse } from '@nestjs/swagger';
import { responseSchemas, z } from '@stayreco/shared';
import { ErrorCode } from '../errors/error-code';
import type { HotelAccessLevel } from '../hotel-access/hotel-access.service';

/**
 * Documentation-only decorators. They record facts as `x-*` extensions; `createSwaggerDocument` turns those into
 * responses, access notes and error lists, then removes the extensions.
 */
export const EXT = {
  public: 'x-public',
  roles: 'x-roles',
  hotelAccess: 'x-hotel-access',
  errors: 'x-errors',
  upload: 'x-upload',
  access: 'x-access',
} as const;

export interface HotelAccessDoc {
  level: HotelAccessLevel;
  notFound: ErrorCode;
}

export type ErrorDoc =
  ErrorCode | { code: ErrorCode; status: number; description: string };

const ref = (schema: z.ZodType) => {
  const id = responseSchemas.get(schema)?.id;
  if (!id) {
    throw new Error(
      'Response schema is not registered in responseSchemas (packages/shared/src/responses)',
    );
  }
  return { $ref: `#/components/schemas/${id}` };
};

const envelope = (data: object, withMeta = false) => ({
  type: 'object',
  required: ['success', 'message', 'data', ...(withMeta ? ['meta'] : [])],
  properties: {
    success: { type: 'boolean', example: true },
    message: { type: 'string', example: 'OK' },
    data,
    ...(withMeta ? { meta: { $ref: '#/components/schemas/PageMeta' } } : {}),
  },
});

/**
 * Success response `{ success, message, data }` where `data` is a shared response schema, or an array of one.
 * Pass the status the route really answers with (201 for a plain `@Post`, 200 with `@HttpCode(200)`).
 */
export function ApiData(schema: z.ZodType, status: HttpStatus = HttpStatus.OK) {
  const data =
    schema instanceof z.ZodArray
      ? { type: 'array', items: ref(schema.element as z.ZodType) }
      : ref(schema);
  return ApiResponse({
    status,
    description: 'Success',
    schema: envelope(data),
  });
}

/** Paginated list: `data` is an array of the schema and `meta` holds page, pageSize, total, totalPages. */
export function ApiPage(schema: z.ZodType) {
  return ApiResponse({
    status: HttpStatus.OK,
    description: 'Success, one page of results',
    schema: envelope({ type: 'array', items: ref(schema) }, true),
  });
}

/**
 * Error codes this route can return besides the ones derived automatically (401 for signed-in routes, 400
 * VALIDATION_ERROR when there is a body or query, access errors from `@Roles` / hotel access, upload errors).
 * Use `{ code, status, description }` when the route answers with another status (and meaning) than the catalog's.
 */
export function ApiErrors(...errors: ErrorDoc[]) {
  return ApiExtension(EXT.errors, errors);
}

/**
 * For routes addressed by another resource (`/rooms/:id`) that check hotel access in the service:
 * documents the access level and the 404 an outsider gets. `HotelAccessRequired` applies it on its own.
 */
export function ApiHotelAccess(
  level: HotelAccessLevel,
  notFound: ErrorCode = ErrorCode.HOTEL_NOT_FOUND,
) {
  return ApiExtension(EXT.hotelAccess, {
    level,
    notFound,
  } satisfies HotelAccessDoc);
}

/** Access note for rules the decorators cannot express (several roles with different checks). */
export function ApiAccess(note: string) {
  return ApiExtension(EXT.access, note);
}

/** Routes that issue or clear the refresh token: web clients get it as an httpOnly cookie. */
export function ApiClientType() {
  return ApiHeader({
    name: 'X-Client-Type',
    required: false,
    enum: ['web'],
    description:
      'Send `web` from the browser: the refresh token is then set as the httpOnly cookie `refresh_token` (path `/api/v1/auth`) instead of being returned in the body. Mobile omits it.',
  });
}
