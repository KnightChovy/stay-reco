import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lockRoomType } from '../../common/db/locks';
import {
  addDays,
  fromCalendarDate,
  toCalendarDate,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { PeriodicJob } from '../../common/jobs/periodic-job';
import type { Env } from '../../config/env';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { fromTime } from '../hotels/hotel.mapper';
import { DEFAULT_CHECK_OUT_TIME } from '../stays/offer';
import { WalletLedger } from '../wallets/wallet-ledger';
import { recordBookingEvent } from './booking-history';
import { chargeCommission } from './commission';

const EVERY_FIVE_MINUTES = 5 * 60_000;

type Actor = Parameters<typeof recordBookingEvent>[1]['actor'];

/**
 * No-shows (decisions O4, O5): staff mark them from the day after the check-in date (FrontDeskService), and this job
 * marks the bookings still CONFIRMED at the hotel's check-out time on the check-out date. Either way the nights from
 * today on are released, the hotel keeps the payment and the commission is charged.
 */
@Injectable()
export class NoShowService extends PeriodicJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedger,
    config: ConfigService<Env, true>,
  ) {
    super('NoShow', EVERY_FIVE_MINUTES, config);
  }

  /** Tests call `markDue` themselves instead of waiting for the timer. */
  protected run() {
    return this.markDue();
  }

  /**
   * Marks the PAID bookings still CONFIRMED at the check-out time (12:00 when the hotel has none). A waiting refund
   * request is left to the owner. Resolves to the number marked.
   */
  async markDue(now = new Date()): Promise<number> {
    const due = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        invoice: { paymentStatus: 'PAID' },
        checkOutDate: { lte: fromCalendarDate(todayInVietnam(now)) },
      },
      select: {
        bookingId: true,
        roomTypeId: true,
        checkOutDate: true,
        roomType: { select: { hotel: { select: { checkOutTime: true } } } },
      },
    });

    let marked = 0;
    for (const booking of due) {
      const checkOutAt = vietnamDateTime(
        toCalendarDate(booking.checkOutDate),
        fromTime(booking.roomType.hotel.checkOutTime) ?? DEFAULT_CHECK_OUT_TIME,
      );
      if (now < checkOutAt) continue;
      const done = await this.prisma.$transaction(async (tx) => {
        await lockRoomType(tx, booking.roomTypeId);
        return this.markIn(tx, booking.bookingId, null, now);
      });
      if (done) marked++;
    }
    if (marked) this.logger.log(`Marked ${marked} no-shows`);
    return marked;
  }

  /**
   * CONFIRMED and PAID → NO_SHOW, conditionally, so staff and the job at once mark it once; false when the booking
   * changed meanwhile. Call under the room type lock, as it releases nights.
   */
  async markIn(
    tx: Prisma.TransactionClient,
    bookingId: string,
    actor: Actor,
    now = new Date(),
  ): Promise<boolean> {
    const { count } = await tx.booking.updateMany({
      where: {
        bookingId,
        status: 'CONFIRMED',
        invoice: { paymentStatus: 'PAID' },
      },
      data: { status: 'NO_SHOW' },
    });
    if (!count) return false;

    const { checkOutDate } = await tx.booking.findUniqueOrThrow({
      where: { bookingId },
      select: { checkOutDate: true },
    });
    const released: string[] = [];
    for (
      let d = todayInVietnam(now);
      d < toCalendarDate(checkOutDate);
      d = addDays(d, 1)
    ) {
      released.push(d);
    }
    await tx.roomCalendars.deleteMany({
      where: { bookingId, date: { in: released.map(fromCalendarDate) } },
    });
    const commission = await chargeCommission(tx, this.ledger, bookingId);
    await recordBookingEvent(tx, {
      action: AuditAction.BOOKING_NO_SHOW,
      bookingId,
      actor,
      at: now,
      value: { commission: commission.toNumber(), releasedNights: released },
    });
    return true;
  }
}
