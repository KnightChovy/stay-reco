import { z } from 'zod';
import { BookingStatus, PaymentStatus } from '../enums';
import { STATS_GRANULARITIES } from '../schemas/stats';
import { isoDateTime, responseSchemas } from './registry';

/**
 * Content of `data` returned by the partner dashboard (docs/api/partner-dashboard.md). Every figure is computed by
 * the backend with the definitions of §3: the client formats it and never recomputes it. `null` means "cannot be
 * computed" (shown as "—"); no data is `0`.
 */

const calendarDate = () => z.iso.date();
const generatedAt = () => isoDateTime().describe('When the figures were computed.');

// ── Shared shapes ───────────────────────────────────────────

export const metricResponseSchema = z
  .object({
    value: z.number().nullable(),
    previous: z.number().nullable(),
    deltaPercent: z
      .number()
      .nullable()
      .describe('(value − previous) / previous × 100, 1 decimal; null when previous is 0 or either side is null.'),
  })
  .register(responseSchemas, { id: 'Metric', description: 'An amount, count or average with its previous period.' });
export type Metric = z.infer<typeof metricResponseSchema>;

export const rateMetricResponseSchema = z
  .object({
    value: z.number().nullable(),
    previous: z.number().nullable(),
    deltaPoints: z.number().nullable().describe('value − previous in percentage points, 1 decimal.'),
  })
  .register(responseSchemas, { id: 'RateMetric', description: 'A percentage (0–100) with its previous period.' });
export type RateMetric = z.infer<typeof rateMetricResponseSchema>;

export const statsPeriodResponseSchema = z
  .object({ from: calendarDate(), to: calendarDate(), days: z.number().int() })
  .register(responseSchemas, { id: 'StatsPeriod' });
export type StatsPeriod = z.infer<typeof statsPeriodResponseSchema>;

// ── Action items ────────────────────────────────────────────

export const ACTION_ITEM_SEVERITIES = ['CRITICAL', 'WARNING', 'INFO'] as const;
export type ActionItemSeverity = (typeof ACTION_ITEM_SEVERITIES)[number];

/** In display order within a severity; more types come with later phases (the FE ignores unknown ones). */
export const ACTION_ITEM_TYPES = [
  'VERIFICATION_NEEDS_REVISION',
  'REFUND_REQUESTS_PENDING',
  'SETUP_INCOMPLETE',
  'ROOMS_LOCKED_LONG',
  'NO_AVAILABILITY_DATES',
  'STAFF_INVITES_PENDING',
  'VERIFICATION_PENDING',
  'HIGH_DEMAND_DATES',
] as const;
export type ActionItemType = (typeof ACTION_ITEM_TYPES)[number];

/** Steps of the onboarding checklist a DRAFT hotel still misses. */
export const SETUP_STEPS = ['AMENITIES', 'POLICIES', 'IMAGES', 'ROOM_CONFIG', 'ROOMS'] as const;

const item = <T extends ActionItemType, P extends z.ZodRawShape>(type: T, params: P) =>
  z.object({
    type: z.literal(type),
    severity: z.enum(ACTION_ITEM_SEVERITIES),
    count: z.number().int(),
    params: z.object(params),
  });

export const actionItemResponseSchema = z
  .discriminatedUnion('type', [
    item('VERIFICATION_NEEDS_REVISION', { requestId: z.uuid() }),
    item('REFUND_REQUESTS_PENDING', { oldestAt: isoDateTime() }),
    item('SETUP_INCOMPLETE', { missing: z.array(z.enum(SETUP_STEPS)) }),
    item('ROOMS_LOCKED_LONG', { roomIds: z.array(z.uuid()), days: z.number().int() }),
    item('NO_AVAILABILITY_DATES', { dates: z.array(calendarDate()) }),
    item('STAFF_INVITES_PENDING', { staffIds: z.array(z.uuid()) }),
    item('VERIFICATION_PENDING', { submittedAt: isoDateTime() }),
    item('HIGH_DEMAND_DATES', { firstDate: calendarDate(), threshold: z.number() }),
  ])
  .register(responseSchemas, { id: 'ActionItem' });
export type ActionItem = z.infer<typeof actionItemResponseSchema>;

export const actionItemListResponseSchema = z
  .object({ generatedAt: generatedAt(), items: z.array(actionItemResponseSchema) })
  .register(responseSchemas, { id: 'ActionItemList' });
export type ActionItemList = z.infer<typeof actionItemListResponseSchema>;

// ── Today ───────────────────────────────────────────────────

export const todayArrivalResponseSchema = z
  .object({
    bookingId: z.uuid(),
    code: z.string(),
    guestName: z.string(),
    roomTypeName: z.string(),
    nights: z.number().int(),
    rooms: z.number().int(),
    numGuests: z.number().int().nullable(),
    arrivalTime: z.string().nullable().describe('Start of the arrival window, "HH:mm".'),
    roomNumbers: z
      .array(z.string())
      .describe('Rooms held for tonight; staff may assign others of the type at check-in (BR-10).'),
    status: z.enum(BookingStatus),
    paymentStatus: z.enum(PaymentStatus),
    specialRequests: z.string().nullable(),
  })
  .register(responseSchemas, { id: 'TodayArrival' });
