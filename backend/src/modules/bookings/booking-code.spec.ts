import { newBookingCode } from './booking-code';

describe('newBookingCode', () => {
  it('uses the booking date in Vietnam and 4 digits', () => {
    // 2026-10-22 18:30 UTC is already 2026-10-23 in Vietnam.
    const code = newBookingCode(new Date('2026-10-22T18:30:00Z'));
    expect(code).toMatch(/^SR-261023-\d{4}$/);
  });
});
