import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import type { Request } from 'express';
import { ErrorCode } from '../../common/errors/error-code';
import type { Env } from '../../config/env';

/**
 * SePay authenticates each webhook call with `Authorization: Apikey <key>` (the key set in the SePay dashboard and in
 * SEPAY_WEBHOOK_API_KEY). Checked before the body is even read, in constant time; without a configured key every
 * call is refused.
 */
@Injectable()
export class SepayApiKeyGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext) {
    const header = context.switchToHttp().getRequest<Request>()
      .headers.authorization;
    const expected = this.config.get('SEPAY_WEBHOOK_API_KEY', { infer: true });
    const given = /^apikey\s+(.+)$/i.exec(header?.trim() ?? '')?.[1] ?? '';
    const ok =
      !!expected &&
      given.length === expected.length &&
      timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    if (!ok) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_API_KEY,
        message: 'Invalid SePay API key',
      });
    }
    return true;
  }
}
