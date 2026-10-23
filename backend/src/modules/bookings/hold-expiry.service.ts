import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const EVERY_MINUTE = 60_000;

/**
 * Unpaid holds that ran out (BR-03, P12): the booking becomes EXPIRED, its invoice FAILED, and the held nights are
 * released. Runs every minute, and also right before a new hold of the same room type so a stale hold never blocks it.
 * Every step is conditional on the current status, so a payment confirmed at the same moment wins cleanly.
 */
@Injectable()
export class HoldExpiryService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger('HoldExpiry');
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Tests call `expireDue` themselves instead of waiting for the timer. */
  onApplicationBootstrap() {
    if (this.config.get('NODE_ENV', { infer: true }) === 'test') return;
    this.timer = setInterval(() => {
      this.expireDue().catch((err: unknown) =>
        this.logger.error(`Expiring holds failed: ${String(err)}`),
      );
    }, EVERY_MINUTE);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
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
    return true;
  }
}
