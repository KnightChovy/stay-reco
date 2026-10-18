import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { StaffPermission } from '../../generated/prisma/client';
import type { AuthUser } from '../decorators/current-user.decorator';
import { ErrorCode } from '../errors/error-code';

/** `owner`: only the partner who owns the hotel. `member`: the owner or a staff member assigned to it. */
export type HotelAccessLevel = 'owner' | 'member';

export interface HotelAccess {
  hotelId: string;
  role: 'OWNER' | 'STAFF';
  /** Staff permission groups; the owner implicitly has all of them. */
  permissions: StaffPermission[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Outsiders get "not found" so they cannot probe which hotels exist.
const hotelNotFound = () =>
  new NotFoundException({
    code: ErrorCode.HOTEL_NOT_FOUND,
    message: 'Hotel not found',
  });

// Staff already know the hotel exists, so missing rights are a plain "forbidden".
const forbidden = (message: string) =>
  new ForbiddenException({ code: ErrorCode.FORBIDDEN, message });

/**
 * Tenant check for hotel data (CONVENTIONS §5). The hotel id given by the client is only a selector:
 * access always comes from the caller's own relationship (owning partner or assigned staff).
 */
@Injectable()
export class HotelAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assert(
    user: AuthUser,
    hotelId: string,
    level: HotelAccessLevel,
    permission?: StaffPermission,
  ): Promise<HotelAccess> {
    const access = UUID.test(hotelId)
      ? await this.resolve(user, hotelId)
      : null;
    if (!access) throw hotelNotFound();

    if (access.role === 'STAFF') {
      if (level === 'owner') {
        throw forbidden('Only the hotel owner can do this');
      }
      if (permission && !access.permissions.includes(permission)) {
        throw forbidden(`Missing staff permission ${permission}`);
      }
    }
    return access;
  }

  private async resolve(
    user: AuthUser,
    hotelId: string,
  ): Promise<HotelAccess | null> {
    if (user.role === 'HOTEL_PARTNER') {
      // A partner's account id is also its hotel_partner id.
      const hotel = await this.prisma.hotel.findFirst({
        where: { hotelId, hotelPartnerId: user.accountId },
        select: { hotelId: true },
      });
      return hotel ? { hotelId, role: 'OWNER', permissions: [] } : null;
    }

    if (user.role === 'HOTEL_STAFF') {
      const staff = await this.prisma.hotelStaff.findFirst({
        where: { hotelStaffId: user.accountId, hotelId },
        select: { permissions: true },
      });
      return staff
        ? { hotelId, role: 'STAFF', permissions: staff.permissions }
        : null;
    }

    return null;
  }
}
