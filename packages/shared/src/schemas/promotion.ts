import { z } from 'zod';
import { DiscountType } from '../enums';
import { addOnLinesSchema } from './add-on';
import { BOOKING_LIMITS, bookingItemInputSchema, bookingItemsOf } from './booking';
import { dateSchema, listQuerySchema, moneySchema } from './common';

/**
 * How much a campaign takes off. `PERCENTAGE` is 0-100 and is capped by the voucher's `maxDiscount`;
 * `FIXED_AMOUNT` is an amount in dong. Either way the final price never goes below 0 (money-rules §2.1).
 */
export const discountValueSchema = z.number().positive().max(999_999_999_999.99);

const campaignFields = {
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  discountType: z.enum(DiscountType),
  discountValue: discountValueSchema,
  /** The stay total must reach this before the campaign applies; no minimum when left out. */
  minBookingAmount: moneySchema.optional(),
  /** How many bookings may use it in total; unlimited when left out. */
  maxUses: z.number().int().positive().max(1_000_000).optional(),
  validFrom: dateSchema.optional(),
  validTo: dateSchema.optional(),
  isActive: z.boolean().optional(),
};

/** The terms a campaign is checked on: what a request sends, or the stored campaign with a change applied. */
export interface CampaignTerms {
  discountType?: string;
  discountValue?: number;
  validFrom?: string | null;
  validTo?: string | null;
}

/**
 * What is wrong with a campaign's terms; empty when nothing is. A percentage over 100 would make the discount larger
 * than the stay, and a campaign that ends before it starts can never apply.
 *
 * Exported because a `PATCH` sends only the fields it changes: `{ discountValue: 500 }` is a fine amount on its own
 * and a 500 % discount on a `PERCENTAGE` campaign, so the backend runs this again on the stored campaign merged with
 * the change.
 */
export function campaignProblems(v: CampaignTerms): { field: string; message: string }[] {
  const problems: { field: string; message: string }[] = [];
  if (v.discountType === 'PERCENTAGE' && v.discountValue !== undefined && v.discountValue > 100) {
    problems.push({ field: 'discountValue', message: 'a percentage is at most 100' });
  }
  if (v.validFrom && v.validTo && v.validFrom > v.validTo) {
    problems.push({ field: 'validTo', message: 'validTo must not be before validFrom' });
  }
  return problems;
}

const checkCampaign = (v: CampaignTerms, ctx: z.RefinementCtx) => {
  for (const p of campaignProblems(v)) {
    ctx.addIssue({ code: 'custom', path: [p.field], message: p.message });
  }
};

/** `POST /hotels/:hotelId/promotions`: the hotel starts a campaign. */
export const createPromotionSchema = z.strictObject(campaignFields).superRefine(checkCampaign);
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

/** `PATCH /promotions/:id`: change a campaign. Its past uses are never rewritten. */
export const updatePromotionSchema = z
  .strictObject(campaignFields)
  .partial()
  .superRefine(checkCampaign)
  .refine((v) => Object.keys(v).length > 0, 'at least one field must be given');
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;

/** `GET /hotels/:hotelId/promotions`: `active=true` keeps the campaigns that can be used right now. */
export const promotionListQuerySchema = listQuerySchema.omit({ sort: true }).extend({
  active: z.stringbool().optional(),
});
export type PromotionListQuery = z.infer<typeof promotionListQuerySchema>;

/** `POST /promotions/:id/vouchers`: hands personal codes to customers of a campaign. */
export const issueVouchersSchema = z.strictObject({
  customerIds: z.array(z.uuid()).min(1).max(100),
  /** Caps a percentage discount in dong; no cap when left out. */
  maxDiscount: moneySchema.optional(),
  expiresAt: dateSchema.optional(),
});
export type IssueVouchersInput = z.infer<typeof issueVouchersSchema>;

/**
 * `POST /bookings/discount-quote`: what a stay would cost with the discounts applied, before the customer commits.
 * The same stay fields as `POST /bookings`, plus the typed code: `items` (1–5 room types of one hotel, at most 8 rooms
 * in total), or the older `roomTypeId` with `rooms`, never both. Sent on every keystroke-free "Apply" click, so it
 * holds nothing and changes nothing.
 */
export const discountQuoteSchema = z
  .strictObject({
    items: z
      .array(bookingItemInputSchema)
      .min(1)
      .max(BOOKING_LIMITS.maxItems)
      .refine((items) => new Set(items.map((i) => i.roomTypeId)).size === items.length, 'room types must be different')
      .optional(),
    /** @deprecated send `items`. */
    roomTypeId: z.uuid().optional(),
    /** @deprecated send `items`; 1 when left out. */
    rooms: z.number().int().min(1).max(BOOKING_LIMITS.maxRooms).optional(),
    checkIn: dateSchema,
    checkOut: dateSchema,
    /** The code the customer typed; left out to see the automatic campaigns only. */
    code: z.string().trim().min(1).max(50).optional(),
    /** Loyalty points to spend on top of the discount; capped at the balance and at what the stay still owes. */
    pointsToUse: z.number().int().min(0).max(100_000_000).optional(),
    /** Add-ons to book with the stay; added to `expectedTotal`, never discounted. */
    addOns: addOnLinesSchema.optional(),
  })
  .superRefine((v, ctx) => {
    if (v.items && (v.roomTypeId || v.rooms !== undefined)) {
      ctx.addIssue({ code: 'custom', path: ['items'], message: 'send either items or roomTypeId with rooms' });
      return;
    }
    if (!v.items && !v.roomTypeId) {
      ctx.addIssue({ code: 'custom', path: ['items'], message: 'Required' });
      return;
    }
    const total = bookingItemsOf(v).reduce((n, i) => n + i.rooms, 0);
    if (total > BOOKING_LIMITS.maxRooms) {
      ctx.addIssue({ code: 'custom', path: ['items'], message: `at most ${BOOKING_LIMITS.maxRooms} rooms in total` });
    }
  });
export type DiscountQuoteInput = z.infer<typeof discountQuoteSchema>;
