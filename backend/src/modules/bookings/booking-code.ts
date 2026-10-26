import { randomInt } from 'crypto';
import { Prisma } from '../../generated/prisma/client';
import { todayInVietnam } from '../../common/http/calendar-date';

/** Codes are random, so a clash is rare; a few tries are plenty. */
export const CODE_ATTEMPTS = 5;

/**
 * Booking code `SR-YYMMDD-XXXX` (decision P6), the date of booking in Vietnam and 4 random digits. It is the
 * invoice number and the bank transfer content; the caller retries on the rare clash with an existing code.
 */
export function newBookingCode(now = new Date()) {
  const yymmdd = todayInVietnam(now).slice(2).replaceAll('-', '');
  const suffix = randomInt(0, 10_000).toString().padStart(4, '0');
  return `SR-${yymmdd}-${suffix}`;
}

/**
 * Booking codes are random and checked before the insert, so two bookings of different room types (different locks)
 * can draw the same code at the same moment; the second insert then hits the unique invoice number. Run it again with
 * a fresh code instead of answering 500.
 */
export async function retryOnUniqueClash<T>(run: () => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (err) {
      const clash =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002';
      if (!clash || attempt >= CODE_ATTEMPTS) throw err;
    }
  }
}
