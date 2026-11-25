import { Prisma } from '../../generated/prisma/client';
import {
  earnRate,
  nextTier,
  pointsEarned,
  pointsToSpend,
  pointsValue,
  redeemCap,
  tierFor,
} from './points';

const d = (v: number | string) => new Prisma.Decimal(v);

// The seeded StayMiles rates: 1 point per 1,000 d, a point worth 100 d.
const EARN = d(0.001);
const VALUE = d(100);

describe('pointsEarned', () => {
  it('gives one point per 1,000 dong spent', () => {
    expect(pointsEarned(d(2_000_000), EARN)).toBe(2000);
    expect(pointsEarned(d(1_000), EARN)).toBe(1);
  });

  it('rounds down, so a point is never credited before it is earned', () => {
    expect(pointsEarned(d(1_999), EARN)).toBe(1);
    expect(pointsEarned(d(999), EARN)).toBe(0);
  });

  it('earns nothing on a free or broken stay', () => {
    expect(pointsEarned(d(0), EARN)).toBe(0);
    expect(pointsEarned(d(-1000), EARN)).toBe(0);
    expect(pointsEarned(d(2_000_000), d(0))).toBe(0);
  });
});

describe('pointsValue', () => {
  it('turns points into dong at the programme rate', () => {
    expect(pointsValue(2000, VALUE, d(1_000_000)).toString()).toBe('200000');
  });

  it('never takes off more than is still owed, so a stay can reach 0 but not go below', () => {
    expect(pointsValue(50_000, VALUE, d(300_000)).toString()).toBe('300000');
  });

  it('is nothing when there are no points, or the programme gives them no value', () => {
    expect(pointsValue(0, VALUE, d(500_000)).toString()).toBe('0');
    expect(pointsValue(100, d(0), d(500_000)).toString()).toBe('0');
  });

  it('rounds to whole dong, so SePay can match the transfer', () => {
    expect(pointsValue(3, d('33.33'), d(1_000_000)).toString()).toBe('100');
  });
});

describe('pointsToSpend', () => {
  it('spends only what the stay needs and leaves the rest on the balance', () => {
    // 10,000 points would be worth 1,000,000 d, but the stay only owes 300,000.
    expect(pointsToSpend(10_000, VALUE, d(300_000))).toBe(3000);
  });

  it('spends everything offered when the stay costs more than the points are worth', () => {
    expect(pointsToSpend(2000, VALUE, d(5_000_000))).toBe(2000);
  });

  it('rounds the last point in the customer\x27s favour', () => {
    // 250 d owed at 100 d a point: 3 points, and pointsValue caps what they are worth at 250.
    expect(pointsToSpend(10, VALUE, d(250))).toBe(3);
    expect(pointsValue(3, VALUE, d(250)).toString()).toBe('250');
  });

  it('spends nothing when there is nothing to spend', () => {
    expect(pointsToSpend(0, VALUE, d(500_000))).toBe(0);
    expect(pointsToSpend(100, d(0), d(500_000))).toBe(0);
  });
});

describe('tierFor', () => {
  it('starts every customer at MEMBER', () => {
    expect(tierFor(0)).toBe('MEMBER');
    expect(tierFor(9_999)).toBe('MEMBER');
  });

  it('moves up as lifetime points pass each threshold', () => {
    expect(tierFor(10_000)).toBe('SILVER');
    expect(tierFor(29_999)).toBe('SILVER');
    expect(tierFor(30_000)).toBe('GOLD');
    expect(tierFor(99_999)).toBe('GOLD');
    expect(tierFor(100_000)).toBe('PLATINUM');
    expect(tierFor(5_000_000)).toBe('PLATINUM');
  });
});

describe('nextTier', () => {
  it('says what is left to reach the next one', () => {
    expect(nextTier(0)).toEqual({ tier: 'SILVER', pointsNeeded: 10_000 });
    expect(nextTier(9_450)).toEqual({ tier: 'SILVER', pointsNeeded: 550 });
    expect(nextTier(30_000)).toEqual({
      tier: 'PLATINUM',
      pointsNeeded: 70_000,
    });
  });

  it('answers nothing once PLATINUM is reached', () => {
    expect(nextTier(100_000)).toBeNull();
  });
});

describe('redeemCap', () => {
  it('keeps the whole stay at 100 %', () => {
    expect(redeemCap(d(1_500_000), d(100)).toNumber()).toBe(1_500_000);
  });

  it('takes the hotel share of the stay after the discount', () => {
    expect(redeemCap(d(1_500_000), d(30)).toNumber()).toBe(450_000);
  });

  it('rounds down to whole dong, so the cap is never exceeded', () => {
    // 999,999 x 33.33 % = 333,299.6667
    expect(redeemCap(d(999_999), d(33.33)).toNumber()).toBe(333_299);
  });

  it('caps what points may take off together with pointsToSpend', () => {
    const cap = redeemCap(d(2_000_000), d(50));
    // 1,000,000 at 100 d a point: 10,000 points at most, whatever the balance.
    expect(pointsToSpend(50_000, d(100), cap)).toBe(10_000);
    expect(pointsValue(50_000, d(100), cap).toNumber()).toBe(1_000_000);
  });
});

describe('earnRate', () => {
  it('is the platform rate when the hotel has no rules on', () => {
    expect(earnRate(d(0.001), null).toNumber()).toBe(0.001);
  });

  it('stays at the platform rate while the limit is 1x', () => {
    // A hotel giving more would have another hotel pay for its points (money-rules §9, M4).
    expect(earnRate(d(0.001), d(0.002)).toNumber()).toBe(0.001);
  });

  it('uses the hotel rate inside a wider limit', () => {
    expect(earnRate(d(0.001), d(0.002), 3).toNumber()).toBe(0.002);
  });

  it('never goes below the platform rate nor above the limit', () => {
    // The platform rate changed after the hotel saved its own.
    expect(earnRate(d(0.002), d(0.001), 3).toNumber()).toBe(0.002);
    expect(earnRate(d(0.0005), d(0.003), 3).toNumber()).toBe(0.0015);
  });
});
