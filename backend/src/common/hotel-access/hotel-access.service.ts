import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { StaffPermission } from '../../generated/prisma/client';
import type { AuthUser } from '../decorators/current-user.decorator';
import { ErrorCode } from '../errors/error-code';

/**
 * `owner`: changes only the owning partner may make (refused while the partner is suspended).
 * `owner-view`: reads only the owner may see, e.g. the staff list (still allowed while suspended).
 * `member`: reads and actions open to the owner and the staff assigned to the hotel.
 */
export type HotelAccessLevel = 'owner' | 'owner-view' | 'member';

export interface HotelAccess {
  hotelId: string;
  role: 'OWNER' | 'STAFF';
  /** Staff permission groups; the owner implicitly has all of them. */
  permissions: StaffPermission[];
  /** The owning partner is suspended (`hotel_partner.status`): it can still read, but not change, its hotels. */
  partnerSuspended: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Ids come from the URL; check them before querying, since Postgres rejects a malformed uuid with an error. */
export const isUuid = (value: string) => UUID.test(value);

// Outsiders get "not found" so they cannot probe which hotels exist.
const hotelNotFound = () =>
  new NotFoundException({
    code: ErrorCode.HOTEL_NOT_FOUND,
    message: 'Hotel not found',
  });

// Staff already know the hotel exists, so missing rights are a plain "forbidden".
const forbidden = (message: string) =>
  new ForbiddenException({ code: ErrorCode.FORBIDDEN, message });

/** Raised for any change a suspended partner tries to make (creating hotels included). */
export const partnerSuspended = () =>
  new ForbiddenException({
    code: ErrorCode.PARTNER_SUSPENDED,
    message: 'The partner is suspended',
  });

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
    const access = isUuid(hotelId) ? await this.resolve(user, hotelId) : null;
    if (!access) throw hotelNotFound();

    if (access.role === 'STAFF') {
      if (level !== 'member') {
        throw forbidden('Only the hotel owner can do this');
      }
      if (permission && !access.permissions.includes(permission)) {
        throw forbidden(`Missing staff permission ${permission}`);
      }
    }
    if (level === 'owner' && access.partnerSuspended) {
      throw partnerSuspended();
    }
    return access;
  }

  /**
   * For routes addressed by a child resource (`/hotel-images/:id`, `/rooms/:id`): pass the resource's hotel id, or
   * null when the resource does not exist. A missing resource and a hotel the caller cannot see both raise
   * `notFound`, so outsiders cannot tell them apart. Staff without the right still get 403.
   */
  async assertResource(
    user: AuthUser,
    hotelId: string | null | undefined,
    level: HotelAccessLevel,
    notFound: () => Error,
    permission?: StaffPermission,
  ): Promise<HotelAccess> {
    if (!hotelId) throw notFound();
    try {
      return await this.assert(user, hotelId, level, permission);
    } catch (err) {
      throw err instanceof NotFoundException ? notFound() : err;
    }
  }

  /** For partner actions not tied to an existing hotel (creating one, uploading documents). */
  async assertPartnerNotSuspended(hotelPartnerId: string): Promise<void> {
    const partner = await this.prisma.hotelPartner.findUniqueOrThrow({
      where: { hotelPartnerId },
      select: { status: true },
    });
    if (partner.status === 'SUSPENDED') throw partnerSuspended();
  }

  private async resolve(
    user: AuthUser,
    hotelId: string,
  ): Promise<HotelAccess | null> {
    if (user.role === 'HOTEL_PARTNER') {
      // A partner's account id is also its hotel_partner id.
      const hotel = await this.prisma.hotel.findFirst({
        where: { hotelId, hotelPartnerId: user.accountId },
        select: { hotelPartner: { select: { status: true } } },
      });
      return hotel
        ? {
            hotelId,
            role: 'OWNER',
            permissions: [],
            partnerSuspended: hotel.hotelPartner.status === 'SUSPENDED',
          }
        : null;
    }

    if (user.role === 'HOTEL_STAFF') {
      const staff = await this.prisma.hotelStaff.findFirst({
        where: { hotelStaffId: user.accountId, hotelId },
        select: { permissions: true },
      });
      // Staff never reach owner-level actions, so the partner status is not needed here.
      return staff
        ? {
            hotelId,
            role: 'STAFF',
            permissions: staff.permissions,
            partnerSuspended: false,
          }
        : null;
    }

    return null;
  }
}
