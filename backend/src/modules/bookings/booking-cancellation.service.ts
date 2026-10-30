import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Booking,
  CancelBookingInput,
  CancellationQuote,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { lockRoomType } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import { toNumber } from '../../common/http/decimal';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BookingMailer } from './booking-mailer';
import { BookingsService } from './bookings.service';
import { AuditAction } from '../audit/audit.service';
import { closePendingChange, recordBookingEvent } from './booking-history';
import { cancellationAmounts } from './cancellation';

const bookingNotFound = () =>
  new NotFoundException({
    code: ErrorCode.BOOKING_NOT_FOUND,
    message: 'Booking not found',
  });

const notCancellable = (status: string) =>
  new ConflictException({
    code: ErrorCode.BOOKING_STATUS_CONFLICT,
    message: `A ${status} booking cannot be cancelled`,
  });

const cancellableSelect = {
  bookingId: true,
  roomTypeId: true,
  status: true,
  freeCancelUntil: true,
  cancelFeePercent: true,
  invoice: { select: { paymentStatus: true, totalAmount: true } },
} satisfies Prisma.BookingSelect;

type CancellableBooking = Prisma.BookingGetPayload<{
  select: typeof cancellableSelect;
}>;

/**
 * Cancellation by the customer (UC28, slide "08. Cancellation And Refund", money-rules §6–7). Nothing to refund →
 * the booking is cancelled at once and its nights released. Money to refund → a refund request: the invoice becomes
 * REFUND_PENDING and the booking stays CONFIRMED with its rooms until the hotel decides.
 */
@Injectable()
export class BookingCancellationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookings: BookingsService,
    private readonly mailer: BookingMailer,
  ) {}

  /** What cancelling now would cost (MSG11). */
  async quote(user: AuthUser, bookingId: string): Promise<CancellationQuote> {
    const booking = await this.findOwn(user, bookingId);
    assertCancellable(booking);
    const paid = booking.invoice!.totalAmount;
    const { fee, refund } = cancellationAmounts(booking, paid);
    return {
      freeUntil: booking.freeCancelUntil?.toISOString() ?? null,
      feePercent: toNumber(booking.cancelFeePercent),
      paid: toNumber(paid),
      fee: toNumber(fee),
      refund: toNumber(refund),
      needsApproval: refund.gt(0),
    };
  }

  async cancel(
    user: AuthUser,
    bookingId: string,
    input: CancelBookingInput,
    meta: RequestMeta = {},
  ): Promise<Booking> {
    const booking = await this.findOwn(user, bookingId);
    assertCancellable(booking);
    const now = new Date();
    const paid = booking.invoice!.totalAmount;
    const { fee, refund } = cancellationAmounts(booking, paid, now);

    await this.prisma.$transaction(async (tx) => {
      // The lock check-in takes: a cancel and a check-in at once run one after the other, and the later one sees the
      // earlier one's result in the conditions below.
      await lockRoomType(tx, booking.roomTypeId);
      // Conditional on the state checked above, so two cancels at once, or a cancel racing the hotel, apply once.
      const stillCancellable = {
        status: 'CONFIRMED',
        invoice: { paymentStatus: 'PAID' },
      } satisfies Prisma.BookingWhereInput;
      if (refund.gt(0)) {
        const { count } = await tx.invoice.updateMany({
          where: {
            bookingId,
            paymentStatus: 'PAID',
            booking: stillCancellable,
          },
          data: { paymentStatus: 'REFUND_PENDING' },
        });
        if (!count) throw notCancellable('changed');
      } else {
        const { count } = await tx.booking.updateMany({
          where: { bookingId, ...stillCancellable },
          data: { status: 'CANCELLED', cancelledAt: now },
        });
        if (!count) throw notCancellable('changed');
        // Nothing to refund: the hotel keeps the money as the fee, and the nights go back on sale.
        await tx.roomCalendars.deleteMany({ where: { bookingId } });
        await closePendingChange(tx, bookingId, now);
      }
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CANCEL_REQUESTED,
        bookingId,
        actor: { role: 'CUSTOMER', accountId: user.accountId },
        at: now,
        ip: meta.ip,
        value: {
          reason: input.reason,
          paid: toNumber(paid),
          fee: toNumber(fee),
          refund: toNumber(refund),
        },
      });
    });
    if (refund.gt(0)) this.mailer.refundRequested(bookingId);
    else this.mailer.cancelledAtOnce(bookingId);
    return this.bookings.findOne(user, bookingId);
  }

  private async findOwn(user: AuthUser, bookingId: string) {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findFirst({
          where: { bookingId, customerId: user.accountId },
          select: cancellableSelect,
        })
      : null;
    if (!booking) throw bookingNotFound();
    return booking;
  }
}

/** Only a paid, CONFIRMED booking without a pending refund; never after check-in (BR-09). */
function assertCancellable(booking: CancellableBooking) {
  if (booking.status === 'CHECKED_IN') {
    throw new ConflictException({
      code: ErrorCode.CANCELLATION_NOT_ALLOWED,
      message: 'A booking cannot be cancelled after check-in',
    });
  }
  if (booking.status !== 'CONFIRMED') throw notCancellable(booking.status);
  if (booking.invoice?.paymentStatus !== 'PAID') {
    throw new ConflictException({
      code: ErrorCode.BOOKING_STATUS_CONFLICT,
      message: 'A refund is already pending for this booking',
    });
  }
}
