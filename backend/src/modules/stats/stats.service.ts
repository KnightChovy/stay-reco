import { Injectable } from '@nestjs/common';
import type {
  HotelStatsOverview,
  HotelStatsSeries,
  HotelTodayStats,
  OccupancyForecast,
  OccupancyForecastDay,
  StatsPeriod,
  StatsRangeQuery,
  StatsSeriesPoint,
  StatsSeriesQuery,
  TodayStatsQuery,
} from '@stayreco/shared';
import { defaultGranularity, daysBetween } from '@stayreco/shared';
import {
  addDays,
  fromCalendarDate,
  todayInVietnam,
  toCalendarDate,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { fromTime } from '../hotels/hotel.mapper';
import {
  bucketsOf,
  metric,
  previousPeriod,
  rateMetric,
  ratio,
  resolvePeriod,
  round,
} from './stats-math';

/** Booking statuses that count as sold (decision PD2: no-shows included). */
const SOLD = Prisma.sql`('CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'NO_SHOW')`;
/** Hotel wallet rows that make up the net received (payouts excluded). */
const EARNINGS = Prisma.sql`('BOOKING_PAYMENT', 'COMMISSION', 'REFUND', 'ADJUSTMENT')`;

/** One day of performance and cash figures (docs/api/partner-dashboard.md §3). */
interface DayRow {
  day: string;
  roomsAvailable: number;
  nightsSold: number;
  revenue: Prisma.Decimal;
  bookingsCreated: number;
  cancellations: number;
  net: Prisma.Decimal;
  commission: Prisma.Decimal;
  refunds: Prisma.Decimal;
}

interface Totals {
  roomsAvailable: number;
  nightsSold: number;
  revenue: Prisma.Decimal;
  bookingsCreated: number;
  cancellations: number;
  net: Prisma.Decimal;
  commission: Prisma.Decimal;
  refunds: Prisma.Decimal;
}

interface Averages {
  stay: number | null;
  lead: number | null;
  rating: number | null;
  reviews: number;
}

/** First instant of a Vietnam date, and the first instant after a range of them. */
const startOf = (date: string) => vietnamDateTime(date, '00:00');

/**
 * The partner dashboard figures. Every aggregate runs in SQL over the hotel's rooms, bookings and wallet; hotel access
 * was checked by `HotelAccessRequired`. Days are Asia/Ho_Chi_Minh dates.
 */
@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(
    hotelId: string,
    query: StatsRangeQuery,
    now = new Date(),
  ): Promise<HotelStatsOverview> {
    const period = resolvePeriod(query, todayInVietnam(now));
    const previous = previousPeriod(period);
    const days = await this.days(hotelId, previous.from, period.to);
    const cur = totalOf(days.filter((d) => d.day >= period.from));
    const prev = totalOf(days.filter((d) => d.day < period.from));
    const [curAvg, prevAvg, wallet] = await Promise.all([
      this.averages(hotelId, period),
      this.averages(hotelId, previous),
      this.prisma.wallet.findUnique({
        where: { hotelId },
        select: {
          balanceAvailable: true,
          balancePending: true,
          balanceReserved: true,
        },
      }),
    ]);

    const occupancy = (t: Totals) =>
      ratio(t.nightsSold, t.roomsAvailable, 1, 100);
    const money = (v: Prisma.Decimal) => toNumber(v);
    const pair = <T>(f: (t: Totals) => T) => [f(cur), f(prev)] as const;
    return {
      generatedAt: now.toISOString(),
      period,
      previous,
      performance: {
        roomRevenue: metric(...pair((t) => money(t.revenue))),
        roomNightsSold: metric(...pair((t) => t.nightsSold)),
        roomNightsAvailable: metric(...pair((t) => t.roomsAvailable)),
        occupancyRate: rateMetric(...pair(occupancy)),
        adr: metric(...pair((t) => ratio(t.revenue, t.nightsSold, 2))),
        revpar: metric(...pair((t) => ratio(t.revenue, t.roomsAvailable, 2))),
        bookingsCreated: metric(...pair((t) => t.bookingsCreated)),
        cancellations: metric(...pair((t) => t.cancellations)),
        cancellationRate: rateMetric(
          ...pair((t) => ratio(t.cancellations, t.bookingsCreated, 1, 100)),
        ),
        avgLengthOfStay: metric(curAvg.stay, prevAvg.stay),
        avgLeadTimeDays: metric(curAvg.lead, prevAvg.lead),
      },
      cash: {
        netEarnings: metric(...pair((t) => money(t.net))),
        commission: metric(...pair((t) => money(t.commission))),
        refunds: metric(...pair((t) => money(t.refunds))),
      },
      reviews: {
        avgRating: metric(curAvg.rating, prevAvg.rating),
        reviewCount: metric(curAvg.reviews, prevAvg.reviews),
      },
      wallet: wallet && {
        available: toNumber(wallet.balanceAvailable),
        pending: toNumber(wallet.balancePending),
        reserved: toNumber(wallet.balanceReserved),
      },
    };
  }

  async series(
    hotelId: string,
    query: StatsSeriesQuery,
    now = new Date(),
  ): Promise<HotelStatsSeries> {
    const period = resolvePeriod(query, todayInVietnam(now));
    const granularity =
      query.granularity ?? defaultGranularity(period.from, period.to);
    const days = await this.days(hotelId, period.from, period.to);

    const points = bucketsOf(period, granularity).map((b): StatsSeriesPoint => {
      const t = totalOf(days.filter((d) => d.day >= b.start && d.day <= b.end));
      return {
        periodStart: b.start,
        days: b.days,
        roomRevenue: toNumber(t.revenue),
        roomNightsSold: t.nightsSold,
        roomNightsAvailable: t.roomsAvailable,
        occupancyRate: ratio(t.nightsSold, t.roomsAvailable, 1, 100),
        adr: ratio(t.revenue, t.nightsSold, 2),
        bookingsCreated: t.bookingsCreated,
        cancellations: t.cancellations,
        netEarnings: toNumber(t.net),
      };
    });
    return { generatedAt: now.toISOString(), granularity, period, points };
  }

  async today(
    hotelId: string,
    query: TodayStatsQuery,
    now = new Date(),
  ): Promise<HotelTodayStats> {
    const date = todayInVietnam(now);
    const day = fromCalendarDate(date);
    const ofHotel = { roomType: { hotelId } };
    const roomOfHotel = { room: { roomType: { hotelId } } };
    const count = (where: Prisma.BookingWhereInput) =>
      this.prisma.booking.count({ where: { ...ofHotel, ...where } });

    const [
      arrivals,
      checkedIn,
      departures,
      checkedOut,
      inHouse,
      roomsSold,
      blocked,
      rooms,
      holds,
      nextHold,
      upcoming,
    ] = await Promise.all([
      count({ checkInDate: day, status: { in: ['CONFIRMED', 'CHECKED_IN'] } }),
      count({ checkInDate: day, status: 'CHECKED_IN' }),
      count({
        checkOutDate: day,
        status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
      }),
      count({ checkOutDate: day, status: 'COMPLETED' }),
      this.prisma.booking.aggregate({
        where: { ...ofHotel, status: 'CHECKED_IN' },
        _count: true,
        _sum: { numGuests: true },
      }),
      this.prisma.roomCalendars.count({
        where: { ...roomOfHotel, date: day, status: 'BOOKED' },
      }),
      this.prisma.roomCalendars.count({
        where: {
          room: { roomType: { hotelId }, status: { not: 'MAINTENANCE' } },
          date: day,
          status: 'BLOCKED',
        },
      }),
      this.prisma.room.groupBy({
        by: ['status'],
        where: ofHotel,
        _count: true,
      }),
      count({
        status: 'PENDING',
        roomCalendars: { some: { status: 'HELD', holdExpiresAt: { gt: now } } },
      }),
      this.prisma.roomCalendars.aggregate({
        where: { ...roomOfHotel, status: 'HELD', holdExpiresAt: { gt: now } },
        _min: { holdExpiresAt: true },
      }),
      this.prisma.booking.findMany({
        where: { ...ofHotel, checkInDate: day, status: 'CONFIRMED' },
        orderBy: [
          { arrivalTime: { sort: 'asc', nulls: 'last' } },
          { createdAt: 'asc' },
          { bookingId: 'asc' },
        ],
        take: query.arrivalsLimit,
        select: {
          bookingId: true,
          guestName: true,
          checkInDate: true,
          checkOutDate: true,
          numRooms: true,
          numGuests: true,
          arrivalTime: true,
          status: true,
          specialRequests: true,
          invoice: { select: { invoiceNumber: true, paymentStatus: true } },
          roomType: { select: { name: true } },
          roomCalendars: {
            where: { date: day },
            select: { room: { select: { roomNumber: true } } },
            orderBy: { room: { roomNumber: 'asc' } },
          },
        },
      }),
    ]);

    const byStatus = Object.fromEntries(
      rooms.map((r) => [r.status, r._count]),
    ) as Partial<Record<string, number>>;
    const total = rooms.reduce((sum, r) => sum + r._count, 0);
    const maintenance = byStatus.MAINTENANCE ?? 0;
    const roomsAvailable = total - maintenance - blocked;
    return {
      generatedAt: now.toISOString(),
      date,
      arrivals: { expected: arrivals, checkedIn },
      departures: { expected: departures, checkedOut },
      inHouse: {
        bookings: inHouse._count,
        guests: inHouse._sum.numGuests ?? 0,
      },
      tonight: {
        roomsSold,
        roomsAvailable,
        occupancyRate: ratio(roomsSold, roomsAvailable, 1, 100),
      },
      rooms: {
        total,
        AVAILABLE: byStatus.AVAILABLE ?? 0,
        OCCUPIED: byStatus.OCCUPIED ?? 0,
        CLEANING: byStatus.CLEANING ?? 0,
        MAINTENANCE: maintenance,
      },
      holds: {
        active: holds,
        nextExpiresAt: nextHold._min.holdExpiresAt?.toISOString() ?? null,
      },
      upcomingArrivals: upcoming.map((b) => ({
        bookingId: b.bookingId,
        code: b.invoice!.invoiceNumber,
        guestName: b.guestName,
        roomTypeName: b.roomType.name,
        nights: daysBetween(
          toCalendarDate(b.checkInDate),
          toCalendarDate(b.checkOutDate),
        ),
        rooms: b.numRooms,
        numGuests: b.numGuests,
        arrivalTime: fromTime(b.arrivalTime),
        roomNumbers: b.roomCalendars.map((c) => c.room.roomNumber),
        status: b.status,
        paymentStatus: b.invoice!.paymentStatus,
        specialRequests: b.specialRequests,
      })),
    };
  }

  async forecast(
    hotelId: string,
    days: number,
    now = new Date(),
  ): Promise<OccupancyForecast> {
    const from = todayInVietnam(now);
    return {
      generatedAt: now.toISOString(),
      from,
      days: await this.forecastDays(hotelId, from, days, now),
    };
  }

  /**
   * Rooms on the books for each of `days` days from `from`: `roomsTotal` = rooms not in maintenance (PD7), `blocked`
   * only on those rooms, `held` only while the hold runs.
   */
  async forecastDays(
    hotelId: string,
    from: string,
    days: number,
    now = new Date(),
  ): Promise<OccupancyForecastDay[]> {
    const to = addDays(from, days - 1);
    const rows = await this.prisma.$queryRaw<
      {
        day: string;
        total: number;
        booked: number;
        held: number;
        blocked: number;
      }[]
    >`
      WITH days AS (
        SELECT d::date AS day FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS d
      ),
      rooms AS (
        SELECT r.room_id, r.status FROM room r
        JOIN room_type rt ON rt.room_type_id = r.room_type_id
        WHERE rt.hotel_id = ${hotelId}::uuid
      ),
      cal AS (
        SELECT rc.date AS day,
          count(*) FILTER (WHERE rc.status = 'BOOKED') AS booked,
          count(*) FILTER (WHERE rc.status = 'HELD' AND rc.hold_expires_at > ${now}) AS held,
          count(*) FILTER (WHERE rc.status = 'BLOCKED' AND r.status <> 'MAINTENANCE') AS blocked
        FROM room_calendars rc JOIN rooms r ON r.room_id = rc.room_id
        WHERE rc.date BETWEEN ${from}::date AND ${to}::date
        GROUP BY rc.date
      )
      SELECT days.day::text AS day,
        (SELECT count(*) FROM rooms WHERE status <> 'MAINTENANCE')::int AS total,
        coalesce(cal.booked, 0)::int AS booked,
        coalesce(cal.held, 0)::int AS held,
        coalesce(cal.blocked, 0)::int AS blocked
      FROM days LEFT JOIN cal ON cal.day = days.day
      ORDER BY days.day`;

    return rows.map((r) => ({
      date: r.day,
      roomsTotal: r.total,
      booked: r.booked,
      held: r.held,
      blocked: r.blocked,
      free: Math.max(0, r.total - r.booked - r.held - r.blocked),
      occupancyRate: ratio(r.booked, r.total - r.blocked, 1, 100),
    }));
  }

  /** Figures of every day from `from` to `to`, zeros included. */
  private async days(
    hotelId: string,
    from: string,
    to: string,
  ): Promise<DayRow[]> {
    const start = startOf(from);
    const end = startOf(addDays(to, 1));
    return this.prisma.$queryRaw<DayRow[]>`
      WITH days AS (
        SELECT d::date AS day FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS d
      ),
      hotel_rooms AS (
        SELECT r.room_id, (r.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS since
        FROM room r JOIN room_type rt ON rt.room_type_id = r.room_type_id
        WHERE rt.hotel_id = ${hotelId}::uuid
      ),
      hotel_bookings AS (
        SELECT b.* FROM booking b JOIN room_type rt ON rt.room_type_id = b.room_type_id
        WHERE rt.hotel_id = ${hotelId}::uuid
      ),
      existing AS (
        SELECT days.day, count(hr.room_id) AS rooms
        FROM days LEFT JOIN hotel_rooms hr ON hr.since <= days.day
        GROUP BY days.day
      ),
      blocked AS (
        SELECT rc.date AS day, count(*) AS rooms
        FROM room_calendars rc JOIN hotel_rooms hr ON hr.room_id = rc.room_id
        WHERE rc.status = 'BLOCKED' AND rc.date BETWEEN ${from}::date AND ${to}::date
        GROUP BY rc.date
      ),
      sold AS (
        SELECT (n->>'date')::date AS day,
          sum(b.num_rooms) AS nights,
          sum((n->>'price')::numeric * b.num_rooms) AS revenue
        FROM hotel_bookings b CROSS JOIN LATERAL jsonb_array_elements(b.nightly_prices) AS n
        WHERE b.status IN ${SOLD}
          AND b.check_in_date <= ${to}::date AND b.check_out_date > ${from}::date
        GROUP BY 1
      ),
      created AS (
        SELECT (b.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day, count(*) AS n
        FROM hotel_bookings b
        WHERE b.status NOT IN ('PENDING', 'EXPIRED') AND b.created_at >= ${start} AND b.created_at < ${end}
        GROUP BY 1
      ),
      cancelled AS (
        SELECT (b.cancelled_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day, count(*) AS n
        FROM hotel_bookings b
        WHERE b.status = 'CANCELLED' AND b.cancelled_at >= ${start} AND b.cancelled_at < ${end}
        GROUP BY 1
      ),
      ledger AS (
        SELECT (wt.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
          sum(wt.amount) FILTER (WHERE wt.type IN ${EARNINGS}) AS net,
          -sum(wt.amount) FILTER (WHERE wt.type = 'COMMISSION') AS commission,
          -sum(wt.amount) FILTER (WHERE wt.type = 'REFUND') AS refunds
        FROM wallet_transaction wt JOIN wallet w ON w.wallet_id = wt.wallet_id
        WHERE w.hotel_id = ${hotelId}::uuid AND wt.created_at >= ${start} AND wt.created_at < ${end}
        GROUP BY 1
      )
      SELECT days.day::text AS day,
        (existing.rooms - coalesce(blocked.rooms, 0))::int AS "roomsAvailable",
        coalesce(sold.nights, 0)::int AS "nightsSold",
        coalesce(sold.revenue, 0) AS revenue,
        coalesce(created.n, 0)::int AS "bookingsCreated",
        coalesce(cancelled.n, 0)::int AS cancellations,
        coalesce(ledger.net, 0) AS net,
        coalesce(ledger.commission, 0) AS commission,
        coalesce(ledger.refunds, 0) AS refunds
      FROM days
      JOIN existing ON existing.day = days.day
      LEFT JOIN blocked ON blocked.day = days.day
      LEFT JOIN sold ON sold.day = days.day
      LEFT JOIN created ON created.day = days.day
      LEFT JOIN cancelled ON cancelled.day = days.day
      LEFT JOIN ledger ON ledger.day = days.day
      ORDER BY days.day`;
  }

  /** Averages that do not add up day by day: stay length, lead time, rating. */
  private async averages(
    hotelId: string,
    period: StatsPeriod,
  ): Promise<Averages> {
    const start = startOf(period.from);
    const end = startOf(addDays(period.to, 1));
    const [row] = await this.prisma.$queryRaw<
      {
        stay: Prisma.Decimal | null;
        lead: Prisma.Decimal | null;
        rating: Prisma.Decimal | null;
        reviews: number;
      }[]
    >`
      WITH hotel_bookings AS (
        SELECT b.* FROM booking b JOIN room_type rt ON rt.room_type_id = b.room_type_id
        WHERE rt.hotel_id = ${hotelId}::uuid
      ),
      reviews AS (
        SELECT overall_rating FROM review
        WHERE hotel_id = ${hotelId}::uuid AND is_visible AND created_at >= ${start} AND created_at < ${end}
      )
      SELECT
        (SELECT avg(check_out_date - check_in_date) FROM hotel_bookings
          WHERE status IN ${SOLD} AND check_in_date BETWEEN ${period.from}::date AND ${period.to}::date) AS stay,
        (SELECT avg(check_in_date - (created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date) FROM hotel_bookings
          WHERE status NOT IN ('PENDING', 'EXPIRED') AND created_at >= ${start} AND created_at < ${end}) AS lead,
        (SELECT avg(overall_rating) FROM reviews) AS rating,
        (SELECT count(*) FROM reviews)::int AS reviews`;
    const one = (v: Prisma.Decimal | null) => (v === null ? null : round(v, 1));
    return {
      stay: one(row.stay),
      lead: one(row.lead),
      rating: one(row.rating),
      reviews: row.reviews,
    };
  }
}

function totalOf(days: DayRow[]): Totals {
  const zero = new Prisma.Decimal(0);
  return days.reduce<Totals>(
    (t, d) => ({
      roomsAvailable: t.roomsAvailable + d.roomsAvailable,
      nightsSold: t.nightsSold + d.nightsSold,
      revenue: t.revenue.plus(d.revenue),
      bookingsCreated: t.bookingsCreated + d.bookingsCreated,
      cancellations: t.cancellations + d.cancellations,
      net: t.net.plus(d.net),
      commission: t.commission.plus(d.commission),
      refunds: t.refunds.plus(d.refunds),
    }),
    {
      roomsAvailable: 0,
      nightsSold: 0,
      revenue: zero,
      bookingsCreated: 0,
      cancellations: 0,
      net: zero,
      commission: zero,
      refunds: zero,
    },
  );
}
