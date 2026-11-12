import { z } from 'zod';
import { PartnerStatus, HotelStatus } from '../enums';
import { REGIONS } from '../regions';
import { COMMISSION_STATUSES } from '../schemas/platform';
import { STATS_GRANULARITIES } from '../schemas/stats';
import { isoDateTime, responseSchemas } from './registry';
import { metricResponseSchema, rateMetricResponseSchema, statsPeriodResponseSchema } from './stats';

/**
 * Content of `data` returned by the platform manager's figures (docs/api/manager.md, "Platform figures", decisions
 * M4–M7). Money is VND; `Metric`s compare with the same number of days just before the period.
 */

const generatedAt = () => isoDateTime().describe('When the figures were computed.');
const hotelRef = z.object({ id: z.uuid(), name: z.string(), city: z.string(), region: z.enum(REGIONS) });

export const platformRevenueResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    period: statsPeriodResponseSchema,
    previous: statsPeriodResponseSchema,
    totals: z.object({
      gmv: metricResponseSchema.describe('What customers paid for the bookings paid in the period (M5).'),
      discounts: metricResponseSchema.describe('Promotion or voucher discounts of those bookings.'),
      pointsUsed: metricResponseSchema.describe('Value of the loyalty points spent on those bookings.'),
      refunds: metricResponseSchema.describe('Refunds approved in the period (credited to customer wallets).'),
      commission: metricResponseSchema.describe('Commission charged in the period (check-out or no-show).'),
      platformDebits: metricResponseSchema.describe('Costs paid from the platform wallet in the period.'),
      platformRevenue: metricResponseSchema.describe('Commission minus the platform debits.'),
      bookings: metricResponseSchema.describe('Bookings paid in the period.'),
    }),
    granularity: z.enum(STATS_GRANULARITIES),
    series: z
      .array(
        z.object({
          periodStart: z.iso.date(),
          days: z.number().int(),
          gmv: z.number(),
          commission: z.number(),
          bookings: z.number().int(),
        }),
      )
      .describe('Continuous buckets; the first and last may be partial.'),
    byRegion: z
      .array(
        z.object({
          region: z.enum(REGIONS),
          hotels: z.number().int().describe('Active hotels of the region now.'),
          gmv: metricResponseSchema,
          commission: metricResponseSchema,
          bookings: metricResponseSchema,
        }),
      )
      .describe('Every region, in the order of `REGIONS`.'),
  })
  .register(responseSchemas, { id: 'PlatformRevenue' });
export type PlatformRevenue = z.infer<typeof platformRevenueResponseSchema>;

export const hotelRevenueRowResponseSchema = z
  .object({
    hotel: hotelRef,
    partner: z.object({ id: z.uuid(), name: z.string() }),
    bookings: z.number().int(),
    gmv: z.number(),
    commission: z.number(),
    refunds: z.number(),
    cancellationRate: z
      .number()
      .nullable()
      .describe('Share of the bookings paid in the period cancelled since, 1 decimal; null without bookings.'),
  })
  .register(responseSchemas, { id: 'HotelRevenueRow', description: 'One hotel over the period.' });
export type HotelRevenueRow = z.infer<typeof hotelRevenueRowResponseSchema>;

export const hotelRevenueDetailResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    period: statsPeriodResponseSchema,
    previous: statsPeriodResponseSchema,
    hotel: hotelRef.extend({ status: z.enum(HotelStatus) }),
    partner: z.object({
      id: z.uuid(),
      name: z.string(),
      status: z.enum(PartnerStatus),
      commissionRate: z.number().describe('Percent applied to bookings made from now on (BR-13).'),
    }),
    bookings: metricResponseSchema,
    gmv: metricResponseSchema,
    commission: metricResponseSchema,
    refunds: metricResponseSchema,
    cancellationRate: rateMetricResponseSchema,
    wallet: z
      .object({ available: z.number(), pending: z.number(), reserved: z.number() })
      .nullable()
      .describe('Balances now; null while the hotel has no wallet.'),
    payouts: z.object({
      paidCount: z.number().int(),
      paidAmount: z.number().describe('Withdrawals paid in the period.'),
      pendingCount: z.number().int(),
      pendingAmount: z.number().describe('Withdrawals waiting now.'),
    }),
  })
  .register(responseSchemas, { id: 'HotelRevenueDetail' });
export type HotelRevenueDetail = z.infer<typeof hotelRevenueDetailResponseSchema>;

