import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  Booking,
  BookingLookupQuery,
  CheckInInput,
  RoomOption,
  Room,
  RoomOptions,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { lockRoomType } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  addDays,
  fromCalendarDate,
  toCalendarDate,
  todayInVietnam,
} from '../../common/http/calendar-date';
import {
  type HotelAccess,
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import type { Env } from '../../config/env';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { toRoom } from '../rooms/room.mapper';
import { byRoomNumber } from '../rooms/rooms.service';
import { WalletLedger } from '../wallets/wallet-ledger';
import { assertCanLookUp, assertFrontDesk } from './booking-access';
import { loadBookingHistory, recordBookingEvent } from './booking-history';
import type { NightlyPrices } from './booking.mapper';
import { BookingsService } from './bookings.service';
import { chargeCommission } from './commission';
import { NoShowService } from './no-show.service';
import { verifyVoucher } from './voucher-token';

const bookingNotFound = () =>
  new NotFoundException({
    code: ErrorCode.BOOKING_NOT_FOUND,
    message: 'Booking not found',
  });

const roomNotFound = () =>
  new NotFoundException({
    code: ErrorCode.ROOM_NOT_FOUND,
    message: 'Room not found',
  });

const statusConflict = (message: string) =>
  new ConflictException({ code: ErrorCode.BOOKING_STATUS_CONFLICT, message });

const notAssignable = (message: string) =>
  new ConflictException({ code: ErrorCode.ROOM_NOT_ASSIGNABLE, message });

/** `SR-261022-0842` typed as `sr2610220842`, `SR 261022 0842`… */
const CODE = /^SR(\d{6})(\d{4})$/;

/** What check-in needs to know about the booking. */
const stayRowSelect = {
  bookingId: true,
  roomTypeId: true,
  status: true,
  numRooms: true,
  checkInDate: true,
  checkOutDate: true,
  nightlyPrices: true,
  invoice: { select: { paymentStatus: true } },
  roomType: { select: { hotelId: true } },
} satisfies Prisma.BookingSelect;

type StayRow = Prisma.BookingGetPayload<{ select: typeof stayRowSelect }>;

/**
 * The front desk (staff.md "Front desk", decisions O2–O9): finding the guest's booking by code or voucher QR, the
 * rooms it can be given, check-in, no-show, check-out and cleaned rooms. Room moves run under the room type lock that bookings and holds take, so a
 * room is never given to two stays for the same night (BR-10).
 */
@Injectable()
export class FrontDeskService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly bookings: BookingsService,
    private readonly ledger: WalletLedger,
    private readonly noShows: NoShowService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /** `access` was resolved by `HotelAccessRequired('member')`. Any status is returned (UC37). */
  async lookup(
    user: AuthUser,
    access: HotelAccess,
    query: BookingLookupQuery,
  ): Promise<Booking> {
    assertCanLookUp(access);
    const code = query.qrToken
      ? this.codeOfVoucher(query.qrToken)
      : normalizeCode(query.code!);
    const invoice = code
      ? await this.prisma.invoice.findFirst({
          where: {
            invoiceNumber: code,
            booking: { roomType: { hotelId: access.hotelId } },
          },
          select: { bookingId: true },
        })
      : null;
    if (!invoice) throw bookingNotFound();
    return this.bookings.findOne(user, invoice.bookingId);
  }

  /** A booking check-in accepts now: the rooms it holds on the remaining nights, and the other rooms it could move to. */
  async roomOptions(user: AuthUser, bookingId: string): Promise<RoomOptions> {
    const booking = await this.findForFrontDesk(user, bookingId);
    // Also keeps `nights` non-empty: with no night, every AVAILABLE room would look free.
    assertCheckInOpen(booking);
    const nights = remainingNights(booking);
    const [held, free] = await Promise.all([
      this.heldRooms(this.prisma, booking, nights),
      this.freeRooms(this.prisma, booking, nights),
    ]);
    const heldIds = new Set(held.map((r) => r.id));
    return {
      held,
      available: free.filter((r) => !heldIds.has(r.id)),
    };
  }

  /**
   * CONFIRMED and PAID, from the check-in date to the day before check-out (O2). The remaining nights move to the
   * chosen rooms (the held ones by default), which become OCCUPIED (O3).
   */
  async checkIn(
    user: AuthUser,
    bookingId: string,
    input: CheckInInput,
  ): Promise<Booking> {
    const booking = await this.findForFrontDesk(user, bookingId);
    assertCheckInOpen(booking);
    if (input.roomIds && input.roomIds.length !== booking.numRooms) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: [
          {
            field: 'roomIds',
            message: `the booking has ${booking.numRooms} rooms`,
          },
        ],
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await lockRoomType(tx, booking.roomTypeId);
      // Read again under the lock: a cancellation or another check-in may have landed meanwhile.
      const current = await tx.booking.findUniqueOrThrow({
        where: { bookingId },
        select: stayRowSelect,
      });
      assertCheckInOpen(current);
      const nights = remainingNights(current);
      const free = await this.freeRooms(tx, current, nights);
      const chosen = input.roomIds
        ? input.roomIds.map((id) => free.find((r) => r.id === id))
        : await this.defaultRooms(tx, current, nights, free);
      if (chosen.some((r) => !r)) {
        throw notAssignable(
          'Every room must be of the booked room type, AVAILABLE and free on the remaining nights',
        );
      }
      const rooms = (chosen as RoomOption[]).sort((a, b) =>
        byRoomNumber(a.roomNumber, b.roomNumber),
      );
      const roomIds = rooms.map((r) => r.id);
      const dates = nights.map(fromCalendarDate);
      const prices = new Map(
        (current.nightlyPrices as NightlyPrices).map((n) => [n.date, n.price]),
      );

      await tx.roomCalendars.deleteMany({
        where: { bookingId, date: { in: dates } },
      });
      // Rows marked AVAILABLE carry nothing and would collide with the moved nights.
      await tx.roomCalendars.deleteMany({
        where: { roomId: { in: roomIds }, date: { in: dates } },
      });
      await tx.roomCalendars.createMany({
        data: roomIds.flatMap((roomId) =>
          nights.map((date) => ({
            roomId,
            bookingId,
            date: fromCalendarDate(date),
            status: 'BOOKED' as const,
            priceOverride: prices.get(date),
          })),
        ),
      });
      // Conditional, like the room lock: a room locked meanwhile is not given to the guest.
      const occupied = await tx.room.updateMany({
        where: { roomId: { in: roomIds }, status: 'AVAILABLE' },
        data: { status: 'OCCUPIED' },
      });
      if (occupied.count !== roomIds.length) {
        throw notAssignable('A chosen room is no longer AVAILABLE');
      }
      const now = new Date();
      // Conditional as well: the re-read above holds only against writers that take the room type lock.
      const checkedIn = await tx.booking.updateMany({
        where: {
          bookingId,
          status: 'CONFIRMED',
          invoice: { paymentStatus: 'PAID' },
        },
        data: { status: 'CHECKED_IN' },
      });
      if (!checkedIn.count)
        throw statusConflict('The booking changed meanwhile');
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CHECKED_IN,
        bookingId,
        actor: actorOf(user),
        at: now,
        value: {
          rooms: rooms.map((r) => ({ id: r.id, roomNumber: r.roomNumber })),
        },
      });
    });
    return this.bookings.findOne(user, bookingId);
  }

  /**
   * Only CONFIRMED and PAID, from the day after the check-in date (O4). The booking becomes NO_SHOW, the nights from
   * today on are released, the hotel keeps the payment and the commission is charged (O5).
   */
  async noShow(user: AuthUser, bookingId: string): Promise<Booking> {
    const booking = await this.findForFrontDesk(user, bookingId);
    assertNoShowAllowed(booking);
    await this.prisma.$transaction(async (tx) => {
      await lockRoomType(tx, booking.roomTypeId);
      const marked = await this.noShows.markIn(tx, bookingId, actorOf(user));
      if (!marked) throw statusConflict('The booking changed meanwhile');
    });
    return this.bookings.findOne(user, bookingId);
  }

  /**
   * Only CHECKED_IN, early or late (O9). The booking becomes COMPLETED, the nights from today on are released
   * without refund, the rooms become CLEANING and the commission is charged (O6). The conditional status change makes
   * two check-outs at once charge it once.
   */
  async checkOut(user: AuthUser, bookingId: string): Promise<Booking> {
    const booking = await this.findForFrontDesk(user, bookingId);
    if (booking.status !== 'CHECKED_IN') {
      throw statusConflict(`A ${booking.status} booking cannot be checked out`);
    }

    await this.prisma.$transaction(async (tx) => {
      await lockRoomType(tx, booking.roomTypeId);
      const { count } = await tx.booking.updateMany({
        where: { bookingId, status: 'CHECKED_IN' },
        data: { status: 'COMPLETED' },
      });
      if (!count) throw statusConflict('The booking is no longer CHECKED_IN');
      const released = remainingNights(booking);
      await tx.roomCalendars.deleteMany({
        where: { bookingId, date: { in: released.map(fromCalendarDate) } },
      });
      const { checkedInRooms } = await loadBookingHistory(tx, bookingId);
      await tx.room.updateMany({
        where: {
          roomId: { in: (checkedInRooms ?? []).map((r) => r.id) },
          status: 'OCCUPIED',
        },
        data: { status: 'CLEANING' },
      });
      const commission = await chargeCommission(tx, this.ledger, bookingId);
      await recordBookingEvent(tx, {
        action: AuditAction.BOOKING_CHECKED_OUT,
        bookingId,
        actor: actorOf(user),
        at: new Date(),
        value: { commission: commission.toNumber(), releasedNights: released },
      });
    });
    return this.bookings.findOne(user, bookingId);
  }

  /** A room the guest has left: CLEANING → AVAILABLE. */
  async cleanRoom(user: AuthUser, roomId: string): Promise<Room> {
    const room = isUuid(roomId)
      ? await this.prisma.room.findUnique({
          where: { roomId },
          select: { roomType: { select: { hotelId: true } } },
        })
      : null;
    const access = await this.access.assertResource(
      user,
      room?.roomType.hotelId,
      'member',
      roomNotFound,
    );
    assertFrontDesk(access);
    const { count } = await this.prisma.room.updateMany({
      where: { roomId, status: 'CLEANING' },
      data: { status: 'AVAILABLE' },
    });
    if (!count) {
      throw new ConflictException({
        code: ErrorCode.ROOM_STATUS_CONFLICT,
        message: 'Only a room being cleaned can be marked cleaned',
      });
    }
    return toRoom(
      await this.prisma.room.findUniqueOrThrow({ where: { roomId } }),
    );
  }

  /** The held rooms when they cover every remaining night; otherwise staff pick the rooms. */
  private async defaultRooms(
    db: Prisma.TransactionClient,
    booking: StayRow,
    nights: string[],
    free: RoomOption[],
  ): Promise<(RoomOption | undefined)[]> {
    const held = await this.heldRooms(db, booking, nights);
    if (held.length !== booking.numRooms) {
      throw notAssignable(
        'The held rooms change during the stay; choose the rooms with roomIds',
      );
    }
    return held.map((r) => free.find((f) => f.id === r.id));
  }

  /** Rooms the booking has a night on among `nights`, with their status. */
  private async heldRooms(
    db: Prisma.TransactionClient,
    booking: StayRow,
    nights: string[],
  ): Promise<RoomOption[]> {
    const rooms = await db.room.findMany({
      where: {
        roomCalendars: {
          some: {
            bookingId: booking.bookingId,
            date: { in: nights.map(fromCalendarDate) },
          },
        },
      },
      select: { roomId: true, roomNumber: true, status: true },
    });
    return rooms.map(toOption).sort(compareOptions);
  }

  /** AVAILABLE rooms of the booked type with no other stay, hold or closure on any of `nights`. */
  private async freeRooms(
    db: Prisma.TransactionClient,
    booking: StayRow,
    nights: string[],
  ): Promise<RoomOption[]> {
    const rooms = await db.room.findMany({
      where: {
        roomTypeId: booking.roomTypeId,
        status: 'AVAILABLE',
        roomCalendars: {
          none: {
            date: { in: nights.map(fromCalendarDate) },
            status: { not: 'AVAILABLE' },
            OR: [
              { bookingId: null },
              { bookingId: { not: booking.bookingId } },
            ],
          },
        },
      },
      select: { roomId: true, roomNumber: true, status: true },
    });
    return rooms.map(toOption).sort(compareOptions);
  }

  /** Outsiders get BOOKING_NOT_FOUND; staff without FRONT_DESK get 403, a suspended owner PARTNER_SUSPENDED. */
  private async findForFrontDesk(
    user: AuthUser,
    bookingId: string,
  ): Promise<StayRow> {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findUnique({
          where: { bookingId },
          select: stayRowSelect,
        })
      : null;
    const access = await this.access.assertResource(
      user,
      booking?.roomType.hotelId,
      'member',
      bookingNotFound,
    );
    assertFrontDesk(access);
    return booking!;
  }

  private codeOfVoucher(token: string) {
    const code = verifyVoucher(
      token,
      this.config.get('VOUCHER_SIGNING_SECRET', { infer: true }),
    );
    if (!code) {
      throw new BadRequestException({
        code: ErrorCode.VOUCHER_INVALID,
        message: 'Not a valid StayReco voucher',
      });
    }
    return code;
  }
}

