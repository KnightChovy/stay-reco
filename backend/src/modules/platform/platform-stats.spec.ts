import { placeKey, regionOf } from '@stayreco/shared';
import { platformPeriod } from './platform-stats.service';

describe('regionOf (decision M7)', () => {
  it('reads the city the way hotels write it', () => {
    expect(
      [
        'Hà Nội',
        'Thành phố Hà Nội',
        'Đà Nẵng',
        'TP. Hồ Chí Minh',
        'Tp Hồ Chí Minh',
        'Sài Gòn',
        'Khánh Hoà',
        'Khánh Hòa',
        'Bà Rịa - Vũng Tàu',
        'Đà Lạt',
        'Phú Quốc',
        'Sa Pa',
        'Atlantis',
      ].map(regionOf),
    ).toEqual([
      'NORTH',
      'NORTH',
      'CENTRAL',
      'SOUTH',
      'SOUTH',
      'SOUTH',
      'CENTRAL',
      'CENTRAL',
      'SOUTH',
      'CENTRAL',
      'SOUTH',
      'NORTH',
      'OTHER',
    ]);
  });

  it('compares names without Vietnamese marks', () => {
    expect(placeKey('  Thành phố  Đà Nẵng ')).toBe('da nang');
  });
});

describe('platformPeriod', () => {
  it('takes the query, or the last 30 days up to today', () => {
    expect(
      platformPeriod({ from: '2026-10-01', to: '2026-10-31' }, '2026-11-12'),
    ).toEqual({ from: '2026-10-01', to: '2026-10-31', days: 31 });
    expect(platformPeriod({}, '2026-11-12')).toEqual({
      from: '2026-10-14',
      to: '2026-11-12',
      days: 30,
    });
  });
});
