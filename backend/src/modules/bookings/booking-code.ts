import { randomInt } from 'crypto';
import { todayInVietnam } from '../../common/http/calendar-date';

/**
 * Booking code `SR-YYMMDD-XXXX` (decision P6), the date of booking in Vietnam and 4 random digits. It is the
 * invoice number and the bank transfer content; the caller retries on the rare clash with an existing code.
 */
export function newBookingCode(now = new Date()) {
  const yymmdd = todayInVietnam(now).slice(2).replaceAll('-', '');
  const suffix = randomInt(0, 10_000).toString().padStart(4, '0');
  return `SR-${yymmdd}-${suffix}`;
}
