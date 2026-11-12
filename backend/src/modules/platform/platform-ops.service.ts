import { Injectable } from '@nestjs/common';
import {
  placeKey,
  type PlatformHotelListQuery,
  type PlatformHotelRow,
  type PlatformOverview,
  type PlatformRangeQuery,
  regionOf,
  type StatsPeriod,
} from '@stayreco/shared';
import {
  addDays,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { latestEventSql, payoutDueBy } from '../payouts/payout-events';
import { metric, previousPeriod, ratio, round } from '../stats/stats-math';
import { latestSuspensionSql } from './compliance-events';
import { PlatformStatsService, platformPeriod } from './platform-stats.service';

const startOf = (date: string) => vietnamDateTime(date, '00:00');
const bounds = (p: StatsPeriod) =>
  [startOf(p.from), startOf(addDays(p.to, 1))] as const;
const iso = (d: Date | null) => d?.toISOString() ?? null;

interface HotelExtras {
  hotelId: string;
  status: PlatformHotelRow['status'];
  partnerStatus: PlatformHotelRow['partner']['status'];
  rooms: number;
  verifiedAt: Date | null;
  rating: Prisma.Decimal | null;
  reviews: number;
  openCases: number;
}

/**
 * The platform manager's operations figures (UC69, UC71; SRS 3.14.1, 3.14.4): the dashboard with its action queue,
 * and the hotels list with each hotel's activity, cancellations and satisfaction.
 */
@Injectable()
export class PlatformOpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly money: PlatformStatsService,
  ) {}

  async overview(
    query: PlatformRangeQuery,
    now = new Date(),
  ): Promise<PlatformOverview> {
    const period = platformPeriod(query, todayInVietnam(now));
    const previous = previousPeriod(period);
    const [cs, ce] = bounds(period);
    const [ps, pe] = bounds(previous);
    const [revenue, [counts], payouts, [queue]] = await Promise.all([
      this.money.revenue(
        { from: period.from, to: period.to, granularity: 'month' },
        now,
      ),
      this.prisma.$queryRaw<
        {
          partnersActive: number;
          partnersNew: number;
          partnersNewPrev: number;
          hotelsActive: number;
          hotelsNew: number;
          hotelsNewPrev: number;
          customers: number;
          customersNew: number;
          customersNewPrev: number;
        }[]
      >`
        WITH first_approval AS (
          SELECT hotel_id, min(reviewed_at) AS at FROM hotel_verification_request
          WHERE status = 'APPROVED' GROUP BY 1
        ),
        customers AS (
          SELECT created_at FROM user_account WHERE role = 'CUSTOMER' AND status <> 'DELETED'
        )
        SELECT
          (SELECT count(*) FROM hotel_partner WHERE status = 'APPROVED')::int AS "partnersActive",
          (SELECT count(*) FROM hotel_partner WHERE created_at >= ${cs} AND created_at < ${ce})::int AS "partnersNew",
          (SELECT count(*) FROM hotel_partner WHERE created_at >= ${ps} AND created_at < ${pe})::int AS "partnersNewPrev",
          (SELECT count(*) FROM hotel WHERE status = 'ACTIVE')::int AS "hotelsActive",
          (SELECT count(*) FROM first_approval WHERE at >= ${cs} AND at < ${ce})::int AS "hotelsNew",
          (SELECT count(*) FROM first_approval WHERE at >= ${ps} AND at < ${pe})::int AS "hotelsNewPrev",
          (SELECT count(*) FROM customers)::int AS customers,
          (SELECT count(*) FROM customers WHERE created_at >= ${cs} AND created_at < ${ce})::int AS "customersNew",
          (SELECT count(*) FROM customers WHERE created_at >= ${ps} AND created_at < ${pe})::int AS "customersNewPrev"`,
      this.prisma.$queryRaw<{ amount: Prisma.Decimal; createdAt: Date }[]>`
        SELECT -wt.amount AS amount, wt.created_at AS "createdAt"
        FROM wallet_transaction wt
        WHERE wt.type = 'PAYOUT' AND ${latestEventSql} = 'PAYOUT_REQUESTED'
        ORDER BY wt.created_at`,
      this.prisma.$queryRaw<
        {
          verifications: number;
          oldestVerification: Date | null;
          reports: number;
          oldestReport: Date | null;
          cases: number;
          critical: number;
          suspensions: number;
        }[]
      >`
        SELECT
          (SELECT count(*) FROM hotel_verification_request WHERE status = 'PENDING')::int AS verifications,
          (SELECT min(created_at) FROM hotel_verification_request WHERE status = 'PENDING') AS "oldestVerification",
          (SELECT count(*) FROM content_report WHERE status IN ('OPEN', 'INVESTIGATING'))::int AS reports,
          (SELECT min(created_at) FROM content_report WHERE status IN ('OPEN', 'INVESTIGATING')) AS "oldestReport",
          (SELECT count(*) FROM policy_violation WHERE status IN ('OPEN', 'INVESTIGATING'))::int AS cases,
          (SELECT count(*) FROM policy_violation
            WHERE status IN ('OPEN', 'INVESTIGATING') AND severity = 'CRITICAL')::int AS critical,
          (SELECT count(*) FROM policy_violation p WHERE ${latestSuspensionSql} = 'SUSPENSION_REQUESTED')::int AS suspensions`,
    ]);

    return {
      generatedAt: now.toISOString(),
      period,
      previous,
      partners: {
        active: counts.partnersActive,
        new: metric(counts.partnersNew, counts.partnersNewPrev),
      },
      hotels: {
        active: counts.hotelsActive,
        new: metric(counts.hotelsNew, counts.hotelsNewPrev),
      },
      customers: {
        total: counts.customers,
        new: metric(counts.customersNew, counts.customersNewPrev),
      },
      bookings: revenue.totals.bookings,
      gmv: revenue.totals.gmv,
      commission: revenue.totals.commission,
      queue: {
        verifications: {
          pending: queue.verifications,
          oldestSubmittedAt: iso(queue.oldestVerification),
        },
        payouts: {
          pending: payouts.length,
          amount: payouts.reduce((s, p) => s + toNumber(p.amount), 0),
          overdue: payouts.filter((p) => now > payoutDueBy(p.createdAt)).length,
          oldestRequestedAt: iso(payouts[0]?.createdAt ?? null),
        },
        contentReports: {
          open: queue.reports,
          oldestCreatedAt: iso(queue.oldestReport),
        },
        complianceCases: { open: queue.cases, critical: queue.critical },
        suspensionRequests: { pending: queue.suspensions },
      },
    };
  }

  /** Every hotel past the draft stage (BR-21: one row per hotel), filtered, sorted and paged. */
  async hotels(
    query: PlatformHotelListQuery,
    now = new Date(),
  ): Promise<Paginated<PlatformHotelRow>> {
    const period = platformPeriod(query, todayInVietnam(now));
    const [figures, extras] = await Promise.all([
      this.money.hotelFigures(period),
      this.extras(),
    ]);
    const byId = new Map(extras.map((e) => [e.hotelId, e]));
    const search = query.search ? placeKey(query.search) : null;

    const rows: PlatformHotelRow[] = figures.flatMap((f) => {
      const e = byId.get(f.hotelId);
      if (!e) return [];
      const row: PlatformHotelRow = {
        id: f.hotelId,
        name: f.name,
        city: f.city,
        region: regionOf(f.city),
        status: e.status,
        partner: {
          id: f.partnerId,
          name: f.partnerName,
          status: e.partnerStatus,
        },
        rooms: e.rooms,
        verifiedAt: iso(e.verifiedAt),
        bookings: f.bookings,
        cancellationRate: ratio(f.cancelled, f.bookings, 1, 100),
        gmv: toNumber(f.gmv),
        rating: {
          average: e.rating === null ? null : round(e.rating, 1),
          count: e.reviews,
        },
        openCases: e.openCases,
      };
      if (
        query.status &&
        !query.status.includes(row.status as (typeof query.status)[number])
      )
        return [];
      if (
        query.partnerStatus &&
        !query.partnerStatus.includes(row.partner.status)
      )
        return [];
      if (query.region && row.region !== query.region) return [];
      if (
        search &&
        !placeKey(row.name).includes(search) &&
        !placeKey(row.partner.name).includes(search)
      )
        return [];
      return [row];
    });

    const rank = (v: number | null, empty: number) => (v === null ? empty : v);
    const by: Record<
      PlatformHotelListQuery['sort'],
      (a: PlatformHotelRow, b: PlatformHotelRow) => number
    > = {
      'bookings-desc': (a, b) => b.bookings - a.bookings,
      'cancellationRate-desc': (a, b) =>
        rank(b.cancellationRate, -1) - rank(a.cancellationRate, -1),
      // Weakest first; hotels without reviews last.
      'rating-asc': (a, b) =>
        rank(a.rating.average, Infinity) - rank(b.rating.average, Infinity),
      'gmv-desc': (a, b) => b.gmv - a.gmv,
      'name-asc': () => 0,
    };
    rows.sort(
      (a, b) =>
        by[query.sort](a, b) ||
        a.name.localeCompare(b.name, 'vi') ||
        a.id.localeCompare(b.id),
    );
    return Paginated.of(
      rows.slice(
        (query.page - 1) * query.pageSize,
        query.page * query.pageSize,
      ),
      {
        page: query.page,
        pageSize: query.pageSize,
        total: rows.length,
      },
    );
  }

  /** What the hotels list adds to the money figures: statuses, rooms, verification, rating, open cases. */
  private extras() {
    return this.prisma.$queryRaw<HotelExtras[]>`
      SELECT h.hotel_id AS "hotelId", h.status::text AS status, hp.status::text AS "partnerStatus",
        (SELECT count(*) FROM room r JOIN room_type rt ON rt.room_type_id = r.room_type_id
          WHERE rt.hotel_id = h.hotel_id)::int AS rooms,
        (SELECT max(reviewed_at) FROM hotel_verification_request v
          WHERE v.hotel_id = h.hotel_id AND v.status = 'APPROVED') AS "verifiedAt",
        (SELECT avg(overall_rating) FROM review rv WHERE rv.hotel_id = h.hotel_id AND rv.is_visible) AS rating,
        (SELECT count(*) FROM review rv WHERE rv.hotel_id = h.hotel_id AND rv.is_visible)::int AS reviews,
        (SELECT count(*) FROM policy_violation p
          JOIN audit_log a ON a.entity_type = 'policy_violation' AND a.entity_id = p.policy_violation_id
            AND a.action = 'VIOLATION_OPENED'
          WHERE p.status IN ('OPEN', 'INVESTIGATING')
            AND (CASE WHEN a.action = 'VIOLATION_OPENED' THEN a.new_value::jsonb ->> 'hotelId' END)
              = h.hotel_id::text)::int AS "openCases"
      FROM hotel h JOIN hotel_partner hp ON hp.hotel_partner_id = h.hotel_partner_id
      WHERE h.status <> 'DRAFT'`;
  }
}
