import { Injectable } from '@nestjs/common';
import type { RecommenderEvaluation } from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import { PrismaService } from '../../prisma/prisma.service';

/** How train.py names the methods of its comparison (reco_pipeline.evaluate). */
const METHODS: Record<string, RecommenderEvaluation['methods'][number]['key']> =
  {
    'StayReco two-sided (served)': 'served',
    'CF only (SVD++)': 'cf',
    'Content only': 'content',
    Popularity: 'popularity',
    Random: 'random',
  };
/** The order the page shows them in (Postgres keeps no key order in jsonb). */
const ORDER = ['served', 'content', 'cf', 'popularity', 'random'];
const GROUPS = ['0-none', '0-prefs', '1-4', '5+'] as const;

interface StoredMethod {
  rmse?: number | null;
  precision?: number | null;
  recall?: number | null;
  ndcg?: number | null;
  new_share?: number | null;
  coldstart_coverage?: number | null;
  coverage?: number | null;
  tail_share?: number | null;
  by_group?: Record<
    string,
    { users: number; recall: number | null; ndcg: number | null }
  >;
}

interface StoredRun {
  comparison?: Record<string, StoredMethod>;
  split?: {
    train: number;
    test: number;
    ranked_users: number;
    catalog: number;
    hidden_or_new_hotels: number;
  };
}

const num = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/**
 * The evidence page of the admin (`GET /admin/recommender/evaluation`): the offline evaluation the served run made of
 * itself against the baselines (stored by train.py in `model_run`), where its lists put their top 10 by how reviewed
 * the hotels are, and how many recent bookings came from a recommendation. Everything is read, nothing is computed
 * from the model here.
 */
@Injectable()
export class RecommenderEvaluationService {
  constructor(private readonly prisma: PrismaService) {}

  async latest(now = new Date()): Promise<RecommenderEvaluation> {
    const run = await this.servedRun();
    const [longTail, bookings, customers] = await Promise.all([
      run ? this.longTail(run.modelRunId) : Promise.resolve([]),
      this.bookings(now),
      run
        ? this.prisma.recommendation
            .findMany({
              where: { modelRunId: run.modelRunId, customerId: { not: null } },
              distinct: ['customerId'],
              select: { customerId: true },
            })
            .then((rows) => rows.length)
        : Promise.resolve(0),
    ]);
    const stored = (run?.hyperparameters ?? {}) as StoredRun;
    const split = stored.split;
    return {
      run: run && {
        id: run.modelRunId,
        version: run.version,
        finishedAt: run.finishedAt!.toISOString(),
        customers,
        hotels: longTail.reduce((sum, band) => sum + band.hotels, 0),
      },
      split:
        run && split
          ? {
              train: split.train,
              test: split.test,
              rankedUsers: split.ranked_users,
              catalog: split.catalog,
              hiddenHotels: split.hidden_or_new_hotels,
              k: run.k ?? 10,
              threshold: toNumber(run.relevanceThreshold) ?? 4,
            }
          : null,
      methods: Object.entries(stored.comparison ?? {})
        .flatMap(([name, m]) =>
          METHODS[name]
            ? [
                {
                  key: METHODS[name],
                  rmse: num(m.rmse),
                  precision: num(m.precision),
                  recall: num(m.recall),
                  ndcg: num(m.ndcg),
                  newShare: num(m.new_share),
                  coldstartCoverage: num(m.coldstart_coverage),
                  coverage: num(m.coverage),
                  tailShare: num(m.tail_share),
                  byGroup: GROUPS.flatMap((group) => {
                    const g = m.by_group?.[group];
                    return g && num(g.recall) !== null && num(g.ndcg) !== null
                      ? [
                          {
                            group,
                            users: g.users,
                            recall: g.recall!,
                            ndcg: g.ndcg!,
                          },
                        ]
                      : [];
                  }),
                },
              ]
            : [],
        )
        .sort((a, b) => ORDER.indexOf(a.key) - ORDER.indexOf(b.key)),
      longTail,
      bookings,
    };
  }

  /** The 5 popularity bands of the bookable hotels against the top-10 slots of every customer list in the run. */
  private async longTail(modelRunId: string) {
    const rows = await this.prisma.$queryRaw<
      {
        band: number;
        hotels: bigint;
        min_reviews: bigint;
        max_reviews: bigint;
        review_share: number;
        slot_share: number;
      }[]
    >`
      WITH pop AS (
        SELECT h.hotel_id, count(r.review_id) AS n
        FROM hotel h LEFT JOIN review r ON r.hotel_id = h.hotel_id AND r.is_visible
        WHERE h.status = 'ACTIVE'
        GROUP BY h.hotel_id
      ), banded AS (
        SELECT hotel_id, n, ntile(5) OVER (ORDER BY n DESC, hotel_id) AS band FROM pop
      ), slots AS (
        SELECT x.hotel_id FROM recommendation x
        WHERE x.model_run_id = ${modelRunId}::uuid AND x.customer_id IS NOT NULL AND x.rank <= 10
      )
      SELECT b.band::int AS band, count(*) AS hotels, min(b.n) AS min_reviews, max(b.n) AS max_reviews,
             coalesce(sum(b.n)::float / nullif((SELECT sum(n) FROM pop), 0), 0) AS review_share,
             coalesce((SELECT count(*) FROM slots s JOIN banded b2 USING (hotel_id) WHERE b2.band = b.band)::float
                      / nullif((SELECT count(*) FROM slots), 0), 0) AS slot_share
      FROM banded b GROUP BY b.band ORDER BY b.band`;
    return rows.map((r) => ({
      band: r.band,
      hotels: Number(r.hotels),
      minReviews: Number(r.min_reviews),
      maxReviews: Number(r.max_reviews),
      reviewShare: Math.round(r.review_share * 1000) / 1000,
      slotShare: Math.round(r.slot_share * 1000) / 1000,
    }));
  }

  /** Bookings of the last 30 days that went ahead, and the rank the booked hotel had when it came from a list. */
  private async bookings(now: Date) {
    const since = new Date(now.getTime() - 30 * 86_400_000);
    const rows = await this.prisma.booking.findMany({
      where: {
        createdAt: { gte: since },
        status: { notIn: ['CANCELLED', 'EXPIRED'] },
      },
      select: { recommendation: { select: { rank: true } } },
    });
    const ranks = rows
      .flatMap((r) => (r.recommendation?.rank ? [r.recommendation.rank] : []))
      .sort((a, b) => a - b);
    const fromRecommendations = rows.filter((r) => r.recommendation).length;
    const middle = Math.floor(ranks.length / 2);
    return {
      total: rows.length,
      fromRecommendations,
      medianRank: ranks.length
        ? ranks.length % 2
          ? ranks[middle]
          : (ranks[middle - 1] + ranks[middle]) / 2
        : null,
    };
  }

  private async servedRun() {
    const latest = (algorithm: string) =>
      this.prisma.modelRun.findFirst({
        where: { algorithm, status: 'COMPLETED', finishedAt: { not: null } },
        orderBy: [{ startedAt: 'desc' }, { modelRunId: 'desc' }],
      });
    return (
      (await latest('two-sided-shrinkage')) ?? latest('stayreco-two-sided')
    );
  }
}
