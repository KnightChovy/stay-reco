import { toHotelAddOn } from '../add-ons/add-on.mapper';
import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  CancellationPolicy,
  HotelListing,
  HotelSearchQuery,
  HotelSearchResult,
  RoomTypeListing,
  RoomTypeOffer,
  StayQuery,
} from '@stayreco/shared';
import { daysBetween } from '@stayreco/shared';
import { escapeLike } from '../../common/db/like';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import {
  cancellationPolicyOf,
  cancellationRowsSelect,
  fromTime,
  hotelInclude,
  toHotel,
} from '../hotels/hotel.mapper';
import { HotelStyles } from '../recommendations/hotel-styles';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { PriceEngine } from '../pricing/price-engine';
import { roomTypeNotFound } from '../rooms/room-types.service';
import {
  roomTypeInclude,
  type RoomTypeWithDetails,
  toRoomType,
} from '../rooms/room.mapper';
import { bookableHotel, sellableRoomType } from './bookable';
import { assertBookableDates, isBookable, type Stay, toOffer } from './offer';

const hotelNotFound = () =>
  new NotFoundException({
    code: ErrorCode.HOTEL_NOT_FOUND,
    message: 'Hotel not found',
  });

/** One room type to price, with what its offer needs from the hotel. */
interface OfferRequest {
  roomTypeId: string;
  maxOccupancy: number;
  policy: CancellationPolicy;
  checkInTime: string | null;
}

