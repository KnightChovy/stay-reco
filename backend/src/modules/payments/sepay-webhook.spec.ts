import { bookingCodeOf, transactionTime } from './sepay-webhook';

describe('bookingCodeOf', () => {
  it('reads the code with or without the dashes the bank may drop', () => {
    for (const content of [
      'SR-261025-0842',
      'SR2610250842',
      'sr 261025 0842 chuyen tien',
      'MBVCB.123.SR-261025-0842.CT tu 0123 NGUYEN VAN A',
    ]) {
      expect(bookingCodeOf({ content })).toBe('SR-261025-0842');
    }
  });

  it('prefers the code SePay recognised, then the content', () => {
    expect(
      bookingCodeOf({ code: 'SR2610250001', content: 'SR-261025-0002' }),
    ).toBe('SR-261025-0001');
    expect(bookingCodeOf({ code: null, content: 'SR-261025-0002' })).toBe(
      'SR-261025-0002',
    );
  });

  it('finds nothing in a transfer without a booking code', () => {
    expect(bookingCodeOf({ content: 'chuyen tien an trua' })).toBeNull();
    expect(bookingCodeOf({ content: 'SR-26102-0842' })).toBeNull();
    expect(bookingCodeOf({ content: 'SR-261025-08421' })).toBeNull();
    expect(bookingCodeOf({ content: null })).toBeNull();
  });
});

describe('transactionTime', () => {
  const fallback = new Date('2026-10-25T00:00:00Z');

  it('reads SePay times as Vietnam time', () => {
    expect(transactionTime('2026-10-25 14:02:37', fallback).toISOString()).toBe(
      '2026-10-25T07:02:37.000Z',
    );
  });

  it('falls back when the time is missing or unreadable', () => {
    expect(transactionTime(undefined, fallback)).toBe(fallback);
    expect(transactionTime('25/10/2026', fallback)).toBe(fallback);
  });
});
