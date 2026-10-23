import type { Booking, BookingPayment, BookingSummary } from '@stayreco/shared';
import { daysBetween } from '@stayreco/shared';
import { toCalendarDate } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import type { Prisma } from '../../generated/prisma/client';
import { fromTime } from '../hotels/hotel.mapper';
import type { CancelRequest } from './cancel-request';

/** What a booking card needs (my trips, the hotel's booking list). */
export const bookingSummaryInclude = {
  invoice: true,
  roomType: {
    select: {
      roomTypeId: true,
      name: true,
      hotel: {
        select: {
          hotelId: true,
          name: true,
          city: true,
          hotelImages: {
            where: { isCover: true },
            take: 1,
            select: { imageUrl: true },
          },
        },
      },
    },
  },
} satisfies Prisma.BookingInclude;

export const bookingInclude = {
  ...bookingSummaryInclude,
  roomCalendars: {
    where: { status: 'HELD' },
    select: { holdExpiresAt: true },
    orderBy: { holdExpiresAt: 'asc' },
    take: 1,
  },
} satisfies Prisma.BookingInclude;

export type BookingSummaryRow = Prisma.BookingGetPayload<{
  include: typeof bookingSummaryInclude;
}>;

export type BookingWithDetails = Prisma.BookingGetPayload<{
  include: typeof bookingInclude;
}>;

/** `booking.nightly_prices`: the price of each night for one room, fixed at booking time (BR-09). */
export type NightlyPrices = { date: string; price: number }[];

/** Builds the payment block for a PENDING booking; `null` once it is paid, expired or cancelled. */
export type PaymentDetails = (input: {
  amount: number;
  code: string;
  expiresAt: Date;
}) => BookingPayment;

export function toBookingSummary(b: BookingSummaryRow): BookingSummary {
  const invoice = b.invoice!;
  const checkIn = toCalendarDate(b.checkInDate);
  const checkOut = toCalendarDate(b.checkOutDate);
  return {
    id: b.bookingId,
    code: invoice.invoiceNumber,
    status: b.status,
    paymentStatus: invoice.paymentStatus,
    hotel: {
      id: b.roomType.hotel.hotelId,
      name: b.roomType.hotel.name,
      city: b.roomType.hotel.city,
      coverImageUrl: b.roomType.hotel.hotelImages[0]?.imageUrl ?? null,
    },
    roomType: { id: b.roomType.roomTypeId, name: b.roomType.name },
    checkIn,
    checkOut,
    nights: daysBetween(checkIn, checkOut),
    rooms: b.numRooms,
    guests: b.numGuests ?? b.numRooms,
    totalAmount: toNumber(b.totalAmount),
    createdAt: b.createdAt.toISOString(),
  };
}

/** Invoice statuses that come from a cancellation with money to refund. */
const REFUND_STATUSES = new Set([
  'REFUND_PENDING',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
]);

export function toBooking(
  b: BookingWithDetails,
  paymentDetails: PaymentDetails,
  cancelRequest: CancelRequest | null,
): Booking {
  const invoice = b.invoice!;
  const summary = toBookingSummary(b);
  const totalAmount = summary.totalAmount;
  const holdExpiresAt =
    b.status === 'PENDING' ? (b.roomCalendars[0]?.holdExpiresAt ?? null) : null;

  const timeline = [{ at: b.createdAt, event: 'CREATED' }];
  if (invoice.paidAt) timeline.push({ at: invoice.paidAt, event: 'PAID' });
  if (b.status === 'EXPIRED')
    timeline.push({ at: b.updatedAt, event: 'EXPIRED' });
  if (cancelRequest) {
    timeline.push({ at: cancelRequest.at, event: 'CANCEL_REQUESTED' });
  }
  if (b.cancelledAt) timeline.push({ at: b.cancelledAt, event: 'CANCELLED' });
  timeline.sort((x, y) => x.at.getTime() - y.at.getTime());

  return {
    ...summary,
    guestName: b.guestName,
    contactPhone: b.contactPhone,
    arrivalTime: fromTime(b.arrivalTime),
    specialRequests: b.specialRequests,
    nightlyPrices: b.nightlyPrices as NightlyPrices,
    cancellation: {
      freeUntil: b.freeCancelUntil?.toISOString() ?? null,
      feePercent: toNumber(b.cancelFeePercent),
    },
    holdExpiresAt: holdExpiresAt?.toISOString() ?? null,
    paidAt: invoice.paidAt?.toISOString() ?? null,
    payment: holdExpiresAt
      ? paymentDetails({
          amount: totalAmount,
          code: invoice.invoiceNumber,
          expiresAt: holdExpiresAt,
        })
      : null,
    refund:
      cancelRequest && REFUND_STATUSES.has(invoice.paymentStatus)
        ? { status: invoice.paymentStatus, amount: cancelRequest.refund }
        : null,
    cancelReason: cancelRequest?.reason ?? null,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
    timeline: timeline.map((t) => ({ at: t.at.toISOString(), event: t.event })),
  };
}
