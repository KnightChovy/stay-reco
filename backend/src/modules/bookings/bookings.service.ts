import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BOOKING_LIMITS,
  type Booking,
  type BookingSummary,
  type BookingVoucher,
  bookingItemsOf,
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
import { type BookingStatus, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityService } from '../availability/availability.service';
import {
  cancellationPolicyOf,
  cancellationRowsSelect,
  fromTime,
  toTime,
} from '../hotels/hotel.mapper';
import { PriceEngine } from '../pricing/price-engine';
import { AuditAction, AuditService } from '../audit/audit.service';
import { DiscountService } from '../promotions/discount.service';
import { payable } from '../promotions/stay-discount.service';
import { roomTypeNotFound } from '../rooms/room-types.service';
import { byRoomNumber } from '../rooms/rooms.service';
import { bookableHotel, sellableRoomType } from '../stays/bookable';
import { assertBookableDates, freeCancellationUntil } from '../stays/offer';
import {
  CODE_ATTEMPTS,
  newBookingCode,
  retryOnUniqueClash,
} from './booking-code';
import {
  type AssignedRoom,
  bookingInclude,
  bookingItemsInclude,
  bookingSummaryInclude,
  type NightlyPrices,
  roomsOf,
  toBooking,
  toBookingSummary,
} from './booking.mapper';
import { assertCanSeeBookings } from './booking-access';
import { loadBookingHistory, type StayRoom } from './booking-history';
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
    private readonly discounts: DiscountService,
    private readonly audit: AuditService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async create(user: AuthUser, input: CreateBookingInput): Promise<Booking> {
    const { checkIn, checkOut, guests } = input;
    const requested = bookingItemsOf(input);
    assertBookableDates(checkIn);
    const ids = requested.map((i) => i.roomTypeId);
    const roomTypes = await this.prisma.roomType.findMany({
      where: {
        roomTypeId: { in: ids },
        ...sellableRoomType,
        hotel: bookableHotel,
      },
      select: {
<<<<<<< HEAD
        roomTypeId: true,
=======
        hotelId: true,
>>>>>>> feat/promotions-api
        maxOccupancy: true,
        hotelId: true,
        hotel: {
          select: {
            checkInTime: true,
            hotelProperties: cancellationRowsSelect,
            hotelPartner: { select: { commissionRate: true } },
          },
        },
      },
    });
<<<<<<< HEAD
    // Every room type sellable, all of one hotel (docs/design/booking-items.md §3).
    const hotelIds = new Set(roomTypes.map((r) => r.hotelId));
    if (roomTypes.length !== ids.length || hotelIds.size !== 1) {
      throw roomTypeNotFound();
    }
    const byId = new Map(roomTypes.map((r) => [r.roomTypeId, r]));
    const { hotelId, hotel } = roomTypes[0];
    const capacity = requested.reduce(
      (n, i) => n + i.rooms * byId.get(i.roomTypeId)!.maxOccupancy,
      0,
    );
    if (guests > capacity) {
=======
    if (!roomType) throw roomTypeNotFound();
    const { hotelId } = roomType;
    if (guests > rooms * roomType.maxOccupancy) {
>>>>>>> feat/promotions-api
      throw validation(
        'guests',
        `at most ${capacity} guests in the rooms of this booking`,
      );
    }

    // Priced before the hold: the rules do not depend on availability, and BR-09 fixes the result on the booking.
<<<<<<< HEAD
    const quotes = await this.engine.quote(ids, checkIn, checkOut);
    const items = requested.map((item, index) => {
      const quote = quotes.get(item.roomTypeId)!;
      return {
        ...item,
        index,
        quote,
        subtotal: quote.total.times(item.rooms),
        nightlyPrices: quote.nights.map((n) => ({
          date: n.date,
          price: toNumber(n.price),
        })) satisfies NightlyPrices,
      };
    });
    const total = items.reduce(
      (sum, i) => sum.plus(i.subtotal),
      new Prisma.Decimal(0),
    );
=======
    const quote = (
      await this.engine.quote([roomTypeId], checkIn, checkOut)
    ).get(roomTypeId)!;
    const subtotal = quote.total.times(rooms);
    // A promotion or the typed code comes off the stay, never both (BR-06, money-rules §2.1).
    const discount = await this.discounts.forStay(
      user.accountId,
      hotelId,
      subtotal,
      input.code,
    );
    const total = payable(subtotal, discount);
>>>>>>> feat/promotions-api
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
    const policy = cancellationPolicyOf(hotel.hotelProperties);

    const bookingId = await retryOnUniqueClash(() =>
      this.prisma.$transaction(async (tx) => {
        // Locks in id order, so two bookings of the same room types never wait on each other.
        for (const id of [...ids].sort()) {
          await lockRoomType(tx, id);
          await this.holds.expireDue(id, tx);
        }
        const picks: {
          item: (typeof items)[number];
          picked: Map<string, string[]>;
        }[] = [];
        for (const item of items) {
          const picked = await this.availability.pickRooms(
            tx,
            item.roomTypeId,
            checkIn,
            checkOut,
            item.rooms,
          );
          if (!picked) {
            throw new ConflictException({
              code: ErrorCode.ROOM_SOLD_OUT,
              message: 'Not enough rooms left for every night of the stay',
              details: [
                {
                  field: `items.${item.index}.rooms`,
                  message: 'not enough rooms of this type',
                },
              ],
            });
          }
          picks.push({ item, picked });
        }

        // Taken inside the booking's transaction: two bookings racing for one code, or for a campaign's last use,
        // cannot both win. The loser is told the price changed rather than quietly paying more than it agreed to.
        if (discount && !(await this.discounts.consume(tx, discount))) {
          throw new ConflictException({
            code: ErrorCode.BOOKING_PRICE_CHANGED,
            message: 'The discount is no longer available',
            details: [{ field: 'expectedTotal', message: subtotal.toString() }],
          });
        }

        const booking = await tx.booking.create({
          data: {
            customerId: user.accountId,
<<<<<<< HEAD
            hotelId,
=======
            roomTypeId,
            promotionId: discount?.promotionId ?? null,
            voucherId: discount?.voucherId ?? null,
>>>>>>> feat/promotions-api
            checkInDate: fromCalendarDate(checkIn),
            checkOutDate: fromCalendarDate(checkOut),
            numGuests: guests,
            totalAmount: total,
            status: 'PENDING',
            guestName: input.guestName,
            contactPhone: input.contactPhone,
            arrivalTime: toTime(input.arrivalTime) ?? null,
            specialRequests: input.specialRequests,
            freeCancelUntil: freeCancellationUntil(
              policy,
              checkIn,
              fromTime(hotel.checkInTime),
              now,
            ),
            cancelFeePercent: policy.feePercent,
            commissionRate: hotel.hotelPartner.commissionRate,
            items: {
              create: items.map((i) => ({
                roomTypeId: i.roomTypeId,
                numRooms: i.rooms,
                nightlyPrices: i.nightlyPrices,
                subtotal: i.subtotal,
              })),
            },
          },
          select: { bookingId: true },
        });
        await tx.invoice.create({
          data: {
            bookingId: booking.bookingId,
            invoiceNumber: await this.unusedCode(tx, now),
            subtotal,
            taxAmount: 0,
            discountAmount: discount?.amount ?? 0,
            totalAmount: total,
            paymentMethod: 'SEPAY',
          },
        });

        const held = picks.flatMap(({ item, picked }) => {
          const nightPrice = new Map(
            item.quote.nights.map((n) => [n.date, n.price]),
          );
          return [...picked].flatMap(([date, roomIds]) =>
            roomIds.map((roomId) => ({
              roomId,
              date: fromCalendarDate(date),
              bookingId: booking.bookingId,
              status: 'HELD' as const,
              holdExpiresAt: expiresAt,
              priceOverride: nightPrice.get(date),
            })),
          );
        });
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
      }),
    );
    if (discount) {
      await this.audit.log(
        AuditAction.BOOKING_DISCOUNT_APPLIED,
        user.accountId,
        {},
        {
          bookingId,
          kind: discount.kind,
          promotionId: discount.promotionId,
          code: discount.code,
          amount: discount.amount,
        },
      );
    }
    return this.load(bookingId);
  }

  /** The customer who booked, the hotel owner (also while suspended), or staff with BOOKING, REFUND or FRONT_DESK. */
  async findOne(user: AuthUser, bookingId: string): Promise<Booking> {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findUnique({
          where: { bookingId },
          select: {
            customerId: true,
            hotelId: true,
          },
        })
      : null;
    if (!booking) throw bookingNotFound();

    if (user.role === 'CUSTOMER') {
      if (booking.customerId !== user.accountId) throw bookingNotFound();
    } else {
      const access = await this.access.assertResource(
        user,
        booking.hotelId,
        'member',
        bookingNotFound,
      );
      assertCanSeeBookings(access);
    }
    return this.load(bookingId, user.role !== 'CUSTOMER');
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
            hotel: { select: { name: true } },
            items: bookingItemsInclude,
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
    const rooms = roomsOf(booking.items);
    return {
      code,
      hotelName: booking.hotel.name,
      items: booking.items.map((i) => ({
        roomTypeName: i.roomType.name,
        rooms: i.numRooms,
      })),
      roomTypeName: booking.items[0].roomType.name,
      checkIn: toCalendarDate(booking.checkInDate),
      checkOut: toCalendarDate(booking.checkOutDate),
      rooms,
      guests: booking.numGuests ?? rooms,
      guestName: booking.guestName,
      amountPaid: toNumber(booking.invoice!.totalAmount),
      qrToken: signVoucher(
        code,
        this.config.get('VOUCHER_SIGNING_SECRET', { infer: true }),
      ),
    };
  }

  /**
   * The customer sees the rooms once checked in; the hotel also sees the rooms held before (customer.md,
   * `assignedRooms`).
   */
  private async load(bookingId: string, forHotel = false): Promise<Booking> {
    const [booking, history] = await Promise.all([
      this.prisma.booking.findUniqueOrThrow({
        where: { bookingId },
        include: bookingInclude,
      }),
      loadBookingHistory(this.prisma, bookingId),
    ]);
    const rooms = history.checkedInRooms
      ? await this.withRoomTypes(history.checkedInRooms)
      : forHotel
        ? await this.heldRooms(bookingId)
        : [];
    return toBooking(booking, this.sepay.details, history, rooms);
  }

  /** Every room the booking has a night on, in room number order. */
  private async heldRooms(bookingId: string): Promise<AssignedRoom[]> {
    const rooms = await this.prisma.room.findMany({
      where: { roomCalendars: { some: { bookingId } } },
      select: { roomId: true, roomNumber: true, roomTypeId: true },
    });
    return rooms
      .map((r) => ({
        id: r.roomId,
        roomNumber: r.roomNumber,
        roomTypeId: r.roomTypeId,
      }))
      .sort((a, b) => byRoomNumber(a.roomNumber, b.roomNumber));
  }

  /** The check-in audit entry keeps the room numbers; the type comes from the room. */
  private async withRoomTypes(rooms: StayRoom[]): Promise<AssignedRoom[]> {
    const types = new Map(
      (
        await this.prisma.room.findMany({
          where: { roomId: { in: rooms.map((r) => r.id) } },
          select: { roomId: true, roomTypeId: true },
        })
      ).map((r) => [r.roomId, r.roomTypeId]),
    );
    return rooms.map((r) => ({ ...r, roomTypeId: types.get(r.id)! }));
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
