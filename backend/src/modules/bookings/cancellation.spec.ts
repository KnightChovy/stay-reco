import { Prisma } from '../../generated/prisma/client';
import { cancellationAmounts } from './cancellation';

const d = (v: number | string) => new Prisma.Decimal(v);
const paid = d(5_000_000);
const deadline = new Date('2026-11-15T07:00:00Z'); // 14:00 on 15/11 in Vietnam

describe('cancellationAmounts', () => {
  // The money-rules §7.1 example: 5,000,000 paid, free until 14:00 on 15/11, 30% fee after.
  const terms = { freeCancelUntil: deadline, cancelFeePercent: d(30) };

  it('charges nothing before the free-cancellation deadline', () => {
    const { fee, refund } = cancellationAmounts(
      terms,
      paid,
      new Date('2026-11-10T03:00:00Z'),
    );
    expect([fee.toNumber(), refund.toNumber()]).toEqual([0, 5_000_000]);
  });

  it('keeps the fee percent from the deadline on', () => {
    for (const now of [deadline, new Date('2026-11-16T03:00:00Z')]) {
      const { fee, refund } = cancellationAmounts(terms, paid, now);
      expect([fee.toNumber(), refund.toNumber()]).toEqual([
        1_500_000, 3_500_000,
      ]);
    }
  });

  it('refunds nothing on a non-refundable booking', () => {
    const { fee, refund } = cancellationAmounts(
      { freeCancelUntil: null, cancelFeePercent: d(100) },
      paid,
    );
    expect([fee.toNumber(), refund.toNumber()]).toEqual([5_000_000, 0]);
  });

  it('rounds the fee half up to 2 decimals', () => {
    // 2,000,001 × 12.5% = 250,000.125 → 250,000.13
    const { fee, refund } = cancellationAmounts(
      { freeCancelUntil: null, cancelFeePercent: d('12.5') },
      d(2_000_001),
    );
    expect([fee.toString(), refund.toString()]).toEqual([
      '250000.13',
      '1750000.87',
    ]);
  });
});