export const commissionRowResponseSchema = z
  .object({
    booking: z.object({ id: z.uuid(), code: z.string() }),
    hotel: z.object({ id: z.uuid(), name: z.string() }),
    checkOutDate: z.iso.date(),
    total: z.number().describe('What the customer paid (`invoice.totalAmount`).'),
    rate: z.number().describe('Percent fixed when the booking was made.'),
    amount: z.number().describe('Charged, or expected: total × rate rounded half up to whole dong.'),
    status: z.enum(COMMISSION_STATUSES),
    chargedAt: isoDateTime().nullable(),
  })
  .register(responseSchemas, {
    id: 'CommissionRow',
    description: 'Commission of one booking. There is no refund adjustment (M6).',
  });
export type CommissionRow = z.infer<typeof commissionRowResponseSchema>;

export const platformCashflowResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    period: statsPeriodResponseSchema,
    received: z.object({
      sepay: z.number().describe('Bookings paid by SePay transfer in the period.'),
      transfers: z.number().int(),
      wallet: z.number().describe('Bookings paid from customer wallets: money already in the bank.'),
    }),
    split: z
      .object({
        refunded: z.number().describe('Refunded to customer wallets.'),
        commission: z.number().describe('Commission charged so far.'),
        hotelSettled: z.number().describe('Settled to the hotels (part of it may be withdrawn since).'),
        hotelPending: z.number().describe('Still held for the hotels.'),
        difference: z.number().describe('`received.sepay` minus the four parts; not 0 → to investigate.'),
      })
      .describe('Where the SePay money of the bookings paid in the period is now, from the wallet ledger.'),
    unmatched: z
      .object({ count: z.number().int(), amount: z.number() })
      .describe('SePay transfers in the period that confirmed nothing or came late, to refund by hand.'),
    payoutsPaid: z.object({ count: z.number().int(), amount: z.number() }),
    reconciliation: z
      .object({
        bankExpected: z.number().describe('SePay received for bookings, all time, minus the withdrawals paid.'),
        walletTotal: z.number().describe('Every wallet: available + pending + reserved, now.'),
        difference: z.number(),
      })
      .describe('Money-rules §5.3, all time, now.'),
  })
  .register(responseSchemas, { id: 'PlatformCashflow' });
export type PlatformCashflow = z.infer<typeof platformCashflowResponseSchema>;

// ── Manager dashboard and hotels ────────────────────────────

const countMetric = metricResponseSchema;

export const platformOverviewResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    period: statsPeriodResponseSchema,
    previous: statsPeriodResponseSchema,
    partners: z.object({ active: z.number().int().describe('Approved partners now.'), new: countMetric }),
    hotels: z.object({
      active: z.number().int(),
      new: countMetric.describe('Hotels whose first verification was approved in the period.'),
    }),
    customers: z.object({ total: z.number().int(), new: countMetric }),
    bookings: metricResponseSchema,
    gmv: metricResponseSchema,
    commission: metricResponseSchema,
    queue: z
      .object({
        verifications: z.object({ pending: z.number().int(), oldestSubmittedAt: isoDateTime().nullable() }),
        payouts: z.object({
          pending: z.number().int(),
          amount: z.number(),
          overdue: z.number().int().describe('Still pending 2 working days after the request.'),
          oldestRequestedAt: isoDateTime().nullable(),
        }),
        contentReports: z.object({ open: z.number().int(), oldestCreatedAt: isoDateTime().nullable() }),
        complianceCases: z.object({ open: z.number().int(), critical: z.number().int() }),
        suspensionRequests: z.object({ pending: z.number().int() }),
      })
      .describe('What waits for the platform now, each block linking to its list.'),
  })
  .register(responseSchemas, { id: 'PlatformOverview' });
export type PlatformOverview = z.infer<typeof platformOverviewResponseSchema>;

export const platformHotelRowResponseSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    city: z.string(),
    region: z.enum(REGIONS),
    status: z.enum(HotelStatus),
    partner: z.object({ id: z.uuid(), name: z.string(), status: z.enum(PartnerStatus) }),
    rooms: z.number().int(),
    verifiedAt: isoDateTime().nullable().describe('When its latest verification request was approved.'),
    bookings: z.number().int().describe('Bookings paid in the period.'),
    cancellationRate: z.number().nullable(),
    gmv: z.number(),
    rating: z.object({ average: z.number().nullable(), count: z.number().int() }),
    openCases: z.number().int().describe('Open or investigating compliance cases about this hotel.'),
  })
  .register(responseSchemas, { id: 'PlatformHotelRow' });
export type PlatformHotelRow = z.infer<typeof platformHotelRowResponseSchema>;
