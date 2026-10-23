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
 * The base price of a room type is its `BASE` price row (decision D3). Pricing rules are other rows of the same room
 * type; early-bird and last-minute rules also have no dates, so the rule type is what tells them apart.
 */
export const basePriceWhere = {
  roomId: null,
  ruleType: 'BASE',
} satisfies Prisma.PriceWhereInput;

/** Fields of a new base price row. */
export const basePriceRow = (pricePerNight: number) =>
  ({
    name: BASE_PRICE_NAME,
    ruleType: 'BASE',
    pricePerNight,
  }) satisfies Partial<Prisma.PriceCreateWithoutRoomTypeInput>;

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
  // The API creates the base price row with the room type; a type inserted another way may lack it, and one such
  // row must not break the whole list.
  basePrice: toNumber(rt.prices[0]?.pricePerNight ?? null),
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
