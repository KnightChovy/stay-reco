import { z, type ZodObject } from 'zod';

/**
 * Keywords the Gemini API rejects in `responseJsonSchema`, which Zod emits anyway.
 *
 * `$schema` is the dialect marker, meaningless to an API that accepts one dialect. `additionalProperties` comes from
 * `z.strictObject`, and Gemini has no setting for it - the schema it is given is the shape it returns, so the
 * restriction is already implied. Sending either one is a 400 on a request that is otherwise fine.
 */
const UNSUPPORTED = ['$schema', 'additionalProperties'];

/** Recursively drops the keywords Gemini will not take. Arrays are walked too: `anyOf` holds its members in one. */
function strip(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(strip);
  if (node === null || typeof node !== 'object') return node;
  return Object.fromEntries(
    Object.entries(node as Record<string, unknown>)
      .filter(([key]) => !UNSUPPORTED.includes(key))
      .map(([key, value]) => [key, strip(value)]),
  );
}

/**
 * A Zod object turned into the JSON Schema Gemini will accept for structured output.
 *
 * `io: 'output'` matters: it describes what the model must produce, so a field with a default is required of the
 * model rather than left out and filled in locally. The answer is still parsed back through the same Zod schema, so
 * this is the model's instruction, never the thing trusted.
 */
export function geminiResponseSchema(
  schema: ZodObject,
): Record<string, unknown> {
  return strip(z.toJSONSchema(schema, { io: 'output' })) as Record<
    string,
    unknown
  >;
}
