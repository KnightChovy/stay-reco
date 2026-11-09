import { Prisma } from '../../generated/prisma/client';
import { toWholeDong } from '../pricing/price-engine';

/**
 * Turning money into points and points back into money (BR-11). Kept apart from the services so the arithmetic that
 * decides what a customer earns and what it is worth can be read and tested without a database.
 *
 * Points are the third subtraction of a booking's final price (money-rules §2.1): nightly prices, minus a promotion
 * **or** a voucher, minus the value of the points spent.
 */

/** The four tiers, and the lifetime points each one starts at. Ordered so the last one reached wins. */
export const TIERS = [
  { tier: 'MEMBER', from: 0 },
  { tier: 'SILVER', from: 10_000 },
  { tier: 'GOLD', from: 30_000 },
  { tier: 'PLATINUM', from: 100_000 },
] as const;

export type Tier = (typeof TIERS)[number]['tier'];

/**
 * Points earned on an amount actually paid. Rounded **down**: a customer is never credited a point they did not
 * quite earn, and the rounding is the same on every stay.
 */
export function pointsEarned(
  amountPaid: Prisma.Decimal,
  pointsPerCurrency: Prisma.Decimal,
): number {
  if (amountPaid.isNegative() || pointsPerCurrency.lessThanOrEqualTo(0)) {
    return 0;
  }
  return amountPaid.times(pointsPerCurrency).floor().toNumber();
}

/**
 * What spending `points` takes off a stay, in whole dong (BR-29). Capped at the amount still owed, so points can
 * bring a stay to 0 but never below, and the leftover points stay in the balance rather than being burnt.
 */
export function pointsValue(
  points: number,
  pointValue: Prisma.Decimal,
  payableAfterDiscount: Prisma.Decimal,
): Prisma.Decimal {
  if (points <= 0 || pointValue.lessThanOrEqualTo(0)) {
    return new Prisma.Decimal(0);
  }
  const value = toWholeDong(pointValue.times(points));
  return value.greaterThan(payableAfterDiscount) ? payableAfterDiscount : value;
}

/**
 * How many of `points` are actually needed to cover `payableAfterDiscount`. A customer asking to spend more than
 * the stay is worth only loses what the stay costs; the rest stays on their balance.
 */
export function pointsToSpend(
  points: number,
  pointValue: Prisma.Decimal,
  payableAfterDiscount: Prisma.Decimal,
): number {
  if (points <= 0 || pointValue.lessThanOrEqualTo(0)) return 0;
  // Points needed to cover the stay, rounded up: paying with the last point is allowed to overshoot in the
  // customer's favour, since `pointsValue` caps what it is worth at the amount owed.
  const needed = payableAfterDiscount.dividedBy(pointValue).ceil().toNumber();
  return Math.min(points, needed);
}

/** The tier a customer has reached, from every point they have ever earned. */
export function tierFor(lifetimePoints: number): Tier {
  let reached: Tier = 'MEMBER';
  for (const { tier, from } of TIERS) {
    if (lifetimePoints >= from) reached = tier;
  }
  return reached;
}

/** Lifetime points still needed for the next tier, and which tier that is; null once PLATINUM is reached. */
export function nextTier(
  lifetimePoints: number,
): { tier: Tier; pointsNeeded: number } | null {
  const upcoming = TIERS.find(({ from }) => lifetimePoints < from);
  return upcoming
    ? { tier: upcoming.tier, pointsNeeded: upcoming.from - lifetimePoints }
    : null;
}
