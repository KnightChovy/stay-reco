import { z } from 'zod';
import { DiscountType } from '../enums';
import { pointsQuoteResponseSchema } from './loyalty';
import { isoDateTime, responseSchemas } from './registry';

/** Promotions and vouchers (BR-06): what takes money off a stay before it is paid. */

export const promotionResponseSchema = z
  .object({
    id: z.uuid(),
    hotelId: z.uuid().nullable().describe('null for a campaign the platform runs across every hotel.'),
    name: z.string(),
    description: z.string().nullable(),
    discountType: z.enum(DiscountType),
    discountValue: z.number(),
    minBookingAmount: z.number().nullable(),
    maxUses: z.number().int().nullable(),
    currentUses: z.number().int(),
    validFrom: z.string().nullable().describe('"YYYY-MM-DD"; null means no start date.'),
    validTo: z.string().nullable(),
    isActive: z.boolean().describe('Switched on by the hotel; it still has to be inside its dates and have uses left.'),
    usable: z.boolean().describe('Computed: active, inside its dates and not out of uses, so a booking today could use it.'),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'Promotion' });
export type Promotion = z.infer<typeof promotionResponseSchema>;

export const voucherResponseSchema = z
  .object({
    id: z.uuid(),
    code: z.string(),
    promotionId: z.uuid(),
    promotionName: z.string(),
    hotelId: z.uuid().nullable(),
    discountType: z.enum(DiscountType),
    discountValue: z.number(),
    maxDiscount: z.number().nullable().describe('Caps a percentage discount, in dong; null when uncapped.'),
    minBookingAmount: z.number().nullable(),
    usedAt: isoDateTime().nullable(),
    expiresAt: isoDateTime().nullable(),
    usable: z.boolean().describe('Computed: not used, not expired, and its campaign is still usable.'),
    createdAt: isoDateTime(),
  })
  .register(responseSchemas, { id: 'Voucher' });
export type Voucher = z.infer<typeof voucherResponseSchema>;

/** The one discount that was applied, and where it came from. */
export const appliedDiscountResponseSchema = z
  .object({
    kind: z.enum(['PROMOTION', 'VOUCHER']),
    promotionId: z.uuid(),
    voucherId: z.uuid().nullable().describe('Set when the discount came from a code the customer typed.'),
    name: z.string(),
    code: z.string().nullable(),
    amount: z.number().describe('What it takes off the stay total, in whole dong.'),
  })
  .register(responseSchemas, { id: 'AppliedDiscount' });
export type AppliedDiscount = z.infer<typeof appliedDiscountResponseSchema>;

/**
 * `POST /bookings/quote-discount`: the stay total, the discount that would apply and what the customer would pay.
 * `expectedTotal` is what `POST /bookings` must be sent.
 */
export const discountQuoteResponseSchema = z
  .object({
    subtotal: z.number().describe('Sum of the nightly prices for every room, before any discount.'),
    discount: appliedDiscountResponseSchema.nullable().describe('null when nothing applies.'),
    points: pointsQuoteResponseSchema.nullable().describe('The loyalty points part; null when no programme is running.'),
    expectedTotal: z.number().describe('subtotal - discount - points, never below 0; send this to POST /bookings.'),
  })
  .register(responseSchemas, { id: 'DiscountQuote' });
export type DiscountQuote = z.infer<typeof discountQuoteResponseSchema>;
