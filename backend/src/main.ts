import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { SWAGGER_PATH, setupSwagger } from './app.swagger';
import { Env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const config = app.get(ConfigService<Env, true>);
  const port = config.get('PORT', { infer: true });
  const swaggerEnabled =
    config.get('NODE_ENV', { infer: true }) !== 'production';
  if (swaggerEnabled) setupSwagger(app);

  await app.listen(port);
  if (swaggerEnabled) {
    Logger.log(
      `Swagger UI: http://localhost:${port}/${SWAGGER_PATH}`,
      'Bootstrap',
    );
  }
}
void bootstrap();
