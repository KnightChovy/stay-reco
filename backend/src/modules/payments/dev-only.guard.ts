import {
  CanActivate,
  Injectable,
  NotFoundException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { ErrorCode } from '../../common/errors/error-code';

/**
 * Routes for local development and tests (the payment simulator). They exist only when `PAYMENT_SIMULATOR=true` and
 * `NODE_ENV` is not production; otherwise they answer 404, as if they did not exist. The flag is opt-in because
 * `NODE_ENV` defaults to development, and a forgotten variable on a server must not let anyone pay for free.
 */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate() {
    const enabled =
      this.config.get('PAYMENT_SIMULATOR', { infer: true }) &&
      this.config.get('NODE_ENV', { infer: true }) !== 'production';
    if (!enabled) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Not found',
      });
    }
    return true;
  }
}

export const DevOnly = () => applyDecorators(UseGuards(DevOnlyGuard));
