import { Injectable } from '@nestjs/common';
import type { RecommendationProfile, RecommendedHotel } from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import { fold } from '../onboarding/onboarding-taste';
import { HotelStyles } from './hotel-styles';

/** The recommender's shrinkage constant for the history part (recommender/weights.py K_USER). */
const K_USER = 5;
/** A hotel this far over the budget per night still counts as within it (recommender BUDGET_SLACK). */
const BUDGET_SLACK = 1.2;

const split = (value: string | undefined) =>
  (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * What a customer's list is built from, for the "Hệ thống hiểu bạn thế nào" box: how many stays the model knows, the
 * share of the score that came from their history against their preferences, what they said they like, and what was
 * left out (hotels they rated below 3, hotels where their next stay is). The history share is the customer's side of
 * the recommender's own weights (n / (n + k)): 0 for a new customer, most of it for a regular.
 */
@Injectable()
export class RecommendationProfiles {
  constructor(
    private readonly prisma: PrismaService,
    private readonly hotelStyles: HotelStyles,
  ) {}

  async of(
    customerId: string,
    items: RecommendedHotel[],
  ): Promise<RecommendationProfile> {
    const [prefs, ratings, upcoming] = await Promise.all([
      this.prisma.customerPreference.findMany({
        where: { customerId },
        select: { preferenceKey: true, preferenceValue: true },
      }),
      this.prisma.review.groupBy({
        by: ['hotelId'],
        where: { customerId, isVisible: true },
        _avg: { overallRating: true },
      }),
      this.prisma.booking.findMany({
        where: {
          customerId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
        },
        distinct: ['hotelId'],
        select: { hotelId: true },
      }),
    ]);
    const pref = Object.fromEntries(
      prefs.map((p) => [p.preferenceKey, p.preferenceValue]),
    ) as Record<string, string | undefined>;
    const explained = items.flatMap((item) =>
      item.explanation ? [item.explanation] : [],
    );
    const stays = explained[0]?.stays ?? ratings.length;
    // The customer's side of the formula (weights.py): how far the model trusts their history, n / (n + k). Read per
    // hotel it is lower on a new hotel, which has no history of its own; that is shown on the hotel's "Vì sao?".
    const history = stays / (stays + K_USER);
    // What is not history goes to their preferences, or to their group when they gave none.
    const stated = explained.some((e) => e.weights.group === 0);
    const round = (value: number) => Math.round(value * 1000) / 1000;
    const cities = split(pref.preferredCities).length
      ? split(pref.preferredCities)
      : split(pref.favouriteCity);
    const budget = Number(pref.budgetPerNight) || null;

    return {
      stays,
      weights: {
        history: round(history),
        content: round(stated || !explained.length ? 1 - history : 0),
        group: round(stated || !explained.length ? 0 : 1 - history),
      },
      preferences: {
        cities,
        travelStyles: split(pref.travelStyles),
        roomAmenities: split(pref.roomAmenities),
        budgetPerNight: budget,
        pickedHotels: split(pref.likedHotels).length,
      },
      budgetConflict: await this.budgetConflict(
        split(pref.travelStyles),
        cities,
        budget,
      ),
      excluded: {
        disliked: ratings.filter(
          (r) => (toNumber(r._avg.overallRating ?? null) ?? 5) < 3,
        ).length,
        upcoming: upcoming.length,
      },
    };
  }

  /**
   * When no hotel of a chosen style in the cities picked is within the budget, the list leads with hotels within
   * budget of other styles (the recommender ranks budget before style), and the customer should be told why, with
   * the cheapest hotel of their style there. Null when the list can honour both.
   */
  private async budgetConflict(
    styles: string[],
    cities: string[],
    budget: number | null,
  ): Promise<RecommendationProfile['budgetConflict']> {
    if (!budget || !styles.length) return null;
    const picked = new Set(cities.map(fold));
    const ofStyle = (await this.hotelStyles.catalogue()).filter(
      (h) =>
        h.styles.some((s) => styles.includes(s)) &&
        (!picked.size || picked.has(fold(h.city))),
    );
    if (
      ofStyle.some((h) => h.from !== null && h.from <= budget * BUDGET_SLACK)
    ) {
      return null;
    }
    const prices = ofStyle.flatMap((h) => (h.from === null ? [] : [h.from]));
    return {
      styles,
      cities,
      budgetPerNight: budget,
      cheapest: prices.length ? Math.min(...prices) : null,
    };
  }
}
