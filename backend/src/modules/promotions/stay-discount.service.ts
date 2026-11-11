import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../../common/errors/error-code';
import type {
  AppliedDiscount,
  DiscountQuote,
  DiscountQuoteInput,
  PointsQuote,
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
  ) {}

  /** What the stay costs, what comes off it, and the total to send to `POST /bookings`. */
  async quote(
    customerId: string,
    input: DiscountQuoteInput,
  ): Promise<DiscountQuote> {
    const hotelId = await this.hotelOf(input.roomTypeId);
    const subtotal = await this.subtotal(
      input.roomTypeId,
      input.checkIn,
      input.checkOut,
      input.rooms,
    );
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
      afterDiscount,
      input.pointsToUse,
    );
    return {
      subtotal: toNumber(subtotal),
      discount,
      points,
      expectedTotal: toNumber(afterPoints(afterDiscount, points)),
    };
  }

  /** The points part of a quote; null when no programme is running, so the FE simply hides the section. */
  async points(
    customerId: string,
    afterDiscount: Prisma.Decimal,
    pointsToUse = 0,
  ): Promise<PointsQuote | null> {
    try {
      return await this.loyalty.quote(customerId, afterDiscount, pointsToUse);
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

  /** The sum of the nightly prices for every room, before any discount. */
  async subtotal(
    roomTypeId: string,
    checkIn: string,
    checkOut: string,
    rooms: number,
  ): Promise<Prisma.Decimal> {
    const quote = (
      await this.engine.quote([roomTypeId], checkIn, checkOut)
    ).get(roomTypeId);
    if (!quote) throw roomTypeNotFound();
    return quote.total.times(rooms);
  }

  /** The hotel a room type belongs to, refusing one that is not on sale, exactly as `POST /bookings` does. */
  async hotelOf(roomTypeId: string): Promise<string> {
    const roomType = await this.prisma.roomType.findFirst({
      where: { roomTypeId, ...sellableRoomType, hotel: bookableHotel },
      select: { hotelId: true },
    });
    if (!roomType) throw roomTypeNotFound();
    return roomType.hotelId;
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
