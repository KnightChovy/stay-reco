import { Prisma } from '../../generated/prisma/client';
import {
  CODE_ATTEMPTS,
  newBookingCode,
  retryOnUniqueClash,
} from './booking-code';

describe('newBookingCode', () => {
  it('uses the booking date in Vietnam and 4 digits', () => {
    // 2026-10-22 18:30 UTC is already 2026-10-23 in Vietnam.
    const code = newBookingCode(new Date('2026-10-22T18:30:00Z'));
    expect(code).toMatch(/^SR-261023-\d{4}$/);
  });
});

describe('retryOnUniqueClash', () => {
  const clash = () =>
    new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
    });

  it('runs again after a unique clash and returns the first success', async () => {
    let calls = 0;
    const result = await retryOnUniqueClash(() => {
      calls++;
      return calls < 3 ? Promise.reject(clash()) : Promise.resolve('ok');
    });
    expect([result, calls]).toEqual(['ok', 3]);
  });

  it('gives up after a few clashes and rethrows other errors at once', async () => {
    let calls = 0;
    await expect(
      retryOnUniqueClash(() => {
        calls++;
        return Promise.reject(clash());
      }),
    ).rejects.toThrow('Unique constraint failed');
    expect(calls).toBe(CODE_ATTEMPTS);

    calls = 0;
    await expect(
      retryOnUniqueClash(() => {
        calls++;
        return Promise.reject(new Error('sold out'));
      }),
    ).rejects.toThrow('sold out');
    expect(calls).toBe(1);
  });
});
