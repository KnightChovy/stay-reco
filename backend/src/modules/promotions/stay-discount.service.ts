import { AddOnsService } from '../add-ons/add-ons.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../../common/errors/error-code';
import {
  type AppliedDiscount,
  type BookingItemInput,
  bookingItemsOf,
  type DiscountQuote,
  type DiscountQuoteInput,
  type PointsQuote,
} from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceEngine } from '../pricing/price-engine';
import { roomTypeNotFound } from '../rooms/room-types.service';
import { bookableHotel, sellableRoomType } from '../stays/bookable';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { DiscountService } from './discount.service';

/**
 * Prices a stay and applies the discount to it, in one place, so `POST /bookings/discount-quote` and
 * `POST /bookings` can never disagree about what a customer owes (money-rules §2.1).
 */
@Injectable()
export class StayDiscountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly engine: PriceEngine,
    private readonly discounts: DiscountService,
    private readonly loyalty: LoyaltyService,
    private readonly addOns: AddOnsService,
  ) {}

  /** What the stay costs, what comes off it, and the total to send to `POST /bookings`. */
  async quote(
    customerId: string,
    input: DiscountQuoteInput,
  ): Promise<DiscountQuote> {
    const items = bookingItemsOf(input);
    const hotelId = await this.hotelOf(items.map((i) => i.roomTypeId));
    const subtotal = await this.subtotal(items, input.checkIn, input.checkOut);
    const discount = await this.discounts.forStay(
      customerId,
      hotelId,
      subtotal,
      input.code,
    );
    // Points come off what is left after the discount, the third term of money-rules §2.1.
    const afterDiscount = payable(subtotal, discount);
    const points = await this.points(
      customerId,
      hotelId,
      afterDiscount,
      input.pointsToUse,
    );
    const addOns = await this.addOns.price(hotelId, input.addOns, 'customer');
    return {
      subtotal: toNumber(subtotal),
      discount,
      points,
      addOnsTotal: toNumber(addOns.total),
      expectedTotal: toNumber(
        afterPoints(afterDiscount, points).plus(addOns.total),
      ),
    };
  }

  /**
   * The points part of a quote at the stay's hotel, under its redemption conditions; null when no programme is
   * running, so the FE simply hides the section.
   */
  async points(
    customerId: string,
    hotelId: string,
    afterDiscount: Prisma.Decimal,
    pointsToUse = 0,
  ): Promise<PointsQuote | null> {
    try {
      return await this.loyalty.quote(
        customerId,
        hotelId,
        afterDiscount,
        pointsToUse,
      );
    } catch (err) {
      if (
        err instanceof NotFoundException &&
        (err.getResponse() as { code?: string }).code ===
          ErrorCode.LOYALTY_PROGRAM_NOT_FOUND
      ) {
        return null;
      }
      throw err;
    }
  }

  /**
   * The sum of the nightly prices for every room of every room type, before any discount: the same subtotal
   * `POST /bookings` computes, so a quote of several room types matches the booking it leads to.
   */
  private async subtotal(
    items: BookingItemInput[],
    checkIn: string,
    checkOut: string,
  ): Promise<Prisma.Decimal> {
    const quotes = await this.engine.quote(
      items.map((i) => i.roomTypeId),
      checkIn,
      checkOut,
    );
    return items.reduce((sum, item) => {
      const quote = quotes.get(item.roomTypeId);
      if (!quote) throw roomTypeNotFound();
      return sum.plus(quote.total.times(item.rooms));
    }, new Prisma.Decimal(0));
  }

  /**
   * The one hotel the room types belong to, refusing any that is not on sale or a mix of hotels, exactly as
   * `POST /bookings` does (docs/design/booking-items.md §3).
   */
  private async hotelOf(roomTypeIds: string[]): Promise<string> {
    const roomTypes = await this.prisma.roomType.findMany({
      where: {
        roomTypeId: { in: roomTypeIds },
        ...sellableRoomType,
        hotel: bookableHotel,
      },
      select: { hotelId: true },
    });
    const hotels = new Set(roomTypes.map((r) => r.hotelId));
    if (roomTypes.length !== roomTypeIds.length || hotels.size !== 1) {
      throw roomTypeNotFound();
    }
    return roomTypes[0].hotelId;
  }
}

/** The stay total after the discount; never below 0, so a booking can be free but never pays the customer. */
export function payable(
  subtotal: Prisma.Decimal,
  discount: AppliedDiscount | null,
): Prisma.Decimal {
  if (!discount) return subtotal;
  const total = subtotal.minus(discount.amount);
  return total.isNegative() ? new Prisma.Decimal(0) : total;
}

/** What is left after the points are spent; never below 0. */
export function afterPoints(
  afterDiscount: Prisma.Decimal,
  points: PointsQuote | null,
): Prisma.Decimal {
  if (!points?.amount) return afterDiscount;
  const total = afterDiscount.minus(points.amount);
  return total.isNegative() ? new Prisma.Decimal(0) : total;
}
