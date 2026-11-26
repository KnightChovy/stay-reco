import { Injectable } from '@nestjs/common';
import type {
  RecommendationExplanation,
  RecommendationQuery,
  RecommendedHotel,
  Recommendations,
} from '@stayreco/shared';
import { escapeLike } from '../../common/db/like';
import { toNumber } from '../../common/http/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { basePriceWhere } from '../rooms/room.mapper';
import { bookableHotel, sellableRoomType } from '../stays/bookable';
import { HotelStyles } from './hotel-styles';
import { PreferenceRanking } from './preference-ranking';
import { RecommendationProfiles } from './recommendation-profile';

/** What a card needs to show about a hotel, beyond what the recommendation row carries. */
export interface HotelCard {
  id: string;
  name: string;
  city: string;
  address: string;
  starRating: number | null;
  coverImageUrl: string | null;
  rating: number | null;
  reviewCount: number;
  pricePerNightFrom: number | null;
  /** Travel style ids (HotelStyles): what the recommender ranked it as. */
  styles: string[];
}

/** The model's opinion of one hotel for one customer (or, before the model knows them, their preferences'). */
export interface PersonalScore {
  /** null when ranked from the preferences: there is no recommendation row to link a booking to. */
  recommendationId: string | null;
  rank: number;
  score: number;
  reason: string | null;
}

/**
 * Serves the lists the recommender (`recommender/train.py`) writes. Nothing is computed here: the model runs offline
 * as a batch, writes `recommendation` rows under a `model_run`, and the newest COMPLETED run is the one served. A
 * customer the run has no list for (signed up after it) is ranked on the spot from the preferences they gave
 * (PreferenceRanking), until the next run includes them; one with no preferences either gets the list the run wrote
 * for signed-out visitors.
 *
 * Hotels are re-checked against BR-01 when served, so a hotel suspended since the run is never shown.
 */
