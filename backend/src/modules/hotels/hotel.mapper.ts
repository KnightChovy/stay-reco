import type {
  Hotel,
  HotelImage,
  HotelSummary,
  UpdateHotelInput,
} from '@stayreco/shared';
import type {
  Prisma,
  HotelImage as HotelImageRow,
} from '../../generated/prisma/client';
import { toNumber } from '../../common/http/decimal';
import { toAmenity } from '../catalog/catalog.service';

/**
 * Policies are `hotel_properties` rows without a verification request, keyed `policy.<name>` (contract D8).
 * Rows that belong to a verification request are that request's snapshot and are never read here.
 */
export const POLICY_PREFIX = 'policy.';

export const hotelInclude = {
  hotelAmenities: {
    include: { amenity: true },
    orderBy: { amenity: { name: 'asc' } },
  },
  hotelImages: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  hotelProperties: {
    where: {
      verificationRequestId: null,
      propertyKey: { startsWith: POLICY_PREFIX },
    },
    orderBy: { propertyKey: 'asc' },
  },
  // One config per hotel (contract D4), enforced in HotelsService.setRoomConfig.
  hotelRoomConfigs: { orderBy: { updatedAt: 'desc' }, take: 1 },
} satisfies Prisma.HotelInclude;

export type HotelWithDetails = Prisma.HotelGetPayload<{
  include: typeof hotelInclude;
}>;

export const hotelSummarySelect = {
  hotelId: true,
  name: true,
  city: true,
  starRating: true,
  status: true,
  hotelImages: {
    where: { isCover: true },
    take: 1,
    select: { imageUrl: true },
  },
} satisfies Prisma.HotelSelect;

type HotelSummaryRow = Prisma.HotelGetPayload<{
  select: typeof hotelSummarySelect;
}>;

/** `TIME` columns come back as a Date on 1970-01-01 UTC. */
const fromTime = (value: Date | null) =>
  value ? value.toISOString().slice(11, 16) : null;

const toTime = (value: string | null | undefined) =>
  value == null ? value : new Date(`1970-01-01T${value}:00.000Z`);

/** Maps validated create/update input to Prisma data; `undefined` fields are left untouched by Prisma. */
export function toHotelData<T extends UpdateHotelInput>(input: T) {
  const { checkInTime, checkOutTime, ...rest } = input;
  return {
    ...rest,
    checkInTime: toTime(checkInTime),
    checkOutTime: toTime(checkOutTime),
  };
}

export const toHotelImage = (i: HotelImageRow): HotelImage => ({
  id: i.hotelImageId,
  url: i.imageUrl,
  caption: i.caption,
  isCover: i.isCover,
  sortOrder: i.sortOrder,
});

export function toHotel(h: HotelWithDetails): Hotel {
  const config = h.hotelRoomConfigs[0];
  return {
    id: h.hotelId,
    name: h.name,
    description: h.description,
    address: h.address,
    city: h.city,
    country: h.country,
    latitude: toNumber(h.latitude),
    longitude: toNumber(h.longitude),
    starRating: h.starRating,
    phone: h.phone,
    email: h.email,
    website: h.website,
    checkInTime: fromTime(h.checkInTime),
    checkOutTime: fromTime(h.checkOutTime),
    status: h.status,
    amenities: h.hotelAmenities.map((ha) => toAmenity(ha.amenity)),
    images: h.hotelImages.map(toHotelImage),
    policies: Object.fromEntries(
      h.hotelProperties.map((p) => [
        p.propertyKey.slice(POLICY_PREFIX.length),
        p.propertyValue,
      ]),
    ),
    roomConfig: config
      ? { totalRooms: config.totalRooms, basePrice: toNumber(config.basePrice) }
      : null,
    createdAt: h.createdAt.toISOString(),
  };
}

export const toHotelSummary = (
  h: HotelSummaryRow,
  myRole: HotelSummary['myRole'],
): HotelSummary => ({
  id: h.hotelId,
  name: h.name,
  city: h.city,
  starRating: h.starRating,
  status: h.status,
  coverImageUrl: h.hotelImages[0]?.imageUrl ?? null,
  myRole,
});
