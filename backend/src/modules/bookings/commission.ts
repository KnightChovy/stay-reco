import { Prisma } from '../../generated/prisma/client';
import { campaignDiscount, type DiscountTerms } from '../promotions/discount';
import {
  PLATFORM_WALLET_ID,
  type WalletLedger,
} from '../wallets/wallet-ledger';

/** Booking total × the rate fixed at booking (a percent, e.g. 8.00), rounded half up to whole dong (O6). */
export function commissionOf(
  total: Prisma.Decimal,
  ratePercent: Prisma.Decimal,
): Prisma.Decimal {
  return total
    .times(ratePercent)
    .dividedBy(100)
    .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * The commission of a booking that took a **platform** discount (money-rules §2.1, §5.4): the platform pays for its
 * own discount out of its commission.
 *
 * The rate applies to the total as it would have been without the discount, and the discount comes off what the
 * platform keeps, so the hotel nets exactly what it would have without the voucher. A platform discount is capped at
 * the lowest commission rate (`PLATFORM_DISCOUNT_CAP_PERCENT`), so this is never below 0; the floor only guards a
 * figure written by hand. With no platform discount it is `commissionOf(total, rate)`.
 */
export function commissionAfterPlatformDiscount(
  total: Prisma.Decimal,
  ratePercent: Prisma.Decimal,
  platformDiscount: Prisma.Decimal,
): Prisma.Decimal {
  const commission = commissionOf(
    total.plus(platformDiscount),
    ratePercent,
  ).minus(platformDiscount);
  return commission.isNegative() ? new Prisma.Decimal(0) : commission;
}

/** What a booking carries that the platform discount is computed from. */
export interface PlatformDiscountSource {
  /** Sum of the booking items: the rooms the discount was taken from, add-ons excluded. */
  roomSubtotal: Prisma.Decimal;
  /** The campaign's terms when it is the platform's (`hotel_id` null), the voucher's when one was typed; else null. */
  terms: DiscountTerms | null;
}

/**
 * The platform discount of a booking, worked out again from what was fixed when it was made: the room subtotal and
 * the voucher's (or campaign's) terms. Both are copied onto the booking at that moment and never change, so the
 * result is the amount the guest was given - computed by the same `campaignDiscount` the quote used, which is why no
 * column is needed to remember it.
 */
export function platformDiscountOf(source: PlatformDiscountSource) {
  if (!source.terms) return new Prisma.Decimal(0);
  return campaignDiscount(source.roomSubtotal, source.terms, true);
}

/** The booking's platform discount source, read in the caller's transaction. */
export async function platformDiscountSource(
  tx: Prisma.TransactionClient,
  bookingId: string,
): Promise<PlatformDiscountSource> {
  const booking = await tx.booking.findUniqueOrThrow({
    where: { bookingId },
    select: {
      items: { select: { subtotal: true } },
      voucher: {
        select: { discountType: true, discountValue: true, maxDiscount: true },
      },
      promotion: {
        select: { hotelId: true, discountType: true, discountValue: true },
      },
    },
  });
  const roomSubtotal = booking.items.reduce(
    (n, i) => n.plus(i.subtotal),
    new Prisma.Decimal(0),
  );
  const platformWide = booking.promotion && booking.promotion.hotelId === null;
  return {
    roomSubtotal,
    terms: platformWide ? (booking.voucher ?? booking.promotion) : null,
  };
}

/**
 * The platform commission of a completed stay or a no-show (money-rules §5.4), as a pair: hotel wallet pending
 * −commission, platform wallet available +commission. The idempotency keys write it once per booking. Resolves to the
 * commission.
 */
export async function chargeCommission(
  tx: Prisma.TransactionClient,
  ledger: WalletLedger,
  bookingId: string,
): Promise<Prisma.Decimal> {
  const booking = await tx.booking.findUniqueOrThrow({
    where: { bookingId },
    select: {
      totalAmount: true,
      commissionRate: true,
      invoice: { select: { invoiceNumber: true } },
      hotelId: true,
    },
  });
  const commission = commissionAfterPlatformDiscount(
    booking.totalAmount,
    booking.commissionRate,
    platformDiscountOf(await platformDiscountSource(tx, bookingId)),
  );
  const description = `Commission on ${booking.invoice!.invoiceNumber}`;
  const hotelWallet = await ledger.hotelWallet(tx, booking.hotelId);
  await ledger.post(tx, {
    walletId: hotelWallet.walletId,
    type: 'COMMISSION',
    amount: commission.negated(),
    balance: 'pending',
    idempotencyKey: `commission:${bookingId}:hotel`,
    bookingId,
    description,
  });
  await ledger.post(tx, {
    walletId: PLATFORM_WALLET_ID,
    type: 'COMMISSION',
    amount: commission,
    balance: 'available',
    idempotencyKey: `commission:${bookingId}:platform`,
    bookingId,
    description,
  });
  return commission;
}