@Injectable()
export class RecommendationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly preferences: PreferenceRanking,
    private readonly profiles: RecommendationProfiles,
    private readonly styles: HotelStyles,
  ) {}

  async list(
    customerId: string | null,
    query: RecommendationQuery,
  ): Promise<Recommendations> {
    const run = await this.latestRun();
    const inCity = query.city ? await this.hotelsInCity(query.city) : null;
    const modelRun = run && {
      id: run.modelRunId,
      algorithm: run.algorithm,
      version: run.version,
      finishedAt: run.finishedAt!.toISOString(),
    };

    // A customer the newest run does not know: their own preferences, ranked now, rather than everyone's list.
    if (
      customerId &&
      !(run && (await this.knownTo(run.modelRunId, customerId)))
    ) {
      const ranked = await this.preferences.rank(
        customerId,
        inCity ?? undefined,
      );
      if (ranked) {
        const top = ranked.slice(0, query.limit);
        const cards = await this.cards(top.map((r) => r.hotelId));
        const items: RecommendedHotel[] = top.flatMap((r) => {
          const card = cards.get(r.hotelId);
          return card
            ? [
                {
                  ...card,
                  recommendationId: null,
                  rank: r.rank,
                  score: r.score,
                  reason: r.reason,
                  isNew: card.reviewCount === 0,
                  explanation: r.explanation,
                },
              ]
            : [];
        });
        return {
          personalized: true,
          source: 'PREFERENCES',
          modelRun,
          items,
          profile: await this.profiles.of(customerId, items),
        };
      }
    }
    if (!run) {
      return {
        personalized: false,
        source: 'POPULAR',
        modelRun: null,
        items: [],
        profile: null,
      };
    }
    const rowsFor = (customer: string | null) =>
      this.prisma.recommendation.findMany({
        where: {
          modelRunId: run.modelRunId,
          customerId: customer,
          hotelId: inCity ? { in: inCity } : { not: null },
          hotel: {
            ...bookableHotel,
            // Only where their next stay already is, as the recommender leaves out: a hotel they stayed at and liked
            // is on their list on purpose ("Bạn đã ở đây và chấm 4.8★").
            ...(customerId && {
              bookings: {
                none: {
                  customerId,
                  status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
                },
              },
            }),
          },
        },
        orderBy: { rank: 'asc' },
        take: query.limit,
        select: {
          recommendationId: true,
          hotelId: true,
          rank: true,
          score: true,
          reason: true,
          explanation: true,
        },
      });

    let personalized = customerId !== null;
    let rows = customerId ? await rowsFor(customerId) : [];
    if (!rows.length) {
      // No list of their own yet; whether they exist at all is the controller's business, not this one's.
      const hasOwn =
        customerId !== null &&
        (await this.prisma.recommendation.count({
          where: { modelRunId: run.modelRunId, customerId },
        })) > 0;
      if (!hasOwn) {
        personalized = false;
        rows = await rowsFor(null);
      }
    }

    const cards = await this.cards(rows.map((r) => r.hotelId!));
    const items: RecommendedHotel[] = rows.flatMap((r) => {
      const card = cards.get(r.hotelId!);
      if (!card) return [];
      return [
        {
          ...card,
          recommendationId: personalized ? r.recommendationId : null,
          rank: r.rank ?? 0,
          score: toNumber(r.score),
          reason: r.reason,
          isNew: card.reviewCount === 0,
          explanation:
            (r.explanation as RecommendationExplanation | null) ?? null,
        },
      ];
    });
    return {
      personalized,
      source: personalized ? 'MODEL' : 'POPULAR',
      modelRun,
      items,
      profile:
        personalized && customerId
          ? await this.profiles.of(customerId, items)
          : null,
    };
  }

  /**
   * The model's rank and reason for each of these hotels, for this customer; hotels outside their list are absent.
   * A customer the newest run does not know is ranked from their preferences instead, so the search's "Phù hợp nhất"
   * and the assistant fit them from their first minute too.
   */
  async personalScores(
    customerId: string,
    hotelIds: string[],
  ): Promise<Map<string, PersonalScore>> {
    if (!hotelIds.length) return new Map();
    const run = await this.latestRun();
    if (!run || !(await this.knownTo(run.modelRunId, customerId))) {
      const ranked = await this.preferences.rank(customerId, hotelIds);
      return new Map(
        (ranked ?? []).map((r) => [
          r.hotelId,
          {
            recommendationId: null,
            rank: r.rank,
            score: r.score,
            reason: r.reason,
          },
        ]),
      );
    }
    const rows = await this.prisma.recommendation.findMany({
      where: {
        modelRunId: run.modelRunId,
        customerId,
        hotelId: { in: hotelIds },
      },
      select: {
        recommendationId: true,
        hotelId: true,
        rank: true,
        score: true,
        reason: true,
      },
    });
    return new Map(
      rows.map((r) => [
        r.hotelId!,
        {
          recommendationId: r.recommendationId,
          rank: r.rank ?? Number.MAX_SAFE_INTEGER,
          score: toNumber(r.score),
          reason: r.reason,
        },
      ]),
    );
  }

  /** Card fields of these hotels (bookable ones only), keyed by id. */
  async cards(hotelIds: string[]): Promise<Map<string, HotelCard>> {
    if (!hotelIds.length) return new Map();
    const [hotels, ratings, styles] = await Promise.all([
      this.prisma.hotel.findMany({
        where: { ...bookableHotel, hotelId: { in: hotelIds } },
        select: {
          hotelId: true,
          name: true,
          city: true,
          address: true,
          starRating: true,
          hotelImages: {
            where: { isCover: true },
            take: 1,
            select: { imageUrl: true },
          },
          roomTypes: {
            where: sellableRoomType,
            select: {
              prices: {
                where: basePriceWhere,
                select: { pricePerNight: true },
              },
            },
          },
        },
      }),
      this.prisma.review.groupBy({
        by: ['hotelId'],
        where: { hotelId: { in: hotelIds }, isVisible: true },
        _avg: { overallRating: true },
        _count: { _all: true },
      }),
      this.styles.of(hotelIds),
    ]);
    const ratingOf = new Map(ratings.map((r) => [r.hotelId, r]));
    return new Map(
      hotels.map((h) => {
        const prices = h.roomTypes
          .flatMap((rt) => rt.prices.map((p) => toNumber(p.pricePerNight)))
          .filter((p): p is number => p !== null);
        const r = ratingOf.get(h.hotelId);
        const avg = toNumber(r?._avg.overallRating ?? null);
        return [
          h.hotelId,
          {
            id: h.hotelId,
            name: h.name,
            city: h.city,
            address: h.address,
            starRating: h.starRating,
            coverImageUrl: h.hotelImages[0]?.imageUrl ?? null,
            rating: avg === null ? null : Math.round(avg * 10) / 10,
            reviewCount: r?._count._all ?? 0,
            pricePerNightFrom: prices.length ? Math.min(...prices) : null,
            styles: styles.get(h.hotelId) ?? [],
          },
        ];
      }),
    );
  }

  /** Whether the run wrote a list for this customer. */
  private async knownTo(modelRunId: string, customerId: string) {
    return (
      (await this.prisma.recommendation.count({
        where: { modelRunId, customerId },
      })) > 0
    );
  }

  private async latestRun() {
    const latest = (algorithm: string) =>
      this.prisma.modelRun.findFirst({
        where: { algorithm, status: 'COMPLETED', finishedAt: { not: null } },
        orderBy: [{ startedAt: 'desc' }, { modelRunId: 'desc' }],
        select: {
          modelRunId: true,
          algorithm: true,
          version: true,
          finishedAt: true,
        },
      });
    return (
      (await latest('two-sided-shrinkage')) ?? latest('stayreco-two-sided')
    );
  }

  /** Hotels whose city matches, ignoring case and Vietnamese accents, as the search does. */
  private async hotelsInCity(city: string): Promise<string[]> {
    const pattern = `%${escapeLike(city)}%`;
    const rows = await this.prisma.$queryRaw<{ hotel_id: string }[]>`
      SELECT hotel_id FROM hotel WHERE unaccent(city) ILIKE unaccent(${pattern})`;
    return rows.map((r) => r.hotel_id);
  }
}
