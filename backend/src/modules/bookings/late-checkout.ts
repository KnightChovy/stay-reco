import { daysBetween, type LateCheckoutPolicy } from '@stayreco/shared';
import {
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { Prisma } from '../../generated/prisma/client';

export interface LateCheckoutStay {
  /** "YYYY-MM-DD" */
  checkOut: string;
  /** The hotel's check-out time, "HH:mm". */
  checkOutTime: string;
  /** Price of one room for the last night, fixed at booking. */
  lastNightPrice: number;
  rooms: number;
}

export interface LateCheckout {
  scheduledAt: Date;
  /** After `scheduledAt`, 0 when not late. */
  minutesLate: number;
  /** Late beyond the grace period (any delay counts when the hotel has no policy). */
  late: boolean;
  /** null: not late, or the hotel has no policy. */
  fee: {
    amount: Prisma.Decimal;
    percent: number;
    nightPrice: Prisma.Decimal;
  } | null;
}

/**
 * The late check-out fee of leaving `now` (money-rules §5.5, decisions L2–L3): free within the grace period; on the
 * check-out date the percent before or from the cutoff; each later day adds the full percent, plus the percent of the
 * departure time. Applied to the last night's price × rooms, rounded half up to whole dong.
 */
export function lateCheckout(
  stay: LateCheckoutStay,
  policy: LateCheckoutPolicy | null,
  now = new Date(),
): LateCheckout {
  const scheduledAt = vietnamDateTime(stay.checkOut, stay.checkOutTime);
  const minutesLate = Math.max(
    0,
    Math.floor((now.getTime() - scheduledAt.getTime()) / 60_000),
  );
  const late = minutesLate > (policy?.graceMinutes ?? 0);
  if (!policy || !late) return { scheduledAt, minutesLate, late, fee: null };

  const today = todayInVietnam(now);
  const extraDays = Math.max(0, daysBetween(stay.checkOut, today));
  const beforeCutoff = now < vietnamDateTime(today, policy.cutoffTime);
  const percent =
    policy.afterCutoffPercent * extraDays +
    (beforeCutoff ? policy.beforeCutoffPercent : policy.afterCutoffPercent);
  const nightPrice = new Prisma.Decimal(stay.lastNightPrice).times(stay.rooms);
  return {
    scheduledAt,
    minutesLate,
    late,
    fee: {
      amount: nightPrice
        .times(percent)
        .dividedBy(100)
        .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP),
      percent,
      nightPrice,
    },
  };
}
