import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { createValidationPipe } from './common/pipes/validation';
import { Env } from './config/env';

export const API_PREFIX = 'api/v1';

/** Shared by main.ts and e2e tests so both run the same pipeline. */
export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService<Env, true>);

  // Trust the first reverse proxy so req.ip is the real client IP (rate limiting, audit).
  (app as NestExpressApplication).set('trust proxy', 1);
  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
  });
  app.useGlobalPipes(createValidationPipe());
  // Response contract: { success, message, data, meta? } / { success: false, message, code, details? }
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
}
