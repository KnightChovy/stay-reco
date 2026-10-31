import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PeriodicJob } from '../../common/jobs/periodic-job';
import type { Env } from '../../config/env';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { recordBookingEvent } from './booking-history';

const EVERY_MINUTE = 60_000;

/**
 * Unpaid holds that ran out (BR-03, P12): the booking becomes EXPIRED, its invoice FAILED, and the held nights are
 * released. Runs every minute, and also right before a new hold of the same room type so a stale hold never blocks it.
 * Every step is conditional on the current status, so a payment confirmed at the same moment wins cleanly.
 */
@Injectable()
export class HoldExpiryService extends PeriodicJob {
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    super('HoldExpiry', EVERY_MINUTE, config);
  }

  /** Tests call `expireDue` themselves instead of waiting for the timer. */
  protected run() {
    return this.expireDue();
  }

  /** Expires the due holds, of one room type when given; resolves to the number of bookings expired. */
  async expireDue(
    roomTypeId?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<number> {
    const db = tx ?? this.prisma;
    const due = await db.booking.findMany({
      where: {
        status: 'PENDING',
        roomTypeId,
        roomCalendars: {
          some: { status: 'HELD', holdExpiresAt: { lte: new Date() } },
        },
      },
      select: { bookingId: true },
    });

    let expired = 0;
    for (const { bookingId } of due) {
      const done = tx
        ? await this.expire(tx, bookingId)
        : await this.prisma.$transaction((t) => this.expire(t, bookingId));
      if (done) expired++;
    }
    if (expired) this.logger.log(`Expired ${expired} unpaid holds`);
    return expired;
  }

  private async expire(tx: Prisma.TransactionClient, bookingId: string) {
    const { count } = await tx.booking.updateMany({
      where: { bookingId, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });
    if (!count) return false;
    await tx.invoice.updateMany({
      where: { bookingId, paymentStatus: 'UNPAID' },
      data: { paymentStatus: 'FAILED' },
    });
    await tx.roomCalendars.deleteMany({
      where: { bookingId, status: 'HELD' },
    });
    await recordBookingEvent(tx, {
      action: AuditAction.BOOKING_EXPIRED,
      bookingId,
      actor: null,
      at: new Date(),
      value: {},
    });
    return true;
  }
}
