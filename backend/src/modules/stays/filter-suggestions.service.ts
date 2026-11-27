import { Injectable } from '@nestjs/common';
import {
  daysBetween,
  type FilterSuggestion,
  type HotelSearchQuery,
  TRAVEL_STYLES,
} from '@stayreco/shared';
import { todayInVietnam } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AMENITY_PHRASES,
  fold,
  STYLE_PHRASES,
} from '../onboarding/onboarding-taste';
import { HotelStyles } from '../recommendations/hotel-styles';
import { StaysService } from './stays.service';

/** At most this many filters are suggested at once. */
const MAX_SUGGESTIONS = 4;
/** A filter that would leave fewer hotels than this is not suggested (Airbnb uses 18 on a far larger catalogue). */
const MIN_RESULTS = 3;
/** The customer's best hotels of a search: this share of the ranked ones, and at least `MIN_GOOD`. */
const GOOD_SHARE = 0.3;
const MIN_GOOD = 3;
/** The weight of how much a filter concentrates the customer's best hotels (Airbnb's N, which they set to 2). */
const UTILITY_POWER = 2;
/** A stay rated at least this is one the customer liked, as the recommender counts it (`LIKED_AGAIN`). */
const LIKED = 4;
/** What the customer's liked stays must mostly share before it says something about them. */
const LIKED_SHARE = { style: 0.5, amenity: 0.6, star: 0.5 } as const;
const MIN_LIKED = 2;
/** Booking this many days ahead or more, free cancellation is worth suggesting (Airbnb's long lead time filter). */
const EARLY_DAYS = 30;

interface Candidate {
  kind: FilterSuggestion['kind'];
  value: string;
  label: string;
  reason: string;
  /** How likely this customer wants it, 0 to 1: Airbnb's P(F|Q), from what they said and what they stayed at. */
  affinity: number;
  /** The customer said so in their preferences, rather than it being read from their stays or the search. */
  stated: boolean;
  /** Whether a hotel of the search passes it. */
  passes: (hotelId: string) => boolean;
}

/**
 * Search filters suggested to one customer for one search ("Gợi ý cho bạn" above the results), after Airbnb's filter
 * recommendation (arXiv 2602.23717) and its personalised SIFT (arXiv 2610.07810): a filter is scored by how likely
 * the customer wants it times how much it helps them book, `P(F|u,q) · P(B|u,q,F)^N`.
 *
 * Without their search logs, the two terms come from what this app has:
 * - wanting it: their preferences (travel styles, room amenities), what most of the stays they rated 4★ or more
 *   share, and for free cancellation how far ahead they book;
 * - helping them book: how much the filter concentrates the hotels the recommender ranks best for them, against the
 *   unfiltered search (a filter that keeps a smaller share of them is not suggested, as in the paper).
 *
 * Suggesting never filters: the customer taps one and the search applies it as any filter, hard.
 */
