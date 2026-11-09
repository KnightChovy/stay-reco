import type {
  Booking,
  BookingItem,
  BookingPayment,
  BookingSummary,
} from '@stayreco/shared';
import { daysBetween } from '@stayreco/shared';
import { toCalendarDate } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import type { Prisma } from '../../generated/prisma/client';
import { fromTime } from '../hotels/hotel.mapper';
import type { BookingHistory } from './booking-history';

/** The items of a booking in room type name order: the first one fills the deprecated single-type fields. */
export const bookingItemsInclude = {
  orderBy: [{ roomType: { name: 'asc' } }, { bookingItemId: 'asc' }],
  include: { roomType: { select: { roomTypeId: true, name: true } } },
} satisfies Prisma.Booking$itemsArgs;

/** What a booking card needs (my trips, the hotel's booking list). */
export const bookingSummaryInclude = {
  invoice: true,
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
  items: bookingItemsInclude,
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

/** `booking_item.nightly_prices`: the price of each night for one room, fixed at booking time (BR-09). */
export type NightlyPrices = { date: string; price: number }[];

/** A room of the stay with its room type, for `assignedRooms`. */
export interface AssignedRoom {
  id: string;
  roomNumber: string;
  roomTypeId: string;
}

/** Rooms over every item of a booking. */
export const roomsOf = (items: { numRooms: number }[]) =>
  items.reduce((n, i) => n + i.numRooms, 0);

const toItem = (i: BookingSummaryRow['items'][number]): BookingItem => ({
  roomType: { id: i.roomType.roomTypeId, name: i.roomType.name },
  rooms: i.numRooms,
  subtotal: toNumber(i.subtotal),
  nightlyPrices: i.nightlyPrices as NightlyPrices,
});

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
  const items = b.items.map(toItem);
  const rooms = roomsOf(b.items);
  return {
    id: b.bookingId,
    code: invoice.invoiceNumber,
    status: b.status,
    paymentStatus: invoice.paymentStatus,
    hotel: {
      id: b.hotel.hotelId,
      name: b.hotel.name,
      city: b.hotel.city,
      coverImageUrl: b.hotel.hotelImages[0]?.imageUrl ?? null,
    },
    items,
    roomType: items[0].roomType,
    checkIn,
    checkOut,
    nights: daysBetween(checkIn, checkOut),
    rooms,
    guests: b.numGuests ?? rooms,
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
  history: BookingHistory,
  assignedRooms: AssignedRoom[],
): Booking {
  const { cancelRequest, rejection, changeRequest, lateCheckout } = history;
  const invoice = b.invoice!;
  const summary = toBookingSummary(b);
  const totalAmount = summary.totalAmount;
  const holdExpiresAt =
    b.status === 'PENDING' ? (b.roomCalendars[0]?.holdExpiresAt ?? null) : null;

  const timeline = [{ at: b.createdAt, event: 'CREATED' }];
  // Bookings paid or expired before those events were recorded (O15) show them from their columns.
  const recorded = new Set(history.events.map((e) => e.event));
  if (invoice.paidAt && !recorded.has('PAID'))
    timeline.push({ at: invoice.paidAt, event: 'PAID' });
  if (b.status === 'EXPIRED' && !recorded.has('EXPIRED'))
    timeline.push({ at: b.updatedAt, event: 'EXPIRED' });
  timeline.push(...history.events);
  if (b.cancelledAt) timeline.push({ at: b.cancelledAt, event: 'CANCELLED' });
  timeline.sort((x, y) => x.at.getTime() - y.at.getTime());

  return {
    ...summary,
    guestName: b.guestName,
    contactPhone: b.contactPhone,
    arrivalTime: fromTime(b.arrivalTime),
    specialRequests: b.specialRequests,
    nightlyPrices: summary.items[0].nightlyPrices,
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
    refundRejection:
      rejection && invoice.paymentStatus === 'PAID'
        ? { reason: rejection.reason, at: rejection.at.toISOString() }
        : null,
    cancelReason: cancelRequest?.reason ?? null,
    cancelledAt: b.cancelledAt?.toISOString() ?? null,
    assignedRooms,
    changeRequest: changeRequest && {
      status: changeRequest.status,
      changes: changeRequest.changes,
      requestedAt: changeRequest.requestedAt.toISOString(),
      decidedAt: changeRequest.decidedAt?.toISOString() ?? null,
      reason: changeRequest.reason,
    },
    lateCheckout,
    timeline: timeline.map((t) => ({ at: t.at.toISOString(), event: t.event })),
  };
}
