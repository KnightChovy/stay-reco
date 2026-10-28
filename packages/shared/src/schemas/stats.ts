import { z } from 'zod';
import { dateSchema, daysBetween, isCalendarDate } from './common';

/** Limits of the partner dashboard queries (docs/api/partner-dashboard.md §2, §4). */
export const STATS_LIMITS = {
  /** `overview`: days in the period. */
  rangeMaxDays: 366,
  /** `series`: buckets per granularity. */
  seriesMaxBuckets: { day: 92, week: 53, month: 24 },
  forecastDaysMin: 7,
  forecastDaysMax: 90,
  forecastDaysDefault: 30,
  arrivalsLimitMax: 20,
  arrivalsLimitDefault: 5,
} as const;

/** Weeks start on Monday. */
export const STATS_GRANULARITIES = ['day', 'week', 'month'] as const;
export type StatsGranularity = (typeof STATS_GRANULARITIES)[number];

/** Granularity used when `series` gets none: `day` up to 31 days, `week` up to 92, otherwise `month`. */
export const defaultGranularity = (from: string, to: string): StatsGranularity => {
  const days = daysBetween(from, to) + 1;
  return days <= 31 ? 'day' : days <= 92 ? 'week' : 'month';
};

/** Buckets from `from` to `to` (both "YYYY-MM-DD"), the first and last ones possibly partial. */
export const statsBucketCount = (from: string, to: string, granularity: StatsGranularity) => {
  if (granularity === 'day') return daysBetween(from, to) + 1;
  if (granularity === 'week') {
    // Counted from the Monday of the first week, so a Sunday-to-Monday range spans two buckets.
    const offset = (new Date(`${from}T00:00:00Z`).getUTCDay() + 6) % 7;
    return Math.floor((offset + daysBetween(from, to)) / 7) + 1;
  }
  const [fromYear, fromMonth] = from.split('-').map(Number);
  const [toYear, toMonth] = to.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
};

const range = { from: dateSchema.optional(), to: dateSchema.optional() };

/** Both dates or neither (default: from the 1st of the current month to today, in Asia/Ho_Chi_Minh). */
const checkPair = (v: { from?: string; to?: string }, ctx: z.RefinementCtx) => {
  if ((v.from === undefined) !== (v.to === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'from and to must be sent together' });
    return false;
  }
  if (!isCalendarDate(v.from) || !isCalendarDate(v.to)) return false;
  if (v.to < v.from) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must not be before from' });
    return false;
  }
  return true;
};

/** `GET /hotels/:hotelId/stats/overview` (and later `breakdown`, `/me/hotels/stats`). */
export const statsRangeQuerySchema = z.object(range).superRefine((v, ctx) => {
  if (checkPair(v, ctx) && daysBetween(v.from!, v.to!) + 1 > STATS_LIMITS.rangeMaxDays) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: `at most ${STATS_LIMITS.rangeMaxDays} days` });
  }
});
export type StatsRangeQuery = z.infer<typeof statsRangeQuerySchema>;

/** `GET /hotels/:hotelId/stats/series`: the bucket limit depends on the granularity, given or defaulted. */
export const statsSeriesQuerySchema = z
  .object({ ...range, granularity: z.enum(STATS_GRANULARITIES).optional() })
  .superRefine((v, ctx) => {
    if (!checkPair(v, ctx)) return;
    const granularity = v.granularity ?? defaultGranularity(v.from!, v.to!);
    const max = STATS_LIMITS.seriesMaxBuckets[granularity];
    if (statsBucketCount(v.from!, v.to!, granularity) > max) {
      ctx.addIssue({ code: 'custom', path: ['to'], message: `at most ${max} ${granularity} buckets` });
    }
  });
export type StatsSeriesQuery = z.infer<typeof statsSeriesQuerySchema>;

/** `GET /hotels/:hotelId/stats/occupancy-forecast`: the next `days` days from today. */
export const occupancyForecastQuerySchema = z.object({
  days: z.coerce
    .number()
    .int()
    .min(STATS_LIMITS.forecastDaysMin)
    .max(STATS_LIMITS.forecastDaysMax)
    .default(STATS_LIMITS.forecastDaysDefault),
});
export type OccupancyForecastQuery = z.infer<typeof occupancyForecastQuerySchema>;

/** `GET /hotels/:hotelId/stats/today`: how many of today's arrivals to list. */
export const todayStatsQuerySchema = z.object({
  arrivalsLimit: z.coerce
    .number()
    .int()
    .min(1)
    .max(STATS_LIMITS.arrivalsLimitMax)
    .default(STATS_LIMITS.arrivalsLimitDefault),
});
export type TodayStatsQuery = z.infer<typeof todayStatsQuerySchema>;
