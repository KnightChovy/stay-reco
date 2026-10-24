import { Prisma } from '../../generated/prisma/client';

export interface CancellationTerms {
  /** Fixed on the booking (BR-07); null: no free-cancellation period. */
  freeCancelUntil: Date | null;
  cancelFeePercent: Prisma.Decimal;
}

export interface CancellationAmounts {
  fee: Prisma.Decimal;
  refund: Prisma.Decimal;
}

/**
 * Fee and refund of a cancellation made `now` (money-rules §7.1, BR-08): no fee before the free-cancellation
 * deadline, otherwise the fee percent of the amount paid; refund = paid − fee, rounded half up to 2 decimals. The
 * refund goes to the customer wallet, not through a bank transfer, so it keeps decimals.
 */
export function cancellationAmounts(
  terms: CancellationTerms,
  paid: Prisma.Decimal,
  now = new Date(),
): CancellationAmounts {
  const free = terms.freeCancelUntil !== null && now < terms.freeCancelUntil;
  const fee = free
    ? new Prisma.Decimal(0)
    : paid
        .times(terms.cancelFeePercent)
        .dividedBy(100)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return { fee, refund: paid.minus(fee) };
}
