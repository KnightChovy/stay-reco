import { z } from 'zod';
import { DayOfWeek, PriceAdjustmentType } from '../enums';
import { dateSchema, daysBetween, hasAtMost2Decimals, isCalendarDate } from './common';

/** Limits agreed for pricing rules and the availability calendar (booking phase file, "Limits"). */
export const PRICING_LIMITS = {
  maxPriority: 100,
  percentMin: -90,
  percentMax: 300,
  seasonMaxDays: 366,
  earlyBirdMaxDays: 365,
  lastMinuteMaxDays: 30,
  availabilityMaxDays: 62,
  maxRoomsOnSale: 500,
} as const;

/** Rule types a partner creates; the BASE price is set on the room type itself. */
export const PRICING_RULE_TYPES = ['SEASON', 'EARLY_BIRD', 'LAST_MINUTE'] as const;

// ── Pricing rules ───────────────────────────────────────────

const pricingRuleFields = {
  name: z.string().trim().min(1).max(100),
  ruleType: z.enum(PRICING_RULE_TYPES),
  adjustmentType: z.enum(PriceAdjustmentType),
  adjustmentValue: z
    .number()
    .min(-999_999_999_999.99)
    .max(999_999_999_999.99)
    .refine(hasAtMost2Decimals, 'at most 2 decimal places'),
  /** Nights covered (inclusive). Required for SEASON, optional for the booking-window rules. */
  validFrom: dateSchema.nullable().optional(),
  validTo: dateSchema.nullable().optional(),
  /** Only this weekday; null or omitted for every day. */
  dayOfWeek: z.enum(DayOfWeek).nullable().optional(),
  /** EARLY_BIRD: booked at least this many days before check-in. */
  minDaysBefore: z.number().int().min(1).max(PRICING_LIMITS.earlyBirdMaxDays).nullable().optional(),
  /** LAST_MINUTE: booked at most this many days before check-in. */
  maxDaysBefore: z.number().int().min(0).max(PRICING_LIMITS.lastMinuteMaxDays).nullable().optional(),
  /** Higher wins when several rules match a night; ties go to the newest rule. */
  priority: z.number().int().min(0).max(PRICING_LIMITS.maxPriority),
  isActive: z.boolean(),
};

/** The fields `pricingRuleIssues` looks at; the backend passes the stored rule merged with a PATCH. */
export interface PricingRuleShape {
  ruleType: (typeof PRICING_RULE_TYPES)[number];
  adjustmentType: PriceAdjustmentType;
  adjustmentValue: number;
  validFrom?: string | null;
  validTo?: string | null;
  minDaysBefore?: number | null;
  maxDaysBefore?: number | null;
}

/**
 * Rules between fields of a pricing rule. Used by the create schema, and by the backend on the merged rule after a
 * PATCH (a partial body cannot be checked on its own). Whether the resulting price stays above 0 depends on the room
 * type's base price, so the backend checks that.
 */
export function pricingRuleIssues(rule: PricingRuleShape): { path: string; message: string }[] {
  const issues: { path: string; message: string }[] = [];
  const add = (path: string, message: string) => issues.push({ path, message });
  const { adjustmentType: type, adjustmentValue: value } = rule;

  if (type === 'SET_PRICE' && value <= 0) add('adjustmentValue', 'the new price must be greater than 0');
  if (type !== 'SET_PRICE' && value === 0) add('adjustmentValue', 'an adjustment of 0 changes nothing');
  if (type === 'PERCENT' && (value < PRICING_LIMITS.percentMin || value > PRICING_LIMITS.percentMax)) {
    add('adjustmentValue', `percent must be between ${PRICING_LIMITS.percentMin} and ${PRICING_LIMITS.percentMax}`);
  }

  const from = rule.validFrom ?? null;
  const to = rule.validTo ?? null;
  if ((from === null) !== (to === null)) add('validTo', 'validFrom and validTo must be sent together');
  if (isCalendarDate(from) && isCalendarDate(to)) {
    if (to < from) add('validTo', 'validTo must not be before validFrom');
    else if (daysBetween(from, to) + 1 > PRICING_LIMITS.seasonMaxDays) {
      add('validTo', `a rule covers at most ${PRICING_LIMITS.seasonMaxDays} days`);
    }
  }

  const min = rule.minDaysBefore ?? null;
  const max = rule.maxDaysBefore ?? null;
  if (rule.ruleType === 'SEASON') {
    if (from === null) add('validFrom', 'a SEASON rule needs validFrom and validTo');
    if (min !== null) add('minDaysBefore', 'only for EARLY_BIRD rules');
    if (max !== null) add('maxDaysBefore', 'only for LAST_MINUTE rules');
  }
  if (rule.ruleType === 'EARLY_BIRD') {
    if (min === null) add('minDaysBefore', 'an EARLY_BIRD rule needs minDaysBefore');
    if (max !== null) add('maxDaysBefore', 'only for LAST_MINUTE rules');
  }
  if (rule.ruleType === 'LAST_MINUTE') {
    if (max === null) add('maxDaysBefore', 'a LAST_MINUTE rule needs maxDaysBefore');
    if (min !== null) add('minDaysBefore', 'only for EARLY_BIRD rules');
  }
  return issues;
}

