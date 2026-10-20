import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateRoomTypeInput,
  RoomType,
  UpdateRoomTypeInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { lockHotel, lockRoomType } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  type HotelAccessLevel,
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  BASE_PRICE_NAME,
  basePriceWhere,
  roomTypeInclude,
  toRoomType,
} from './room.mapper';

export const roomTypeNotFound = () =>
  new NotFoundException({
    code: ErrorCode.ROOM_TYPE_NOT_FOUND,
    message: 'Room type not found',
  });

const unknownIds = (field: string, message: string) =>
  new BadRequestException({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    details: [{ field, message }],
  });

/** Room types with their base price, beds and amenities. Rooms and images have their own services. */
@Injectable()
export class RoomTypesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly storage: StorageService,
  ) {}

  /** `hotelId` was checked by `HotelAccessRequired`. */
  async list(hotelId: string): Promise<RoomType[]> {
    const roomTypes = await this.prisma.roomType.findMany({
      where: { hotelId },
      include: roomTypeInclude,
      orderBy: { createdAt: 'asc' },
    });
    return roomTypes.map(toRoomType);
  }

  /** One insert creates the room type with its beds, amenities and base price row. */
  async create(hotelId: string, input: CreateRoomTypeInput): Promise<RoomType> {
    await this.assertCatalog(input.beds, input.amenityIds);
    const roomType = await this.prisma.roomType.create({
      data: {
        hotelId,
        name: input.name,
        description: input.description,
        maxOccupancy: input.maxOccupancy,
        baseAreaSqm: input.areaSqm,
        roomTypeBeds: { create: input.beds },
        roomTypeAmenities: {
          create: input.amenityIds.map((amenityId) => ({ amenityId })),
        },
        prices: {
          create: { name: BASE_PRICE_NAME, pricePerNight: input.basePrice },
        },
      },
      include: roomTypeInclude,
    });
    return toRoomType(roomType);
  }

  async findOne(user: AuthUser, roomTypeId: string): Promise<RoomType> {
    await this.findForAccess(user, roomTypeId, 'member');
    return this.load(roomTypeId);
  }

  /** `beds` and `amenityIds`, when sent, replace the current lists. */
  async update(
    user: AuthUser,
    roomTypeId: string,
    input: UpdateRoomTypeInput,
  ): Promise<RoomType> {
    await this.findForAccess(user, roomTypeId, 'owner');
    await this.assertCatalog(input.beds ?? [], input.amenityIds ?? []);

    const { beds, amenityIds, basePrice, areaSqm, ...fields } = input;
    await this.prisma.$transaction(async (tx) => {
      await tx.roomType.update({
        where: { roomTypeId },
        data: { ...fields, baseAreaSqm: areaSqm },
      });
      if (beds) {
        await tx.roomTypeBed.deleteMany({ where: { roomTypeId } });
        await tx.roomTypeBed.createMany({
          data: beds.map((b) => ({ ...b, roomTypeId })),
        });
      }
      if (amenityIds) {
        await tx.roomTypeAmenity.deleteMany({ where: { roomTypeId } });
        await tx.roomTypeAmenity.createMany({
          data: amenityIds.map((amenityId) => ({ amenityId, roomTypeId })),
        });
      }
      if (basePrice !== undefined) {
        await tx.price.updateMany({
          where: { roomTypeId, ...basePriceWhere },
          data: { pricePerNight: basePrice },
        });
      }
    });
    return this.load(roomTypeId);
  }

  /**
   * Only an unused room type can be deleted: no physical rooms and no bookings (bookings keep their room type,
   * see `booking.room_type_id`). Its beds, amenities, prices, images and recommendations go with it.
   */
  async remove(user: AuthUser, roomTypeId: string): Promise<void> {
    const { hotelId } = await this.findForAccess(user, roomTypeId, 'owner');
    const images = await this.prisma.$transaction(async (tx) => {
      // Room creation takes the same hotel lock, so no room can be added to this type between the check and the delete.
      await lockHotel(tx, hotelId);
      // And the image upload lock, so an upload in progress either finishes first or sees the type gone.
      await lockRoomType(tx, roomTypeId);
      const rooms = await tx.room.count({ where: { roomTypeId } });
      const bookings = await tx.booking.count({ where: { roomTypeId } });
      if (rooms > 0 || bookings > 0) {
        throw new ConflictException({
          code: ErrorCode.ROOM_TYPE_IN_USE,
          message:
            rooms > 0
              ? `The room type still has ${rooms} rooms`
              : 'The room type has bookings',
        });
      }

      const removed = await tx.roomTypeImage.findMany({
        where: { roomTypeId },
        select: { storageKey: true },
      });
      await tx.roomTypeBed.deleteMany({ where: { roomTypeId } });
      await tx.roomTypeAmenity.deleteMany({ where: { roomTypeId } });
      await tx.price.deleteMany({ where: { roomTypeId } });
      await tx.recommendation.deleteMany({ where: { roomTypeId } });
      // room_type_image rows are removed by ON DELETE CASCADE.
      await tx.roomType.delete({ where: { roomTypeId } });
      return removed;
    });
    for (const { storageKey } of images) {
      await this.storage.deleteImage(storageKey);
    }
  }

  /** Checks the caller's access to the room type's hotel; outsiders get ROOM_TYPE_NOT_FOUND. */
  async findForAccess(
    user: AuthUser,
    roomTypeId: string,
    level: HotelAccessLevel,
  ) {
    const roomType = isUuid(roomTypeId)
      ? await this.prisma.roomType.findUnique({
          where: { roomTypeId },
          select: { roomTypeId: true, hotelId: true },
        })
      : null;
    await this.access.assertResource(
      user,
      roomType?.hotelId,
      level,
      roomTypeNotFound,
    );
    return roomType!;
  }

  private async load(roomTypeId: string): Promise<RoomType> {
    const roomType = await this.prisma.roomType.findUniqueOrThrow({
      where: { roomTypeId },
      include: roomTypeInclude,
    });
    return toRoomType(roomType);
  }

  private async assertCatalog(
    beds: { bedTypeId: string }[],
    amenityIds: string[],
  ) {
    const bedTypeIds = beds.map((b) => b.bedTypeId);
    const [knownBeds, knownAmenities] = await Promise.all([
      this.prisma.bedType.count({ where: { bedTypeId: { in: bedTypeIds } } }),
      this.prisma.amenity.count({ where: { amenityId: { in: amenityIds } } }),
    ]);
    if (knownBeds !== bedTypeIds.length) {
      throw unknownIds('beds', 'Unknown bed type id');
    }
    if (knownAmenities !== amenityIds.length) {
      throw unknownIds('amenityIds', 'Unknown amenity id');
    }
  }
}
