import { Injectable } from '@nestjs/common';
import { Prisma, type Price } from '../../generated/prisma/client';
import {
  addDays,
  fromCalendarDate,
  todayInVietnam,
  toCalendarDate,
  weekdayOf,
} from '../../common/http/calendar-date';
import { PrismaService } from '../../prisma/prisma.service';
import { daysBetween } from '@stayreco/shared';

/** Highest priority first; on a tie the newest rule (money-rules §2.3). The id only makes the order stable. */
export const ruleOrder = [
  { priority: 'desc' },
  { createdAt: 'desc' },
  { priceId: 'desc' },
] satisfies Prisma.PriceOrderByWithRelationInput[];

export interface NightPrice {
  date: string;
  price: Prisma.Decimal;
  /** The rule that set the price; null when the base price applies. */
  rule: Pick<Price, 'priceId' | 'name'> | null;
}

export interface StayQuote {
  basePrice: Prisma.Decimal;
  nights: NightPrice[];
  /** Sum of the nightly prices, for one room. */
  total: Prisma.Decimal;
}

/** Does the rule cover this night, for a booking made `daysBefore` days before check-in? */
export function ruleMatches(rule: Price, night: string, daysBefore: number) {
  if (!rule.isActive || rule.ruleType === 'BASE') return false;
  if (rule.validFrom && night < toCalendarDate(rule.validFrom)) return false;
  if (rule.validTo && night > toCalendarDate(rule.validTo)) return false;
  if (rule.dayOfWeek && rule.dayOfWeek !== weekdayOf(night)) return false;
  if (rule.minDaysBefore !== null && daysBefore < rule.minDaysBefore) {
    return false;
  }
  if (rule.maxDaysBefore !== null && daysBefore > rule.maxDaysBefore) {
    return false;
  }
  return true;
}

/** The rule's price for one night, rounded half up to 2 decimals (BR-29). */
export function applyRule(basePrice: Prisma.Decimal, rule: Price) {
  const value = rule.adjustmentValue!;
  const price =
    rule.adjustmentType === 'SET_PRICE'
      ? value
      : rule.adjustmentType === 'AMOUNT'
        ? basePrice.plus(value)
        : basePrice.times(value.plus(100)).dividedBy(100);
  return price.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * One rule per night: the first matching rule in `ruleOrder`. A rule that would bring the price to 0 or below (an
 * amount larger than a base price lowered after the rule was saved) is skipped, so a night is never free.
 */
export function priceNight(
  basePrice: Prisma.Decimal,
  rules: Price[],
  night: string,
  daysBefore: number,
): NightPrice {
  for (const rule of rules) {
    if (!ruleMatches(rule, night, daysBefore)) continue;
    const price = applyRule(basePrice, rule);
    if (price.lte(0)) continue;
    return {
      date: night,
      price,
      rule: { priceId: rule.priceId, name: rule.name },
    };
  }
  return { date: night, price: basePrice, rule: null };
}

/** Prices stays from the base price and the pricing rules (money-rules §2). Used by the preview, search and booking. */
@Injectable()
export class PriceEngine {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Nightly prices of each room type for the nights `checkIn` … `checkOut − 1`. Days before check-in are counted from
   * `bookedOn` (today in Vietnam by default). Room types without a base price are left out of the map.
   */
  async quote(
    roomTypeIds: string[],
    checkIn: string,
    checkOut: string,
    bookedOn = todayInVietnam(),
  ): Promise<Map<string, StayQuote>> {
    const lastNight = addDays(checkOut, -1);
    const rows = await this.prisma.price.findMany({
      where: {
        roomTypeId: { in: roomTypeIds },
        roomId: null,
        OR: [
          { ruleType: 'BASE' },
          {
            isActive: true,
            OR: [
              { validFrom: null },
              {
                validFrom: { lte: fromCalendarDate(lastNight) },
                validTo: { gte: fromCalendarDate(checkIn) },
              },
            ],
          },
        ],
      },
      orderBy: ruleOrder,
    });

    const daysBefore = daysBetween(bookedOn, checkIn);
    const nights = Array.from(
      { length: daysBetween(checkIn, checkOut) },
      (_, i) => addDays(checkIn, i),
    );
    const quotes = new Map<string, StayQuote>();
    for (const roomTypeId of roomTypeIds) {
      const own = rows.filter((r) => r.roomTypeId === roomTypeId);
      const basePrice = own.find((r) => r.ruleType === 'BASE')?.pricePerNight;
      if (!basePrice) continue;
      const prices = nights.map((night) =>
        priceNight(basePrice, own, night, daysBefore),
      );
      quotes.set(roomTypeId, {
        basePrice,
        nights: prices,
        total: prices.reduce(
          (sum, n) => sum.plus(n.price),
          new Prisma.Decimal(0),
        ),
      });
    }
    return quotes;
  }
}