export type TodayArrival = z.infer<typeof todayArrivalResponseSchema>;

export const hotelTodayStatsResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    date: calendarDate(),
    arrivals: z.object({ expected: z.number().int(), checkedIn: z.number().int() }),
    departures: z.object({ expected: z.number().int(), checkedOut: z.number().int() }),
    inHouse: z.object({ bookings: z.number().int(), guests: z.number().int() }),
    tonight: z.object({
      roomsSold: z.number().int(),
      roomsAvailable: z.number().int(),
      occupancyRate: z.number().nullable(),
    }),
    rooms: z
      .object({
        total: z.number().int(),
        AVAILABLE: z.number().int(),
        OCCUPIED: z.number().int(),
        CLEANING: z.number().int(),
        MAINTENANCE: z.number().int(),
      })
      .describe('Rooms of the hotel by their current status.'),
    holds: z.object({ active: z.number().int(), nextExpiresAt: isoDateTime().nullable() }),
    upcomingArrivals: z.array(todayArrivalResponseSchema),
  })
  .register(responseSchemas, { id: 'HotelTodayStats' });
export type HotelTodayStats = z.infer<typeof hotelTodayStatsResponseSchema>;

// ── Overview ────────────────────────────────────────────────

export const hotelStatsOverviewResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    period: statsPeriodResponseSchema,
    previous: statsPeriodResponseSchema,
    performance: z.object({
      roomRevenue: metricResponseSchema,
      roomNightsSold: metricResponseSchema,
      roomNightsAvailable: metricResponseSchema,
      occupancyRate: rateMetricResponseSchema,
      adr: metricResponseSchema,
      revpar: metricResponseSchema,
      bookingsCreated: metricResponseSchema,
      cancellations: metricResponseSchema,
      cancellationRate: rateMetricResponseSchema,
      avgLengthOfStay: metricResponseSchema,
      avgLeadTimeDays: metricResponseSchema,
    }),
    cash: z.object({
      netEarnings: metricResponseSchema,
      commission: metricResponseSchema,
      refunds: metricResponseSchema,
    }),
    reviews: z.object({ avgRating: metricResponseSchema, reviewCount: metricResponseSchema }),
    wallet: z
      .object({ available: z.number(), pending: z.number(), reserved: z.number() })
      .nullable()
      .describe('Hotel wallet balances now; null while the hotel has no wallet yet.'),
  })
  .register(responseSchemas, { id: 'HotelStatsOverview' });
export type HotelStatsOverview = z.infer<typeof hotelStatsOverviewResponseSchema>;

// ── Series ──────────────────────────────────────────────────

export const statsSeriesPointResponseSchema = z
  .object({
    periodStart: calendarDate(),
    days: z.number().int().describe('Days of the bucket inside the period (the first and last may be partial).'),
    roomRevenue: z.number(),
    roomNightsSold: z.number().int(),
    roomNightsAvailable: z.number().int(),
    occupancyRate: z.number().nullable(),
    adr: z.number().nullable(),
    bookingsCreated: z.number().int(),
    cancellations: z.number().int(),
    netEarnings: z.number(),
  })
  .register(responseSchemas, { id: 'StatsSeriesPoint' });
export type StatsSeriesPoint = z.infer<typeof statsSeriesPointResponseSchema>;

export const hotelStatsSeriesResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    granularity: z.enum(STATS_GRANULARITIES),
    period: statsPeriodResponseSchema,
    points: z.array(statsSeriesPointResponseSchema),
  })
  .register(responseSchemas, { id: 'HotelStatsSeries' });
export type HotelStatsSeries = z.infer<typeof hotelStatsSeriesResponseSchema>;

// ── Occupancy forecast ──────────────────────────────────────

export const occupancyForecastDayResponseSchema = z
  .object({
    date: calendarDate(),
    roomsTotal: z.number().int().describe('Rooms not in MAINTENANCE.'),
    booked: z.number().int(),
    held: z.number().int(),
    blocked: z.number().int(),
    free: z.number().int(),
    occupancyRate: z.number().nullable().describe('booked / (roomsTotal − blocked) × 100.'),
  })
  .register(responseSchemas, { id: 'OccupancyForecastDay' });
export type OccupancyForecastDay = z.infer<typeof occupancyForecastDayResponseSchema>;

export const occupancyForecastResponseSchema = z
  .object({
    generatedAt: generatedAt(),
    from: calendarDate(),
    days: z.array(occupancyForecastDayResponseSchema),
  })
  .register(responseSchemas, { id: 'OccupancyForecast' });
export type OccupancyForecast = z.infer<typeof occupancyForecastResponseSchema>;
