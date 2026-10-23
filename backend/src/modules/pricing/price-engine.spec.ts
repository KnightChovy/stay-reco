import { Prisma, type Price } from '../../generated/prisma/client';
import { applyRule, priceNight, ruleMatches } from './price-engine';

const d = (value: number | string) => new Prisma.Decimal(value);
const date = (value: string) => new Date(`${value}T00:00:00Z`);

let seq = 0;
const rule = (fields: Partial<Price>): Price => ({
  priceId: `rule-${++seq}`,
  roomTypeId: 'rt',
  roomId: null,
  name: `Rule ${seq}`,
  pricePerNight: null,
  currency: 'VND',
  validFrom: null,
  validTo: null,
  dayOfWeek: null,
  ruleType: 'SEASON',
  adjustmentType: 'PERCENT',
  adjustmentValue: d(10),
  minDaysBefore: null,
  maxDaysBefore: null,
  priority: 0,
  isActive: true,
  createdAt: new Date(),
  ...fields,
});

const base = d(2_000_000);

describe('ruleMatches', () => {
  it('matches nights inside the date range, both ends included', () => {
    const tet = rule({
      validFrom: date('2027-02-01'),
      validTo: date('2027-02-10'),
    });
    expect(ruleMatches(tet, '2027-01-31', 0)).toBe(false);
    expect(ruleMatches(tet, '2027-02-01', 0)).toBe(true);
    expect(ruleMatches(tet, '2027-02-10', 0)).toBe(true);
    expect(ruleMatches(tet, '2027-02-11', 0)).toBe(false);
  });

  it('matches only the given weekday', () => {
    const saturdays = rule({
      validFrom: date('2027-01-01'),
      validTo: date('2027-12-31'),
      dayOfWeek: 'SAT',
    });
    expect(ruleMatches(saturdays, '2027-02-06', 0)).toBe(true); // a Saturday
    expect(ruleMatches(saturdays, '2027-02-05', 0)).toBe(false);
  });

  it('counts early-bird and last-minute windows in days before check-in', () => {
    const early = rule({ ruleType: 'EARLY_BIRD', minDaysBefore: 30 });
    expect(ruleMatches(early, '2027-03-01', 29)).toBe(false);
    expect(ruleMatches(early, '2027-03-01', 30)).toBe(true);

    const late = rule({ ruleType: 'LAST_MINUTE', maxDaysBefore: 3 });
    expect(ruleMatches(late, '2027-03-01', 3)).toBe(true);
    expect(ruleMatches(late, '2027-03-01', 4)).toBe(false);
  });

  it('ignores inactive rules and the BASE row', () => {
    expect(ruleMatches(rule({ isActive: false }), '2027-03-01', 0)).toBe(false);
    expect(
      ruleMatches(
        rule({ ruleType: 'BASE', pricePerNight: base }),
        '2027-03-01',
        0,
      ),
    ).toBe(false);
  });
});

describe('applyRule', () => {
  it('sets, adds or applies a percentage of the base price', () => {
    expect(
      applyRule(
        base,
        rule({ adjustmentType: 'SET_PRICE', adjustmentValue: d(4_500_000) }),
      ),
    ).toEqual(d(4_500_000));
    expect(
      applyRule(
        base,
        rule({ adjustmentType: 'AMOUNT', adjustmentValue: d(-200_000) }),
      ),
    ).toEqual(d(1_800_000));
    expect(
      applyRule(
        base,
        rule({ adjustmentType: 'PERCENT', adjustmentValue: d(15) }),
      ),
    ).toEqual(d(2_300_000));
  });

  it('rounds half up to whole dong', () => {
    // 1,000.05 × 0.85 = 850.0425 → 850; 1,001 × 1.5 = 1,501.5 → 1,502
    expect(
      applyRule(
        d('1000.05'),
        rule({ adjustmentType: 'PERCENT', adjustmentValue: d(-15) }),
      ),
    ).toEqual(d(850));
    expect(
      applyRule(
        d(1001),
        rule({ adjustmentType: 'PERCENT', adjustmentValue: d(50) }),
      ),
    ).toEqual(d(1502));
  });
});

describe('priceNight', () => {
  // Rules come sorted by priority, then newest (the order the engine loads them in).
  const saturdays = rule({
    validFrom: date('2027-01-01'),
    validTo: date('2027-12-31'),
    dayOfWeek: 'SAT',
    adjustmentValue: d(15),
    priority: 1,
  });
  const early = rule({
    ruleType: 'EARLY_BIRD',
    minDaysBefore: 30,
    adjustmentValue: d(-10),
    priority: 2,
  });

  it('applies only the first matching rule (money-rules §2.3 example)', () => {
    const rules = [early, saturdays];
    expect(priceNight(base, rules, '2027-02-05', 40)).toEqual({
      date: '2027-02-05',
      price: d(1_800_000),
      rule: { priceId: early.priceId, name: early.name },
    });
    // Saturday: both match, the early-bird rule has the higher priority and nothing is stacked.
    expect(priceNight(base, rules, '2027-02-06', 40).price).toEqual(
      d(1_800_000),
    );
    // Booked 10 days ahead: only the Saturday rule matches.
    expect(priceNight(base, rules, '2027-02-06', 10).price).toEqual(
      d(2_300_000),
    );
  });

  it('rounds a base price with decimals when it applies', () => {
    expect(priceNight(d('1999.5'), [], '2027-02-05', 0).price).toEqual(d(2000));
  });

  it('falls back to the base price when no rule matches', () => {
    expect(priceNight(base, [early], '2027-02-05', 5)).toEqual({
      date: '2027-02-05',
      price: base,
      rule: null,
    });
  });

  it('skips a rule that would make the night free and tries the next one', () => {
    const tooLarge = rule({
      adjustmentType: 'AMOUNT',
      adjustmentValue: d(-2_000_000),
      priority: 5,
    });
    expect(priceNight(base, [tooLarge, early], '2027-02-05', 40).rule).toEqual({
      priceId: early.priceId,
      name: early.name,
    });
    expect(priceNight(base, [tooLarge], '2027-02-05', 40).price).toEqual(base);
  });
});
