import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AppliedDiscount } from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';
import { todayInVietnam } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  bestDiscount,
  campaignUsable,
  discountAmount,
  meetsMinimum,
} from './discount';

/** A discount that could apply, with the amount it would take off, before the best one is picked. */
interface Candidate {
  kind: 'PROMOTION' | 'VOUCHER';
  promotionId: string;
  voucherId: string | null;
  name: string;
  code: string | null;
  amount: Prisma.Decimal;
}

const voucherNotFound = () =>
  new NotFoundException({
    code: ErrorCode.VOUCHER_NOT_FOUND,
    message: 'Discount code not found',
  });

/**
 * Decides the one discount a stay gets (BR-06, money-rules §2.1).
 *
 * Two sources. A **promotion** is a campaign the hotel (or the platform) runs; it applies on its own, with nothing
 * typed. A **voucher** is one customer's personal code. A booking takes one or the other, never both, and gets
 * whichever saves more — so typing a code can only ever help.
 *
 * Nothing here holds or spends anything: quoting a stay is read-only, and the voucher is only marked as used when
 * the booking is actually created.
 */
@Injectable()
export class DiscountService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The discount that applies to a stay of `subtotal` at `hotelId`, with an optional code the customer typed.
   *
   * A code that cannot be used is an error rather than a silent fallback: a customer who typed one deserves to know
   * why it did not work, instead of watching the total quietly stay the same.
   */
  async forStay(
    customerId: string,
    hotelId: string,
    subtotal: Prisma.Decimal,
    code?: string,
    today = todayInVietnam(),
  ): Promise<AppliedDiscount | null> {
    const [automatic, typed] = await Promise.all([
      this.automaticCandidates(hotelId, subtotal, today),
      code
        ? this.voucherCandidate(customerId, hotelId, subtotal, code, today)
        : Promise.resolve(null),
    ]);
    const picked = bestDiscount(automatic, typed);
    if (!picked) return null;
    return {
      kind: picked.kind,
      promotionId: picked.promotionId,
      voucherId: picked.voucherId,
      name: picked.name,
      code: picked.code,
      amount: toNumber(picked.amount),
    };
  }

  /**
   * Campaigns that apply by themselves: the hotel's own, plus the platform-wide ones (`hotel_id` null), that are
   * usable today and that the stay is large enough for.
   */
  private async automaticCandidates(
    hotelId: string,
    subtotal: Prisma.Decimal,
    today: string,
  ): Promise<Candidate[]> {
    const campaigns = await this.prisma.promotion.findMany({
      where: { isActive: true, OR: [{ hotelId }, { hotelId: null }] },
    });
    return campaigns
      .filter(
        (p) =>
          campaignUsable(p, today) &&
          meetsMinimum(subtotal, p.minBookingAmount),
      )
      .map((p) => ({
        kind: 'PROMOTION' as const,
        promotionId: p.promotionId,
        voucherId: null,
        name: p.name,
        code: null,
        amount: discountAmount(subtotal, p),
      }))
      .filter((c) => c.amount.greaterThan(0));
  }

  /** The code the customer typed, checked against every reason it might not apply. */
  private async voucherCandidate(
    customerId: string,
    hotelId: string,
    subtotal: Prisma.Decimal,
    code: string,
    today: string,
  ): Promise<Candidate> {
    const voucher = await this.prisma.voucher.findUnique({
      where: { code: code.trim().toUpperCase() },
      include: { promotion: true },
    });
    // Someone else's code is "not found", not "forbidden": a customer must not be able to probe which codes exist.
    if (!voucher || voucher.customerId !== customerId) throw voucherNotFound();

    if (voucher.usedAt) {
      throw new ConflictException({
        code: ErrorCode.VOUCHER_ALREADY_USED,
        message: 'This code has already been used',
      });
    }
    if (voucher.expiresAt && voucher.expiresAt <= new Date()) {
      throw new ConflictException({
        code: ErrorCode.VOUCHER_EXPIRED,
        message: 'This code has expired',
      });
    }
    if (!campaignUsable(voucher.promotion, today)) {
      throw new ConflictException({
        code: ErrorCode.VOUCHER_EXPIRED,
        message: 'The campaign behind this code is no longer running',
      });
    }
    // A campaign of another hotel; a platform-wide one (`hotel_id` null) covers every hotel.
    if (voucher.promotion.hotelId && voucher.promotion.hotelId !== hotelId) {
      throw new ConflictException({
        code: ErrorCode.VOUCHER_NOT_APPLICABLE,
        message: 'This code is for another hotel',
      });
    }
    if (!meetsMinimum(subtotal, voucher.promotion.minBookingAmount)) {
      throw new ConflictException({
        code: ErrorCode.VOUCHER_NOT_APPLICABLE,
        message: 'The stay is below the minimum amount for this code',
        details: [
          {
            field: 'code',
            message: `minimum ${voucher.promotion.minBookingAmount!.toString()}`,
          },
        ],
      });
    }

    return {
      kind: 'VOUCHER',
      promotionId: voucher.promotionId,
      voucherId: voucher.voucherId,
      name: voucher.promotion.name,
      code: voucher.code,
      amount: discountAmount(subtotal, voucher),
    };
  }

  /**
   * Takes the discount for a booking being created, inside that booking's transaction.
   *
   * The voucher is marked used and the campaign's counter raised in the same transaction as the booking, under
   * conditional updates: two bookings racing for the last use of a campaign, or for one voucher, cannot both win.
   * Returns false when the race was lost, and the caller prices the booking without the discount.
   */
  async consume(
    tx: Prisma.TransactionClient,
    discount: AppliedDiscount,
    today = todayInVietnam(),
  ): Promise<boolean> {
    if (discount.voucherId) {
      const { count } = await tx.voucher.updateMany({
        where: { voucherId: discount.voucherId, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (!count) return false;
    }
    const campaign = await tx.promotion.findUniqueOrThrow({
      where: { promotionId: discount.promotionId },
    });
    if (!campaignUsable(campaign, today)) return false;

    const { count } = await tx.promotion.updateMany({
      where:
        campaign.maxUses === null
          ? { promotionId: discount.promotionId }
          : {
              promotionId: discount.promotionId,
              currentUses: { lt: campaign.maxUses },
            },
      data: { currentUses: { increment: 1 } },
    });
    return count > 0;
  }

  /**
   * Gives a discount back when a booking never became a stay: the hold expired unpaid, or the booking was cancelled.
   * Without this a customer would lose a personal code to a payment they never made.
   */
  async release(
    tx: Prisma.TransactionClient,
    bookingId: string,
  ): Promise<void> {
    const booking = await tx.booking.findUnique({
      where: { bookingId },
      select: { voucherId: true, promotionId: true },
    });
    if (!booking?.promotionId) return;

    if (booking.voucherId) {
      await tx.voucher.updateMany({
        where: { voucherId: booking.voucherId },
        data: { usedAt: null },
      });
    }
    // Never below zero, so a double release cannot make a campaign look unused.
    await tx.promotion.updateMany({
      where: { promotionId: booking.promotionId, currentUses: { gt: 0 } },
      data: { currentUses: { decrement: 1 } },
    });
  }
}
