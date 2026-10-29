import { Prisma } from '../../generated/prisma/client';
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
      roomType: { select: { hotelId: true } },
    },
  });
  const commission = commissionOf(booking.totalAmount, booking.commissionRate);
  const description = `Commission on ${booking.invoice!.invoiceNumber}`;
  const hotelWallet = await ledger.hotelWallet(tx, booking.roomType.hotelId);
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
