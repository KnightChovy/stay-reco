import { z } from 'zod';
import {
  dateSchema,
  daysBetween,
  isCalendarDate,
  listQuerySchema,
  moneySchema,
  phoneSchema,
  repeatedQuery,
  timeSchema,
} from './common';

/**
 * Limits agreed for stays and bookings (booking phase file, "Limits"). "Check-in from today, at most 365 days ahead"
 * depends on today's date in Asia/Ho_Chi_Minh, so the backend checks it.
 */
export const BOOKING_LIMITS = {
  maxNights: 30,
  maxRooms: 8,
  maxGuests: 30,
  maxDaysAhead: 365,
  holdMinutes: 15,
  guestNameMax: 100,
  specialRequestsMax: 500,
} as const;

export const HOTEL_SORTS = ['recommended', 'price-asc', 'price-desc', 'star-desc'] as const;

interface Stay {
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

const checkStay = (v: Stay, ctx: z.RefinementCtx) => {
  if (isCalendarDate(v.checkIn) && isCalendarDate(v.checkOut)) {
    const nights = daysBetween(v.checkIn, v.checkOut);
    if (nights < 1) ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'checkOut must be after checkIn' });
    else if (nights > BOOKING_LIMITS.maxNights) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: `at most ${BOOKING_LIMITS.maxNights} nights` });
    }
  }
  if (v.guests < v.rooms) {
    ctx.addIssue({ code: 'custom', path: ['guests'], message: 'at least one guest per room' });
  }
};

const guests = (coerce: boolean) =>
  (coerce ? z.coerce.number() : z.number()).int().min(1).max(BOOKING_LIMITS.maxGuests);
const rooms = (coerce: boolean) =>
  (coerce ? z.coerce.number() : z.number()).int().min(1).max(BOOKING_LIMITS.maxRooms);

// ── Search and listings (public) ────────────────────────────

/**
 * `GET /hotels`: destination and stay are required (SRS 3.3.1). `priceMin` / `priceMax` filter on the total of the
 * stay; `starRating` and `amenityIds` may be repeated.
 */
export const hotelSearchQuerySchema = listQuerySchema
  .omit({ search: true, sort: true })
  .extend({
    destination: z.string().trim().min(1).max(100),
    checkIn: dateSchema,
    checkOut: dateSchema,
    guests: guests(true),
    rooms: rooms(true).default(1),
    priceMin: z.coerce.number().min(0).optional(),
    priceMax: z.coerce.number().min(0).optional(),
    starRating: repeatedQuery(z.coerce.number().int().min(1).max(5)).optional(),
    amenityIds: repeatedQuery(z.uuid()).pipe(z.array(z.uuid()).max(20)).optional(),
    freeCancellation: z.stringbool().optional(),
    sort: z.enum(HOTEL_SORTS).default('recommended'),
  })
  .superRefine((v, ctx) => {
    checkStay(v, ctx);
    if (v.priceMin !== undefined && v.priceMax !== undefined && v.priceMin > v.priceMax) {
      ctx.addIssue({ code: 'custom', path: ['priceMax'], message: 'priceMax must not be below priceMin' });
    }
  });
export type HotelSearchQuery = z.infer<typeof hotelSearchQuerySchema>;

/**
 * `GET /hotels/:hotelId/listing`, `GET /room-types/:id/listing`. Without dates the page has no prices; with dates both
 * `checkIn` and `checkOut` are required.
 */
export const stayQuerySchema = z
  .object({
    checkIn: dateSchema.optional(),
    checkOut: dateSchema.optional(),
    guests: guests(true).default(1),
    rooms: rooms(true).default(1),
  })
  .superRefine((v, ctx) => {
    if ((v.checkIn === undefined) !== (v.checkOut === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'checkIn and checkOut must be sent together' });
      return;
    }
    if (v.checkIn !== undefined && v.checkOut !== undefined) {
      checkStay({ checkIn: v.checkIn, checkOut: v.checkOut, guests: v.guests, rooms: v.rooms }, ctx);
    }
  });
export type StayQuery = z.infer<typeof stayQuerySchema>;

// ── Bookings ────────────────────────────────────────────────

/**
 * `POST /bookings`. `expectedTotal` is the total the customer saw; if the backend prices the stay differently it
 * answers BOOKING_PRICE_CHANGED with the new total (MSG13) and the client sends it again.
 */
export const createBookingSchema = z
  .strictObject({
    roomTypeId: z.uuid(),
    checkIn: dateSchema,
    checkOut: dateSchema,
    guests: guests(false),
    rooms: rooms(false).default(1),
    guestName: z.string().trim().min(1).max(BOOKING_LIMITS.guestNameMax),
    contactPhone: phoneSchema,
    /** Start of the one-hour arrival window, e.g. "14:00". */
    arrivalTime: timeSchema.optional(),
    specialRequests: z.string().trim().max(BOOKING_LIMITS.specialRequestsMax).optional(),
    expectedTotal: moneySchema,
  })
  .superRefine(checkStay);
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
