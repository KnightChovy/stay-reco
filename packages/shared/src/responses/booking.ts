import { z } from 'zod';
import { BookingStatus, DayOfWeek, PaymentStatus, PriceAdjustmentType, PriceRuleType, RoomStatus } from '../enums';
import { CHANGE_REQUEST_STATUSES } from '../schemas/booking';
import {
  amenityResponseSchema,
  cancellationPolicyResponseSchema,
  hotelImageResponseSchema,
  lateCheckoutPolicyResponseSchema,
  roomTypeImageResponseSchema,
} from './hotel';
import { isoDateTime, responseSchemas } from './registry';

/**
 * Content of `data` returned by the search, booking and pricing endpoints (the envelope is `APIResponse<T>`).
 * Money is a number with at most 2 decimals, `YYYY-MM-DD` for calendar dates, ISO 8601 UTC for instants.
 * Rules behind the numbers: docs/money-rules.md.
 */

const calendarDate = () => z.iso.date();

// ── Pricing rules and availability (partner) ────────────────

export const pricingRuleResponseSchema = z
  .object({
    id: z.uuid(),
    roomTypeId: z.uuid(),
    name: z.string(),
    ruleType: z.enum(PriceRuleType),
    adjustmentType: z.enum(PriceAdjustmentType),
    adjustmentValue: z.number(),
    validFrom: calendarDate().nullable(),
    validTo: calendarDate().nullable(),
    dayOfWeek: z.enum(DayOfWeek).nullable(),
    minDaysBefore: z.number().int().nullable(),
    maxDaysBefore: z.number().int().nullable(),
    priority: z.number().int(),
    isActive: z.boolean(),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'PricingRule' });
export type PricingRule = z.infer<typeof pricingRuleResponseSchema>;

export const pricePreviewResponseSchema = z
  .object({
    date: calendarDate(),
    bookedOn: calendarDate(),
    basePrice: z.number(),
    rule: z
      .object({ id: z.uuid(), name: z.string() })
      .nullable()
      .describe('The rule that set the price; null when the base price applies.'),
    price: z.number(),
  })
  .register(responseSchemas, { id: 'PricePreview' });
export type PricePreview = z.infer<typeof pricePreviewResponseSchema>;

export const availabilityDayResponseSchema = z
  .object({
    roomTypeId: z.uuid(),
    date: calendarDate(),
    totalRooms: z.number().int().describe('Physical rooms of the type not locked for maintenance.'),
    booked: z.number().int(),
    held: z.number().int().describe('Nights held for bookings waiting for payment.'),
    closed: z.number().int().describe('Rooms taken off sale by the partner.'),
    onSale: z.number().int().describe('totalRooms − booked − held − closed.'),
  })
  .register(responseSchemas, { id: 'AvailabilityDay' });
export type AvailabilityDay = z.infer<typeof availabilityDayResponseSchema>;

// ── Search and listings (public) ────────────────────────────

export const hotelSearchResultResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    city: z.string(),
    address: z.string(),
    starRating: z.number().int().nullable(),
    coverImageUrl: z.url().nullable(),
    latitude: z.number().nullable(),
    longitude: z.number().nullable(),
    rating: z.number().nullable().describe('Guest rating; null until reviews exist (phase 4).'),
    nights: z.number().int(),
    fromTotal: z.number().describe('Cheapest total for the whole stay and the requested rooms.'),
    freeCancellation: z.boolean(),
  })
  .register(responseSchemas, { id: 'HotelSearchResult' });
export type HotelSearchResult = z.infer<typeof hotelSearchResultResponseSchema>;

const nightlyPriceResponseSchema = z.object({ date: calendarDate(), price: z.number() });

export const roomTypeOfferResponseSchema = z
  .object({
    available: z.number().int().describe('Rooms of this type free on every night of the stay.'),
    fitsGuests: z.boolean(),
    nightlyPrices: z.array(nightlyPriceResponseSchema),
    perRoomTotal: z.number(),
    total: z.number().describe('perRoomTotal × rooms.'),
    freeCancellationUntil: isoDateTime().nullable().describe('null: no free cancellation.'),
    cancellationFeePercent: z.number(),
  })
  .register(responseSchemas, { id: 'RoomTypeOffer' });
export type RoomTypeOffer = z.infer<typeof roomTypeOfferResponseSchema>;

export const roomTypeListingResponseSchema = z
  .object({
    roomType: z.object({
      id: z.uuid(),
      name: z.string(),
      description: z.string().nullable(),
      maxOccupancy: z.number().int(),
      areaSqm: z.number(),
      beds: z.array(z.object({ bedTypeId: z.uuid(), name: z.string(), quantity: z.number().int() })),
      amenities: z.array(amenityResponseSchema),
      images: z.array(roomTypeImageResponseSchema),
    }),
    offer: roomTypeOfferResponseSchema.nullable().describe('null when the request has no dates.'),
  })
  .register(responseSchemas, { id: 'RoomTypeListing' });