/** `SR-YYMMDD-XXXX` from what was typed, or null when it cannot be a booking code. */
export function normalizeCode(typed: string): string | null {
  const match = CODE.exec(typed.toUpperCase().replace(/[^A-Z0-9]/g, ''));
  return match ? `SR-${match[1]}-${match[2]}` : null;
}

/** From today (or the check-in date when it is ahead) to the night before check-out. */
function remainingNights(booking: StayRow, today = todayInVietnam()) {
  const checkIn = toCalendarDate(booking.checkInDate);
  const checkOut = toCalendarDate(booking.checkOutDate);
  const nights: string[] = [];
  for (
    let d = checkIn > today ? checkIn : today;
    d < checkOut;
    d = addDays(d, 1)
  ) {
    nights.push(d);
  }
  return nights;
}

/** CONFIRMED and PAID; a waiting refund request is for the owner to decide first (O2, O4). */
function assertConfirmedAndPaid(booking: StayRow, action: string) {
  if (booking.status !== 'CONFIRMED') {
    throw statusConflict(`A ${booking.status} booking cannot be ${action}`);
  }
  const payment = booking.invoice!.paymentStatus;
  if (payment === 'REFUND_PENDING') {
    throw new ConflictException({
      code: ErrorCode.REFUND_DECISION_PENDING,
      message: 'A refund request waits for the hotel; decide it first',
    });
  }
  if (payment !== 'PAID') {
    throw statusConflict(
      `A booking with a ${payment} invoice cannot be ${action}`,
    );
  }
}

