import type { Prisma } from '../../generated/prisma/client';
import { basePriceWhere } from '../rooms/room.mapper';

/** Only these hotels are shown to customers and can be booked (BR-01): verified, and the partner not suspended. */
export const bookableHotel = {
  status: 'ACTIVE',
  hotelPartner: { status: { not: 'SUSPENDED' } },
} satisfies Prisma.HotelWhereInput;

/** A room type without a base price cannot be priced, so it is not sold. */
export const sellableRoomType = {
  prices: { some: basePriceWhere },
} satisfies Prisma.RoomTypeWhereInput;
