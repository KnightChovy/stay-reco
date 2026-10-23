import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { assertBookableDates, freeCancellationUntil, toOffer } from './offer';

describe('assertBookableDates', () => {
  const today = '2026-10-23';

  it('accepts today up to 365 days ahead', () => {
    expect(() => assertBookableDates('2026-10-23', today)).not.toThrow();
    expect(() => assertBookableDates('2027-10-23', today)).not.toThrow();
  });

  it('refuses the past and more than 365 days ahead, on checkIn', () => {
    for (const [checkIn, message] of [
      ['2026-10-22', 'checkIn must not be in the past'],
      ['2027-10-24', 'checkIn at most 365 days ahead'],
    ]) {
      try {
        assertBookableDates(checkIn, today);
        throw new Error('expected a validation error');
      } catch (err) {
        expect(err).toBeInstanceOf(BadRequestException);
        expect((err as BadRequestException).getResponse()).toMatchObject({
          code: 'VALIDATION_ERROR',
          details: [{ field: 'checkIn', message }],
        });
      }
    }
  });
});

describe('freeCancellationUntil', () => {
  const policy = { freeCancellationDays: 3, feePercent: 50 };
  const now = new Date('2026-10-23T03:00:00Z');

  it('ends at the hotel check-in time, N days before check-in, Vietnam time', () => {
    expect(
      freeCancellationUntil(policy, '2026-11-20', '15:30', now)?.toISOString(),
    ).toBe('2026-11-17T08:30:00.000Z');
  });

  it('uses 14:00 when the hotel has no check-in time', () => {
    expect(
      freeCancellationUntil(policy, '2026-11-20', null, now)?.toISOString(),
    ).toBe('2026-11-17T07:00:00.000Z');
  });

  it('is null without a free period, or once the deadline has passed', () => {
    expect(
      freeCancellationUntil(
        { freeCancellationDays: null, feePercent: 100 },
        '2026-11-20',
        null,
        now,
      ),
    ).toBeNull();
    // Check-in on 2026-10-25, 3 days before = 2026-10-22 14:00, already past.
    expect(freeCancellationUntil(policy, '2026-10-25', null, now)).toBeNull();
  });
});

describe('toOffer', () => {
  const d = (v: number) => new Prisma.Decimal(v);
  const quote = {
    basePrice: d(1_000_000),
    nights: [
      { date: '2026-11-20', price: d(1_000_000), rule: null },
      { date: '2026-11-21', price: d(1_150_000), rule: null },
    ],
    total: d(2_150_000),
  };

  it('prices the requested rooms and checks the guests against the room capacity', () => {
    const offer = toOffer({
      stay: {
        checkIn: '2026-11-20',
        checkOut: '2026-11-22',
        guests: 5,
        rooms: 2,
      },
      maxOccupancy: 2,
      available: 3,
      quote,
      policy: { freeCancellationDays: null, feePercent: 100 },
      checkInTime: '14:00',
    });
    expect(offer).toEqual({
      available: 3,
      fitsGuests: false,
      nightlyPrices: [
        { date: '2026-11-20', price: 1_000_000 },
        { date: '2026-11-21', price: 1_150_000 },
      ],
      perRoomTotal: 2_150_000,
      total: 4_300_000,
      freeCancellationUntil: null,
      cancellationFeePercent: 100,
    });
  });
});
