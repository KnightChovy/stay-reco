import {
  applyDecorators,
  BadRequestException,
  CallHandler,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  mixin,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiExtension } from '@nestjs/swagger';
import { UPLOAD_RULES, z } from '@stayreco/shared';
import type { Request, Response } from 'express';
import multer from 'multer';
import { ErrorCode } from '../errors/error-code';
import { EXT } from '../swagger/api-docs.decorators';

export type UploadKind = 'image' | 'document';

// ApiBody's options are a union; the `schema` variant is the one used here.
type BodySchema = Extract<
  Parameters<typeof ApiBody>[0],
  { schema: unknown }
>['schema'];

const invalidFile = (message: string) =>
  new BadRequestException({ code: ErrorCode.UPLOAD_INVALID_FILE, message });

/**
 * The client's Content-Type and file name can be anything, so the type is read from the file's first bytes.
 * Only the formats in UPLOAD_RULES are recognized.
 */
function sniffMimeType(file: Buffer): string | null {
  const ascii = (start: number, end: number) =>
    file.subarray(start, end).toString('ascii');
  if (file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff) {
    return 'image/jpeg';
  }
  if (file.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) {
    return 'image/png';
  }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'image/webp';
  if (ascii(0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

/** Parses the multipart body into memory; any multer error (too large, unexpected field) is UPLOAD_INVALID_FILE. */
function uploadInterceptor(kind: UploadKind) {
  const parse = multer({
    limits: { fileSize: UPLOAD_RULES[kind].maxBytes, files: 1 },
  }).single('file');

  @Injectable()
  class UploadInterceptor implements NestInterceptor {
    async intercept(ctx: ExecutionContext, next: CallHandler) {
      const http = ctx.switchToHttp();
      await new Promise<void>((resolve, reject) =>
        parse(
          http.getRequest<Request>(),
          http.getResponse<Response>(),
          (err: unknown) =>
            err
              ? reject(
                  invalidFile(
                    err instanceof Error ? err.message : 'Invalid upload',
                  ),
                )
              : resolve(),
        ),
      );
      return next.handle();
    }
  }
  return mixin(UploadInterceptor);
}

/**
 * Accepts one multipart field `file`; the other fields go to `@Body()` and are described by `fields` (the shared
 * schema of that body). Read the file with `@UploadedFileOf(kind)`.
 */
export function UploadFile(kind: UploadKind, fields?: z.ZodObject) {
  const { mimeTypes, maxBytes } = UPLOAD_RULES[kind];
  const fieldProperties = fields
    ? (z.toJSONSchema(fields, { io: 'input' }) as { properties?: object })
        .properties
    : {};
  // Swagger cannot infer the file part, so the multipart body is described explicitly.
  const schema = {
    type: 'object',
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: `${mimeTypes.join(', ')}; at most ${maxBytes / 1024 / 1024} MB`,
      },
      ...fieldProperties,
    },
  } as BodySchema;
  return applyDecorators(
    ApiConsumes('multipart/form-data'),
    ApiBody({ schema }),
    ApiExtension(EXT.upload, true),
    UseInterceptors(uploadInterceptor(kind)),
  );
}

/** The uploaded file's bytes, after checking that it exists and that its real type is allowed for `kind`. */
export const UploadedFileOf = createParamDecorator(
  (kind: UploadKind, ctx: ExecutionContext): Buffer => {
    const { file } = ctx.switchToHttp().getRequest<Request>();
    if (!file) throw invalidFile('Missing file');

    const allowed: readonly string[] = UPLOAD_RULES[kind].mimeTypes;
    const type = sniffMimeType(file.buffer);
    if (!type || !allowed.includes(type)) {
      throw invalidFile(`Allowed types: ${allowed.join(', ')}`);
    }
    return file.buffer;
  },
);
