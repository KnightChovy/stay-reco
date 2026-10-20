import type { Room, RoomType, RoomTypeImage } from '@stayreco/shared';
import type {
  Prisma,
  Room as RoomRow,
  RoomTypeImage as RoomTypeImageRow,
} from '../../generated/prisma/client';
import { toNumber } from '../../common/http/decimal';
import { toAmenity } from '../catalog/catalog.service';

/** Name given to the base price row (shown to staff tools that list `price` rows). */
export const BASE_PRICE_NAME = 'Giá gốc';

/**
 * The base price of a room type is the `price` row with no room, no dates and no weekday (contract D3). Seasonal and
 * weekday rules added later are other rows of the same room type.
 */
export const basePriceWhere = {
  roomId: null,
  validFrom: null,
  validTo: null,
  dayOfWeek: null,
} satisfies Prisma.PriceWhereInput;

export const roomTypeInclude = {
  roomTypeBeds: {
    include: { bedType: true },
    orderBy: { bedType: { name: 'asc' } },
  },
  roomTypeAmenities: {
    include: { amenity: true },
    orderBy: { amenity: { name: 'asc' } },
  },
  roomTypeImages: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  prices: { where: basePriceWhere, take: 1 },
  _count: { select: { rooms: true } },
} satisfies Prisma.RoomTypeInclude;

export type RoomTypeWithDetails = Prisma.RoomTypeGetPayload<{
  include: typeof roomTypeInclude;
}>;

export const toRoomTypeImage = (i: RoomTypeImageRow): RoomTypeImage => ({
  id: i.roomTypeImageId,
  url: i.imageUrl,
  caption: i.caption,
  sortOrder: i.sortOrder,
});

export const toRoomType = (rt: RoomTypeWithDetails): RoomType => ({
  id: rt.roomTypeId,
  hotelId: rt.hotelId,
  name: rt.name,
  description: rt.description,
  maxOccupancy: rt.maxOccupancy,
  areaSqm: toNumber(rt.baseAreaSqm),
  // Every room type is created with its base price row, in the same insert.
  basePrice: toNumber(rt.prices[0].pricePerNight),
  beds: rt.roomTypeBeds.map((b) => ({
    bedTypeId: b.bedTypeId,
    name: b.bedType.name,
    quantity: b.quantity,
  })),
  amenities: rt.roomTypeAmenities.map((a) => toAmenity(a.amenity)),
  images: rt.roomTypeImages.map(toRoomTypeImage),
  roomCount: rt._count.rooms,
});

export const toRoom = (r: RoomRow): Room => ({
  id: r.roomId,
  roomTypeId: r.roomTypeId,
  roomNumber: r.roomNumber,
  floor: r.floor,
  status: r.status,
  notes: r.notes,
});
