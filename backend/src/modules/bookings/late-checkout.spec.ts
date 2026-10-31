import { lateCheckout } from './late-checkout';

const stay = {
  checkOut: '2026-11-20',
  checkOutTime: '12:00',
  lastNightPrice: 1_200_000,
  rooms: 1,
};
const policy = {
  graceMinutes: 30,
  cutoffTime: '18:00',
  beforeCutoffPercent: 50,
  afterCutoffPercent: 100,
};
/** Vietnam wall-clock time. */
const at = (date: string, time: string) => new Date(`${date}T${time}:00+07:00`);
const fee = (now: Date, s = stay) =>
  lateCheckout(s, policy, now).fee?.amount.toNumber() ?? 0;

describe('lateCheckout', () => {
  // The money-rules §5.5 example.
  it('is free on time and within the grace period', () => {
    const early = lateCheckout(stay, policy, at('2026-11-20', '11:00'));
    expect(early).toMatchObject({ minutesLate: 0, late: false, fee: null });
    const grace = lateCheckout(stay, policy, at('2026-11-20', '12:20'));
    expect(grace).toMatchObject({ minutesLate: 20, late: false, fee: null });
    expect(grace.scheduledAt).toEqual(at('2026-11-20', '12:00'));
  });

  it('charges the lower percent before the cutoff and the full one from it', () => {
    expect(fee(at('2026-11-20', '15:00'))).toBe(600_000);
    expect(fee(at('2026-11-20', '18:00'))).toBe(1_200_000);
    expect(fee(at('2026-11-20', '19:00'))).toBe(1_200_000);
  });

  it('adds the full percent for each day after the check-out date', () => {
    expect(fee(at('2026-11-21', '10:00'))).toBe(1_800_000);
    const twoDays = lateCheckout(stay, policy, at('2026-11-22', '20:00'));
    expect(twoDays.fee).toMatchObject({ percent: 300 });
    expect(twoDays.fee!.amount.toNumber()).toBe(3_600_000);
  });

  it('multiplies by the rooms and rounds half up to whole dong', () => {
    const res = lateCheckout(
      { ...stay, lastNightPrice: 1_234_567, rooms: 2 },
      { ...policy, beforeCutoffPercent: 33 },
      at('2026-11-20', '13:00'),
    );
    // 2,469,134 × 33% = 814,814.22
    expect(res.fee!.nightPrice.toNumber()).toBe(2_469_134);
    expect(res.fee!.amount.toNumber()).toBe(814_814);
  });

  it('costs nothing without a policy, but still counts the delay', () => {
    const res = lateCheckout(stay, null, at('2026-11-20', '12:05'));
    expect(res).toMatchObject({ minutesLate: 5, late: true, fee: null });
  });
});