const reportIssues = (rule: PricingRuleShape, ctx: z.RefinementCtx) => {
  for (const { path, message } of pricingRuleIssues(rule)) {
    ctx.addIssue({ code: 'custom', path: [path], message });
  }
};

export const createPricingRuleSchema = z
  .strictObject({
    roomTypeId: z.uuid(),
    ...pricingRuleFields,
    priority: pricingRuleFields.priority.default(0),
    isActive: pricingRuleFields.isActive.default(true),
  })
  .superRefine(reportIssues);
export type CreatePricingRuleInput = z.infer<typeof createPricingRuleSchema>;

/** Only the fields sent change; the backend validates the merged rule with `pricingRuleIssues`. */
export const updatePricingRuleSchema = z.strictObject(pricingRuleFields).partial();
export type UpdatePricingRuleInput = z.infer<typeof updatePricingRuleSchema>;

export const pricingRuleListQuerySchema = z.object({ roomTypeId: z.uuid().optional() });
export type PricingRuleListQuery = z.infer<typeof pricingRuleListQuerySchema>;

/** Price of one night of a room type; `bookedOn` (default: today) drives the early-bird / last-minute rules. */
export const pricePreviewQuerySchema = z.object({
  date: dateSchema,
  bookedOn: dateSchema.optional(),
});
export type PricePreviewQuery = z.infer<typeof pricePreviewQuerySchema>;

// ── Availability calendar ──────────────────────────────────

const checkRange = (v: { from: string; to: string }, ctx: z.RefinementCtx) => {
  if (!isCalendarDate(v.from) || !isCalendarDate(v.to)) return;
  if (v.to < v.from) ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must not be before from' });
  else if (daysBetween(v.from, v.to) + 1 > PRICING_LIMITS.availabilityMaxDays) {
    ctx.addIssue({
      code: 'custom',
      path: ['to'],
      message: `at most ${PRICING_LIMITS.availabilityMaxDays} days per request`,
    });
  }
};

export const availabilityQuerySchema = z
  .object({ from: dateSchema, to: dateSchema, roomTypeId: z.uuid().optional() })
  .superRefine(checkRange);
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

/** Keep `onSale` rooms sellable on each day of the range; 0 closes the dates. */
export const updateAvailabilitySchema = z
  .strictObject({
    roomTypeId: z.uuid(),
    from: dateSchema,
    to: dateSchema,
    onSale: z.number().int().min(0).max(PRICING_LIMITS.maxRoomsOnSale),
  })
  .superRefine(checkRange);
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;

// ── Cancellation policy ─────────────────────────────────────

/**
 * Free cancellation until the hotel's check-in time, `freeCancellationDays` days before the check-in date (null: no
 * free period); after that `feePercent` of the amount paid is kept. Fixed on each booking when it is made (BR-07).
 */
export const cancellationPolicySchema = z.strictObject({
  freeCancellationDays: z.number().int().min(0).max(30).nullable(),
  feePercent: z.number().min(0).max(100).refine(hasAtMost2Decimals, 'at most 2 decimal places'),
});
export type CancellationPolicyInput = z.infer<typeof cancellationPolicySchema>;

/** Applies until the partner sets a policy (decision P14). */
export const DEFAULT_CANCELLATION_POLICY: CancellationPolicyInput = { freeCancellationDays: 1, feePercent: 100 };
