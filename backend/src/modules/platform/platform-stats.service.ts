import { Injectable, NotFoundException } from '@nestjs/common';
import {
  type CommissionListQuery,
  type CommissionRow,
  defaultGranularity,
  type HotelRevenueDetail,
  type HotelRevenueListQuery,
  type HotelRevenueRow,
  PLATFORM_DEFAULT_DAYS,
  type PlatformCashflow,
  type PlatformRangeQuery,
  type PlatformRevenue,
  type PlatformRevenueQuery,
  placeKey,
  REGIONS,
  regionOf,
  type StatsPeriod,
} from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';
import {
  addDays,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { escapeLike } from '../../common/db/like';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { latestEventSql } from '../payouts/payout-events';
import {
  bucketsOf,
  metric,
  periodOf,
  previousPeriod,
  rateMetric,
  ratio,
} from '../stats/stats-math';
import { PLATFORM_WALLET_ID } from '../wallets/wallet-ledger';

const ZERO = new Prisma.Decimal(0);
const startOf = (date: string) => vietnamDateTime(date, '00:00');
/** `[start, end)` instants of a period of Vietnam dates. */
const bounds = (p: StatsPeriod) =>
  [startOf(p.from), startOf(addDays(p.to, 1))] as const;
const money = (v: Prisma.Decimal | null) => (v === null ? 0 : toNumber(v));

/** The period of a query, or by default the last 30 days up to today (docs/api/manager.md). */
export function platformPeriod(
  query: { from?: string; to?: string },
  today: string,
): StatsPeriod {
  if (query.from && query.to) return periodOf(query.from, query.to);
  return periodOf(addDays(today, -(PLATFORM_DEFAULT_DAYS - 1)), today);
}

interface DayRow {
  day: string;
  gmv: Prisma.Decimal;
  bookings: number;
  discounts: Prisma.Decimal;
  points: Prisma.Decimal;
  commission: Prisma.Decimal;
  debits: Prisma.Decimal;
  refunds: Prisma.Decimal;
}

/** One hotel's figures over a period. */
export interface HotelFigures {
  hotelId: string;
  name: string;
  city: string;
  status: string;
  partnerId: string;
  partnerName: string;
  bookings: number;
  cancelled: number;
  gmv: Prisma.Decimal;
  commission: Prisma.Decimal;
  refunds: Prisma.Decimal;
}

const sumDays = (days: DayRow[]) =>
  days.reduce(
    (t, d) => ({
      gmv: t.gmv.plus(d.gmv),
      bookings: t.bookings + d.bookings,
      discounts: t.discounts.plus(d.discounts),
      points: t.points.plus(d.points),
      commission: t.commission.plus(d.commission),
      debits: t.debits.plus(d.debits),
      refunds: t.refunds.plus(d.refunds),
    }),
    {
      gmv: ZERO,
      bookings: 0,
      discounts: ZERO,
      points: ZERO,
      commission: ZERO,
      debits: ZERO,
      refunds: ZERO,
    },
  );

const cancellationRate = (f: Pick<HotelFigures, 'cancelled' | 'bookings'>) =>
  ratio(f.cancelled, f.bookings, 1, 100);

/**
 * The platform manager's money figures (UC75, SRS 3.15.1–3.15.4, decisions M4–M7), aggregated in SQL:
 * - GMV and bookings: invoices paid in the period (`paid_at`), cancelled later included;
 * - discounts: the `BOOKING_DISCOUNT_APPLIED` amount of those bookings; points: the rest of `discount_amount`;
 * - commission and platform debits: the platform wallet's movements of the period;
 * - refunds: `REFUND` credits to customer wallets in the period.
 * Days are Asia/Ho_Chi_Minh dates.
 */
@Injectable()
export class PlatformStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async revenue(
    query: PlatformRevenueQuery,
    now = new Date(),
  ): Promise<PlatformRevenue> {
    const period = platformPeriod(query, todayInVietnam(now));
    const previous = previousPeriod(period);
    const granularity =
      query.granularity ?? defaultGranularity(period.from, period.to);
    const [days, curHotels, prevHotels] = await Promise.all([
      this.days(previous.from, period.to),
      this.hotelFigures(period),
      this.hotelFigures(previous),
    ]);
    const cur = sumDays(days.filter((d) => d.day >= period.from));
    const prev = sumDays(days.filter((d) => d.day < period.from));
    const pair = (f: (t: typeof cur) => Prisma.Decimal | number) => {
      const v = (x: Prisma.Decimal | number) =>
        typeof x === 'number' ? x : money(x);
      return metric(v(f(cur)), v(f(prev)));
    };

    const byRegion = REGIONS.map((region) => {
      const of = (rows: HotelFigures[]) =>
        rows.filter((h) => regionOf(h.city) === region);
      const total = (rows: HotelFigures[]) =>
        rows.reduce(
          (t, h) => ({
            gmv: t.gmv.plus(h.gmv),
            commission: t.commission.plus(h.commission),
            bookings: t.bookings + h.bookings,
          }),
          { gmv: ZERO, commission: ZERO, bookings: 0 },
        );
      const c = total(of(curHotels));
      const p = total(of(prevHotels));
      return {
        region,
        hotels: of(curHotels).filter((h) => h.status === 'ACTIVE').length,
        gmv: metric(money(c.gmv), money(p.gmv)),
        commission: metric(money(c.commission), money(p.commission)),
        bookings: metric(c.bookings, p.bookings),
      };
    });

    return {
      generatedAt: now.toISOString(),
      period,
      previous,
      totals: {
        gmv: pair((t) => t.gmv),
        discounts: pair((t) => t.discounts),
        pointsUsed: pair((t) => t.points),
        refunds: pair((t) => t.refunds),
        commission: pair((t) => t.commission),
        platformDebits: pair((t) => t.debits),
        platformRevenue: pair((t) => t.commission.minus(t.debits)),
        bookings: pair((t) => t.bookings),
      },
      granularity,
      series: bucketsOf(period, granularity).map((b) => {
        const t = sumDays(
          days.filter((d) => d.day >= b.start && d.day <= b.end),
        );
        return {
          periodStart: b.start,
          days: b.days,
          gmv: money(t.gmv),
          commission: money(t.commission),
          bookings: t.bookings,
        };
      }),
      byRegion,
    };
  }

  /** The drill-down table: every hotel past the draft stage, filtered, sorted and paged. */
  async hotels(
    query: HotelRevenueListQuery,
    now = new Date(),
  ): Promise<Paginated<HotelRevenueRow>> {
    const period = platformPeriod(query, todayInVietnam(now));
    const search = query.search ? placeKey(query.search) : null;
    const rows = (await this.hotelFigures(period))
      .map((h) => ({ h, region: regionOf(h.city) }))
      .filter(({ h, region }) => {
        if (query.region && region !== query.region) return false;
        if (!search) return true;
        return (
          placeKey(h.name).includes(search) ||
          placeKey(h.partnerName).includes(search)
        );
      });
    const by: Record<
      HotelRevenueListQuery['sort'],
      (a: HotelFigures, b: HotelFigures) => number
    > = {
      'gmv-desc': (a, b) => b.gmv.comparedTo(a.gmv),
      'commission-desc': (a, b) => b.commission.comparedTo(a.commission),
      'bookings-desc': (a, b) => b.bookings - a.bookings,
      'cancellationRate-desc': (a, b) =>
        (cancellationRate(b) ?? -1) - (cancellationRate(a) ?? -1),
      'name-asc': () => 0,
    };
    rows.sort(
      (a, b) =>
        by[query.sort](a.h, b.h) ||
        a.h.name.localeCompare(b.h.name, 'vi') ||
        a.h.hotelId.localeCompare(b.h.hotelId),
    );
    const page = rows.slice(
      (query.page - 1) * query.pageSize,
      query.page * query.pageSize,
    );
    return Paginated.of(
      page.map(({ h, region }) => ({
        hotel: { id: h.hotelId, name: h.name, city: h.city, region },
        partner: { id: h.partnerId, name: h.partnerName },
        bookings: h.bookings,
        gmv: money(h.gmv),
        commission: money(h.commission),
        refunds: money(h.refunds),
        cancellationRate: cancellationRate(h),
      })),
      { page: query.page, pageSize: query.pageSize, total: rows.length },
    );
  }

  /** One hotel (SRS 3.15.2): its figures against the previous period, wallet now and withdrawals. */
  async hotel(
    hotelId: string,
    query: PlatformRangeQuery,
    now = new Date(),
  ): Promise<HotelRevenueDetail> {
    const hotel = isUuid(hotelId)
      ? await this.prisma.hotel.findUnique({
          where: { hotelId },
          select: {
            hotelId: true,
            name: true,
            city: true,
            status: true,
            hotelPartner: {
              select: {
                hotelPartnerId: true,
                partnerName: true,
                status: true,
                commissionRate: true,
              },
            },
            wallet: {
              select: {
                balanceAvailable: true,
                balancePending: true,
                balanceReserved: true,
              },
            },
          },
        })
      : null;
    if (!hotel) {
      throw new NotFoundException({
        code: ErrorCode.HOTEL_NOT_FOUND,
        message: 'Hotel not found',
      });
    }
    const period = platformPeriod(query, todayInVietnam(now));
    const previous = previousPeriod(period);
    const [[cur], [prev], payouts] = await Promise.all([
      this.hotelFigures(period, hotelId, true),
      this.hotelFigures(previous, hotelId, true),
      this.payouts(hotelId, period),
    ]);
    const { wallet } = hotel;
    return {
      generatedAt: now.toISOString(),
      period,
      previous,
      hotel: {
        id: hotel.hotelId,
        name: hotel.name,
        city: hotel.city,
        region: regionOf(hotel.city),
        status: hotel.status,
      },
      partner: {
        id: hotel.hotelPartner.hotelPartnerId,
        name: hotel.hotelPartner.partnerName,
        status: hotel.hotelPartner.status,
        commissionRate: toNumber(hotel.hotelPartner.commissionRate),
      },
      bookings: metric(cur.bookings, prev.bookings),
      gmv: metric(money(cur.gmv), money(prev.gmv)),
      commission: metric(money(cur.commission), money(prev.commission)),
      refunds: metric(money(cur.refunds), money(prev.refunds)),
      cancellationRate: rateMetric(
        cancellationRate(cur),
        cancellationRate(prev),
      ),
      wallet: wallet && {
        available: toNumber(wallet.balanceAvailable),
        pending: toNumber(wallet.balancePending),
        reserved: toNumber(wallet.balanceReserved),
      },
      payouts,
    };
  }

  /**
   * Commission per booking (SRS 3.15.3, M6), by check-out date: `CHARGED` when the platform's commission movement
   * exists, `EXPECTED` for a stay still confirmed or under way. Cancelled bookings pay none and are not listed.
   */
  async commissions(
    query: CommissionListQuery,
    now = new Date(),
  ): Promise<Paginated<CommissionRow>> {
    const { where } = this.commissionWhere(query, now);
    const from = Prisma.sql`
      FROM booking b
      JOIN invoice i ON i.booking_id = b.booking_id
      JOIN hotel h ON h.hotel_id = b.hotel_id
      LEFT JOIN wallet_transaction c ON c.idempotency_key = 'commission:' || b.booking_id || ':platform'
      WHERE ${where}`;
    const [rows, [{ total }]] = await Promise.all([
      this.prisma.$queryRaw<CommissionSqlRow[]>`
        ${commissionColumns} ${from}
        ORDER BY b.check_out_date DESC, i.invoice_number
        LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`,
      this.prisma.$queryRaw<
        { total: number }[]
      >`SELECT count(*)::int AS total ${from}`,
    ]);
    return Paginated.of(rows.map(toCommissionRow), { ...query, total });
  }

  /** Every commission row of the query, for the export. */
  async allCommissions(
    query: Omit<CommissionListQuery, 'page' | 'pageSize'>,
    now = new Date(),
  ) {
    const { where } = this.commissionWhere(query, now);
    const rows = await this.prisma.$queryRaw<CommissionSqlRow[]>`
      ${commissionColumns}
      FROM booking b
      JOIN invoice i ON i.booking_id = b.booking_id
      JOIN hotel h ON h.hotel_id = b.hotel_id
      LEFT JOIN wallet_transaction c ON c.idempotency_key = 'commission:' || b.booking_id || ':platform'
      WHERE ${where}
      ORDER BY b.check_out_date DESC, i.invoice_number`;
    return rows.map(toCommissionRow);
  }

  /**
   * Cash flow and reconciliation (SRS 3.15.4, money-rules §5.3). The split follows the SePay money of the bookings
   * paid in the period through the wallet ledger, so a `difference` means the ledger and the invoices disagree.
   */
  async cashflow(
    query: PlatformRangeQuery,
    now = new Date(),
  ): Promise<PlatformCashflow> {
    const period = platformPeriod(query, todayInVietnam(now));
    const [start, end] = bounds(period);
    const [[flow], [unmatched], [paid], [rec]] = await Promise.all([
      this.prisma.$queryRaw<
        {
          sepay: Prisma.Decimal;
          transfers: number;
          wallet: Prisma.Decimal;
          refunded: Prisma.Decimal;
          commission: Prisma.Decimal;
          settled: Prisma.Decimal;
          pending: Prisma.Decimal;
        }[]
      >`
        WITH paid AS (
          SELECT i.booking_id, i.total_amount, i.payment_method FROM invoice i
          WHERE i.paid_at >= ${start} AND i.paid_at < ${end}
        ),
        moves AS (
          SELECT
            coalesce(sum(wt.amount) FILTER (WHERE w.owner_type = 'CUSTOMER' AND wt.type = 'REFUND' AND wt.amount > 0), 0) AS refunded,
            coalesce(sum(wt.amount) FILTER (WHERE w.owner_type = 'PLATFORM' AND wt.type = 'COMMISSION'), 0) AS commission,
            coalesce(sum(wt.amount) FILTER (WHERE w.owner_type = 'HOTEL' AND wt.type = 'SETTLEMENT' AND wt.amount > 0), 0) AS settled,
            coalesce(sum(wt.amount) FILTER (WHERE w.owner_type = 'HOTEL'
              AND (wt.type IN ('BOOKING_PAYMENT', 'REFUND', 'COMMISSION') OR (wt.type = 'SETTLEMENT' AND wt.amount < 0))), 0) AS pending
          FROM wallet_transaction wt JOIN wallet w ON w.wallet_id = wt.wallet_id
          WHERE wt.booking_id IN (SELECT booking_id FROM paid WHERE payment_method = 'SEPAY')
        )
        SELECT
          (SELECT coalesce(sum(total_amount), 0) FROM paid WHERE payment_method = 'SEPAY') AS sepay,
          (SELECT count(*) FROM paid WHERE payment_method = 'SEPAY')::int AS transfers,
          (SELECT coalesce(sum(total_amount), 0) FROM paid WHERE payment_method = 'WALLET') AS wallet,
          moves.*
        FROM moves`,
      this.prisma.$queryRaw<{ count: number; amount: Prisma.Decimal }[]>`
        SELECT count(*)::int AS count,
          coalesce(sum(CASE WHEN a.action IN ('SEPAY_TRANSFER_UNMATCHED', 'SEPAY_TRANSFER_LATE') THEN
            CASE WHEN jsonb_typeof(a.new_value::jsonb -> 'amount') = 'number'
              THEN (a.new_value::jsonb ->> 'amount')::numeric END END), 0) AS amount
        FROM audit_log a
        WHERE a.action IN ('SEPAY_TRANSFER_UNMATCHED', 'SEPAY_TRANSFER_LATE')
          AND a.created_at >= ${start} AND a.created_at < ${end}`,
      this.prisma.$queryRaw<{ count: number; amount: Prisma.Decimal }[]>`
        SELECT count(*)::int AS count, coalesce(-sum(wt.amount), 0) AS amount
        FROM audit_log a JOIN wallet_transaction wt ON wt.wallet_transaction_id = a.entity_id
        WHERE a.action = 'PAYOUT_PAID' AND a.entity_type = 'wallet_transaction'
          AND a.created_at >= ${start} AND a.created_at < ${end}`,
      this.prisma.$queryRaw<
        {
          received: Prisma.Decimal;
          paidOut: Prisma.Decimal;
          wallets: Prisma.Decimal;
        }[]
      >`
        SELECT
          (SELECT coalesce(sum(total_amount), 0) FROM invoice WHERE payment_method = 'SEPAY' AND paid_at IS NOT NULL) AS received,
          (SELECT coalesce(-sum(wt.amount), 0) FROM audit_log a
            JOIN wallet_transaction wt ON wt.wallet_transaction_id = a.entity_id
            WHERE a.action = 'PAYOUT_PAID' AND a.entity_type = 'wallet_transaction') AS "paidOut",
          (SELECT coalesce(sum(balance_available + balance_pending + balance_reserved), 0) FROM wallet) AS wallets`,
    ]);

    const parts = flow.refunded
      .plus(flow.commission)
      .plus(flow.settled)
      .plus(flow.pending);
    const bankExpected = rec.received.minus(rec.paidOut);
    return {
      generatedAt: now.toISOString(),
      period,
      received: {
        sepay: money(flow.sepay),
        transfers: flow.transfers,
        wallet: money(flow.wallet),
      },
      split: {
        refunded: money(flow.refunded),
        commission: money(flow.commission),
        hotelSettled: money(flow.settled),
        hotelPending: money(flow.pending),
        difference: money(flow.sepay.minus(parts)),
      },
      unmatched: { count: unmatched.count, amount: money(unmatched.amount) },
      payoutsPaid: { count: paid.count, amount: money(paid.amount) },
      reconciliation: {
        bankExpected: money(bankExpected),
        walletTotal: money(rec.wallets),
        difference: money(bankExpected.minus(rec.wallets)),
      },
    };
  }

  /** The transfers SePay reported that confirmed nothing or came late, in the period, for the cash flow export. */
  unmatchedTransfers(period: StatsPeriod) {
    const [start, end] = bounds(period);
    return this.prisma.auditLog.findMany({
      where: {
        action: { in: ['SEPAY_TRANSFER_UNMATCHED', 'SEPAY_TRANSFER_LATE'] },
        createdAt: { gte: start, lt: end },
      },
      orderBy: { createdAt: 'asc' },
      select: { action: true, newValue: true, createdAt: true },
    });
  }

  /** Every hotel past the draft stage over `period`, or only `hotelId` (then drafts too). */
  async hotelFigures(
    period: StatsPeriod,
    hotelId?: string,
    anyStatus = false,
  ): Promise<HotelFigures[]> {
    const [start, end] = bounds(period);
    const only = hotelId
      ? Prisma.sql`AND b.hotel_id = ${hotelId}::uuid`
      : Prisma.empty;
    const rows = await this.prisma.$queryRaw<
      (Omit<HotelFigures, 'gmv' | 'commission' | 'refunds'> & {
        gmv: Prisma.Decimal;
        commission: Prisma.Decimal;
        refunds: Prisma.Decimal;
      })[]
    >`
      WITH paid AS (
        SELECT b.hotel_id, count(*)::int AS bookings, sum(i.total_amount) AS gmv,
          count(*) FILTER (WHERE b.status = 'CANCELLED')::int AS cancelled
        FROM invoice i JOIN booking b ON b.booking_id = i.booking_id
        WHERE i.paid_at >= ${start} AND i.paid_at < ${end} ${only}
        GROUP BY 1
      ),
      comm AS (
        SELECT b.hotel_id, sum(wt.amount) AS commission
        FROM wallet_transaction wt JOIN booking b ON b.booking_id = wt.booking_id
        WHERE wt.wallet_id = ${PLATFORM_WALLET_ID}::uuid AND wt.type = 'COMMISSION'
          AND wt.created_at >= ${start} AND wt.created_at < ${end} ${only}
        GROUP BY 1
      ),
      ref AS (
        SELECT b.hotel_id, sum(wt.amount) AS refunds
        FROM wallet_transaction wt
        JOIN wallet w ON w.wallet_id = wt.wallet_id
        JOIN booking b ON b.booking_id = wt.booking_id
        WHERE w.owner_type = 'CUSTOMER' AND wt.type = 'REFUND' AND wt.amount > 0
          AND wt.created_at >= ${start} AND wt.created_at < ${end} ${only}
        GROUP BY 1
      )
      SELECT h.hotel_id AS "hotelId", h.name, h.city, h.status::text AS status,
        hp.hotel_partner_id AS "partnerId", hp.partner_name AS "partnerName",
        coalesce(paid.bookings, 0)::int AS bookings, coalesce(paid.cancelled, 0)::int AS cancelled,
        coalesce(paid.gmv, 0) AS gmv, coalesce(comm.commission, 0) AS commission, coalesce(ref.refunds, 0) AS refunds
      FROM hotel h
      JOIN hotel_partner hp ON hp.hotel_partner_id = h.hotel_partner_id
      LEFT JOIN paid ON paid.hotel_id = h.hotel_id
      LEFT JOIN comm ON comm.hotel_id = h.hotel_id
      LEFT JOIN ref ON ref.hotel_id = h.hotel_id
      WHERE ${hotelId ? Prisma.sql`h.hotel_id = ${hotelId}::uuid` : Prisma.sql`TRUE`}
        ${anyStatus ? Prisma.empty : Prisma.sql`AND h.status <> 'DRAFT'`}
      ORDER BY h.name, h.hotel_id`;
    return rows;
  }

  /** One row per day from `from` to `to`, empty days included. */
  private async days(from: string, to: string): Promise<DayRow[]> {
    const [start, end] = bounds(periodOf(from, to));
    const day = (column: Prisma.Sql) =>
      Prisma.sql`(${column} AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`;
    return this.prisma.$queryRaw<DayRow[]>`
      WITH days AS (
        SELECT d::date AS day FROM generate_series(${from}::date, ${to}::date, interval '1 day') AS d
      ),
      paid AS (
        SELECT ${day(Prisma.sql`i.paid_at`)} AS day, i.booking_id, i.total_amount, i.discount_amount
        FROM invoice i WHERE i.paid_at >= ${start} AND i.paid_at < ${end}
      ),
      -- The JSON is only read inside CASE on the action: Postgres may test the WHERE terms in any order, and a row of
      -- another action is not bound to hold JSON.
      applied AS (
        SELECT CASE WHEN a.action = 'BOOKING_DISCOUNT_APPLIED' THEN a.new_value::jsonb ->> 'bookingId' END AS booking_id,
          CASE WHEN a.action = 'BOOKING_DISCOUNT_APPLIED' THEN (a.new_value::jsonb ->> 'amount')::numeric END AS amount
        FROM audit_log a
        WHERE a.action = 'BOOKING_DISCOUNT_APPLIED'
      ),
      disc AS (
        SELECT booking_id, sum(amount) AS amount FROM applied
        WHERE booking_id IN (SELECT booking_id::text FROM paid)
        GROUP BY 1
      ),
      sales AS (
        SELECT p.day, sum(p.total_amount) AS gmv, count(*)::int AS bookings,
          sum(coalesce(d.amount, 0)) AS discounts, sum(p.discount_amount - coalesce(d.amount, 0)) AS points
        FROM paid p LEFT JOIN disc d ON d.booking_id = p.booking_id::text
        GROUP BY 1
      ),
      platform AS (
        SELECT ${day(Prisma.sql`wt.created_at`)} AS day,
          sum(wt.amount) FILTER (WHERE wt.type = 'COMMISSION') AS commission,
          -sum(wt.amount) FILTER (WHERE wt.amount < 0) AS debits
        FROM wallet_transaction wt
        WHERE wt.wallet_id = ${PLATFORM_WALLET_ID}::uuid AND wt.created_at >= ${start} AND wt.created_at < ${end}
        GROUP BY 1
      ),
      refunds AS (
        SELECT ${day(Prisma.sql`wt.created_at`)} AS day, sum(wt.amount) AS refunds
        FROM wallet_transaction wt JOIN wallet w ON w.wallet_id = wt.wallet_id
        WHERE w.owner_type = 'CUSTOMER' AND wt.type = 'REFUND' AND wt.amount > 0
          AND wt.created_at >= ${start} AND wt.created_at < ${end}
        GROUP BY 1
      )
      SELECT days.day::text AS day,
        coalesce(sales.gmv, 0) AS gmv, coalesce(sales.bookings, 0)::int AS bookings,
        coalesce(sales.discounts, 0) AS discounts, coalesce(sales.points, 0) AS points,
        coalesce(platform.commission, 0) AS commission, coalesce(platform.debits, 0) AS debits,
        coalesce(refunds.refunds, 0) AS refunds
      FROM days
      LEFT JOIN sales ON sales.day = days.day
      LEFT JOIN platform ON platform.day = days.day
      LEFT JOIN refunds ON refunds.day = days.day
      ORDER BY days.day`;
  }

  /** Withdrawals of a hotel: paid in the period, and waiting now (decision M1). */
  private async payouts(hotelId: string, period: StatsPeriod) {
    const [start, end] = bounds(period);
    const [[paid], [pending]] = await Promise.all([
      this.prisma.$queryRaw<{ count: number; amount: Prisma.Decimal }[]>`
        SELECT count(*)::int AS count, coalesce(-sum(wt.amount), 0) AS amount
        FROM audit_log a
        JOIN wallet_transaction wt ON wt.wallet_transaction_id = a.entity_id
        JOIN wallet w ON w.wallet_id = wt.wallet_id
        WHERE a.action = 'PAYOUT_PAID' AND a.entity_type = 'wallet_transaction' AND w.hotel_id = ${hotelId}::uuid
          AND a.created_at >= ${start} AND a.created_at < ${end}`,
      this.prisma.$queryRaw<{ count: number; amount: Prisma.Decimal }[]>`
        SELECT count(*)::int AS count, coalesce(-sum(wt.amount), 0) AS amount
        FROM wallet_transaction wt JOIN wallet w ON w.wallet_id = wt.wallet_id
        WHERE w.hotel_id = ${hotelId}::uuid AND wt.type = 'PAYOUT' AND ${latestEventSql} = 'PAYOUT_REQUESTED'`,
    ]);
    return {
      paidCount: paid.count,
      paidAmount: money(paid.amount),
      pendingCount: pending.count,
      pendingAmount: money(pending.amount),
    };
  }

  private commissionWhere(
    query: Omit<CommissionListQuery, 'page' | 'pageSize'>,
    now: Date,
  ) {
    const period = platformPeriod(query, todayInVietnam(now));
    const statuses = query.status ?? ['CHARGED', 'EXPECTED'];
    const charged = statuses.includes('CHARGED');
    const expected = statuses.includes('EXPECTED');
    const filters = [
      Prisma.sql`b.check_out_date BETWEEN ${period.from}::date AND ${period.to}::date`,
      charged && expected
        ? Prisma.sql`(c.wallet_transaction_id IS NOT NULL OR b.status IN ('CONFIRMED', 'CHECKED_IN'))`
        : charged
          ? Prisma.sql`c.wallet_transaction_id IS NOT NULL`
          : Prisma.sql`(c.wallet_transaction_id IS NULL AND b.status IN ('CONFIRMED', 'CHECKED_IN'))`,
    ];
    if (query.hotelId)
      filters.push(Prisma.sql`b.hotel_id = ${query.hotelId}::uuid`);
    if (query.search) {
      filters.push(
        Prisma.sql`i.invoice_number ILIKE ${`%${escapeLike(query.search)}%`}`,
      );
    }
    return { period, where: Prisma.join(filters, ' AND ') };
  }
}

interface CommissionSqlRow {
  bookingId: string;
  code: string;
  hotelId: string;
  hotelName: string;
  checkOutDate: string;
  total: Prisma.Decimal;
  rate: Prisma.Decimal;
  charged: Prisma.Decimal | null;
  chargedAt: Date | null;
}

const commissionColumns = Prisma.sql`
  SELECT b.booking_id AS "bookingId", i.invoice_number AS code, h.hotel_id AS "hotelId", h.name AS "hotelName",
    b.check_out_date::text AS "checkOutDate", i.total_amount AS total, b.commission_rate AS rate,
    c.amount AS charged, c.created_at AS "chargedAt"`;

const toCommissionRow = (r: CommissionSqlRow): CommissionRow => ({
  booking: { id: r.bookingId, code: r.code },
  hotel: { id: r.hotelId, name: r.hotelName },
  checkOutDate: r.checkOutDate,
  total: money(r.total),
  rate: money(r.rate),
  amount: r.charged
    ? money(r.charged)
    : money(
        r.total
          .times(r.rate)
          .dividedBy(100)
          .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP),
      ),
  status: r.charged ? 'CHARGED' : 'EXPECTED',
  chargedAt: r.chargedAt?.toISOString() ?? null,
});
