import { z } from 'zod';
import { DiscountType } from '../enums';
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

/** A percentage over 100 would make the discount larger than the stay, so it is refused when the campaign is saved. */
const checkCampaign = (
  v: { discountType?: string; discountValue?: number; validFrom?: string; validTo?: string },
  ctx: z.RefinementCtx,
) => {
  if (v.discountType === 'PERCENTAGE' && v.discountValue !== undefined && v.discountValue > 100) {
    ctx.addIssue({ code: 'custom', path: ['discountValue'], message: 'a percentage is at most 100' });
  }
  if (v.validFrom && v.validTo && v.validFrom > v.validTo) {
    ctx.addIssue({ code: 'custom', path: ['validTo'], message: 'validTo must not be before validFrom' });
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
 * `POST /bookings/quote-discount`: what a stay would cost with the discounts applied, before the customer commits.
 * The same stay fields as `POST /bookings`, plus the typed code. Sent on every keystroke-free "Apply" click, so it
 * holds nothing and changes nothing.
 */
export const discountQuoteSchema = z.strictObject({
  roomTypeId: z.uuid(),
  checkIn: dateSchema,
  checkOut: dateSchema,
  rooms: z.number().int().min(1).max(8).default(1),
  /** The code the customer typed; left out to see the automatic campaigns only. */
  code: z.string().trim().min(1).max(50).optional(),
  /** Loyalty points to spend on top of the discount; capped at the balance and at what the stay still owes. */
  pointsToUse: z.number().int().min(0).max(100_000_000).optional(),
});
export type DiscountQuoteInput = z.infer<typeof discountQuoteSchema>;
