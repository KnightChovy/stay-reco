import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  type CompleteOnboardingInput,
  ErrorCode,
  ONBOARDING_LIMITS,
  type Onboarding,
  type OnboardingDestination,
  type OnboardingHotel,
  type OnboardingHotelSuggestion,
  type OnboardingHotelsQuery,
  type OnboardingStatus,
} from '@stayreco/shared';
import { lockAccount } from '../../common/db/locks';
import { todayInVietnam } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { toAmenity } from '../catalog/catalog.service';
import { NotificationsService } from '../notifications/notifications.service';
import { toVoucher } from '../promotions/promotions.mapper';
import { basePriceWhere } from '../rooms/room.mapper';
import { bookableHotel, sellableRoomType } from '../stays/bookable';
import { ModelRefreshService } from '../recommendations/model-refresh.service';
import { tasteFit } from './onboarding-taste';
import {
  type WelcomeVoucherRow,
  WelcomeVoucherService,
} from './welcome-voucher.service';

/** A hotel whose cheapest night is more than this over the budget is offered last (the recommender's `BUDGET_SLACK`). */
const BUDGET_SLACK = 1.2;

/** The catalog category whose amenities are the views a customer can pick (W8). */
export const VIEW_CATEGORY = 'Tầm nhìn';

/**
 * The `customer_preference` keys onboarding writes (W3). The first four are the ones `/account/preferences` already
 * reads and writes, so the two screens agree; lists are comma-separated, as that page writes them. `favouriteCity` is
 * single there, so it gets the first city and `preferredCities` keeps them all.
 */
export const ONBOARDING_KEYS = {
  favouriteCity: 'favouriteCity',
  travelStyles: 'travelStyles',
  roomAmenities: 'roomAmenities',
  budgetPerNight: 'budgetPerNight',
  preferredCities: 'preferredCities',
  likedHotels: 'likedHotels',
  preferredViews: 'preferredViews',
  status: 'onboardingStatus',
  at: 'onboardingAt',
} as const;

const alreadyCompleted = () =>
  new ConflictException({
    code: ErrorCode.ONBOARDING_ALREADY_COMPLETED,
    message:
      'Onboarding is already completed; change the picks in your preferences',
  });

/**
 * First-login preferences and the welcome voucher (docs/design/onboarding-welcome-voucher.md).
 *
 * The customer picks destinations, hotels, views, travel styles, room amenities and a budget; the picks are saved as
 * their preferences, which is what the recommender has for a customer with no stays yet, and finishing earns the
 * platform's welcome code. Skipping saves nothing but the answer, and the screen can be finished later.
 */
