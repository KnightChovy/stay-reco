import { z } from 'zod';
import { BookingStatus, DayOfWeek, PaymentStatus, PriceAdjustmentType, PriceRuleType } from '../enums';
import { amenityResponseSchema, hotelImageResponseSchema, roomTypeImageResponseSchema } from './hotel';
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

export const cancellationPolicyResponseSchema = z
  .object({
    freeCancellationDays: z.number().int().nullable().describe('null: no free-cancellation period.'),
    feePercent: z.number(),
  })
  .register(responseSchemas, { id: 'CancellationPolicy' });
export type CancellationPolicy = z.infer<typeof cancellationPolicyResponseSchema>;

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
    cancelReason: z.string().nullable(),
    cancelledAt: isoDateTime().nullable(),
    timeline: z.array(z.object({ at: isoDateTime(), event: z.string() })),
  })
  .register(responseSchemas, { id: 'Booking' });
export type Booking = z.infer<typeof bookingResponseSchema>;