export type RoomTypeListing = z.infer<typeof roomTypeListingResponseSchema>;

export const hotelListingResponseSchema = z
  .object({
    hotel: z.object({
      id: z.uuid(),
      name: z.string(),
      description: z.string().nullable(),
      address: z.string(),
      city: z.string(),
      country: z.string(),
      latitude: z.number().nullable(),
      longitude: z.number().nullable(),
      starRating: z.number().int().nullable(),
      phone: z.string().nullable(),
      website: z.url().nullable(),
      checkInTime: z.string().nullable(),
      checkOutTime: z.string().nullable(),
      amenities: z.array(amenityResponseSchema),
      images: z.array(hotelImageResponseSchema),
      policies: z.record(z.string(), z.string()),
      cancellationPolicy: cancellationPolicyResponseSchema,
      lateCheckoutPolicy: lateCheckoutPolicyResponseSchema.nullable().describe('null: no late check-out fee.'),
    }),
    roomTypes: z.array(roomTypeListingResponseSchema),
  })
  .register(responseSchemas, { id: 'HotelListing' });
export type HotelListing = z.infer<typeof hotelListingResponseSchema>;

// ── Bookings ────────────────────────────────────────────────

export const bookingSummaryResponseSchema = z
  .object({
    id: z.uuid(),
    code: z.string().describe('SR-YYMMDD-XXXX, also the bank transfer content.'),
    status: z.enum(BookingStatus),
    paymentStatus: z.enum(PaymentStatus),
    hotel: z.object({ id: z.uuid(), name: z.string(), city: z.string(), coverImageUrl: z.url().nullable() }),
    roomType: z.object({ id: z.uuid(), name: z.string() }),
    checkIn: calendarDate(),
    checkOut: calendarDate(),
    nights: z.number().int(),
    rooms: z.number().int(),
    guests: z.number().int(),
    totalAmount: z.number(),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'BookingSummary' });
export type BookingSummary = z.infer<typeof bookingSummaryResponseSchema>;

export const bookingPaymentResponseSchema = z
  .object({
    method: z.literal('SEPAY'),
    bankName: z.string(),
    accountNumber: z.string(),
    accountName: z.string(),
    amount: z.number(),
    transferContent: z.string().describe('Must be copied exactly; it is the booking code.'),
    qrImageUrl: z.url().describe('VietQR image with the amount and the content filled in.'),
    expiresAt: isoDateTime().describe('End of the 15-minute hold.'),
  })
  .register(responseSchemas, {
    id: 'BookingPayment',
    description: 'What the payment page shows while the booking is PENDING.',
  });
export type BookingPayment = z.infer<typeof bookingPaymentResponseSchema>;

export const bookingResponseSchema = bookingSummaryResponseSchema
  .extend({
    guestName: z.string(),
    contactPhone: z.string(),
    arrivalTime: z.string().nullable().describe('"HH:mm", start of the one-hour arrival window.'),
    specialRequests: z.string().nullable(),
    nightlyPrices: z.array(nightlyPriceResponseSchema).describe('Prices fixed at booking time.'),
    cancellation: z.object({
      freeUntil: isoDateTime().nullable().describe('null: no free cancellation.'),
      feePercent: z.number(),
    }),
    holdExpiresAt: isoDateTime().nullable().describe('Set while PENDING.'),
    paidAt: isoDateTime().nullable(),
    payment: bookingPaymentResponseSchema.nullable().describe('Set while PENDING.'),
    refund: z
      .object({ status: z.enum(PaymentStatus), amount: z.number() })
      .nullable()
      .describe('Set once the customer has cancelled with money to refund.'),
    refundRejection: z
      .object({ reason: z.string(), at: isoDateTime() })
      .nullable()
      .describe('Set when the hotel rejected the latest refund request; the booking stays CONFIRMED.'),
    cancelReason: z.string().nullable(),
    cancelledAt: isoDateTime().nullable(),
    assignedRooms: z
      .array(z.object({ id: z.uuid(), roomNumber: z.string() }))
      .describe(
        'Rooms of the stay: held at booking, replaced by the rooms assigned at check-in. Empty for the customer before check-in.',
      ),
    changeRequest: z
      .object({
        status: z.enum(CHANGE_REQUEST_STATUSES),
        changes: z.object({
          guestName: z.string().optional(),
          contactPhone: z.string().optional(),
          arrivalTime: z.string().nullable().optional(),
          specialRequests: z.string().nullable().optional(),
        }),
        requestedAt: isoDateTime(),
        decidedAt: isoDateTime().nullable(),
        reason: z.string().nullable().describe('Set when the hotel rejected the request.'),
      })
      .nullable()
      .describe('The latest request to change guest details (UC25), null when there was none.'),
    lateCheckout: z
      .object({
        minutesLate: z.number().int().describe('After the check-out time of the check-out date.'),
        computedFee: z.number().describe('Under the hotel policy at check-out; 0 when it has none.'),
        fee: z.number().describe('Charged at the front desk; below computedFee when staff lowered it.'),
        reason: z.string().nullable().describe('Why staff lowered the fee.'),
      })
      .nullable()
      .describe(
        'Set when the guest checked out after the check-out time and its grace period. The fee is collected at the front desk, not through StayReco (decision L5).',
      ),
    timeline: z.array(z.object({ at: isoDateTime(), event: z.string() })),
  })
  .register(responseSchemas, { id: 'Booking' });