@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly welcome: WelcomeVoucherService,
    private readonly notifications: NotificationsService,
    private readonly model: ModelRefreshService,
  ) {}

  /** Where the customer is, what to pick from (until they finish), and their welcome code once they have it. */
  async get(customerId: string): Promise<Onboarding> {
    const [status, voucher] = await Promise.all([
      this.statusOf(this.prisma, customerId),
      this.welcome.find(this.prisma, customerId),
    ]);
    return {
      status,
      options: status === 'COMPLETED' ? null : await this.options(),
      voucher: voucher ? toVoucher(voucher, todayInVietnam()) : null,
    };
  }

  /**
   * Saves the picks and issues the welcome code, in one transaction. The account is locked first (by the voucher
   * service), so finishing twice at once saves once and issues one code; the second request sees `COMPLETED`.
   */
  async complete(
    customerId: string,
    input: CompleteOnboardingInput,
    now = new Date(),
  ): Promise<Onboarding> {
    await this.assertOffered(input);
    const verified = await this.prisma.userAccount.findUnique({
      where: { userAccountId: customerId },
      select: { emailVerifiedAt: true },
    });

    const { voucher, issued } = await this.prisma.$transaction(async (tx) => {
      // The account lock comes before the status is read, so a second request waits and then sees COMPLETED.
      await lockAccount(tx, customerId);
      if ((await this.statusOf(tx, customerId)) === 'COMPLETED') {
        throw alreadyCompleted();
      }
      await writePreferences(tx, customerId, {
        [ONBOARDING_KEYS.favouriteCity]: input.cities?.[0],
        [ONBOARDING_KEYS.preferredCities]: list(input.cities),
        [ONBOARDING_KEYS.likedHotels]: list(input.hotelIds),
        [ONBOARDING_KEYS.preferredViews]: list(input.viewIds),
        [ONBOARDING_KEYS.travelStyles]: list(input.travelStyles),
        [ONBOARDING_KEYS.roomAmenities]: list(input.roomAmenities),
        [ONBOARDING_KEYS.budgetPerNight]: input.budgetPerNight?.toString(),
        [ONBOARDING_KEYS.status]: 'COMPLETED',
        [ONBOARDING_KEYS.at]: now.toISOString(),
      });
      // Signing in needs a verified email, so this is a guard rather than a path: an unverified account still
      // saves its picks but earns no code, which is what keeps one code per real address.
      const welcome = verified?.emailVerifiedAt
        ? await this.welcome.issue(tx, customerId, now)
        : null;
      return {
        voucher: welcome?.voucher ?? null,
        issued: welcome?.issued ?? false,
      };
    });

    if (voucher && issued) await this.tell(customerId, voucher);
    // The model's own list in seconds; until then the preferences are ranked on the spot.
    this.model.refresh(customerId);
    return {
      status: 'COMPLETED',
      options: null,
      voucher: voucher ? toVoucher(voucher, todayInVietnam(now)) : null,
    };
  }

  /** Remembers that the customer skipped, so the screen is not forced on them again; they can still finish later. */
  async skip(customerId: string, now = new Date()): Promise<Onboarding> {
    await this.prisma.$transaction(async (tx) => {
      // Locked like `complete`, so a skip racing a finish cannot turn COMPLETED back into SKIPPED.
      await lockAccount(tx, customerId);
      if ((await this.statusOf(tx, customerId)) === 'COMPLETED') {
        throw alreadyCompleted();
      }
      await writePreferences(tx, customerId, {
        [ONBOARDING_KEYS.status]: 'SKIPPED',
        [ONBOARDING_KEYS.at]: now.toISOString(),
      });
    });
    return this.get(customerId);
  }

  /**
   * The hotel step: hotels in the cities picked that fit the style, amenities and views picked, best fit first, so a
   * customer cannot pick a hotel that contradicts what they just said (docs/api/onboarding.md). With no city picked
   * every city counts. A chosen style is required to fit; amenities and views only rank. Hotels whose cheapest night
   * is well over the budget come last, marked. At most `ONBOARDING_LIMITS.hotelsOffered`.
   */
  async suggestHotels(
    query: OnboardingHotelsQuery,
  ): Promise<OnboardingHotelSuggestion[]> {
    const answers = {
      travelStyles: query.travelStyles ?? [],
      roomAmenities: query.roomAmenities ?? [],
      viewIds: query.viewIds ?? [],
    };
    const [hotels, ratings, views] = await Promise.all([
      this.prisma.hotel.findMany({
        where: {
          ...bookableHotel,
          ...(query.cities?.length && { city: { in: query.cities } }),
        },
        select: {
          hotelId: true,
          name: true,
          city: true,
          description: true,
          starRating: true,
          hotelImages: {
            orderBy: [
              { isCover: 'desc' },
              { sortOrder: 'asc' },
              { hotelImageId: 'asc' },
            ],
            take: 1,
            select: { imageUrl: true },
          },
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
        where: { category: VIEW_CATEGORY },
        select: { amenityId: true, name: true },
      }),
    ]);
    const ratingOf = new Map(ratings.map((r) => [r.hotelId, r]));
    const viewNames = new Map(views.map((v) => [v.amenityId, v.name]));

    const ranked = hotels.flatMap((h) => {
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
        answers,
        viewNames,
      );
      if (!fit.fits) return [];
      const prices = h.roomTypes
        .flatMap((rt) => rt.prices.map((p) => toNumber(p.pricePerNight)))
        .filter((p): p is number => p !== null);
      const from = prices.length ? Math.min(...prices) : null;
      const r = ratingOf.get(h.hotelId);
      const avg = r?._avg.overallRating;
      const suggestion: OnboardingHotelSuggestion = {
        id: h.hotelId,
        name: h.name,
        city: h.city,
        starRating: h.starRating,
        imageUrl: h.hotelImages[0]?.imageUrl ?? null,
        rating: avg ? Math.round(toNumber(avg) * 10) / 10 : null,
        reviewCount: r?._count ?? 0,
        // Unique labels: "spa" is both a resort phrase and an amenity, and the card should say it once.
        matches: [...new Set(fit.matches)],
        pricePerNightFrom: from,
        overBudget:
          query.budgetPerNight !== undefined &&
          from !== null &&
          from > query.budgetPerNight * BUDGET_SLACK,
      };
      return [{ suggestion, score: fit.score }];
    });

    return ranked
      .sort(
        (a, b) =>
          Number(a.suggestion.overBudget) - Number(b.suggestion.overBudget) ||
          b.score - a.score ||
          (b.suggestion.rating ?? 0) - (a.suggestion.rating ?? 0) ||
          b.suggestion.reviewCount - a.suggestion.reviewCount ||
          a.suggestion.name.localeCompare(b.suggestion.name, 'vi'),
      )
      .slice(0, ONBOARDING_LIMITS.hotelsOffered)
      .map((r) => r.suggestion);
  }

  private async statusOf(
    db: Prisma.TransactionClient,
    customerId: string,
  ): Promise<OnboardingStatus> {
    const row = await db.customerPreference.findFirst({
      where: { customerId, preferenceKey: ONBOARDING_KEYS.status },
      select: { preferenceValue: true },
    });
    if (
      row?.preferenceValue === 'COMPLETED' ||
      row?.preferenceValue === 'SKIPPED'
    ) {
      return row.preferenceValue;
    }
    // The screen is for newcomers. A guest who has already stayed (an account from before onboarding existed) is not
    // stopped by it on sign-in; the account page still offers it, as after a skip.
    const stayed = await db.booking.count({
      where: { customerId, status: 'COMPLETED' },
      take: 1,
    });
    return stayed ? 'SKIPPED' : 'NEW';
  }

  /**
   * What the customer picks from: the cities with bookable hotels, up to 12 of those hotels (best reviewed first,
   * then newest), and the views of the catalog. Read from the same bookable filter as the search, so nothing offered
   * here is a hotel the customer could not book.
   */
  private async options(): Promise<NonNullable<Onboarding['options']>> {
    const [hotels, ratings, views] = await Promise.all([
      this.prisma.hotel.findMany({
        where: bookableHotel,
        select: {
          hotelId: true,
          name: true,
          city: true,
          starRating: true,
          createdAt: true,
          hotelImages: {
            orderBy: [
              { isCover: 'desc' },
              { sortOrder: 'asc' },
              { hotelImageId: 'asc' },
            ],
            take: 1,
            select: { imageUrl: true },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { hotelId: 'asc' }],
      }),
      this.prisma.review.groupBy({
        by: ['hotelId'],
        where: { isVisible: true, hotel: bookableHotel },
        _avg: { overallRating: true },
        _count: true,
      }),
      this.prisma.amenity.findMany({
        where: { category: VIEW_CATEGORY },
        orderBy: [{ name: 'asc' }, { amenityId: 'asc' }],
      }),
    ]);
    const ratingOf = new Map(ratings.map((r) => [r.hotelId, r]));

    const cards: OnboardingHotel[] = hotels.map((h) => {
      const r = ratingOf.get(h.hotelId);
      const avg = r?._avg.overallRating;
      return {
        id: h.hotelId,
        name: h.name,
        city: h.city,
        starRating: h.starRating,
        imageUrl: h.hotelImages[0]?.imageUrl ?? null,
        rating: avg ? Math.round(toNumber(avg) * 10) / 10 : null,
        reviewCount: r?._count ?? 0,
      };
    });

    const byCity = new Map<string, OnboardingDestination>();
    for (const card of cards) {
      const city = byCity.get(card.city) ?? {
        city: card.city,
        hotels: 0,
        imageUrl: null,
      };
      city.hotels++;
      city.imageUrl ??= card.imageUrl;
      byCity.set(card.city, city);
    }

    return {
      destinations: [...byCity.values()].sort(
        (a, b) => b.hotels - a.hotels || a.city.localeCompare(b.city, 'vi'),
      ),
      // Hotels arrive newest first; a stable sort on the rating keeps that order among equals.
      hotels: [...cards]
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, ONBOARDING_LIMITS.hotelsOffered),
      views: views.map(toAmenity),
    };
  }

  /**
   * Cities, hotels and views must be ones the screen could have offered: a city with bookable hotels, a bookable
   * hotel, a view of the catalog. Anything else is a typo or a stale screen, and saving it would give the recommender
   * a preference that matches nothing.
   */
  private async assertOffered(input: CompleteOnboardingInput) {
    const problems: { field: string; message: string }[] = [];
    if (input.cities?.length) {
      const rows = await this.prisma.hotel.findMany({
        where: { ...bookableHotel, city: { in: input.cities } },
        select: { city: true },
        distinct: ['city'],
      });
      const known = new Set(rows.map((r) => r.city));
      input.cities.forEach((c, i) => {
        if (!known.has(c)) {
          problems.push({
            field: `cities.${i}`,
            message: 'no bookable hotel there',
          });
        }
      });
    }
    if (input.hotelIds?.length) {
      const rows = await this.prisma.hotel.findMany({
        where: { ...bookableHotel, hotelId: { in: input.hotelIds } },
        select: { hotelId: true },
      });
      const known = new Set(rows.map((r) => r.hotelId));
      input.hotelIds.forEach((id, i) => {
        if (!known.has(id)) {
          problems.push({ field: `hotelIds.${i}`, message: 'not bookable' });
        }
      });
    }
    if (input.viewIds?.length) {
      const rows = await this.prisma.amenity.findMany({
        where: { category: VIEW_CATEGORY, amenityId: { in: input.viewIds } },
        select: { amenityId: true },
      });
      const known = new Set(rows.map((r) => r.amenityId));
      input.viewIds.forEach((id, i) => {
        if (!known.has(id)) {
          problems.push({ field: `viewIds.${i}`, message: 'not a view' });
        }
      });
    }
    if (problems.length) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: problems,
      });
    }
  }

  /** The in-app notification with the code (W9). Logged, never thrown: the customer already has the code on screen. */
  private async tell(customerId: string, voucher: WelcomeVoucherRow) {
    const off = toNumber(voucher.discountValue);
    const cap = toNumber(voucher.maxDiscount);
    const until = voucher.expiresAt ? todayInVietnam(voucher.expiresAt) : null;
    try {
      await this.notifications.create({
        userAccountId: customerId,
        type: 'PROMOTION',
        title: 'Quà chào mừng: mã giảm giá của bạn',
        message: [
          `Cảm ơn bạn đã chia sẻ sở thích! Mã ${voucher.code} giảm ${off}% tiền phòng`,
          cap ? ` (tối đa ${cap.toLocaleString('vi-VN')} ₫)` : '',
          ' ở mọi khách sạn trên StayReco',
          until ? `, dùng đến hết ngày ${until}.` : '.',
        ].join(''),
        link: '/account/rewards',
      });
    } catch (err) {
      this.logger.error(
        `Could not tell ${customerId} about the welcome voucher: ${String(err)}`,
      );
    }
  }
}

/** A comma-separated list as `/account/preferences` writes one; undefined (key left alone) when nothing was picked. */
const list = (values: readonly string[] | undefined) =>
  values?.length ? values.join(',') : undefined;

/**
 * Writes the given keys and leaves the others alone, inside the caller's transaction. `customer_preference` has no
 * unique key on (customer, key), so each write is a delete-then-insert, as `PreferencesService` does it.
 */
async function writePreferences(
  tx: Prisma.TransactionClient,
  customerId: string,
  values: Record<string, string | undefined>,
) {
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) continue;
    await tx.customerPreference.deleteMany({
      where: { customerId, preferenceKey: key },
    });
    await tx.customerPreference.create({
      data: { customerId, preferenceKey: key, preferenceValue: value },
    });
  }
}
