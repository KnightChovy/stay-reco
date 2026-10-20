import {
  applyDecorators,
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { StaffPermission } from '../../generated/prisma/client';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator';
import {
  type HotelAccess,
  type HotelAccessLevel,
  HotelAccessService,
} from './hotel-access.service';

const HOTEL_ACCESS_KEY = 'hotelAccess';

interface HotelAccessOptions {
  level: HotelAccessLevel;
  permission?: StaffPermission;
  /** Route param holding the hotel id. */
  param: string;
}

type HotelRequest = AuthenticatedRequest & { hotelAccess?: HotelAccess };

/**
 * Protects a `/hotels/:hotelId/...` route. Runs after the global JWT guard, so the caller is known.
 * Routes addressed by another resource (`/rooms/:id`) call `HotelAccessService.assert` in the service instead.
 */
export function HotelAccessRequired(
  level: HotelAccessLevel,
  options: { permission?: StaffPermission; param?: string } = {},
) {
  const metadata: HotelAccessOptions = {
    level,
    permission: options.permission,
    param: options.param ?? 'hotelId',
  };
  return applyDecorators(
    SetMetadata(HOTEL_ACCESS_KEY, metadata),
    UseGuards(HotelAccessGuard),
  );
}

/** The access resolved by `HotelAccessRequired` (role OWNER / STAFF and staff permissions). */
export const CurrentHotelAccess = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): HotelAccess | undefined =>
    ctx.switchToHttp().getRequest<HotelRequest>().hotelAccess,
);

@Injectable()
export class HotelAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly access: HotelAccessService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<
      HotelAccessOptions | undefined
    >(HOTEL_ACCESS_KEY, [context.getHandler(), context.getClass()]);
    if (!options) return true;

    const req = context.switchToHttp().getRequest<HotelRequest>();
    const hotelId = String(req.params[options.param] ?? '');
    req.hotelAccess = await this.access.assert(
      req.user,
      hotelId,
      options.level,
      options.permission,
    );
    return true;
  }
}