export type Booking = z.infer<typeof bookingResponseSchema>;

export const roomOptionResponseSchema = z
  .object({ id: z.uuid(), roomNumber: z.string(), status: z.enum(RoomStatus) })
  .register(responseSchemas, { id: 'RoomOption' });
export type RoomOption = z.infer<typeof roomOptionResponseSchema>;

export const roomOptionsResponseSchema = z
  .object({
    held: z.array(roomOptionResponseSchema).describe('Rooms the booking holds now.'),
    available: z
      .array(roomOptionResponseSchema)
      .describe('Other rooms of the booked type, AVAILABLE and free on every remaining night.'),
  })
  .register(responseSchemas, { id: 'RoomOptions', description: 'Rooms to assign at check-in (UC38, BR-10).' });
export type RoomOptions = z.infer<typeof roomOptionsResponseSchema>;

export const checkOutQuoteResponseSchema = z
  .object({
    scheduledAt: isoDateTime().describe('The check-out date at the hotel check-out time (12:00 when not set).'),
    early: z.boolean().describe('Leaving before the check-out date: the nights from today on are released, no refund.'),
    releasedNights: z.array(calendarDate()).describe('Nights released by checking out now.'),
    minutesLate: z.number().int().describe('After `scheduledAt`; 0 when not late.'),
    lateFee: z
      .object({
        amount: z.number().describe('Whole dong, to collect at the front desk.'),
        percent: z
          .number()
          .int()
          .describe('Of the night price: the rate of the departure time, plus the full rate for each later day.'),
        nightPrice: z.number().describe('Last night price × rooms, fixed at booking.'),
      })
      .nullable()
      .describe('null: within the grace period, not late, or the hotel has no late check-out policy.'),
    amountPaid: z.number(),
  })
  .register(responseSchemas, {
    id: 'CheckOutQuote',
    description: 'What checking out now means (UC39, decisions L2–L6); the fee is computed again at check-out.',
  });
export type CheckOutQuote = z.infer<typeof checkOutQuoteResponseSchema>;

export const bookingVoucherResponseSchema = z
  .object({
    code: z.string(),
    hotelName: z.string(),
    roomTypeName: z.string(),
    checkIn: calendarDate(),
    checkOut: calendarDate(),
    rooms: z.number().int(),
    guests: z.number().int(),
    guestName: z.string(),
    amountPaid: z.number(),
    qrToken: z
      .string()
      .describe('Render as a QR code: the booking code plus a signature the hotel checks at check-in.'),
  })
  .register(responseSchemas, {
    id: 'BookingVoucher',
    description: 'E-voucher of a confirmed booking (UC23), shown at check-in.',
  });
export type BookingVoucher = z.infer<typeof bookingVoucherResponseSchema>;

export const cancellationQuoteResponseSchema = z
  .object({
    freeUntil: isoDateTime().nullable().describe('End of free cancellation fixed on the booking; null: none.'),
    feePercent: z.number(),
    paid: z.number(),
    fee: z.number().describe('0 before `freeUntil`, otherwise `feePercent` of `paid`.'),
    refund: z.number().describe('paid − fee (BR-08).'),
    needsApproval: z.boolean().describe('false when refund = 0: the booking is cancelled at once.'),
  })
  .register(responseSchemas, {
    id: 'CancellationQuote',
    description: 'What cancelling now would cost (MSG11), shown before the customer confirms.',
  });
export type CancellationQuote = z.infer<typeof cancellationQuoteResponseSchema>;

// ── Payments ────────────────────────────────────────────────

export const sepayWebhookResultResponseSchema = z
  .object({
    outcome: z
      .enum(['CONFIRMED', 'DUPLICATE', 'IGNORED_OUTGOING', 'UNMATCHED', 'LATE'])
      .describe('UNMATCHED and LATE transfers are kept in the audit log for manual handling.'),
  })
  .register(responseSchemas, {
    id: 'SepayWebhookResult',
    description: 'What the backend did with one SePay notification; SePay only reads `success`.',
  });
export type SepayWebhookResult = z.infer<typeof sepayWebhookResultResponseSchema>;
