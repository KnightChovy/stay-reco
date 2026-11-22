import { Prisma } from '../../generated/prisma/client';
import {
  commissionAfterPlatformDiscount,
  commissionOf,
  platformDiscountOf,
} from './commission';

const d = (v: number | string) => new Prisma.Decimal(v);

describe('commissionOf', () => {
  it('takes the rate fixed on the booking', () => {
    expect(commissionOf(d(2_000_000), d(8)).toNumber()).toBe(160_000);
    expect(commissionOf(d(2_000_000), d('12.50')).toNumber()).toBe(250_000);
  });

  it('rounds half up to whole dong', () => {
    // 1,234,567 × 8% = 98,765.36; × 10.5% = 129,629.535.
    expect(commissionOf(d(1_234_567), d(8)).toNumber()).toBe(98_765);
    expect(commissionOf(d(1_234_567), d('10.50')).toNumber()).toBe(129_630);
    // 6,256.25 × 8% = 500.5.
    expect(commissionOf(d('6256.25'), d(8)).toNumber()).toBe(501);
  });
});

describe('commissionAfterPlatformDiscount', () => {
  it('leaves the hotel what it would have netted without the platform discount', () => {
    // 2,000,000 of rooms, 5 % welcome code: the guest pays 1,900,000.
    const commission = commissionAfterPlatformDiscount(
      d(1_900_000),
      d(10),
      d(100_000),
    );
    expect(commission.toNumber()).toBe(100_000);
    // The hotel keeps 1,900,000 − 100,000 = 1,800,000, the same as 2,000,000 − 10 %.
    expect(1_900_000 - commission.toNumber()).toBe(
      2_000_000 - commissionOf(d(2_000_000), d(10)).toNumber(),
    );
  });

  it('is plain commissionOf without a platform discount', () => {
    expect(
      commissionAfterPlatformDiscount(d(1_234_567), d(8), d(0)).toNumber(),
    ).toBe(98_765);
  });

  it('never goes below 0, even with a discount written by hand above the cap', () => {
    expect(
      commissionAfterPlatformDiscount(
        d(1_000_000),
        d(8),
        d(500_000),
      ).toNumber(),
    ).toBe(0);
  });
});

describe('platformDiscountOf', () => {
  it('works the discount out again from the fixed room subtotal and the code', () => {
    const terms = {
      discountType: 'PERCENTAGE' as const,
      discountValue: d(5),
      maxDiscount: d(200_000),
    };
    expect(
      platformDiscountOf({ roomSubtotal: d(2_000_000), terms }).toNumber(),
    ).toBe(100_000);
    // 5 % of 6,000,000 is 300,000; the code caps it at 200,000.
    expect(
      platformDiscountOf({ roomSubtotal: d(6_000_000), terms }).toNumber(),
    ).toBe(200_000);
  });

  it('is 0 for a booking without a platform discount', () => {
    expect(
      platformDiscountOf({
        roomSubtotal: d(2_000_000),
        terms: null,
      }).toNumber(),
    ).toBe(0);
  });
});
