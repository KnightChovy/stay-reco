import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BOOKING_LIMITS,
  type Booking,
  type BookingSummary,
  type BookingVoucher,
  type CreateBookingInput,
  type MyBookingsQuery,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { escapeLike } from '../../common/db/like';
import { lockRoomType } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import {
  fromCalendarDate,
  toCalendarDate,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import type { Env } from '../../config/env';
import type { BookingStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import {
  cancellationPolicyOf,
  cancellationRowsSelect,
  fromTime,
} from '../hotels/hotel.mapper';
import { PriceEngine } from '../pricing/price-engine';
import { roomTypeNotFound } from '../rooms/room-types.service';
import { bookableHotel, sellableRoomType } from '../stays/bookable';
import { assertBookableDates, freeCancellationUntil } from '../stays/offer';
import { newBookingCode } from './booking-code';
import {
  bookingInclude,
  bookingSummaryInclude,
  type NightlyPrices,
  toBooking,
  toBookingSummary,
} from './booking.mapper';
import { latestCancelRequest } from './cancel-request';
import { HoldExpiryService } from './hold-expiry.service';
import { SepayPayment } from './sepay-payment';
import { signVoucher } from './voucher-token';

const bookingNotFound = () =>
  new NotFoundException({
    code: ErrorCode.BOOKING_NOT_FOUND,
    message: 'Booking not found',
  });

const validation = (field: string, message: string) =>
  new BadRequestException({
    code: ErrorCode.VALIDATION_ERROR,
    message: 'Validation failed',
    details: [{ field, message }],
  });

/** My trips tabs (customer.md): no-shows are past stays, expired holds count as cancelled. */
const TAB_STATUSES: Record<MyBookingsQuery['tab'], BookingStatus[]> = {
  upcoming: ['PENDING', 'CONFIRMED'],
  staying: ['CHECKED_IN'],
  completed: ['COMPLETED', 'NO_SHOW'],
  cancelled: ['CANCELLED', 'EXPIRED'],
};

/** A voucher is shown from payment until the guest has checked in (customer.md, "Voucher"). */
const VOUCHER_STATUSES: BookingStatus[] = ['CONFIRMED', 'CHECKED_IN'];

/** Codes are random, so a clash is rare; a few tries are plenty. */
const CODE_ATTEMPTS = 5;

/**
 * Booking with a 15-minute hold (UC18, UC20, customer.md "Bookings"). The stay is priced again and the rooms are held
 * under the room type lock, so two customers can never hold the same room for the same night (BR-02, BR-03).
 */
@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly availability: AvailabilityService,
    private readonly engine: PriceEngine,
    private readonly holds: HoldExpiryService,
    private readonly sepay: SepayPayment,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(user: AuthUser, input: CreateBookingInput): Promise<Booking> {
    const { roomTypeId, checkIn, checkOut, rooms, guests } = input;
    assertBookableDates(checkIn);
    const roomType = await this.prisma.roomType.findFirst({
      where: { roomTypeId, ...sellableRoomType, hotel: bookableHotel },
      select: {
        maxOccupancy: true,
        hotel: {
          select: {
            checkInTime: true,
            hotelProperties: cancellationRowsSelect,
            hotelPartner: { select: { commissionRate: true } },
          },
        },
      },
    });
    if (!roomType) throw roomTypeNotFound();
    if (guests > rooms * roomType.maxOccupancy) {
      throw validation(
        'guests',
        `at most ${rooms * roomType.maxOccupancy} guests in ${rooms} rooms of this type`,
      );
    }

    // Priced before the hold: the rules do not depend on availability, and BR-09 fixes the result on the booking.
    const quote = (
      await this.engine.quote([roomTypeId], checkIn, checkOut)
    ).get(roomTypeId)!;
    const total = quote.total.times(rooms);
    if (!total.equals(input.expectedTotal)) {
      throw new ConflictException({
        code: ErrorCode.BOOKING_PRICE_CHANGED,
        message: 'The total of the stay has changed',
        details: [{ field: 'expectedTotal', message: total.toString() }],
      });
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + BOOKING_LIMITS.holdMinutes * 60_000,
    );
    const policy = cancellationPolicyOf(roomType.hotel.hotelProperties);
    const nightlyPrices: NightlyPrices = quote.nights.map((n) => ({
      date: n.date,
      price: toNumber(n.price),
    }));

    const bookingId = await this.prisma.$transaction(async (tx) => {
      await lockRoomType(tx, roomTypeId);
      await this.holds.expireDue(roomTypeId, tx);
      const picked = await this.availability.pickRooms(
        tx,
        roomTypeId,
        checkIn,
        checkOut,
        rooms,
      );
      if (!picked) {
        throw new ConflictException({
          code: ErrorCode.ROOM_SOLD_OUT,
          message: 'Not enough rooms left for every night of the stay',
        });
      }

      const booking = await tx.booking.create({
        data: {
          customerId: user.accountId,
          roomTypeId,
          checkInDate: fromCalendarDate(checkIn),
          checkOutDate: fromCalendarDate(checkOut),
          numGuests: guests,
          numRooms: rooms,
          nightlyPrices,
          totalAmount: total,
          status: 'PENDING',
          guestName: input.guestName,
          contactPhone: input.contactPhone,
          arrivalTime: input.arrivalTime
            ? new Date(`1970-01-01T${input.arrivalTime}:00.000Z`)
            : null,
          specialRequests: input.specialRequests,
          freeCancelUntil: freeCancellationUntil(
            policy,
            checkIn,
            fromTime(roomType.hotel.checkInTime),
            now,
          ),
          cancelFeePercent: policy.feePercent,
          commissionRate: roomType.hotel.hotelPartner.commissionRate,
        },
        select: { bookingId: true },
      });
      await tx.invoice.create({
        data: {
          bookingId: booking.bookingId,
          invoiceNumber: await this.unusedCode(tx, now),
          subtotal: total,
          taxAmount: 0,
          discountAmount: 0,
          totalAmount: total,
          paymentMethod: 'SEPAY',
        },
      });

      const nightPrice = new Map(quote.nights.map((n) => [n.date, n.price]));
      const held = [...picked].flatMap(([date, roomIds]) =>
        roomIds.map((roomId) => ({
          roomId,
          date: fromCalendarDate(date),
          bookingId: booking.bookingId,
          status: 'HELD' as const,
          holdExpiresAt: expiresAt,
          priceOverride: nightPrice.get(date),
        })),
      );
      // Rows marked AVAILABLE carry nothing and would collide with the hold.
      await tx.roomCalendars.deleteMany({
        where: {
          status: 'AVAILABLE',
          roomId: { in: [...new Set(held.map((h) => h.roomId))] },
          date: {
            gte: fromCalendarDate(checkIn),
            lt: fromCalendarDate(checkOut),
          },
        },
      });
      await tx.roomCalendars.createMany({ data: held });
      return booking.bookingId;
    });
    return this.load(bookingId);
  }

  /** The customer who booked, the hotel owner (also while suspended), or staff with BOOKING or REFUND. */
  async findOne(user: AuthUser, bookingId: string): Promise<Booking> {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findUnique({
          where: { bookingId },
          select: {
            customerId: true,
            roomType: { select: { hotelId: true } },
          },
        })
      : null;
    if (!booking) throw bookingNotFound();

    if (user.role === 'CUSTOMER') {
      if (booking.customerId !== user.accountId) throw bookingNotFound();
    } else {
      const access = await this.access.assertResource(
        user,
        booking.roomType.hotelId,
        'member',
        bookingNotFound,
      );
      const allowed =
        access.role === 'OWNER' ||
        access.permissions.some((p) => p === 'BOOKING' || p === 'REFUND');
      if (!allowed) {
        throw new ForbiddenException({
          code: ErrorCode.FORBIDDEN,
          message: 'Missing staff permission BOOKING or REFUND',
        });
      }
    }
    return this.load(bookingId);
  }

  /** The signed-in customer's bookings for one tab of My trips, newest first. */
  async listMine(
    user: AuthUser,
    query: MyBookingsQuery,
  ): Promise<Paginated<BookingSummary>> {
    const where = {
      customerId: user.accountId,
      status: { in: TAB_STATUSES[query.tab] },
      invoice: query.search
        ? {
            invoiceNumber: {
              contains: escapeLike(query.search),
              mode: 'insensitive',
            },
          }
        : undefined,
    } satisfies Prisma.BookingWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: bookingSummaryInclude,
        orderBy: [{ createdAt: 'desc' }, { bookingId: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return Paginated.of(rows.map(toBookingSummary), { ...query, total });
  }

  /** For the customer who booked, while the booking is CONFIRMED or CHECKED_IN (UC23). */
  async voucher(user: AuthUser, bookingId: string): Promise<BookingVoucher> {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findFirst({
          where: { bookingId, customerId: user.accountId },
          include: {
            invoice: true,
            roomType: {
              select: { name: true, hotel: { select: { name: true } } },
            },
          },
        })
      : null;
    if (!booking) throw bookingNotFound();
    if (!VOUCHER_STATUSES.includes(booking.status)) {
      throw new ConflictException({
        code: ErrorCode.BOOKING_STATUS_CONFLICT,
        message: `A ${booking.status} booking has no voucher`,
      });
    }
    const code = booking.invoice!.invoiceNumber;
    return {
      code,
      hotelName: booking.roomType.hotel.name,
      roomTypeName: booking.roomType.name,
      checkIn: toCalendarDate(booking.checkInDate),
      checkOut: toCalendarDate(booking.checkOutDate),
      rooms: booking.numRooms,
      guests: booking.numGuests ?? booking.numRooms,
      guestName: booking.guestName,
      amountPaid: toNumber(booking.invoice!.totalAmount),
      qrToken: signVoucher(
        code,
        this.config.get('VOUCHER_SIGNING_SECRET', { infer: true }),
      ),
    };
  }

  private async load(bookingId: string): Promise<Booking> {
    const [booking, cancelRequest] = await Promise.all([
      this.prisma.booking.findUniqueOrThrow({
        where: { bookingId },
        include: bookingInclude,
      }),
      latestCancelRequest(this.prisma, bookingId),
    ]);
    return toBooking(booking, this.sepay.details, cancelRequest);
  }

  private async unusedCode(tx: Prisma.TransactionClient, now: Date) {
    for (let i = 0; i < CODE_ATTEMPTS; i++) {
      const code = newBookingCode(now);
      const taken = await tx.invoice.count({ where: { invoiceNumber: code } });
      if (!taken) return code;
    }
    throw new Error('Could not find a free booking code');
  }
}
