import {
  type CancellationPolicy,
  type CancellationPolicyInput,
  DEFAULT_CANCELLATION_POLICY,
  type Hotel,
  type HotelImage,
  type HotelSummary,
  type UpdateHotelInput,
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

/**
 * The cancellation policy (decision P4) is two more `hotel_properties` rows: the free-cancellation days ('' for no
 * free period) and the fee percent. Without them the default policy applies (P14).
 */
export const CANCELLATION_KEYS = {
  freeDays: 'cancellation_free_days',
  feePercent: 'cancellation_fee_percent',
} as const;

type PropertyRow = { propertyKey: string; propertyValue: string };

export function cancellationPolicyOf(rows: PropertyRow[]): CancellationPolicy {
  const value = (key: string) =>
    rows.find((r) => r.propertyKey === key)?.propertyValue;
  const freeDays = value(CANCELLATION_KEYS.freeDays);
  const feePercent = value(CANCELLATION_KEYS.feePercent);
  if (freeDays === undefined || feePercent === undefined) {
    return DEFAULT_CANCELLATION_POLICY;
  }
  return {
    freeCancellationDays: freeDays === '' ? null : Number(freeDays),
    feePercent: Number(feePercent),
  };
}

/** Select for the rows `cancellationPolicyOf` reads. */
export const cancellationRowsSelect = {
  where: {
    verificationRequestId: null,
    propertyKey: { in: Object.values(CANCELLATION_KEYS) },
  },
  select: { propertyKey: true, propertyValue: true },
} satisfies Prisma.Hotel$hotelPropertiesArgs;

export const toCancellationRows = (policy: CancellationPolicyInput) => [
  {
    propertyKey: CANCELLATION_KEYS.freeDays,
    propertyValue: policy.freeCancellationDays?.toString() ?? '',
  },
  {
    propertyKey: CANCELLATION_KEYS.feePercent,
    propertyValue: policy.feePercent.toString(),
  },
];

export const hotelInclude = {
  hotelAmenities: {
    include: { amenity: true },
    orderBy: { amenity: { name: 'asc' } },
  },
  hotelImages: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
  hotelProperties: {
    where: {
      verificationRequestId: null,
      OR: [
        { propertyKey: { startsWith: POLICY_PREFIX } },
        { propertyKey: { in: Object.values(CANCELLATION_KEYS) } },
      ],
    },
    orderBy: { propertyKey: 'asc' },
  },
  hotelRoomConfig: true,
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
export const fromTime = (value: Date | null) =>
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
  const config = h.hotelRoomConfig;
  const policyRows = h.hotelProperties.filter((p) =>
    p.propertyKey.startsWith(POLICY_PREFIX),
  );
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
      policyRows.map((p) => [
        p.propertyKey.slice(POLICY_PREFIX.length),
        p.propertyValue,
      ]),
    ),
    roomConfig: config
      ? { totalRooms: config.totalRooms, basePrice: toNumber(config.basePrice) }
      : null,
    cancellationPolicy: cancellationPolicyOf(h.hotelProperties),
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
