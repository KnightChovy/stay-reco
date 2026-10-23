/**
 * Calendar dates ("YYYY-MM-DD") for `@db.Date` columns: Prisma reads and writes them as a `Date` at UTC midnight, the
 * API sends the plain date (api-guide §3).
 */
export const toCalendarDate = (date: Date) => date.toISOString().slice(0, 10);

export const fromCalendarDate = (date: string) => new Date(`${date}T00:00:00Z`);

export const addDays = (date: string, days: number) =>
  toCalendarDate(
    new Date(fromCalendarDate(date).getTime() + days * 86_400_000),
  );

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

export const weekdayOf = (date: string) =>
  WEEKDAYS[fromCalendarDate(date).getUTCDay()];

/** Vietnam has no daylight saving time: always UTC+7. */
const VIETNAM_OFFSET_MS = 7 * 3_600_000;

/** Today in Asia/Ho_Chi_Minh, where booking days are counted (money-rules §2.3). */
export const todayInVietnam = (now = new Date()) =>
  toCalendarDate(new Date(now.getTime() + VIETNAM_OFFSET_MS));
