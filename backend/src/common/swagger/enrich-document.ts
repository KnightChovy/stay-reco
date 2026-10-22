import type { OpenAPIObject } from '@nestjs/swagger';
import { responseSchemas, z } from '@stayreco/shared';
import { ErrorCode } from '../errors/error-code';
import { EXT, type ErrorDoc, type HotelAccessDoc } from './api-docs.decorators';
import { ERROR_CATALOG } from './error-catalog';

type Json = Record<string, unknown>;

interface Param {
  name: string;
  in: string;
  description?: string;
  schema?: Json;
}

const METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

const SHARED_COMPONENTS: Json = {
  PageMeta: {
    type: 'object',
    required: ['page', 'pageSize', 'total', 'totalPages'],
    properties: {
      page: { type: 'integer', example: 1 },
      pageSize: { type: 'integer', example: 10 },
      total: { type: 'integer', example: 42 },
      totalPages: { type: 'integer', example: 5 },
    },
  },
  ErrorDetail: {
    type: 'object',
    required: ['field', 'message'],
    properties: {
      field: { type: 'string', example: 'email' },
      message: { type: 'string', example: 'Invalid email address' },
    },
  },
  APIError: {
    type: 'object',
    description:
      'Body of every error response. Branch on `code`, never on `message`.',
    required: ['success', 'message', 'code'],
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string' },
      code: { type: 'string' },
      details: {
        type: 'array',
        description: 'Only for VALIDATION_ERROR: one item per invalid field.',
        items: { $ref: '#/components/schemas/ErrorDetail' },
      },
    },
  },
};

const ACCESS_LABEL: Record<HotelAccessDoc['level'], string> = {
  owner: 'the hotel owner',
  'owner-view': 'the hotel owner (also while the partner is suspended)',
  member: 'a hotel member (the owner or a staff member assigned to the hotel)',
};

/** zod adds a regex next to well-known formats and safe-integer bounds to every int; both only add noise here. */
function tidySchemas(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(tidySchemas);
  if (!node || typeof node !== 'object') return;
  const obj = node as Json;
  delete obj.$id;
  if (obj.format && obj.pattern) delete obj.pattern;
  if (obj.minimum === Number.MIN_SAFE_INTEGER) delete obj.minimum;
  if (obj.maximum === Number.MAX_SAFE_INTEGER) delete obj.maximum;
  Object.values(obj).forEach(tidySchemas);
}

function responseComponents(): Json {
  return z.toJSONSchema(responseSchemas, {
    target: 'openapi-3.0',
    uri: (id) => `#/components/schemas/${id}`,
  }).schemas;
}

function accessNote(op: Json): string {
  if (op[EXT.public]) return '**Access:** public, no token needed.';
  if (op[EXT.access]) return `**Access:** ${op[EXT.access] as string}.`;
  const roles = op[EXT.roles] as string[] | undefined;
  const hotel = op[EXT.hotelAccess] as HotelAccessDoc | undefined;
  const who = roles?.length
    ? roles.map((r) => `\`${r}\``).join(', ')
    : 'any signed-in account';
  return hotel
    ? `**Access:** ${roles?.length ? `${who}, and ` : ''}${ACCESS_LABEL[hotel.level]}. Outsiders get 404 \`${hotel.notFound}\`.`
    : `**Access:** ${who}.`;
}

function errorDocs(op: Json): ErrorDoc[] {
  const errors: ErrorDoc[] = [...((op[EXT.errors] as ErrorDoc[]) ?? [])];
  const hotel = op[EXT.hotelAccess] as HotelAccessDoc | undefined;
  if (!op[EXT.public]) errors.push(ErrorCode.UNAUTHENTICATED);
  if (op[EXT.roles]) errors.push(ErrorCode.FORBIDDEN);
  if (hotel) {
    errors.push(hotel.notFound);
    if (hotel.level !== 'member') errors.push(ErrorCode.FORBIDDEN);
    if (hotel.level === 'owner') errors.push(ErrorCode.PARTNER_SUSPENDED);
  }
  const hasInput =
    !!op.requestBody ||
    (op.parameters as Param[] | undefined)?.some((p) => p.in === 'query');
  if (hasInput) errors.push(ErrorCode.VALIDATION_ERROR);
  if (op[EXT.upload]) {
    errors.push(ErrorCode.UPLOAD_INVALID_FILE, ErrorCode.UPLOAD_UNAVAILABLE);
  }
  return errors;
}

/** One response per status, listing every code with its meaning and a selectable example. */
function errorResponses(errors: ErrorDoc[]): Json {
  // status → code → description; the first mention of a code wins (route-specific ones come first).
  const byStatus = new Map<number, Map<ErrorCode, string>>();
  for (const e of errors) {
    const { code, status, description } =
      typeof e === 'string' ? { code: e, ...ERROR_CATALOG[e] } : e;
    if (!byStatus.has(status)) byStatus.set(status, new Map());
    const codes = byStatus.get(status)!;
    if (!codes.has(code)) codes.set(code, description);
  }
  const responses: Json = {};
  for (const [status, codes] of [...byStatus].sort(([a], [b]) => a - b)) {
    const list = [...codes.keys()];
    responses[status] = {
      description: list.map((c) => `\`${c}\`: ${codes.get(c)}`).join('<br>'),
      content: {
        'application/json': {
          schema: {
            allOf: [
              { $ref: '#/components/schemas/APIError' },
              {
                type: 'object',
                properties: { code: { type: 'string', enum: list } },
              },
            ],
          },
          examples: Object.fromEntries(
            list.map((c) => [
              c,
              {
                value: { success: false, message: codes.get(c), code: c },
              },
            ]),
          ),
        },
      },
    };
  }
  return responses;
}

/** Path segments whose plain singular reads badly as a param label. */
const SEGMENT_LABELS: Record<string, string> = {
  'hotel-staff': 'staff member',
};

const words = (segment: string) =>
  SEGMENT_LABELS[segment] ?? segment.replace(/-/g, ' ').replace(/s$/, '');

/** `hotelId` → "Hotel id"; `/room-types/{id}` → "Room type id". */
function describePathParams(path: string, op: Json) {
  const segments = path.split('/');
  for (const param of (op.parameters as Param[] | undefined) ?? []) {
    if (param.in !== 'path') continue;
    param.schema = { ...param.schema, format: 'uuid' };
    if (param.description) continue;
    const label =
      param.name === 'id'
        ? words(segments[segments.indexOf('{id}') - 1])
        : param.name
            .replace(/Id$/, '')
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase();
    param.description = `${label.charAt(0).toUpperCase()}${label.slice(1)} id`;
  }
}

/**
 * Completes what Nest generates from the routes: shared response components, public routes without the lock, an
 * access note on every operation, the full list of error codes per status, and described path params.
 */
export function enrichDocument(document: OpenAPIObject): OpenAPIObject {
  document.components ??= {};
  document.components.schemas = {
    ...document.components.schemas,
    ...responseComponents(),
    ...SHARED_COMPONENTS,
  } as NonNullable<OpenAPIObject['components']>['schemas'];

  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of METHODS) {
      const op = (item as Json)[method] as Json | undefined;
      if (!op) continue;

      if (op[EXT.public]) op.security = [];
      op.description = [accessNote(op), op.description as string | undefined]
        .filter(Boolean)
        .join('\n\n');
      op.responses = {
        ...(op.responses as Json),
        ...errorResponses(errorDocs(op)),
      };
      describePathParams(path, op);
      for (const key of Object.values(EXT)) delete op[key];
    }
  }

  tidySchemas(document);
  return document;
}
