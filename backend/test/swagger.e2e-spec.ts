import type { OpenAPIObject } from '@nestjs/swagger';
import { createSwaggerDocument } from '../src/app.swagger';
import { createTestApp } from './helpers';

type Json = Record<string, any>;

const operations = (document: OpenAPIObject) =>
  Object.entries(document.paths).flatMap(([path, item]) =>
    (['get', 'post', 'put', 'patch', 'delete'] as const)
      .filter((method) => (item as Json)[method])
      .map((method) => ({
        name: `${method.toUpperCase()} ${path}`,
        op: (item as Json)[method] as Json,
      })),
  );

/** `npm run dev` builds the Swagger document at startup; a DTO it cannot describe crashes the server. */
describe('Swagger (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let document: OpenAPIObject;

  beforeAll(async () => {
    t = await createTestApp();
    document = createSwaggerDocument(t.app);
  });

  afterAll(() => t.app.close());

  it('builds the API document for every route, with typed nullable fields', () => {
    expect(document.paths).toHaveProperty('/api/v1/hotels/{hotelId}');
    expect(document.paths).not.toHaveProperty('/api/v1/health');

    const schema = document.components?.schemas?.UpdateHotelDto as {
      properties: Record<string, object>;
    };
    expect(schema.properties.website).toMatchObject({
      type: 'string',
      nullable: true,
    });
  });

  it('describes the file part of upload endpoints so Swagger UI can send it', () => {
    const multipart = (path: string) =>
      (
        document.paths[path].post?.requestBody as {
          content: Record<string, { schema: { properties: object } }>;
        }
      ).content['multipart/form-data'].schema.properties;

    expect(multipart('/api/v1/hotels/{hotelId}/images')).toMatchObject({
      file: { type: 'string', format: 'binary' },
      caption: { type: 'string' },
      isCover: { type: 'string' },
    });
    expect(multipart('/api/v1/uploads/verification-documents')).toEqual({
      file: expect.objectContaining({ format: 'binary' }),
    });
  });

  it('gives every operation a summary, an access note and exactly one success response', () => {
    for (const { name, op } of operations(document)) {
      expect({ name, summary: !!op.summary }).toEqual({ name, summary: true });
      expect({ name, access: op.description }).toEqual({
        name,
        access: expect.stringContaining('**Access:**'),
      });
      const success = Object.keys(op.responses as Json).filter(
        (s) => s < '300',
      );
      expect({ name, success: success.length }).toEqual({ name, success: 1 });
      const [status] = success;
      if (status !== '204') {
        expect({
          name,
          data: op.responses[status].content?.['application/json']?.schema
            ?.properties?.data,
        }).toEqual({ name, data: expect.any(Object) });
      }
      expect(Object.keys(op).filter((k) => k.startsWith('x-'))).toEqual([]);
    }
  });

  it('drops the lock on public routes and documents 401 on the others', () => {
    for (const { name, op } of operations(document)) {
      const isPublic = String(op.description).startsWith('**Access:** public');
      expect({ name, security: op.security ?? 'default' }).toEqual({
        name,
        security: isPublic ? [] : 'default',
      });
      const unauthenticated = String(
        op.responses['401']?.description ?? '',
      ).includes('UNAUTHENTICATED');
      expect({ name, unauthenticated }).toEqual({
        name,
        unauthenticated: !isPublic,
      });
    }
    expect(document.paths['/api/v1/auth/login'].post?.security).toEqual([]);
    expect(document.paths['/api/v1/amenities'].get?.security).toEqual([]);
  });

  it('lists the error codes of a route with their meaning and an example each', () => {
    const responses = document.paths['/api/v1/hotels/{hotelId}/rooms'].post
      ?.responses as Json;
    const conflict = responses['409'].content['application/json'];
    expect(conflict.schema.allOf[1].properties.code.enum).toEqual([
      'ROOM_LIMIT_REACHED',
      'ROOM_NUMBER_TAKEN',
    ]);
    expect(Object.keys(conflict.examples as Json)).toEqual([
      'ROOM_LIMIT_REACHED',
      'ROOM_NUMBER_TAKEN',
    ]);
    expect(responses['403'].description).toContain('PARTNER_SUSPENDED');
    expect(responses['404'].description).toContain('HOTEL_NOT_FOUND');

    const approve = document.paths['/api/v1/verification-requests/{id}/approve']
      .post?.responses as Json;
    expect(approve['409'].description).toContain('PARTNER_SUSPENDED');
  });

  it('wraps responses in the envelope and resolves every $ref', () => {
    const rooms = document.paths['/api/v1/hotels/{hotelId}/rooms'].get
      ?.responses as Json;
    expect(rooms['200'].content['application/json'].schema).toMatchObject({
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Room' } },
        meta: { $ref: '#/components/schemas/PageMeta' },
      },
    });

    const refs = JSON.stringify(document).match(/#\/components\/schemas\/\w+/g);
    const names = new Set(refs?.map((r) => r.split('/').pop()));
    for (const name of names) {
      expect({
        name,
        defined: !!document.components?.schemas?.[name!],
      }).toEqual({ name, defined: true });
    }
  });

  it('describes path params as uuids', () => {
    const [param] = document.paths['/api/v1/room-types/{id}'].get
      ?.parameters as Json[];
    expect(param).toMatchObject({
      name: 'id',
      description: 'Room type id',
      schema: { type: 'string', format: 'uuid' },
    });
  });
});
