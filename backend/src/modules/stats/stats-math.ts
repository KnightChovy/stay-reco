import type {
  Metric,
  RateMetric,
  StatsGranularity,
  StatsPeriod,
} from '@stayreco/shared';
import { daysBetween } from '@stayreco/shared';
import {
  addDays,
  fromCalendarDate,
  toCalendarDate,
} from '../../common/http/calendar-date';
import { Prisma } from '../../generated/prisma/client';

/**
 * Pure helpers behind the dashboard figures (docs/api/partner-dashboard.md §2–§3): rounding, ratios, comparisons with
 * the previous period and chart buckets. Money stays in `Prisma.Decimal` until the final rounding.
 */

type Num = Prisma.Decimal | number;

const dec = (v: Num) => new Prisma.Decimal(v);

/** Rounded half up (away from zero for negative changes) to `places` decimals. */
export const round = (v: Num, places: number) =>
  dec(v).toDecimalPlaces(places, Prisma.Decimal.ROUND_HALF_UP).toNumber();

/** `numerator / denominator × scale` rounded, or null when the denominator is 0. */
export function ratio(
  numerator: Num,
  denominator: Num,
  places: number,
  scale = 1,
): number | null {
  const d = dec(denominator);
  if (d.isZero()) return null;
  return round(dec(numerator).times(scale).div(d), places);
}

/** A figure with its previous period; the change is in percent, null against 0 or a missing value. */
export function metric(value: number | null, previous: number | null): Metric {
  const deltaPercent =
    value === null || previous === null || previous === 0
      ? null
      : ratio(value - previous, previous, 1, 100);
  return { value, previous, deltaPercent };
}

/** A percentage with its previous period; the change is in percentage points. */
export function rateMetric(
  value: number | null,
  previous: number | null,
): RateMetric {
  const deltaPoints =
    value === null || previous === null ? null : round(value - previous, 1);
  return { value, previous, deltaPoints };
}

export const periodOf = (from: string, to: string): StatsPeriod => ({
  from,
  to,
  days: daysBetween(from, to) + 1,
});

/** The query's period, or by default from the 1st of the current month to today. */
export function resolvePeriod(
  query: { from?: string; to?: string },
  today: string,
): StatsPeriod {
  if (query.from && query.to) return periodOf(query.from, query.to);
  return periodOf(`${today.slice(0, 8)}01`, today);
}

/** The same number of days just before the period. */
export function previousPeriod(period: StatsPeriod): StatsPeriod {
  const to = addDays(period.from, -1);
  return periodOf(addDays(to, -(period.days - 1)), to);
}

export interface Bucket {
  start: string;
  end: string;
  days: number;
}

/** Chart buckets covering the period; weeks start on Monday, the first and last buckets are cut by the period. */
export function bucketsOf(
  period: StatsPeriod,
  granularity: StatsGranularity,
): Bucket[] {
  const buckets: Bucket[] = [];
  let start = period.from;
  while (start <= period.to) {
    const next = nextBucketStart(start, granularity);
    const end = next > period.to ? period.to : addDays(next, -1);
    buckets.push({ start, end, days: daysBetween(start, end) + 1 });
    start = next;
  }
  return buckets;
}

function nextBucketStart(date: string, granularity: StatsGranularity) {
  if (granularity === 'day') return addDays(date, 1);
  if (granularity === 'week') {
    const weekday = (fromCalendarDate(date).getUTCDay() + 6) % 7; // Monday = 0
    return addDays(date, 7 - weekday);
  }
  const d = fromCalendarDate(date);
  return toCalendarDate(
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)),
  );
}
