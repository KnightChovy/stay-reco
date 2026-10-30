import { Injectable } from '@nestjs/common';
import type { BookingStatus } from '@stayreco/shared';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { recordBookingEvent } from '../bookings/booking-history';
import { BookingMailer } from '../bookings/booking-mailer';
import { WalletLedger } from '../wallets/wallet-ledger';

/** One incoming transfer, as SePay (or the dev simulator) reports it. */
export interface PaymentNotice {
  /** The booking code found in the transfer content. */
  code: string;
  amount: number;
  /** The gateway's transaction id: stored on the invoice and part of the idempotency key. */
  transactionId: string;
  paidAt: Date;
}

export type PaymentResult =
  | { status: 'CONFIRMED'; bookingId: string }
  /** This transaction was already processed: nothing changes, the caller answers success. */
  | { status: 'DUPLICATE' }
  | { status: 'UNKNOWN_CODE' }
  | { status: 'AMOUNT_MISMATCH'; bookingId: string }
  /** The booking is no longer waiting for payment (expired, already paid, cancelled): a late or second transfer. */
  | { status: 'NOT_PENDING'; bookingId: string; bookingStatus: BookingStatus };

/**
 * Confirms a booking when a transfer matches its code and exactly its amount (BR-04, decision P7), in one
 * transaction: booking CONFIRMED, invoice PAID, held nights BOOKED, and the full amount credited to the hotel
 * wallet's pending balance (BR-22; commission is taken at check-out). The webhook and the dev simulator both call it;
 * what to do with the other results (log them for manual handling) is up to the caller.
 */
@Injectable()
export class PaymentConfirmationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedger,
    private readonly mailer: BookingMailer,
  ) {}

  async confirm(notice: PaymentNotice): Promise<PaymentResult> {
    const idempotencyKey = `sepay:${notice.transactionId}`;
    if (await this.processed(idempotencyKey)) return { status: 'DUPLICATE' };

    const invoice = await this.prisma.invoice.findUnique({
      where: { invoiceNumber: notice.code },
      select: {
        bookingId: true,
        invoiceNumber: true,
        totalAmount: true,
        booking: { select: { roomType: { select: { hotelId: true } } } },
      },
    });
    if (!invoice) return { status: 'UNKNOWN_CODE' };
    const { bookingId } = invoice;
    const amount = new Prisma.Decimal(notice.amount);
    if (!invoice.totalAmount.equals(amount)) {
      return { status: 'AMOUNT_MISMATCH', bookingId };
    }

    try {
      const result = await this.prisma.$transaction(
        async (tx): Promise<PaymentResult> => {
          // Conditional on PENDING: the expiry job flips the same row, so exactly one of them wins.
          const { count } = await tx.booking.updateMany({
            where: { bookingId, status: 'PENDING' },
            data: { status: 'CONFIRMED' },
          });
          if (!count) {
            // The same transaction delivered twice at once: the other call confirmed the booking while this one waited.
            if (await this.processed(idempotencyKey, tx)) {
              return { status: 'DUPLICATE' };
            }
            const { status } = await tx.booking.findUniqueOrThrow({
              where: { bookingId },
              select: { status: true },
            });
            return { status: 'NOT_PENDING', bookingId, bookingStatus: status };
          }

          await tx.invoice.update({
            where: { bookingId },
            data: {
              paymentStatus: 'PAID',
              paidAt: notice.paidAt,
              // Column named for VNPay, reused for the SePay transaction id (P7).
              vnpayTxnRef: notice.transactionId,
            },
          });
          await tx.roomCalendars.updateMany({
            where: { bookingId, status: 'HELD' },
            data: { status: 'BOOKED', holdExpiresAt: null },
          });
          await recordBookingEvent(tx, {
            action: AuditAction.BOOKING_CONFIRMED,
            bookingId,
            actor: null,
            at: notice.paidAt,
            value: {
              transactionId: notice.transactionId,
              amount: notice.amount,
            },
          });
          const wallet = await this.ledger.hotelWallet(
            tx,
            invoice.booking.roomType.hotelId,
          );
          await this.ledger.post(tx, {
            walletId: wallet.walletId,
            type: 'BOOKING_PAYMENT',
            amount,
            balance: 'pending',
            idempotencyKey,
            bookingId,
            description: `Payment of ${invoice.invoiceNumber}`,
          });
          return { status: 'CONFIRMED', bookingId };
        },
      );
      // After the commit: the confirmation email (P10).
      if (result.status === 'CONFIRMED') {
        this.mailer.bookingConfirmed(bookingId);
      }
      return result;
    } catch (err) {
      // The same transaction processed twice at once: the second insert hits the unique key and is rolled back.
      // A clash on another key (two first payments creating one hotel wallet) is rethrown; SePay retries it.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (await this.processed(idempotencyKey))
      ) {
        return { status: 'DUPLICATE' };
      }
      throw err;
    }
  }

  private async processed(
    idempotencyKey: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const rows = await db.walletTransaction.count({
      where: { idempotencyKey },
    });
    return rows > 0;
  }
}
