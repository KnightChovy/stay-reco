import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  Booking,
  ForwardRefundInput,
  RejectRefundInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { PeriodicJob } from '../../common/jobs/periodic-job';
import {
  toCalendarDate,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import {
  type HotelAccessLevel,
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { fromTime } from '../hotels/hotel.mapper';
import { DEFAULT_CHECK_IN_TIME } from '../stays/offer';
import { WalletLedger } from '../wallets/wallet-ledger';
import { loadBookingHistory, recordBookingEvent } from './booking-history';
import { BookingMailer } from './booking-mailer';
import { BookingsService } from './bookings.service';

const EVERY_MINUTE = 60_000;

const bookingNotFound = () =>
  new NotFoundException({
    code: ErrorCode.BOOKING_NOT_FOUND,
    message: 'Booking not found',
  });

const notPending = () =>
  new ConflictException({
    code: ErrorCode.REFUND_STATUS_CONFLICT,
    message: 'The booking has no refund request waiting for a decision',
  });

/** Who decides: the owner, or the system at the check-in time. */
type Decider = { role: 'HOTEL_PARTNER'; accountId: string } | null;

/**
 * The hotel side of a refund request (slide "08. Cancellation And Refund", money-rules §7.2): staff with REFUND
 * forward it with a note, the partner approves or rejects it, and a request made before the check-in time that is
 * still waiting at that time is approved automatically. Every decision is conditional on REFUND_PENDING, so the
 * partner and the automatic approval racing each other apply once.
 */
@Injectable()
export class RefundDecisionsService extends PeriodicJob {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly ledger: WalletLedger,
    private readonly bookings: BookingsService,
    private readonly mailer: BookingMailer,
    config: ConfigService<Env, true>,
  ) {
    super('RefundDecisions', EVERY_MINUTE, config);
  }

  /** Tests call `approveDue` themselves instead of waiting for the timer. */
  protected run() {
    return this.approveDue();
  }

  /** Staff with REFUND only: the owner decides directly. Written to the history; the partner reads it there. */
  async forward(
    user: AuthUser,
    bookingId: string,
    input: ForwardRefundInput,
  ): Promise<Booking> {
    const { access } = await this.findForHotel(user, bookingId, 'member');
    if (access.role !== 'STAFF' || !access.permissions.includes('REFUND')) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message:
          'Only staff with the REFUND permission forward refund requests',
      });
    }
    await this.prisma.$transaction(async (tx) => {
      await assertPending(tx, bookingId);
      await recordBookingEvent(tx, {
        action: AuditAction.REFUND_FORWARDED,
        bookingId,
        actor: { role: 'HOTEL_STAFF', accountId: user.accountId },
        at: new Date(),
        value: { note: input.note },
      });
    });
    this.mailer.refundForwarded(bookingId, input.note);
    return this.bookings.findOne(user, bookingId);
  }

  /** The owner, also while suspended: the money goes back to the customer (P15). */
  async approve(user: AuthUser, bookingId: string): Promise<Booking> {
    await this.findForHotel(user, bookingId, 'owner-view');
    await this.prisma.$transaction((tx) =>
      this.approveIn(tx, bookingId, {
        role: 'HOTEL_PARTNER',
        accountId: user.accountId,
      }),
    );
    this.mailer.refundApproved(bookingId);
    return this.bookings.findOne(user, bookingId);
  }

  /** The owner, not while suspended (P15); the reason must be one of BR-20's and is sent to the customer. */
  async reject(
    user: AuthUser,
    bookingId: string,
    input: RejectRefundInput,
  ): Promise<Booking> {
    await this.findForHotel(user, bookingId, 'owner');
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.invoice.updateMany({
        where: {
          bookingId,
          paymentStatus: 'REFUND_PENDING',
          booking: { status: 'CONFIRMED' },
        },
        data: { paymentStatus: 'PAID' },
      });
      if (!count) throw notPending();
      await recordBookingEvent(tx, {
        action: AuditAction.REFUND_REJECTED,
        bookingId,
        actor: { role: 'HOTEL_PARTNER', accountId: user.accountId },
        at: new Date(),
        value: { reason: input.reason },
      });
    });
    this.mailer.refundRejected(bookingId, input.reason);
    return this.bookings.findOne(user, bookingId);
  }

  /**
   * Approves the requests still waiting at the hotel's check-in time on the check-in date, when they were made
   * before that time (P11); later requests wait for the partner. Resolves to the number approved.
   */
  async approveDue(now = new Date()): Promise<number> {
    const pending = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        invoice: { paymentStatus: 'REFUND_PENDING' },
      },
      select: {
        bookingId: true,
        checkInDate: true,
        roomType: { select: { hotel: { select: { checkInTime: true } } } },
      },
    });

    let approved = 0;
    for (const booking of pending) {
      const checkInAt = vietnamDateTime(
        toCalendarDate(booking.checkInDate),
        fromTime(booking.roomType.hotel.checkInTime) ?? DEFAULT_CHECK_IN_TIME,
      );
      if (now < checkInAt) continue;
      const { cancelRequest } = await loadBookingHistory(
        this.prisma,
        booking.bookingId,
      );
      if (!cancelRequest || cancelRequest.at >= checkInAt) continue;
      try {
        await this.prisma.$transaction((tx) =>
          this.approveIn(tx, booking.bookingId, null, now),
        );
        approved++;
        this.mailer.refundApproved(booking.bookingId, true);
      } catch (err) {
        // Decided by the partner in the meantime: nothing left to do.
        if (!(err instanceof ConflictException)) throw err;
      }
    }
    if (approved) this.logger.log(`Approved ${approved} refunds automatically`);
    return approved;
  }

  /**
   * Booking CANCELLED, nights released, the refund fixed when the customer cancelled moved from the hotel wallet's
   * pending balance to the customer wallet's available balance (two REFUND rows), invoice REFUNDED or
   * PARTIALLY_REFUNDED.
   */
  private async approveIn(
    tx: Prisma.TransactionClient,
    bookingId: string,
    decider: Decider,
    now = new Date(),
  ) {
    const { cancelRequest } = await loadBookingHistory(tx, bookingId);
    if (!cancelRequest) throw notPending();
    const refund = new Prisma.Decimal(cancelRequest.refund);
    const fullRefund = refund.equals(cancelRequest.paid);

    const { count } = await tx.invoice.updateMany({
      where: {
        bookingId,
        paymentStatus: 'REFUND_PENDING',
        booking: { status: 'CONFIRMED' },
      },
      data: { paymentStatus: fullRefund ? 'REFUNDED' : 'PARTIALLY_REFUNDED' },
    });
    if (!count) throw notPending();

    const booking = await tx.booking.update({
      where: { bookingId },
      data: { status: 'CANCELLED', cancelledAt: now },
      select: {
        customerId: true,
        invoice: { select: { invoiceNumber: true } },
        roomType: { select: { hotelId: true } },
      },
    });
    await tx.roomCalendars.deleteMany({ where: { bookingId } });

    const code = booking.invoice!.invoiceNumber;
    const hotelWallet = await this.ledger.hotelWallet(
      tx,
      booking.roomType.hotelId,
    );
    const customerWallet = await this.ledger.customerWallet(
      tx,
      booking.customerId,
    );
    await this.ledger.post(tx, {
      walletId: hotelWallet.walletId,
      type: 'REFUND',
      amount: refund.negated(),
      balance: 'pending',
      idempotencyKey: `refund:${bookingId}:hotel`,
      bookingId,
      description: `Refund of ${code}`,
    });
    await this.ledger.post(tx, {
      walletId: customerWallet.walletId,
      type: 'REFUND',
      amount: refund,
      balance: 'available',
      idempotencyKey: `refund:${bookingId}:customer`,
      bookingId,
      description: `Refund of ${code}`,
    });

    await recordBookingEvent(tx, {
      action: decider
        ? AuditAction.REFUND_APPROVED
        : AuditAction.REFUND_AUTO_APPROVED,
      bookingId,
      actor: decider,
      at: now,
      value: { refund: cancelRequest.refund },
    });
  }

  /** Outsiders get BOOKING_NOT_FOUND; staff without the right level get 403. */
  private async findForHotel(
    user: AuthUser,
    bookingId: string,
    level: HotelAccessLevel,
  ) {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findUnique({
          where: { bookingId },
          select: { roomType: { select: { hotelId: true } } },
        })
      : null;
    const access = await this.access.assertResource(
      user,
      booking?.roomType.hotelId,
      level,
      bookingNotFound,
    );
    return { access };
  }
}

async function assertPending(tx: Prisma.TransactionClient, bookingId: string) {
  const pending = await tx.invoice.count({
    where: {
      bookingId,
      paymentStatus: 'REFUND_PENDING',
      booking: { status: 'CONFIRMED' },
    },
  });
  if (!pending) throw notPending();
}
