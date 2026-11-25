import { payoutDueBy } from './payout-events';

describe('payoutDueBy', () => {
  const due = (at: string) => payoutDueBy(new Date(at)).toISOString();

  it('adds two working days, keeping the time of day', () => {
    // Wednesday 10:00 in Vietnam → Friday 10:00.
    expect(due('2026-11-11T03:00:00.000Z')).toBe('2026-11-13T03:00:00.000Z');
  });

  it('skips the weekend', () => {
    // Friday 10:00 → Tuesday 10:00; Saturday 10:00 → Tuesday 10:00.
    expect(due('2026-11-13T03:00:00.000Z')).toBe('2026-11-17T03:00:00.000Z');
    expect(due('2026-11-14T03:00:00.000Z')).toBe('2026-11-17T03:00:00.000Z');
  });

  it('counts the days of the Vietnam calendar, not UTC', () => {
    // Friday 18:00 UTC is already Saturday 01:00 in Vietnam: due Tuesday 01:00 there, Monday 18:00 UTC.
    expect(due('2026-11-13T18:00:00.000Z')).toBe('2026-11-16T18:00:00.000Z');
  });
});
