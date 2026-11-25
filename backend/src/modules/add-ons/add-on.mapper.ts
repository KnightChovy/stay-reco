import type { BookingAddOn, HotelAddOn } from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import type { Prisma } from '../../generated/prisma/client';

export const toHotelAddOn = (
  a: Prisma.HotelAddOnGetPayload<object>,
): HotelAddOn => ({
  id: a.hotelAddOnId,
  name: a.name,
  description: a.description,
  price: toNumber(a.price),
  timing: a.timing,
  prebookable: a.prebookable,
  isActive: a.isActive,
  createdAt: a.createdAt.toISOString(),
});

/** The add-on lines of a booking, oldest first, then by name (lines booked together share their time). */
export const bookingAddOnsInclude = {
  orderBy: [{ createdAt: 'asc' }, { name: 'asc' }, { bookingAddOnId: 'asc' }],
  include: { hotelAddOn: { select: { timing: true } } },
} satisfies Prisma.Booking$addOnsArgs;

export type BookingAddOnRow = Prisma.BookingAddOnGetPayload<{
  include: { hotelAddOn: { select: { timing: true } } };
}>;

export const toBookingAddOn = (l: BookingAddOnRow): BookingAddOn => ({
  id: l.bookingAddOnId,
  addOnId: l.hotelAddOnId,
  name: l.name,
  timing: l.hotelAddOn.timing,
  unitPrice: toNumber(l.unitPrice),
  quantity: l.quantity,
  amount: toNumber(l.amount),
  payment: l.payment,
  createdAt: l.createdAt.toISOString(),
});