/** Public search and hotel / room type pages with prices for a stay (UC10–UC12, UC19, customer.md). */
@Injectable()
export class StaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly availability: AvailabilityService,
    private readonly engine: PriceEngine,
    private readonly recommendations: RecommendationsService,
    private readonly styles: HotelStyles,
  ) {}

  /**
   * Hotels matching the destination with at least one room type that takes the whole booking. Prices and
   * availability depend on the stay, so filtering, sorting and paging happen after pricing every candidate.
   */
  async search(
    query: HotelSearchQuery,
    customerId?: string,
  ): Promise<Paginated<HotelSearchResult>> {
    assertBookableDates(query.checkIn);
    const personalized = query.sort === 'recommended' && customerId;
    const hotels = await this.prisma.hotel.findMany({
      where: {
        ...bookableHotel,
        hotelId: { in: await this.matchDestination(query.destination) },
        starRating: query.starRating && { in: query.starRating },
        AND: (query.amenityIds ?? []).map((amenityId) => ({
          hotelAmenities: { some: { amenityId } },
        })),
      },
      select: {
        hotelId: true,
        name: true,
        city: true,
        address: true,
        starRating: true,
        latitude: true,
        longitude: true,
        checkInTime: true,
        hotelImages: {
          where: { isCover: true },
          take: 1,
          select: { imageUrl: true },
        },
        hotelProperties: cancellationRowsSelect,
        roomTypes: {
          where: sellableRoomType,
          select: { roomTypeId: true, maxOccupancy: true },
        },
      },
    });

    const requests = hotels.flatMap((h) =>
      h.roomTypes.map((rt) => ({
        ...rt,
        policy: cancellationPolicyOf(h.hotelProperties),
        checkInTime: fromTime(h.checkInTime),
      })),
    );
    const [offers, ratings] = await Promise.all([
      this.offers(requests, query),
      this.ratingsOf(hotels.map((h) => h.hotelId)),
    ]);

    const results: HotelSearchResult[] = [];
    for (const h of hotels) {
      const totals = h.roomTypes
        .map((rt) => offers.get(rt.roomTypeId))
        .filter((o) => o && isBookable(o, query))
        .map((o) => o!);
      if (!totals.length) continue;
      const cheapest = totals.reduce((a, b) => (b.total < a.total ? b : a));
      results.push({
        id: h.hotelId,
        name: h.name,
        city: h.city,
        address: h.address,
        starRating: h.starRating,
        coverImageUrl: h.hotelImages[0]?.imageUrl ?? null,
        latitude: toNumber(h.latitude),
        longitude: toNumber(h.longitude),
        rating: ratings.get(h.hotelId)?.rating ?? null,
        reviewCount: ratings.get(h.hotelId)?.reviewCount ?? 0,
        nights: daysBetween(query.checkIn, query.checkOut),
        fromTotal: cheapest.total,
        freeCancellation: cheapest.freeCancellationUntil !== null,
        styles: [],
      });
    }

    const matching = results
      .filter(
        (r) => query.priceMin === undefined || r.fromTotal >= query.priceMin,
      )
      .filter(
        (r) => query.priceMax === undefined || r.fromTotal <= query.priceMax,
      )
      .filter((r) => !query.freeCancellation || r.freeCancellation);
    const scores = personalized
      ? await this.recommendations.personalScores(
          personalized,
          matching.map((hotel) => hotel.id),
        )
      : null;
    const compare = compareBy(query.sort);
    // The recommender's published rank (it already weighs the customer's budget); unranked hotels after, by default order.
    // Hotels the customer booked stay searchable: the recommender only leaves them out of its own list.
    matching.sort((a, b) => {
      const left = scores?.get(a.id)?.rank ?? Infinity;
      const right = scores?.get(b.id)?.rank ?? Infinity;
      return left === right ? compare(a, b) : left - right;
    });
    const start = (query.page - 1) * query.pageSize;
    const page = matching.slice(start, start + query.pageSize);
    // Read for the page shown only: it parses each hotel's text.
    const styles = await this.styles.of(page.map((hotel) => hotel.id));
    return Paginated.of(
      page.map((hotel) => ({ ...hotel, styles: styles.get(hotel.id) ?? [] })),
      { ...query, total: matching.length },
    );
  }

  /** Every sellable room type is listed; one that is full or too small shows its offer instead of disappearing. */
  async hotelListing(hotelId: string, query: StayQuery): Promise<HotelListing> {
    const hotel = isUuid(hotelId)
      ? await this.prisma.hotel.findFirst({
          where: { hotelId, ...bookableHotel },
          include: {
            ...hotelInclude,
            roomTypes: {
              where: sellableRoomType,
              include: roomTypeInclude,
              orderBy: { createdAt: 'asc' },
            },
            addOns: {
              where: { isActive: true },
              orderBy: [{ name: 'asc' }, { hotelAddOnId: 'asc' }],
            },
          },
        })
      : null;
    if (!hotel) throw hotelNotFound();

    const details = toHotel(hotel);
    const offers = await this.offersFor(
      query,
      hotel.roomTypes.map((rt) => ({
        roomTypeId: rt.roomTypeId,
        maxOccupancy: rt.maxOccupancy,
        policy: details.cancellationPolicy,
        checkInTime: details.checkInTime,
      })),
    );
    return {
      hotel: {
        id: details.id,
        name: details.name,
        description: details.description,
        address: details.address,
        city: details.city,
        country: details.country,
        latitude: details.latitude,
        longitude: details.longitude,
        starRating: details.starRating,
        phone: details.phone,
        website: details.website,
        checkInTime: details.checkInTime,
        checkOutTime: details.checkOutTime,
        amenities: details.amenities,
        images: details.images,
        policies: details.policies,
        cancellationPolicy: details.cancellationPolicy,
        lateCheckoutPolicy: details.lateCheckoutPolicy,
        addOns: hotel.addOns.map(toHotelAddOn),
      },
      roomTypes: hotel.roomTypes.map((rt) =>
        toRoomTypeListing(rt, offers?.get(rt.roomTypeId) ?? null),
      ),
    };
  }

  async roomTypeListing(
    roomTypeId: string,
    query: StayQuery,
  ): Promise<RoomTypeListing> {
    const roomType = isUuid(roomTypeId)
      ? await this.prisma.roomType.findFirst({
          where: { roomTypeId, ...sellableRoomType, hotel: bookableHotel },
          include: {
            ...roomTypeInclude,
            hotel: {
              select: {
                checkInTime: true,
                hotelProperties: cancellationRowsSelect,
              },
            },
          },
        })
      : null;
    if (!roomType) throw roomTypeNotFound();

    const offers = await this.offersFor(query, [
      {
        roomTypeId,
        maxOccupancy: roomType.maxOccupancy,
        policy: cancellationPolicyOf(roomType.hotel.hotelProperties),
        checkInTime: fromTime(roomType.hotel.checkInTime),
      },
    ]);
    return toRoomTypeListing(roomType, offers?.get(roomTypeId) ?? null);
  }

  /** Offers for a listing: none without dates. */
  private async offersFor(query: StayQuery, requests: OfferRequest[]) {
    if (query.checkIn === undefined || query.checkOut === undefined) {
      return null;
    }
    assertBookableDates(query.checkIn);
    return this.offers(requests, {
      checkIn: query.checkIn,
      checkOut: query.checkOut,
      guests: query.guests,
      rooms: query.rooms,
    });
  }

  /** One availability read and one pricing read for all the room types. */
  private async offers(
    requests: OfferRequest[],
    stay: Stay,
  ): Promise<Map<string, RoomTypeOffer>> {
    const ids = requests.map((r) => r.roomTypeId);
    const [available, quotes] = await Promise.all([
      this.availability.availableRooms(ids, stay.checkIn, stay.checkOut),
      this.engine.quote(ids, stay.checkIn, stay.checkOut),
    ]);
    const offers = new Map<string, RoomTypeOffer>();
    const now = new Date();
    for (const request of requests) {
      const quote = quotes.get(request.roomTypeId);
      if (!quote) continue;
      offers.set(
        request.roomTypeId,
        toOffer({
          stay,
          maxOccupancy: request.maxOccupancy,
          available: available.get(request.roomTypeId) ?? 0,
          quote,
          policy: request.policy,
          checkInTime: request.checkInTime,
          now,
        }),
      );
    }
    return offers;
  }

  /**
   * Each hotel's guest rating, the way its own page and the recommendations show it: the average overall rating of
   * the visible reviews to one decimal, and how many there are. A hotel with no review is left out of the map.
   */
  private async ratingsOf(
    hotelIds: string[],
  ): Promise<Map<string, { rating: number; reviewCount: number }>> {
    if (!hotelIds.length) return new Map();
    const rows = await this.prisma.review.groupBy({
      by: ['hotelId'],
      where: { hotelId: { in: hotelIds }, isVisible: true },
      _avg: { overallRating: true },
      _count: { _all: true },
    });
    const ratings = new Map<string, { rating: number; reviewCount: number }>();
    for (const row of rows) {
      const avg = toNumber(row._avg.overallRating);
      if (avg === null) continue;
      ratings.set(row.hotelId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: row._count._all,
      });
    }
    return ratings;
  }

  /** City, hotel name or address containing the text, ignoring case and Vietnamese accents (decision P9). */
  private async matchDestination(destination: string): Promise<string[]> {
    const pattern = `%${escapeLike(destination)}%`;
    const rows = await this.prisma.$queryRaw<{ hotel_id: string }[]>`
      SELECT hotel_id FROM hotel
      WHERE unaccent(city) ILIKE unaccent(${pattern})
         OR unaccent(name) ILIKE unaccent(${pattern})
         OR unaccent(address) ILIKE unaccent(${pattern})`;
    return rows.map((r) => r.hotel_id);
  }
}

function toRoomTypeListing(
  rt: RoomTypeWithDetails,
  offer: RoomTypeOffer | null,
): RoomTypeListing {
  const details = toRoomType(rt);
  return {
    roomType: {
      id: details.id,
      name: details.name,
      description: details.description,
      maxOccupancy: details.maxOccupancy,
      areaSqm: details.areaSqm,
      beds: details.beds,
      amenities: details.amenities,
      images: details.images,
    },
    offer,
  };
}

/**
 * Default order for ties and hotels without a personalized score.
 */
function compareBy(sort: HotelSearchQuery['sort']) {
  const stars = (r: HotelSearchResult) => r.starRating ?? 0;
  const byPrice = (a: HotelSearchResult, b: HotelSearchResult) =>
    a.fromTotal - b.fromTotal || a.name.localeCompare(b.name);
  return (a: HotelSearchResult, b: HotelSearchResult) => {
    switch (sort) {
      case 'price-asc':
        return byPrice(a, b);
      case 'price-desc':
        return b.fromTotal - a.fromTotal || a.name.localeCompare(b.name);
      default:
        return stars(b) - stars(a) || byPrice(a, b);
    }
  };
}
