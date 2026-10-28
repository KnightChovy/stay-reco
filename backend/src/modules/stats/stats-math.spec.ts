import { statsBucketCount } from '@stayreco/shared';
import {
  bucketsOf,
  metric,
  periodOf,
  previousPeriod,
  rateMetric,
  ratio,
  resolvePeriod,
} from './stats-math';

describe('stats math', () => {
  it('rounds ratios half up and gives null against 0', () => {
    expect(ratio(2, 3, 1, 100)).toBe(66.7);
    expect(ratio(1, 8, 2)).toBe(0.13);
    expect(ratio(5, 0, 1)).toBeNull();
  });

  it('compares with the previous period in percent, or in points for rates', () => {
    expect(metric(112, 100)).toEqual({
      value: 112,
      previous: 100,
      deltaPercent: 12,
    });
    expect(metric(5, 0)).toEqual({ value: 5, previous: 0, deltaPercent: null });
    expect(metric(null, 10).deltaPercent).toBeNull();
    // Half away from zero, also for a drop.
    expect(metric(98.75, 100).deltaPercent).toBe(-1.3);
    expect(rateMetric(67.7, 62.2)).toEqual({
      value: 67.7,
      previous: 62.2,
      deltaPoints: 5.5,
    });
    expect(rateMetric(null, 62.2).deltaPoints).toBeNull();
  });

  it('defaults to the month to date and compares with the days just before', () => {
    expect(resolvePeriod({}, '2026-10-21')).toEqual({
      from: '2026-10-01',
      to: '2026-10-21',
      days: 21,
    });
    expect(
      resolvePeriod({ from: '2026-09-01', to: '2026-09-30' }, '2026-10-21')
        .days,
    ).toBe(30);
    expect(previousPeriod(periodOf('2026-10-01', '2026-10-21'))).toEqual({
      from: '2026-09-10',
      to: '2026-09-30',
      days: 21,
    });
  });

  it('cuts weeks on Monday and months on the 1st, partial at both ends', () => {
    // 2026-10-28 is a Wednesday.
    expect(bucketsOf(periodOf('2026-10-28', '2026-11-10'), 'week')).toEqual([
      { start: '2026-10-28', end: '2026-11-01', days: 5 },
      { start: '2026-11-02', end: '2026-11-08', days: 7 },
      { start: '2026-11-09', end: '2026-11-10', days: 2 },
    ]);
    expect(bucketsOf(periodOf('2026-12-15', '2027-02-03'), 'month')).toEqual([
      { start: '2026-12-15', end: '2026-12-31', days: 17 },
      { start: '2027-01-01', end: '2027-01-31', days: 31 },
      { start: '2027-02-01', end: '2027-02-03', days: 3 },
    ]);
    expect(bucketsOf(periodOf('2026-10-01', '2026-10-03'), 'day')).toHaveLength(
      3,
    );
  });

  it('makes as many buckets as the shared limit counts', () => {
    for (const [from, to] of [
      ['2026-11-01', '2026-11-02'],
      ['2026-01-05', '2027-01-03'],
      ['2025-02-28', '2027-01-31'],
    ]) {
      for (const g of ['day', 'week', 'month'] as const) {
        expect(bucketsOf(periodOf(from, to), g)).toHaveLength(
          statsBucketCount(from, to, g),
        );
      }
    }
  });
});
