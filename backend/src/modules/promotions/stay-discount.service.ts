import { Injectable } from '@nestjs/common';
import type {
  AppliedDiscount,
  DiscountQuote,
  DiscountQuoteInput,
} from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceEngine } from '../pricing/price-engine';
import { roomTypeNotFound } from '../rooms/room-types.service';
import { bookableHotel, sellableRoomType } from '../stays/bookable';
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
    return {
      subtotal: toNumber(subtotal),
      discount,
      expectedTotal: toNumber(payable(subtotal, discount)),
    };
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
