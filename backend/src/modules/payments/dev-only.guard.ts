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

/** Routes for local development and tests: in production they do not exist (404). */
@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate() {
    if (this.config.get('NODE_ENV', { infer: true }) === 'production') {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Not found',
      });
    }
    return true;
  }
}

export const DevOnly = () => applyDecorators(UseGuards(DevOnlyGuard));
