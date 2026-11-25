import { z } from 'zod';
import { REGIONS } from '../regions';
import { dateSchema, daysBetween, isCalendarDate, listQuerySchema, repeatedQuery } from './common';
import { STATS_LIMITS, statsSeriesQuerySchema } from './stats';

/**
 * Queries of the platform manager's figures (docs/api/manager.md, "Platform figures"): the same `from` / `to` rules
 * as the partner dashboard, both or neither (default: the last 30 days up to today), at most 366 days.
 */
const range = { from: dateSchema.optional(), to: dateSchema.optional() };

const checkRange = (v: { from?: string; to?: string }, ctx: z.RefinementCtx) => {
  if ((v.from === undefined) !== (v.to === undefined)) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'from and to must be sent together' });
    return;
  }
  if (!isCalendarDate(v.from) || !isCalendarDate(v.to)) return;
  if (v.to < v.from) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: 'to must not be before from' });
  } else if (daysBetween(v.from, v.to) + 1 > STATS_LIMITS.rangeMaxDays) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: `at most ${STATS_LIMITS.rangeMaxDays} days` });
  }
};

/** Days in the default period of the platform figures. */
export const PLATFORM_DEFAULT_DAYS = 30;

/** `GET /platform/hotels/:hotelId/revenue` and `GET /platform/cashflow`. */
export const platformRangeQuerySchema = z.object(range).superRefine(checkRange);
export type PlatformRangeQuery = z.infer<typeof platformRangeQuerySchema>;

/** `GET /platform/stats/revenue`: the period plus the chart's granularity (bucket limits as the partner's series). */
export const platformRevenueQuerySchema = statsSeriesQuerySchema.superRefine((v, ctx) => {
  if (isCalendarDate(v.from) && isCalendarDate(v.to) && daysBetween(v.from, v.to) + 1 > STATS_LIMITS.rangeMaxDays) {
    ctx.addIssue({ code: 'custom', path: ['to'], message: `at most ${STATS_LIMITS.rangeMaxDays} days` });
  }
});
export type PlatformRevenueQuery = z.infer<typeof platformRevenueQuerySchema>;

export const HOTEL_REVENUE_SORTS = [
  'gmv-desc',
  'commission-desc',
  'bookings-desc',
  'cancellationRate-desc',
  'name-asc',
] as const;

/** `GET /platform/stats/revenue/hotels`: the drill-down table; `search` matches the hotel or the partner name. */
export const hotelRevenueListQuerySchema = listQuerySchema
  .extend({
    ...range,
    region: z.enum(REGIONS).optional(),
    sort: z.enum(HOTEL_REVENUE_SORTS).default('gmv-desc'),
  })
  .superRefine(checkRange);
export type HotelRevenueListQuery = z.infer<typeof hotelRevenueListQuerySchema>;

/** `CHARGED` at check-out or no-show; `EXPECTED` while the stay is confirmed or under way (decision M6). */
export const COMMISSION_STATUSES = ['CHARGED', 'EXPECTED'] as const;
export type CommissionStatus = (typeof COMMISSION_STATUSES)[number];

/** `GET /platform/commissions`: period on the check-out date; `search` matches the booking code. */
export const commissionListQuerySchema = listQuerySchema
  .omit({ sort: true })
  .extend({
    ...range,
    hotelId: z.uuid().optional(),
    status: repeatedQuery(z.enum(COMMISSION_STATUSES)).optional(),
  })
  .superRefine(checkRange);
export type CommissionListQuery = z.infer<typeof commissionListQuerySchema>;

export const PLATFORM_REPORTS = ['revenue', 'commissions', 'cashflow'] as const;
export type PlatformReport = (typeof PLATFORM_REPORTS)[number];

/** `GET /platform/stats/export`: one workbook per report, for the same period rules. */
export const platformExportQuerySchema = z
  .object({ ...range, report: z.enum(PLATFORM_REPORTS) })
  .superRefine(checkRange);
export type PlatformExportQuery = z.infer<typeof platformExportQuerySchema>;

/** Hotel statuses past the draft stage, the ones the hotels list shows. */
export const LISTED_HOTEL_STATUSES = ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE'] as const;
export const PARTNER_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;

export const PLATFORM_HOTEL_SORTS = [
  'bookings-desc',
  'cancellationRate-desc',
  'rating-asc',
  'gmv-desc',
  'name-asc',
] as const;

/**
 * `GET /platform/hotels` (SRS 3.14.4): one row per hotel; `search` matches the hotel or the partner name. Figures over
 * the period (default the last 30 days); the rating is over all visible reviews.
 */
export const platformHotelListQuerySchema = listQuerySchema
  .extend({
    ...range,
    status: repeatedQuery(z.enum(LISTED_HOTEL_STATUSES)).optional(),
    partnerStatus: repeatedQuery(z.enum(PARTNER_STATUSES)).optional(),
    region: z.enum(REGIONS).optional(),
    sort: z.enum(PLATFORM_HOTEL_SORTS).default('bookings-desc'),
  })
  .superRefine(checkRange);
export type PlatformHotelListQuery = z.infer<typeof platformHotelListQuerySchema>;
