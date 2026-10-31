import { Prisma } from '../../generated/prisma/client';
import { commissionOf } from './commission';

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
