import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ErrorCode } from '../../common/errors/error-code';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { recordBookingEvent } from '../bookings/booking-history';
import { BookingMailer } from '../bookings/booking-mailer';
import { WalletLedger } from './wallet-ledger';

const bookingNotFound = () =>
  new NotFoundException({
    code: ErrorCode.BOOKING_NOT_FOUND,
    message: 'Booking not found',
  });

/**
 * Paying a booking from the customer's wallet (decision W1, money-rules §5).
 *
 * **All or nothing**: the balance either covers the whole booking or the booking is paid by transfer. Paying part of
 * one would mean SePay having to match an amount that depends on a balance held at booking time, which risks one
 * balance paying two bookings at once, a hold expiring without the money coming back, and a transfer landing after
 * the booking is gone. The wallet is only ever filled by refunds, so a balance usually covers a whole booking.
 *
 * The money model does not change: the hotel still receives the full booking amount into its **pending** balance,
 * exactly as a transfer would, so commission, settlement and refunds work on a wallet-paid booking unchanged. Only
 * where the money came from differs, and the invoice records that as `WALLET`.
 */
@Injectable()
export class WalletPaymentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedger,
    private readonly mailer: BookingMailer,
  ) {}

  /** Pays the customer's own booking in full from their balance, confirming it without a transfer. */
  async pay(customerId: string, bookingId: string): Promise<void> {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findFirst({
          where: { bookingId, customerId },
          select: {
            status: true,
            roomType: { select: { hotelId: true } },
            invoice: {
              select: {
                invoiceNumber: true,
                totalAmount: true,
                paymentStatus: true,
              },
            },
          },
        })
      : null;
    if (!booking?.invoice) throw bookingNotFound();

    if (
      booking.status !== 'PENDING' ||
      booking.invoice.paymentStatus !== 'UNPAID'
    ) {
      throw new ConflictException({
        code: ErrorCode.BOOKING_STATUS_CONFLICT,
        message: 'The booking is no longer waiting for payment',
      });
    }

    const amount = booking.invoice.totalAmount;
    const wallet = await this.prisma.wallet.findUnique({
      where: { customerId },
      select: { walletId: true, balanceAvailable: true },
    });
    const available = wallet?.balanceAvailable ?? new Prisma.Decimal(0);
    if (available.lessThan(amount)) {
      throw new ConflictException({
        code: ErrorCode.WALLET_INSUFFICIENT,
        message: 'The wallet does not cover the whole booking',
        details: [
          { field: 'balance', message: available.toString() },
          { field: 'total', message: amount.toString() },
        ],
      });
    }

    const now = new Date();
    const paid = await this.prisma.$transaction(async (tx) => {
      // Conditional on PENDING: the expiry job flips the same row, so exactly one of them wins.
      const { count } = await tx.booking.updateMany({
        where: { bookingId, status: 'PENDING' },
        data: { status: 'CONFIRMED' },
      });
      if (!count) return false;

      // Conditional on the balance too: two payments racing cannot both spend the same money.
      const debited = await tx.wallet.updateMany({
        where: { customerId, balanceAvailable: { gte: amount } },
        data: { balanceAvailable: { decrement: amount } },
      });
      if (!debited.count) {
        throw new ConflictException({
          code: ErrorCode.WALLET_INSUFFICIENT,
          message: 'The wallet does not cover the whole booking',
        });
      }
      const customerWallet = await tx.wallet.findUniqueOrThrow({
        where: { customerId },
        select: {
          walletId: true,
          balanceAvailable: true,
          balancePending: true,
        },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: customerWallet.walletId,
          bookingId,
          type: 'BOOKING_PAYMENT',
          amount: amount.negated(),
          balanceAfter: customerWallet.balanceAvailable.plus(
            customerWallet.balancePending,
          ),
          description: `Payment of ${booking.invoice!.invoiceNumber} from the wallet`,
          idempotencyKey: `wallet:${bookingId}:customer`,
        },
      });

      await tx.invoice.update({
        where: { bookingId },
        data: {
          paymentStatus: 'PAID',
          paidAt: now,
          paymentMethod: 'WALLET',
        },
      });
      await tx.roomCalendars.updateMany({
        where: { bookingId, status: 'HELD' },
        data: { status: 'BOOKED', holdExpiresAt: null },
      });
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CONFIRMED,
        bookingId,
        actor: { role: 'CUSTOMER', accountId: customerId },
        at: now,
        value: { paidFrom: 'WALLET', amount: amount.toNumber() },
      });

      // The hotel is credited exactly as a transfer would credit it (BR-22): full amount into pending.
      const hotelWallet = await this.ledger.hotelWallet(
        tx,
        booking.roomType.hotelId,
      );
      await this.ledger.post(tx, {
        walletId: hotelWallet.walletId,
        type: 'BOOKING_PAYMENT',
        amount,
        balance: 'pending',
        idempotencyKey: `wallet:${bookingId}:hotel`,
        bookingId,
        description: `Payment of ${booking.invoice!.invoiceNumber}`,
      });
      return true;
    });

    if (!paid) {
      throw new ConflictException({
        code: ErrorCode.BOOKING_STATUS_CONFLICT,
        message: 'The booking is no longer waiting for payment',
      });
    }
    // After the commit, like a transfer confirmation (P10).
    this.mailer.bookingConfirmed(bookingId);
  }
}
