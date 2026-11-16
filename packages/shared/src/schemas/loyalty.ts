import { z } from 'zod';
import { hasAtMost2Decimals, listQuerySchema } from './common';

/** Points a customer offers to spend on a stay; capped by the backend at the balance and at what the stay owes. */
export const pointsToUseSchema = z.number().int().min(0).max(100_000_000);

/** `GET /me/loyalty/entries`: the customer's points movements, newest first. */
export const loyaltyEntryQuerySchema = listQuerySchema.omit({
  sort: true,
  search: true,
});
export type LoyaltyEntryQuery = z.infer<typeof loyaltyEntryQuerySchema>;

/**
 * Bounds of a hotel's own rules (decisions L9, L10). A hotel may earn up to three times the platform rate and never
 * less, and may let points pay from 1 % to all of a stay after the discount.
 */
export const LOYALTY_LIMITS = { maxEarnMultiplier: 3, redeemPercent: { min: 1, max: 100 } } as const;

const hasAtMost4Decimals = (v: number) => Math.abs(v * 10_000 - Math.round(v * 10_000)) < 1e-6;

/**
 * `PUT /hotels/:hotelId/loyalty-program`: the hotel's own rules, replaced as a whole. `pointsPerCurrency` is checked
 * against the platform rate by the backend (from 1x to 3x); `isActive: false` goes back to the platform rules.
 */
export const hotelLoyaltyProgramSchema = z.strictObject({
  isActive: z.boolean(),
  pointsPerCurrency: z.number().positive().max(9999).refine(hasAtMost4Decimals, 'at most 4 decimal places'),
  acceptsPoints: z.boolean(),
  maxRedeemPercent: z
    .number()
    .min(LOYALTY_LIMITS.redeemPercent.min)
    .max(LOYALTY_LIMITS.redeemPercent.max)
    .refine(hasAtMost2Decimals, 'at most 2 decimal places'),
});
export type HotelLoyaltyProgramInput = z.infer<typeof hotelLoyaltyProgramSchema>;