@Injectable()
export class FilterSuggestions {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stays: StaysService,
    private readonly styles: HotelStyles,
  ) {}

  async suggest(
    query: HotelSearchQuery,
    customerId: string,
  ): Promise<FilterSuggestion[]> {
    const { matching, scores } = await this.stays.ranked(
      { ...query, sort: 'recommended', page: 1 },
      customerId,
    );
    if (matching.length <= MIN_RESULTS) return [];
    const ids = matching.map((h) => h.id);

    const [styleOf, amenityRows, prefs, liked] = await Promise.all([
      this.styles.of(ids),
      this.prisma.hotelAmenity.findMany({
        where: { hotelId: { in: ids } },
        select: {
          hotelId: true,
          amenity: { select: { amenityId: true, name: true } },
        },
      }),
      this.preferences(customerId),
      this.likedHotels(customerId),
    ]);
    const amenitiesOf = new Map<string, Set<string>>();
    const amenityName = new Map<string, string>();
    for (const row of amenityRows) {
      const set = amenitiesOf.get(row.hotelId) ?? new Set<string>();
      set.add(row.amenity.amenityId);
      amenitiesOf.set(row.hotelId, set);
      amenityName.set(row.amenity.amenityId, row.amenity.name);
    }
    const starOf = new Map(matching.map((h) => [h.id, h.starRating]));
    const freeOf = new Map(matching.map((h) => [h.id, h.freeCancellation]));

    const candidates = [
      ...this.styleCandidates(query, prefs.styles, liked.styles, styleOf),
      ...this.amenityCandidates(
        query,
        prefs.amenities,
        liked.amenities,
        amenityName,
        amenitiesOf,
      ),
      ...this.starCandidates(query, liked.stars, starOf),
      ...this.cancellationCandidate(query, freeOf),
    ];

    // The customer's best hotels of this search, by the recommender's rank for them.
    const ranked = ids
      .filter((id) => scores?.has(id))
      .sort((a, b) => scores!.get(a)!.rank - scores!.get(b)!.rank);
    const good = new Set(
      ranked.slice(
        0,
        Math.max(MIN_GOOD, Math.ceil(ranked.length * GOOD_SHARE)),
      ),
    );
    const baseline = good.size / matching.length;

    return (
      candidates
        .flatMap((c) => {
          const kept = ids.filter(c.passes);
          // A filter must narrow the search, and must not leave the customer with almost nothing.
          if (kept.length < MIN_RESULTS || kept.length === ids.length)
            return [];
          let lift = 1;
          if (good.size) {
            const keptGood = kept.filter((id) => good.has(id)).length;
            lift = keptGood / kept.length / baseline;
            // Airbnb's condition: booking must be likelier with the filter than without.
            if (keptGood === 0 || lift < 1) return [];
          }
          return [
            {
              suggestion: {
                kind: c.kind,
                value: c.value,
                label: c.label,
                reason: c.reason,
                count: kept.length,
              },
              score: c.affinity * lift ** UTILITY_POWER,
              stated: c.stated,
            },
          ];
        })
        // What the customer said they want comes before what is read from their stays, then by score.
        .sort(
          (a, b) => Number(b.stated) - Number(a.stated) || b.score - a.score,
        )
        .slice(0, MAX_SUGGESTIONS)
        .map((s) => s.suggestion)
    );
  }

  private styleCandidates(
    query: HotelSearchQuery,
    chosen: string[],
    likedShare: Map<string, number>,
    styleOf: Map<string, string[]>,
  ): Candidate[] {
    if (query.style) return [];
    return TRAVEL_STYLES.flatMap((style) => {
      const share = likedShare.get(style) ?? 0;
      const affinity = chosen.includes(style)
        ? 1
        : share >= LIKED_SHARE.style
          ? share
          : 0;
      if (!affinity) return [];
      const label = STYLE_PHRASES[style].label;
      return [
        {
          kind: 'style' as const,
          value: style,
          label,
          reason: chosen.includes(style)
            ? `Bạn thích phong cách ${label.toLocaleLowerCase('vi')}`
            : 'Giống những nơi bạn từng ở và thích',
          affinity,
          stated: chosen.includes(style),
          passes: (id: string) => styleOf.get(id)?.includes(style) ?? false,
        },
      ];
    });
  }

  private amenityCandidates(
    query: HotelSearchQuery,
    chosen: string[],
    likedShare: Map<string, number>,
    names: Map<string, string>,
    amenitiesOf: Map<string, Set<string>>,
  ): Candidate[] {
    const applied = new Set(query.amenityIds ?? []);
    return [...names].flatMap(([amenityId, name]) => {
      if (applied.has(amenityId)) return [];
      const folded = fold(name);
      // The preferences store the screen's own ids (pool, spa…); an amenity is one when its name says so.
      const pref = chosen.find((key) =>
        AMENITY_PHRASES[key]?.phrases.some((p) => folded.includes(fold(p))),
      );
      const share = likedShare.get(amenityId) ?? 0;
      const affinity = pref ? 1 : share >= LIKED_SHARE.amenity ? share : 0;
      if (!affinity) return [];
      return [
        {
          kind: 'amenity' as const,
          value: amenityId,
          label: name,
          reason: pref
            ? `Bạn ưu tiên ${AMENITY_PHRASES[pref].label.toLocaleLowerCase('vi')}`
            : 'Có ở hầu hết nơi bạn từng thích',
          affinity,
          stated: !!pref,
          passes: (id: string) => amenitiesOf.get(id)?.has(amenityId) ?? false,
        },
      ];
    });
  }

  private starCandidates(
    query: HotelSearchQuery,
    likedShare: Map<number, number>,
    starOf: Map<string, number | null>,
  ): Candidate[] {
    if (query.starRating?.length) return [];
    return [...likedShare].flatMap(([star, share]) =>
      share >= LIKED_SHARE.star
        ? [
            {
              kind: 'star' as const,
              value: String(star),
              label: `${star} sao`,
              reason: `Bạn hay ở khách sạn ${star} sao`,
              affinity: share,
              stated: false,
              passes: (id: string) => starOf.get(id) === star,
            },
          ]
        : [],
    );
  }

  private cancellationCandidate(
    query: HotelSearchQuery,
    freeOf: Map<string, boolean>,
  ): Candidate[] {
    if (query.freeCancellation) return [];
    const ahead = daysBetween(todayInVietnam(), query.checkIn);
    if (ahead < EARLY_DAYS) return [];
    return [
      {
        kind: 'freeCancellation',
        value: 'true',
        label: 'Miễn phí huỷ',
        reason: `Bạn đặt trước ${ahead} ngày, nên giữ quyền huỷ miễn phí`,
        affinity: 0.6,
        stated: false,
        passes: (id: string) => freeOf.get(id) ?? false,
      },
    ];
  }

  private async preferences(customerId: string) {
    const rows = await this.prisma.customerPreference.findMany({
      where: {
        customerId,
        preferenceKey: { in: ['travelStyles', 'roomAmenities'] },
      },
      select: { preferenceKey: true, preferenceValue: true },
    });
    const list = (key: string) =>
      (rows.find((r) => r.preferenceKey === key)?.preferenceValue ?? '')
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    return { styles: list('travelStyles'), amenities: list('roomAmenities') };
  }

  /** What the hotels the customer rated 4★ or more share: the share of them per style, hotel amenity and star. */
  private async likedHotels(customerId: string) {
    const rated = await this.prisma.userItemRating.groupBy({
      by: ['hotelId'],
      where: { customerId },
      _avg: { score: true },
    });
    const liked = rated
      .filter((r) => (toNumber(r._avg.score) ?? 0) >= LIKED)
      .map((r) => r.hotelId);
    const empty = {
      styles: new Map<string, number>(),
      amenities: new Map<string, number>(),
      stars: new Map<number, number>(),
    };
    if (liked.length < MIN_LIKED) return empty;

    const [styleOf, hotels] = await Promise.all([
      this.styles.of(liked),
      this.prisma.hotel.findMany({
        where: { hotelId: { in: liked } },
        select: {
          starRating: true,
          hotelAmenities: { select: { amenityId: true } },
        },
      }),
    ]);
    const share = <K>(keys: K[]) => {
      const counts = new Map<K, number>();
      for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
      return new Map([...counts].map(([k, n]) => [k, n / liked.length]));
    };
    return {
      styles: share([...styleOf.values()].flat()),
      amenities: share(
        hotels.flatMap((h) => h.hotelAmenities.map((a) => a.amenityId)),
      ),
      stars: share(
        hotels.map((h) => h.starRating).filter((s): s is number => s !== null),
      ),
    };
  }
}
