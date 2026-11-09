import { Prisma } from '../../generated/prisma/client';
import { toWholeDong } from '../pricing/price-engine';

/**
 * What a promotion or voucher takes off a stay (BR-06, money-rules §2.1). Kept apart from the services so the
 * arithmetic that decides what a customer pays can be read and tested without a database.
 *
 * The final price is `subtotal − promotion or voucher discount − loyalty points`. "Or" is the rule: a booking takes
 * **one** discount, never a promotion stacked on a voucher. Loyalty points are a separate subtraction and come with
 * their own phase-4 branch.
 */

/** The campaign terms a discount is computed from, whether it came from a code or applied by itself. */
export interface DiscountTerms {
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: Prisma.Decimal;
  /** Caps a percentage discount, in dong; null when uncapped. Only vouchers carry one. */
  maxDiscount?: Prisma.Decimal | null;
  /** The stay total must reach this for the campaign to apply; null when there is no minimum. */
  minBookingAmount?: Prisma.Decimal | null;
}

/**
 * The amount a campaign takes off `subtotal`, in whole dong.
 *
 * A percentage is taken of the subtotal and then capped by `maxDiscount`. The result is never more than the subtotal
 * itself: the final price may reach 0 but never goes below it, so the platform can never owe money on a booking.
 * Rounded half up to whole dong like every other amount on a booking (BR-29), because SePay has to match the
 * transfer exactly.
 */
export function discountAmount(
  subtotal: Prisma.Decimal,
  terms: DiscountTerms,
): Prisma.Decimal {
  const raw =
    terms.discountType === 'PERCENTAGE'
      ? subtotal.times(terms.discountValue).dividedBy(100)
      : terms.discountValue;

  const capped =
    terms.maxDiscount && raw.greaterThan(terms.maxDiscount)
      ? terms.maxDiscount
      : raw;
  const whole = toWholeDong(capped);
  return whole.greaterThan(subtotal) ? subtotal : whole;
}

/** Whether the stay is large enough for the campaign; a campaign without a minimum always clears it. */
export const meetsMinimum = (
  subtotal: Prisma.Decimal,
  minBookingAmount?: Prisma.Decimal | null,
) => !minBookingAmount || subtotal.greaterThanOrEqualTo(minBookingAmount);

/**
 * A campaign is usable when the hotel has it switched on, today falls inside its dates, and it has uses left.
 * Dates are compared as calendar dates in Vietnam time, like every other date on a booking.
 */
export function campaignUsable(
  campaign: {
    isActive: boolean;
    validFrom: Date | null;
    validTo: Date | null;
    maxUses: number | null;
    currentUses: number;
  },
  today: string,
): boolean {
  if (!campaign.isActive) return false;
  if (campaign.validFrom && today < toDateOnly(campaign.validFrom))
    return false;
  if (campaign.validTo && today > toDateOnly(campaign.validTo)) return false;
  if (campaign.maxUses !== null && campaign.currentUses >= campaign.maxUses) {
    return false;
  }
  return true;
}

/** A `@db.Date` column as "YYYY-MM-DD"; it is stored at midnight UTC, so the ISO prefix is the calendar date. */
export const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Picks the discount the customer actually gets. Given the campaigns that apply by themselves and the one behind a
 * typed code, it takes **whichever saves more**: the customer is never worse off for having typed a code, and never
 * gets both (money-rules §2.1). A tie goes to the code, so a customer handed a personal voucher sees it used.
 */
export function bestDiscount<T extends { amount: Prisma.Decimal }>(
  automatic: T[],
  fromCode: T | null,
): T | null {
  const best = automatic.reduce<T | null>(
    (top, c) => (top === null || c.amount.greaterThan(top.amount) ? c : top),
    null,
  );
  if (!fromCode) return best;
  if (!best) return fromCode;
  return fromCode.amount.greaterThanOrEqualTo(best.amount) ? fromCode : best;
}
