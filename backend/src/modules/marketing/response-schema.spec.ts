import { z } from 'zod';
import { geminiResponseSchema } from './response-schema';

describe('geminiResponseSchema', () => {
  it('drops $schema, which the API rejects', () => {
    const json = geminiResponseSchema(z.object({ title: z.string() }));
    expect(json).not.toHaveProperty('$schema');
  });

  it('drops additionalProperties, at every depth', () => {
    const json = geminiResponseSchema(
      z.strictObject({
        voice: z.strictObject({ summary: z.string() }),
      }),
    );
    // A nested strictObject emits it too, and one left behind anywhere is a 400 on the whole request.
    expect(JSON.stringify(json)).not.toContain('additionalProperties');
  });

  it('keeps the shape the model has to follow', () => {
    const json = geminiResponseSchema(
      z.object({ title: z.string(), body: z.string() }),
    );
    expect(json).toMatchObject({
      type: 'object',
      properties: { title: { type: 'string' }, body: { type: 'string' } },
    });
  });

  it('keeps the field descriptions, which are the model’s instructions', () => {
    const json = geminiResponseSchema(
      z.object({ body: z.string().describe('The post itself') }),
    );
    expect(JSON.stringify(json)).toContain('The post itself');
  });

  it('asks the model for a field that has a default rather than leaving it out', () => {
    // io: 'output' - the schema describes what the model must produce, so a default is not an excuse to omit it.
    const json = geminiResponseSchema(
      z.object({ tone: z.string().default('warm') }),
    );
    expect(json).toMatchObject({ required: ['tone'] });
  });

  it('walks arrays, where anyOf keeps its members', () => {
    // A union of objects is emitted as an anyOf array; each member is a schema that needs stripping too.
    const json = geminiResponseSchema(
      z.object({
        value: z.union([
          z.strictObject({ a: z.string() }),
          z.strictObject({ b: z.string() }),
        ]),
      }),
    );
    const text = JSON.stringify(json);
    expect(text).toContain('anyOf');
    expect(text).not.toContain('additionalProperties');
  });

  it('walks into items of an array field', () => {
    const json = geminiResponseSchema(
      z.object({ ideas: z.array(z.strictObject({ brief: z.string() })) }),
    );
    expect(JSON.stringify(json)).not.toContain('additionalProperties');
  });
});
