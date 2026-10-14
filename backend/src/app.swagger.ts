import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api/docs';

/** Swagger UI at /api/docs, raw spec at /api/docs-json. Not enabled in production. */
export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('StayReco API')
    .setDescription(
      [
        'Every route requires `Authorization: Bearer <accessToken>` unless it is public.',
        'Web clients send `X-Client-Type: web` on login/register/refresh/accept-invitation to receive the refresh token as an httpOnly cookie; mobile receives it in the body.',
        'Flows and conventions: packages/docs/api-guide.md. Endpoint contracts per phase: packages/docs/contracts/.',
      ].join('\n\n'),
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' })
    .addSecurityRequirements('bearer')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'StayReco API',
  });
}
