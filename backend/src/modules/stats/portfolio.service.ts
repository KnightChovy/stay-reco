import { Injectable } from '@nestjs/common';
import type {
  PartnerPortfolio,
  PortfolioHotel,
  StatsRangeQuery,
} from '@stayreco/shared';
import { todayInVietnam } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActionItemsService } from './action-items.service';
import {
  metric,
  previousPeriod,
  rateMetric,
  ratio,
  resolvePeriod,
} from './stats-math';
import { StatsService, type Totals } from './stats.service';

/** The parts of `Totals` the portfolio adds up over the hotels. */
type Summed = Pick<Totals, 'revenue' | 'net' | 'nightsSold' | 'roomsAvailable'>;

const zero = (): Summed => ({
  revenue: new Prisma.Decimal(0),
  net: new Prisma.Decimal(0),
  nightsSold: 0,
  roomsAvailable: 0,
});

const add = (a: Summed, b: Summed): Summed => ({
  revenue: a.revenue.plus(b.revenue),
  net: a.net.plus(b.net),
  nightsSold: a.nightsSold + b.nightsSold,
  roomsAvailable: a.roomsAvailable + b.roomsAvailable,
});

const occupancy = (t: Summed) => ratio(t.nightsSold, t.roomsAvailable, 1, 100);

/**
 * Every hotel of a partner over one period (docs/api/partner-dashboard.md §4.7): each hotel's revenue, net received,
 * occupancy and rating, the same figures as its own overview, plus its open action items, and the totals. Occupancy
 * of the totals is computed from the summed room nights, never as an average of the hotels' rates.
 */
@Injectable()
export class PortfolioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stats: StatsService,
    private readonly actionItems: ActionItemsService,
  ) {}

  async portfolio(
    partnerId: string,
    query: StatsRangeQuery,
    now = new Date(),
  ): Promise<PartnerPortfolio> {
    const period = resolvePeriod(query, todayInVietnam(now));
    const previous = previousPeriod(period);
    const partner = await this.prisma.hotelPartner.findUniqueOrThrow({
      where: { hotelPartnerId: partnerId },
      select: {
        status: true,
        hotels: {
          select: { hotelId: true, name: true, city: true, status: true },
          orderBy: [{ name: 'asc' }, { hotelId: 'asc' }],
        },
      },
    });

    const hotels: PortfolioHotel[] = [];
    let cur = zero();
    let prev = zero();
    // One hotel at a time: each already runs its queries in parallel, and a partner has a handful of hotels.
    for (const h of partner.hotels) {
      const [totals, items] = await Promise.all([
        this.stats.periodTotals(h.hotelId, period, previous),
        this.actionItems.list(
          {
            hotelId: h.hotelId,
            role: 'OWNER',
            permissions: [],
            partnerSuspended: partner.status === 'SUSPENDED',
          },
          now,
        ),
      ]);
      cur = add(cur, totals.cur);
      prev = add(prev, totals.prev);
      const count = (severity: string) =>
        items.items.filter((i) => i.severity === severity).length;
      hotels.push({
        hotel: { id: h.hotelId, name: h.name, city: h.city, status: h.status },
        roomRevenue: metric(
          toNumber(totals.cur.revenue),
          toNumber(totals.prev.revenue),
        ),
        netEarnings: metric(
          toNumber(totals.cur.net),
          toNumber(totals.prev.net),
        ),
        occupancyRate: rateMetric(
          occupancy(totals.cur),
          occupancy(totals.prev),
        ),
        avgRating: totals.rating,
        actionItems: { critical: count('CRITICAL'), warning: count('WARNING') },
      });
    }

    return {
      generatedAt: now.toISOString(),
      period,
      previous,
      hotels,
      totals: {
        roomRevenue: metric(toNumber(cur.revenue), toNumber(prev.revenue)),
        netEarnings: metric(toNumber(cur.net), toNumber(prev.net)),
        occupancyRate: rateMetric(occupancy(cur), occupancy(prev)),
      },
    };
  }
}
