import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { enrichDocument } from './common/swagger/enrich-document';

export const SWAGGER_PATH = 'api/docs';

const TAGS: [name: string, description: string][] = [
  [
    'auth',
    'Sign-up, sign-in, tokens, sessions, passwords and invitations. Guide: docs/api/auth.md',
  ],
  ['catalog', 'Public lists used by forms and search filters'],
  [
    'hotels',
    'Hotels of a partner: details, amenities, policies, room config, images. Guide: docs/api/partner.md',
  ],
  [
    'rooms',
    'Room types, their images and physical rooms. Guide: docs/api/partner.md',
  ],
  [
    'pricing',
    'Pricing rules, the nightly price preview and the rooms on sale per day. Guide: docs/api/partner.md#pricing-rules-phase-2, rules: docs/money-rules.md',
  ],
  [
    'search',
    'Public hotel search and hotel / room type pages with prices for a stay. Guide: docs/api/customer.md',
  ],
  [
    'staff',
    'Staff of a hotel, managed by its owner. Guide: docs/api/partner.md#staff',
  ],
  [
    'verification',
    'Hotel verification: partner submissions and the platform manager review. Guides: docs/api/partner.md, docs/api/manager.md',
  ],
];

/** The OpenAPI document served by Swagger UI; also built by the Swagger e2e test. */
export function createSwaggerDocument(app: INestApplication) {
  const builder = new DocumentBuilder()
    .setTitle('StayReco API')
    .setDescription(
      [
        'Every route requires `Authorization: Bearer <accessToken>` unless its description says it is public. Click **Authorize** and paste the `accessToken` from `POST /auth/login`.',
        'Every success body is `{ success: true, message, data, meta? }`; every error body is `{ success: false, message, code, details? }`. Branch on `code`, never on `message`. Each operation lists the codes it can return under its error responses.',
        'Web clients send `X-Client-Type: web` on the routes that issue tokens to receive the refresh token as an httpOnly cookie; mobile receives it in the body.',
        'All routes are rate limited; strict limits on sign-in and email routes answer 429 `TOO_MANY_REQUESTS`.',
        'Flows and conventions: docs/api-guide.md. Endpoints by user role: docs/api/.',
      ].join('\n\n'),
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addSecurityRequirements('bearer');
  for (const [name, description] of TAGS) builder.addTag(name, description);

  return enrichDocument(SwaggerModule.createDocument(app, builder.build()));
}

/** Swagger UI at /api/docs, raw spec at /api/docs-json. Not enabled in production. */
export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup(SWAGGER_PATH, app, createSwaggerDocument(app), {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'StayReco API',
  });
}
