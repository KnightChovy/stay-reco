import { Prisma } from '../../generated/prisma/client';
import {
  bestDiscount,
  campaignUsable,
  discountAmount,
  meetsMinimum,
} from './discount';

const d = (v: number | string) => new Prisma.Decimal(v);
const date = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('discountAmount', () => {
  it('takes a percentage of the stay total', () => {
    const amount = discountAmount(d(2_000_000), {
      discountType: 'PERCENTAGE',
      discountValue: d(10),
    });
    expect(amount.toString()).toBe('200000');
  });

  it('takes a fixed amount as it is', () => {
    const amount = discountAmount(d(2_000_000), {
      discountType: 'FIXED_AMOUNT',
      discountValue: d(200_000),
    });
    expect(amount.toString()).toBe('200000');
  });

  it("caps a percentage at the voucher's maxDiscount", () => {
    const amount = discountAmount(d(10_000_000), {
      discountType: 'PERCENTAGE',
      discountValue: d(20),
      maxDiscount: d(500_000),
    });
    // 20% would be 2,000,000; the cap wins.
    expect(amount.toString()).toBe('500000');
  });

  it('never gives back more than the stay costs, so a booking can reach 0 but not go below', () => {
    const overshoot = discountAmount(d(800_000), {
      discountType: 'FIXED_AMOUNT',
      discountValue: d(1_000_000),
    });
    expect(overshoot.toString()).toBe('800000');

    const all = discountAmount(d(800_000), {
      discountType: 'PERCENTAGE',
      discountValue: d(100),
    });
    expect(all.toString()).toBe('800000');
  });

  it('rounds half up to whole dong, so SePay can match the transfer', () => {
    // 7.5% of 2,100,000 = 157,500 exactly; 7.5% of 2,100,001 = 157,500.075 → 157,500.
    expect(
      discountAmount(d(2_100_001), {
        discountType: 'PERCENTAGE',
        discountValue: d(7.5),
      }).toString(),
    ).toBe('157500');
    // 1/3 of 1,000,000 rounds up from 333,333.33…
    expect(
      discountAmount(d(1_000_000), {
        discountType: 'PERCENTAGE',
        discountValue: d('33.33335'),
      }).toString(),
    ).toBe('333334');
  });
});

describe('meetsMinimum', () => {
  it('clears a campaign with no minimum', () => {
    expect(meetsMinimum(d(100), null)).toBe(true);
    expect(meetsMinimum(d(100), undefined)).toBe(true);
  });

  it('treats the minimum as inclusive', () => {
    expect(meetsMinimum(d(1_000_000), d(1_000_000))).toBe(true);
    expect(meetsMinimum(d(999_999), d(1_000_000))).toBe(false);
  });
});

describe('campaignUsable', () => {
  const base = {
    isActive: true,
    validFrom: null,
    validTo: null,
    maxUses: null,
    currentUses: 0,
  };
  const today = '2026-11-09';

  it('accepts a switched-on campaign with no limits', () => {
    expect(campaignUsable(base, today)).toBe(true);
  });

  it('refuses one the hotel switched off', () => {
    expect(campaignUsable({ ...base, isActive: false }, today)).toBe(false);
  });

  it('includes both end dates', () => {
    const dated = {
      ...base,
      validFrom: date('2026-11-09'),
      validTo: date('2026-11-09'),
    };
    expect(campaignUsable(dated, '2026-11-09')).toBe(true);
    expect(campaignUsable(dated, '2026-11-08')).toBe(false);
    expect(campaignUsable(dated, '2026-11-10')).toBe(false);
  });

  it('refuses one that has run out of uses', () => {
    expect(
      campaignUsable({ ...base, maxUses: 10, currentUses: 9 }, today),
    ).toBe(true);
    expect(
      campaignUsable({ ...base, maxUses: 10, currentUses: 10 }, today),
    ).toBe(false);
  });
});

describe('bestDiscount', () => {
  const offer = (name: string, amount: number) => ({ name, amount: d(amount) });

  it('takes the larger of the automatic campaigns', () => {
    const picked = bestDiscount(
      [offer('small', 100_000), offer('big', 300_000), offer('mid', 200_000)],
      null,
    );
    expect(picked?.name).toBe('big');
  });

  it('never stacks: a code replaces the automatic campaign rather than adding to it', () => {
    const picked = bestDiscount(
      [offer('auto', 100_000)],
      offer('code', 300_000),
    );
    expect(picked?.name).toBe('code');
    expect(picked?.amount.toString()).toBe('300000');
  });

  it('leaves the customer on the better automatic campaign when their code saves less', () => {
    const picked = bestDiscount(
      [offer('auto', 500_000)],
      offer('code', 100_000),
    );
    expect(picked?.name).toBe('auto');
  });

  it('gives a tie to the typed code, so a personal voucher is the one used', () => {
    const picked = bestDiscount(
      [offer('auto', 200_000)],
      offer('code', 200_000),
    );
    expect(picked?.name).toBe('code');
  });

  it('answers nothing when there is nothing to apply', () => {
    expect(bestDiscount([], null)).toBeNull();
  });
});