/** From the day after the check-in date (O4). */
function assertNoShowAllowed(booking: StayRow, today = todayInVietnam()) {
  assertConfirmedAndPaid(booking, 'marked as a no-show');
  const from = addDays(toCalendarDate(booking.checkInDate), 1);
  if (today < from) {
    throw new ConflictException({
      code: ErrorCode.NO_SHOW_NOT_ALLOWED,
      message: `A no-show can be marked from ${from}`,
    });
  }
}

function assertCheckInOpen(booking: StayRow, today = todayInVietnam()) {
  assertConfirmedAndPaid(booking, 'checked in');
  const checkIn = toCalendarDate(booking.checkInDate);
  const checkOut = toCalendarDate(booking.checkOutDate);
  if (today < checkIn || today >= checkOut) {
    throw new ConflictException({
      code: ErrorCode.CHECK_IN_NOT_OPEN,
      message: `Check-in is open from ${checkIn} to ${addDays(checkOut, -1)}`,
    });
  }
}

const toOption = (r: {
  roomId: string;
  roomNumber: string;
  status: RoomOption['status'];
}): RoomOption => ({
  id: r.roomId,
  roomNumber: r.roomNumber,
  status: r.status,
});

const compareOptions = (a: RoomOption, b: RoomOption) =>
  byRoomNumber(a.roomNumber, b.roomNumber);

/** Staff or the owning partner; the guards let no one else through. */
const actorOf = (user: AuthUser) => ({
  role: user.role as 'HOTEL_STAFF' | 'HOTEL_PARTNER',
  accountId: user.accountId,
});
