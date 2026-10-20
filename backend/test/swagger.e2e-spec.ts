import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { createTestApp } from './helpers';

/** `npm run dev` builds the Swagger document at startup; a DTO it cannot describe crashes the server. */
describe('Swagger (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(() => t.app.close());

  it('builds the API document for every route, with typed nullable fields', () => {
    const document = SwaggerModule.createDocument(
      t.app,
      new DocumentBuilder().build(),
    );
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
    const document = SwaggerModule.createDocument(
      t.app,
      new DocumentBuilder().build(),
    );
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
});
