import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Booking,
  ChangeRequestInput,
  RejectChangeInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { lockBooking } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { fromTime } from '../hotels/hotel.mapper';
import { assertCanDecideChanges } from './booking-access';
import {
  type GuestChanges,
  loadBookingHistory,
  recordBookingEvent,
} from './booking-history';
import { BookingMailer } from './booking-mailer';
import { BookingsService } from './bookings.service';

const bookingNotFound = () =>
  new NotFoundException({
    code: ErrorCode.BOOKING_NOT_FOUND,
    message: 'Booking not found',
  });

const statusConflict = (message: string) =>
  new ConflictException({ code: ErrorCode.BOOKING_STATUS_CONFLICT, message });

const noPendingRequest = () =>
  new ConflictException({
    code: ErrorCode.CHANGE_REQUEST_STATUS_CONFLICT,
    message: 'The booking has no change request waiting for a decision',
  });

const guestSelect = {
  status: true,
  guestName: true,
  contactPhone: true,
  arrivalTime: true,
  specialRequests: true,
} satisfies Prisma.BookingSelect;

type GuestRow = Prisma.BookingGetPayload<{ select: typeof guestSelect }>;

/**
 * Change requests (UC25, UC43, decision O11), kept in `audit_log` like cancel requests: the customer asks to change
 * guest details that do not affect the price (BR-09), staff with BOOKING or the owner accept (the booking takes the
 * new values) or reject with a reason. Every step locks the booking row, so a request and a decision, or two requests,
 * never interleave.
 */
@Injectable()
export class ChangeRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly bookings: BookingsService,
    private readonly mailer: BookingMailer,
  ) {}

  /** The customer who booked, only while CONFIRMED, one waiting request at a time. Keeps the fields that differ. */
  async request(
    user: AuthUser,
    bookingId: string,
    input: ChangeRequestInput,
  ): Promise<Booking> {
    await this.findOwn(user, bookingId);
    const changes = await this.prisma.$transaction(async (tx) => {
      await lockBooking(tx, bookingId);
      const current = await tx.booking.findUniqueOrThrow({
        where: { bookingId },
        select: guestSelect,
      });
      if (current.status !== 'CONFIRMED') {
        throw statusConflict(`A ${current.status} booking cannot be changed`);
      }
      const { changeRequest } = await loadBookingHistory(tx, bookingId);
      if (changeRequest?.status === 'PENDING') {
        throw new ConflictException({
          code: ErrorCode.CHANGE_REQUEST_PENDING,
          message: 'A change request already waits for the hotel',
        });
      }
      const changes = changesFrom(current, input);
      if (!Object.keys(changes).length) {
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Validation failed',
          details: Object.keys(input).map((field) => ({
            field,
            message: 'same as the booking',
          })),
        });
      }
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CHANGE_REQUESTED,
        bookingId,
        actor: { role: 'CUSTOMER', accountId: user.accountId },
        at: new Date(),
        value: { changes },
      });
      return changes;
    });
    this.mailer.changeRequested(bookingId, changes);
    return this.bookings.findOne(user, bookingId);
  }

  /** Staff with BOOKING or the owner; the booking must still be CONFIRMED and takes the requested values. */
  async accept(user: AuthUser, bookingId: string): Promise<Booking> {
    await this.findForHotel(user, bookingId);
    const changes = await this.prisma.$transaction(async (tx) => {
      await lockBooking(tx, bookingId);
      const changes = await pendingChanges(tx, bookingId);
      const { status } = await tx.booking.findUniqueOrThrow({
        where: { bookingId },
        select: { status: true },
      });
      if (status !== 'CONFIRMED') {
        throw statusConflict(`A ${status} booking cannot be changed`);
      }
      await tx.booking.update({
        where: { bookingId },
        data: {
          guestName: changes.guestName,
          contactPhone: changes.contactPhone,
          arrivalTime:
            changes.arrivalTime === undefined
              ? undefined
              : changes.arrivalTime &&
                new Date(`1970-01-01T${changes.arrivalTime}:00.000Z`),
          specialRequests: changes.specialRequests,
        },
      });
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CHANGE_ACCEPTED,
        bookingId,
        actor: actorOf(user),
        at: new Date(),
        value: {},
      });
      return changes;
    });
    this.mailer.changeAccepted(bookingId, changes);
    return this.bookings.findOne(user, bookingId);
  }

  /**
   * Staff with BOOKING or the owner; the reason goes to the customer. Possible whatever the booking status, so a
   * request left waiting when the booking was cancelled or checked in can be closed.
   */
  async reject(
    user: AuthUser,
    bookingId: string,
    input: RejectChangeInput,
  ): Promise<Booking> {
    await this.findForHotel(user, bookingId);
    await this.prisma.$transaction(async (tx) => {
      await lockBooking(tx, bookingId);
      await pendingChanges(tx, bookingId);
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CHANGE_REJECTED,
        bookingId,
        actor: actorOf(user),
        at: new Date(),
        value: { reason: input.reason },
      });
    });
    this.mailer.changeRejected(bookingId, input.reason);
    return this.bookings.findOne(user, bookingId);
  }

  /** Another customer's booking is not found. */
  private async findOwn(user: AuthUser, bookingId: string) {
    const found = isUuid(bookingId)
      ? await this.prisma.booking.count({
          where: { bookingId, customerId: user.accountId },
        })
      : 0;
    if (!found) throw bookingNotFound();
  }

  /** Outsiders get BOOKING_NOT_FOUND; staff without BOOKING get 403, a suspended owner PARTNER_SUSPENDED. */
  private async findForHotel(user: AuthUser, bookingId: string) {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findUnique({
          where: { bookingId },
          select: { roomType: { select: { hotelId: true } } },
        })
      : null;
    const access = await this.access.assertResource(
      user,
      booking?.roomType.hotelId,
      'member',
      bookingNotFound,
    );
    assertCanDecideChanges(access);
  }
}

/** The changes of the request still waiting, or CHANGE_REQUEST_STATUS_CONFLICT. */
async function pendingChanges(
  tx: Prisma.TransactionClient,
  bookingId: string,
): Promise<GuestChanges> {
  const { changeRequest } = await loadBookingHistory(tx, bookingId);
  if (changeRequest?.status !== 'PENDING') throw noPendingRequest();
  return changeRequest.changes;
}

/** The requested values that differ from the booking; empty special requests count as none. */
function changesFrom(
  current: GuestRow,
  input: ChangeRequestInput,
): GuestChanges {
  const now: Required<GuestChanges> = {
    guestName: current.guestName,
    contactPhone: current.contactPhone,
    arrivalTime: fromTime(current.arrivalTime),
    specialRequests: current.specialRequests || null,
  };
  const wanted: GuestChanges = {
    ...input,
    ...(input.specialRequests !== undefined && {
      specialRequests: input.specialRequests || null,
    }),
  };
  const changes: GuestChanges = {};
  for (const field of Object.keys(wanted) as (keyof GuestChanges)[]) {
    const value = wanted[field];
    if (value !== undefined && value !== now[field]) {
      Object.assign(changes, { [field]: value });
    }
  }
  return changes;
}

/** Staff or the owning partner; the guards let no one else through. */
const actorOf = (user: AuthUser) => ({
  role: user.role as 'HOTEL_STAFF' | 'HOTEL_PARTNER',
  accountId: user.accountId,
});
