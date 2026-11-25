import { INestApplication, RequestMethod } from '@nestjs/common';
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
  // The bare host address stays outside the prefix, so opening the API URL in a browser does not look broken.
  app.setGlobalPrefix(API_PREFIX, {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.get('CORS_ORIGINS', { infer: true }),
    credentials: true,
    // Lets the web read the file name of downloads (stats/export).
    exposedHeaders: ['Content-Disposition'],
  });
  app.useGlobalPipes(createValidationPipe());
  // Response contract: { success, message, data, meta? } / { success: false, message, code, details? }
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
}
