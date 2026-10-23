import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type {
  CancellationPolicyInput,
  CreateHotelInput,
  Hotel,
  HotelSummary,
  RoomConfigInput,
  UpdateHotelInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { lockHotel } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import { HotelAccessService } from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CANCELLATION_KEYS,
  hotelInclude,
  hotelSummarySelect,
  POLICY_PREFIX,
  toCancellationRows,
  toHotel,
  toHotelData,
  toHotelSummary,
} from './hotel.mapper';

/**
 * Hotel profile, amenities, policies and room configuration.
 * Callers have already passed `HotelAccessRequired`, so `hotelId` is known to exist and belong to them.
 */
@Injectable()
export class HotelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
  ) {}

  /** Hotels the partner owns, or the one hotel a staff member works at. */
  async myHotels(user: AuthUser): Promise<HotelSummary[]> {
    if (user.role === 'HOTEL_PARTNER') {
      const hotels = await this.prisma.hotel.findMany({
        where: { hotelPartnerId: user.accountId },
        select: hotelSummarySelect,
        orderBy: { createdAt: 'desc' },
      });
      return hotels.map((h) => toHotelSummary(h, 'OWNER'));
    }

    const hotels = await this.prisma.hotel.findMany({
      where: { hotelStaffs: { some: { hotelStaffId: user.accountId } } },
      select: hotelSummarySelect,
    });
    return hotels.map((h) => toHotelSummary(h, 'STAFF'));
  }

  /** New hotels start as DRAFT until a verification request is approved. Suspended partners cannot add hotels. */
  async create(user: AuthUser, input: CreateHotelInput): Promise<Hotel> {
    await this.access.assertPartnerNotSuspended(user.accountId);
    const hotel = await this.prisma.hotel.create({
      data: { ...toHotelData(input), hotelPartnerId: user.accountId },
      include: hotelInclude,
    });
    return toHotel(hotel);
  }

  async findOne(hotelId: string): Promise<Hotel> {
    const hotel = await this.prisma.hotel.findUniqueOrThrow({
      where: { hotelId },
      include: hotelInclude,
    });
    return toHotel(hotel);
  }

  /** Edits apply immediately, also for ACTIVE hotels (contract D9: no re-approval). */
  async update(hotelId: string, input: UpdateHotelInput): Promise<Hotel> {
    const hotel = await this.prisma.hotel.update({
      where: { hotelId },
      data: toHotelData(input),
      include: hotelInclude,
    });
    return toHotel(hotel);
  }

  /** Replaces the hotel's amenity list. */
  async setAmenities(hotelId: string, amenityIds: string[]): Promise<Hotel> {
    const known = await this.prisma.amenity.count({
      where: { amenityId: { in: amenityIds } },
    });
    if (known !== amenityIds.length) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: [{ field: 'amenityIds', message: 'Unknown amenity id' }],
      });
    }

    await this.prisma.$transaction([
      this.prisma.hotelAmenity.deleteMany({ where: { hotelId } }),
      this.prisma.hotelAmenity.createMany({
        data: amenityIds.map((amenityId) => ({ hotelId, amenityId })),
      }),
    ]);
    return this.findOne(hotelId);
  }

  /** Replaces all policies; keys missing from `policies` are removed. */
  async setPolicies(
    hotelId: string,
    policies: Record<string, string>,
  ): Promise<Hotel> {
    await this.prisma.$transaction([
      this.prisma.hotelProperties.deleteMany({
        where: {
          hotelId,
          verificationRequestId: null,
          propertyKey: { startsWith: POLICY_PREFIX },
        },
      }),
      this.prisma.hotelProperties.createMany({
        data: Object.entries(policies).map(([key, value]) => ({
          hotelId,
          propertyKey: POLICY_PREFIX + key,
          propertyValue: value,
        })),
      }),
    ]);
    return this.findOne(hotelId);
  }

  /** Applies to bookings made from now on; existing bookings keep the policy fixed on them (BR-07). */
  async setCancellationPolicy(
    hotelId: string,
    policy: CancellationPolicyInput,
  ): Promise<Hotel> {
    await this.prisma.$transaction([
      this.prisma.hotelProperties.deleteMany({
        where: {
          hotelId,
          verificationRequestId: null,
          propertyKey: { in: Object.values(CANCELLATION_KEYS) },
        },
      }),
      this.prisma.hotelProperties.createMany({
        data: toCancellationRows(policy).map((row) => ({ ...row, hotelId })),
      }),
    ]);
    return this.findOne(hotelId);
  }

  /**
   * Creates or updates the hotel's single room configuration (contract D4).
   * `totalRooms` caps how many physical rooms can exist, so it cannot go below the rooms already created.
   */
  async setRoomConfig(
    hotelId: string,
    { totalRooms, basePrice }: RoomConfigInput,
  ): Promise<Hotel> {
    await this.prisma.$transaction(async (tx) => {
      // Same lock as room creation, so a room cannot be added while the limit is being lowered.
      await lockHotel(tx, hotelId);
      const rooms = await tx.room.count({ where: { roomType: { hotelId } } });
      if (totalRooms < rooms) {
        throw new ConflictException({
          code: ErrorCode.ROOM_LIMIT_REACHED,
          message: `The hotel already has ${rooms} rooms`,
        });
      }

      // `hotel_id` is unique, so concurrent first calls cannot create two configs.
      await tx.hotelRoomConfig.upsert({
        where: { hotelId },
        create: { hotelId, totalRooms, basePrice },
        update: { totalRooms, basePrice },
      });
    });
    return this.findOne(hotelId);
  }
}
