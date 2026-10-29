import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletLedger } from '../wallets/wallet-ledger';

const EVERY_HOUR = 3_600_000;
const DAY = 86_400_000;

/**
 * Settlement (BR-22, decisions O7–O8): `WALLET_HOLD_DAYS` after the commission of a check-out or no-show, the hotel's
 * net amount of the booking (payment − commission, and any refund) moves from pending to available as a pair of
 * SETTLEMENT rows. Runs every hour; the idempotency keys write it once even when two runs overlap.
 */
@Injectable()
export class SettlementService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger('Settlement');
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedger,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** Tests call `settleDue` themselves instead of waiting for the timer. */
  onApplicationBootstrap() {
    if (this.config.get('NODE_ENV', { infer: true }) === 'test') return;
    this.timer = setInterval(() => {
      this.settleDue().catch((err: unknown) =>
        this.logger.error(`Settlement failed: ${String(err)}`),
      );
    }, EVERY_HOUR);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  /** Settles the bookings whose holding period is over; resolves to the number settled. */
  async settleDue(now = new Date()): Promise<number> {
    const holdDays = this.config.get('WALLET_HOLD_DAYS', { infer: true });
    const due = await this.prisma.walletTransaction.findMany({
      where: {
        type: 'COMMISSION',
        wallet: { ownerType: 'HOTEL' },
        createdAt: { lte: new Date(now.getTime() - holdDays * DAY) },
        booking: { walletTransactions: { none: { type: 'SETTLEMENT' } } },
      },
      select: {
        walletId: true,
        booking: {
          select: {
            bookingId: true,
            invoice: { select: { invoiceNumber: true } },
          },
        },
      },
    });

    let settled = 0;
    for (const { walletId, booking } of due) {
      if (await this.settle(walletId, booking!)) settled++;
    }
    if (settled) this.logger.log(`Settled ${settled} bookings`);
    return settled;
  }

  private async settle(
    walletId: string,
    booking: { bookingId: string; invoice: { invoiceNumber: string } | null },
  ) {
    const { bookingId } = booking;
    const key = `settlement:${bookingId}:pending`;
    try {
      await this.prisma.$transaction(async (tx) => {
        // What the booking left in the hotel's pending balance: payment, commission, refunds.
        const { _sum } = await tx.walletTransaction.aggregate({
          where: { walletId, bookingId },
          _sum: { amount: true },
        });
        const net = _sum.amount ?? new Prisma.Decimal(0);
        const description = `Settlement of ${booking.invoice!.invoiceNumber}`;
        await this.ledger.post(tx, {
          walletId,
          type: 'SETTLEMENT',
          amount: net.negated(),
          balance: 'pending',
          idempotencyKey: key,
          bookingId,
          description,
        });
        await this.ledger.post(tx, {
          walletId,
          type: 'SETTLEMENT',
          amount: net,
          balance: 'available',
          idempotencyKey: `settlement:${bookingId}:available`,
          bookingId,
          description,
        });
      });
      return true;
    } catch (err) {
      // Settled by an overlapping run: its insert won the unique key and this one was rolled back.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (await this.prisma.walletTransaction.count({
          where: { idempotencyKey: key },
        }))
      ) {
        return false;
      }
      throw err;
    }
  }
}
