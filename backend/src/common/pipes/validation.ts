import {
  ArgumentMetadata,
  BadRequestException,
  PipeTransform,
} from '@nestjs/common';
import { z } from '@stayreco/shared';
import { ErrorCode } from '../errors/error-code';

/**
 * zod writes a nullable field as `anyOf: [X, { type: 'null' }]`. Swagger needs a `type` on each property (without one
 * it treats the property as a class and crashes), so rewrite it as `X` plus `nullable: true`.
 */
function toSwaggerProperty(prop: object): object {
  const { anyOf, ...rest } = prop as { anyOf?: { type?: string }[] };
  const nonNull = anyOf?.filter((s) => s.type !== 'null');
  if (!anyOf || nonNull?.length !== 1 || nonNull.length === anyOf.length) {
    return prop;
  }
  return { ...rest, ...nonNull[0], nullable: true };
}

/**
 * Turns a shared zod schema into a DTO class: Nest keeps it as the param's metatype (so the pipe finds the schema)
 * and the Swagger plugin reads its body schema from `_OPENAPI_METADATA_FACTORY`.
 */
export function zodDto<T extends z.ZodObject>(schema: T) {
  class ZodDto {
    static schema = schema;

    static _OPENAPI_METADATA_FACTORY() {
      const json = z.toJSONSchema(schema, { io: 'input' }) as {
        properties?: Record<string, object>;
        required?: string[];
      };
      return Object.fromEntries(
        Object.entries(json.properties ?? {}).map(([key, prop]) => [
          key,
          {
            ...toSwaggerProperty(prop),
            required: json.required?.includes(key) ?? false,
          },
        ]),
      );
    }
  }
  // Expose only the parsed shape: the schema type lives in shared's zod copy and cannot be emitted in .d.ts.
  return ZodDto as unknown as new () => z.output<T>;
}

/** Validates params whose metatype was built with `zodDto`; everything else passes through untouched. */
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, { metatype }: ArgumentMetadata) {
    const schema = (metatype as { schema?: z.ZodType } | undefined)?.schema;
    if (!(schema instanceof z.ZodType)) return value;

    const result = schema.safeParse(value ?? {});
    if (result.success) return result.data;
    throw new BadRequestException({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: result.error.issues.flatMap((issue) => {
        const field = issue.path.join('.');
        // Unknown keys come as one issue on the parent; report each key like any other field.
        if (issue.code === 'unrecognized_keys') {
          return issue.keys.map((key) => ({
            field: field ? `${field}.${key}` : key,
            message: `${key} is not allowed`,
          }));
        }
        return [{ field, message: issue.message }];
      }),
    });
  }
}

export function createValidationPipe() {
  return new ZodValidationPipe();
}
