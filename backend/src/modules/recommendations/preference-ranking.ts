import { Injectable } from '@nestjs/common';
import type { RecommendationExplanation } from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { fold, STYLE_PHRASES, tasteFit } from '../onboarding/onboarding-taste';
import { basePriceWhere } from '../rooms/room.mapper';
import { bookableHotel, sellableRoomType } from '../stays/bookable';

/** A hotel whose cheapest night is more than this over the budget comes after the others (the recommender's). */
const BUDGET_SLACK = 1.2;

/** The preference keys this ranking reads (written by onboarding and /account/preferences). */
const KEYS = [
  'travelStyles',
  'roomAmenities',
  'preferredViews',
  'preferredCities',
  'favouriteCity',
  'budgetPerNight',
] as const;

export interface PreferenceRank {
  hotelId: string;
  rank: number;
  /** On the model's 1-5 scale, so the field means the same whichever list it comes from. */
  score: number;
  reason: string;
  /** As the model writes it: everything from the preferences (content), no history yet. */
  explanation: RecommendationExplanation;
}

const split = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Recommendations for a customer the newest training run does not know yet (they signed up, or gave their
 * preferences, after it ran), computed on the spot from those preferences, so the list fits them from their first
 * minute instead of the next night.
 *
 * For such a customer the model itself has nothing but the preferences: with no stays the paper's weights give
 * collaborative filtering nothing and content everything. So this uses what the model uses, in the order it uses it
 * (recommender/reco_pipeline.py `recommend`): within budget first, then hotels of a chosen travel style, then in the
 * cities picked, then by how much of the preferences the hotel's own text matches, then its guests' rating. A hotel's
 * styles are read by the same phrases and rule as the onboarding hotel step and recommender/styles.py. Measured
 * against the model's lists for guests with no stays: 80% of the top 10 in common, 2 of the top 3 for 94% of them.
 * The next run replaces it with the model's own list.
 */
@Injectable()
export class PreferenceRanking {
  constructor(private readonly prisma: PrismaService) {}

  /** The customer's ranking, or null when they have given no preference to rank by. */
  async rank(
    customerId: string,
    hotelIds?: string[],
  ): Promise<PreferenceRank[] | null> {
    const rows = await this.prisma.customerPreference.findMany({
      where: { customerId, preferenceKey: { in: [...KEYS] } },
      select: { preferenceKey: true, preferenceValue: true },
    });
    const prefs = Object.fromEntries(
      rows.map((r) => [r.preferenceKey, r.preferenceValue]),
    ) as Partial<Record<(typeof KEYS)[number], string>>;
    const travelStyles = split(prefs.travelStyles).filter(
      (s) => s in STYLE_PHRASES,
    );
    const roomAmenities = split(prefs.roomAmenities);
    const viewIds = split(prefs.preferredViews);
    const cities = new Set(
      (split(prefs.preferredCities).length
        ? split(prefs.preferredCities)
        : split(prefs.favouriteCity)
      ).map(fold),
    );
    const budget = Number(prefs.budgetPerNight) || null;
    if (
      !travelStyles.length &&
      !roomAmenities.length &&
      !viewIds.length &&
      !cities.size &&
      !budget
    ) {
      return null;
    }

    const [hotels, ratings, views] = await Promise.all([
      this.prisma.hotel.findMany({
        where: {
          ...bookableHotel,
          ...(hotelIds && { hotelId: { in: hotelIds } }),
          // As the model does: not a hotel where the customer's next stay already is.
          bookings: {
            none: {
              customerId,
              status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
            },
          },
        },
        select: {
          hotelId: true,
          name: true,
          city: true,
          description: true,
          hotelAmenities: {
            select: { amenity: { select: { amenityId: true, name: true } } },
          },
          roomTypes: {
            where: sellableRoomType,
            select: {
              name: true,
              roomTypeAmenities: {
                select: {
                  amenity: { select: { amenityId: true, name: true } },
                },
              },
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
        where: { isVisible: true, hotel: bookableHotel },
        _avg: { overallRating: true },
        _count: true,
      }),
      this.prisma.amenity.findMany({
        where: { amenityId: { in: viewIds } },
        select: { amenityId: true, name: true },
      }),
    ]);
    const ratingOf = new Map(ratings.map((r) => [r.hotelId, r]));
    const viewNames = new Map(views.map((v) => [v.amenityId, v.name]));
    const styleLabel = (id: string) =>
      STYLE_PHRASES[id].label.toLocaleLowerCase('vi');

    const scored = hotels.map((h) => {
      const amenities = [
        ...h.hotelAmenities.map((a) => a.amenity),
        ...h.roomTypes.flatMap((rt) =>
          rt.roomTypeAmenities.map((a) => a.amenity),
        ),
      ];
      const fit = tasteFit(
        {
          text: [
            h.name,
            h.description,
            ...amenities.map((a) => a.name),
            ...h.roomTypes.map((rt) => rt.name),
          ]
            .filter(Boolean)
            .join(' '),
          amenityIds: new Set(amenities.map((a) => a.amenityId)),
        },
        { travelStyles, roomAmenities, viewIds },
        viewNames,
      );
      const prices = h.roomTypes
        .flatMap((rt) => rt.prices.map((p) => toNumber(p.pricePerNight)))
        .filter((p): p is number => p !== null);
      const from = prices.length ? Math.min(...prices) : null;
      const r = ratingOf.get(h.hotelId);
      const rating = toNumber(r?._avg.overallRating ?? null) ?? 0;
      return {
        hotel: h,
        fit,
        rating,
        reviews: r?._count ?? 0,
        over: budget !== null && from !== null && from > budget * BUDGET_SLACK,
        offStyle: travelStyles.length > 0 && fit.styles.length === 0,
        away: cities.size > 0 && !cities.has(fold(h.city)),
      };
    });

    scored.sort(
      (a, b) =>
        Number(a.over) - Number(b.over) ||
        Number(a.offStyle) - Number(b.offStyle) ||
        Number(a.away) - Number(b.away) ||
        b.fit.score - a.fit.score ||
        b.rating - a.rating ||
        b.reviews - a.reviews ||
        a.hotel.name.localeCompare(b.hotel.name, 'vi'),
    );

    return scored.map((s, i) => {
      const parts = [
        s.fit.styles.length &&
          `phong cách ${s.fit.styles.map(styleLabel).join(', ')}`,
        !s.away && cities.size && `ở ${s.hotel.city}`,
      ].filter(Boolean);
      const reason = [
        s.away && 'Ngoài điểm đến bạn chọn.',
        s.over && 'Trên ngân sách bạn đặt.',
        parts.length
          ? `Hợp sở thích bạn vừa chọn: ${parts.join('; ')}.`
          : 'Gợi ý theo sở thích bạn vừa chọn.',
      ]
        .filter(Boolean)
        .join(' ');
      // Mapped onto the model's predicted-rating scale: a strong fit reads as a 4-5, no fit as about 3.
      const score =
        Math.round(Math.min(5, 3 + s.fit.score * 0.2) * 1000) / 1000;
      return {
        hotelId: s.hotel.hotelId,
        rank: i + 1,
        score,
        reason,
        explanation: {
          weights: { history: 0, content: 1, group: 0 },
          scores: { history: null, content: score, group: null },
          stays: 0,
          hotelRatings: s.reviews,
          own: null,
          similar: null,
          picked: null,
          styles: s.fit.styles.map(styleLabel),
          inCity: cities.size ? !s.away : null,
          overBudget: s.over,
        },
      };
    });
  }
}
