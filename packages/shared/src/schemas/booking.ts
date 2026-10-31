import { z } from 'zod';
import { BookingStatus, PaymentStatus } from '../enums';
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
  cancelReasonMax: 500,
  /** Staff note when forwarding a refund request, and the partner's reason when rejecting one. */
  refundNoteMax: 500,
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
const rooms = (coerce: boolean) => (coerce ? z.coerce.number() : z.number()).int().min(1).max(BOOKING_LIMITS.maxRooms);

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

/**
 * My trips tabs: `upcoming` = PENDING and CONFIRMED (not checked in yet), `staying` = CHECKED_IN, `completed` =
 * COMPLETED and NO_SHOW (past stays), `cancelled` = CANCELLED and EXPIRED.
 */
export const MY_BOOKING_TABS = ['upcoming', 'staying', 'completed', 'cancelled'] as const;

/** `GET /me/bookings`: `search` matches the booking code; newest first. */
export const myBookingsQuerySchema = listQuerySchema.omit({ sort: true }).extend({
  tab: z.enum(MY_BOOKING_TABS).default('upcoming'),
});
export type MyBookingsQuery = z.infer<typeof myBookingsQuerySchema>;

/** `POST /bookings/:id/cancel`: the reason is required (slide 08) and shown to the hotel. */
export const cancelBookingSchema = z.strictObject({
  reason: z.string().trim().min(1).max(BOOKING_LIMITS.cancelReasonMax),
});
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

// ── Bookings of a hotel and refund decisions (partner, staff) ─

export const HOTEL_BOOKING_SORTS = ['check-in-asc', 'check-in-desc', 'created-desc'] as const;

/**
 * `GET /hotels/:hotelId/bookings` (UC57). `status` and `paymentStatus` may be repeated; `search` matches the booking
 * code or the guest name. The refund queue is `?paymentStatus=REFUND_PENDING`.
 */
export const hotelBookingsQuerySchema = listQuerySchema
  .omit({ sort: true })
  .extend({
    status: repeatedQuery(z.enum(BookingStatus)).optional(),
    paymentStatus: repeatedQuery(z.enum(PaymentStatus)).optional(),
    /** `PENDING`: bookings with a change request waiting for the hotel (phase 3). */
    changeRequest: z.enum(['PENDING']).optional(),
    checkInFrom: dateSchema.optional(),
    checkInTo: dateSchema.optional(),
    sort: z.enum(HOTEL_BOOKING_SORTS).default('check-in-asc'),
  })
  .superRefine((v, ctx) => {
    if (v.checkInFrom && v.checkInTo && v.checkInTo < v.checkInFrom) {
      ctx.addIssue({ code: 'custom', path: ['checkInTo'], message: 'checkInTo must not be before checkInFrom' });
    }
  });
export type HotelBookingsQuery = z.infer<typeof hotelBookingsQuerySchema>;

/** `POST /bookings/:id/forward-refund` (staff with REFUND): what the staff checked, for the partner. */
export const forwardRefundSchema = z.strictObject({
  note: z.string().trim().min(1).max(BOOKING_LIMITS.refundNoteMax),
});
export type ForwardRefundInput = z.infer<typeof forwardRefundSchema>;

/** `POST /bookings/:id/reject-refund` (owner): one of the BR-20 reasons, sent to the customer. */
export const rejectRefundSchema = z.strictObject({
  reason: z.string().trim().min(1).max(BOOKING_LIMITS.refundNoteMax),
});
export type RejectRefundInput = z.infer<typeof rejectRefundSchema>;

// ── Front desk (staff with FRONT_DESK, the owner) ───────────

/**
 * `GET /hotels/:hotelId/bookings/lookup` (UC37): the code typed at the desk (dashes optional) or the token read from
 * the voucher QR, exactly one of them.
 */
export const bookingLookupQuerySchema = z
  .object({
    code: z.string().trim().min(1).max(50).optional(),
    qrToken: z.string().trim().min(1).max(200).optional(),
  })
  .superRefine((v, ctx) => {
    if ((v.code === undefined) === (v.qrToken === undefined)) {
      ctx.addIssue({ code: 'custom', path: ['code'], message: 'send either code or qrToken' });
    }
  });
export type BookingLookupQuery = z.infer<typeof bookingLookupQuerySchema>;

/**
 * `POST /bookings/:id/check-in` (UC36, BR-10): `roomIds` (as many as the booking's rooms, all different) replaces the
 * rooms held at booking; without it the held rooms are used.
 */
export const checkInSchema = z.strictObject({
  roomIds: z
    .array(z.uuid())
    .min(1)
    .max(BOOKING_LIMITS.maxRooms)
    .refine((ids) => new Set(ids).size === ids.length, 'rooms must be different')
    .optional(),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

/**
 * `POST /bookings/:id/check-out` (UC39, decisions L4–L6): without `lateFee` the fee computed under the hotel policy is
 * recorded; `lateFee` lowers it (never above the computed fee), always with a reason.
 */
export const checkOutSchema = z.strictObject({
  lateFee: z
    .strictObject({
      amount: z.number().int().min(0),
      reason: z.string().trim().min(1).max(BOOKING_LIMITS.refundNoteMax),
    })
    .optional(),
});
export type CheckOutInput = z.infer<typeof checkOutSchema>;

// ── Change requests (UC25, UC43) ────────────────────────────

export const CHANGE_REQUEST_STATUSES = ['PENDING', 'ACCEPTED', 'REJECTED'] as const;
export type ChangeRequestStatus = (typeof CHANGE_REQUEST_STATUSES)[number];

/**
 * `POST /bookings/:id/change-request` (the customer who booked): only details that do not change the price (BR-09);
 * `null` clears `arrivalTime` or `specialRequests`. At least one field.
 */
export const changeRequestSchema = z
  .strictObject({
    guestName: z.string().trim().min(1).max(BOOKING_LIMITS.guestNameMax).optional(),
    contactPhone: phoneSchema.optional(),
    arrivalTime: timeSchema.nullable().optional(),
    specialRequests: z.string().trim().max(BOOKING_LIMITS.specialRequestsMax).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'send at least one field to change');
export type ChangeRequestInput = z.infer<typeof changeRequestSchema>;

/** `POST /bookings/:id/reject-change` (BOOKING staff, the owner): the reason is sent to the customer. */
export const rejectChangeSchema = z.strictObject({
  reason: z.string().trim().min(1).max(BOOKING_LIMITS.refundNoteMax),
});
export type RejectChangeInput = z.infer<typeof rejectChangeSchema>;
