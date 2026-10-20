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
});
