import { BadRequestException } from '@nestjs/common';
import {
  BOOKING_LIMITS,
  type CancellationPolicy,
  daysBetween,
  type RoomTypeOffer,
} from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';
import {
  addDays,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import type { StayQuote } from '../pricing/price-engine';

/** Used when the hotel has not set its check-in time (decision P4). */
export const DEFAULT_CHECK_IN_TIME = '14:00';
/** Used when the hotel has not set its check-out time (phase 3 contract): when unarrived guests become no-shows. */
export const DEFAULT_CHECK_OUT_TIME = '12:00';

export interface Stay {
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

/** What the shared schema cannot check: check-in from today up to 365 days ahead, in Vietnam time. */
export function assertBookableDates(checkIn: string, today = todayInVietnam()) {
  const message =
    checkIn < today
      ? 'checkIn must not be in the past'
      : daysBetween(today, checkIn) > BOOKING_LIMITS.maxDaysAhead
        ? `checkIn at most ${BOOKING_LIMITS.maxDaysAhead} days ahead`
        : null;
  if (message) {
    throw new BadRequestException({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: [{ field: 'checkIn', message }],
    });
  }
}

/**
 * End of free cancellation: the hotel's check-in time, N days before the check-in date (money-rules §6). Null when the
 * policy has no free period, or when that moment has already passed, so the booking would get none.
 */
export function freeCancellationUntil(
  policy: CancellationPolicy,
  checkIn: string,
  checkInTime: string | null,
  now = new Date(),
): Date | null {
  if (policy.freeCancellationDays === null) return null;
  const deadline = vietnamDateTime(
    addDays(checkIn, -policy.freeCancellationDays),
    checkInTime ?? DEFAULT_CHECK_IN_TIME,
  );
  return deadline > now ? deadline : null;
}

/** The offer of one room type for a stay: rooms free on every night, nightly prices and cancellation terms. */
export function toOffer(input: {
  stay: Stay;
  maxOccupancy: number;
  available: number;
  quote: StayQuote;
  policy: CancellationPolicy;
  checkInTime: string | null;
  now?: Date;
}): RoomTypeOffer {
  const { stay, quote, policy } = input;
  const deadline = freeCancellationUntil(
    policy,
    stay.checkIn,
    input.checkInTime,
    input.now,
  );
  return {
    available: input.available,
    fitsGuests: stay.guests <= stay.rooms * input.maxOccupancy,
    nightlyPrices: quote.nights.map((n) => ({
      date: n.date,
      price: toNumber(n.price),
    })),
    perRoomTotal: toNumber(quote.total),
    total: toNumber(quote.total.times(stay.rooms)),
    freeCancellationUntil: deadline?.toISOString() ?? null,
    cancellationFeePercent: policy.feePercent,
  };
}

/** The room type can take the whole booking: enough rooms free every night and room for every guest. */
export const isBookable = (offer: RoomTypeOffer, stay: Stay) =>
  offer.fitsGuests && offer.available >= stay.rooms;
