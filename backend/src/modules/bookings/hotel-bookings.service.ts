import { Injectable } from '@nestjs/common';
import type { BookingSummary, HotelBookingsQuery } from '@stayreco/shared';
import { escapeLike } from '../../common/db/like';
import { Paginated } from '../../common/http/api-response';
import { fromCalendarDate } from '../../common/http/calendar-date';
import type { HotelAccess } from '../../common/hotel-access/hotel-access.service';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertCanSeeBookings } from './booking-access';
import { bookingSummaryInclude, toBookingSummary } from './booking.mapper';

const ORDER: Record<
  HotelBookingsQuery['sort'],
  Prisma.BookingOrderByWithRelationInput[]
> = {
  'check-in-asc': [{ checkInDate: 'asc' }, { createdAt: 'asc' }],
  'check-in-desc': [{ checkInDate: 'desc' }, { createdAt: 'desc' }],
  'created-desc': [{ createdAt: 'desc' }],
};

/** The bookings of one hotel, read-only (UC57); the refund queue is the `REFUND_PENDING` filter. */
@Injectable()
export class HotelBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** `access` was resolved by `HotelAccessRequired('member')`. */
  async list(
    access: HotelAccess,
    query: HotelBookingsQuery,
  ): Promise<Paginated<BookingSummary>> {
    assertCanSeeBookings(access);
    const search = query.search && escapeLike(query.search);
    const where = {
      roomType: { hotelId: access.hotelId },
      status: query.status && { in: query.status },
      invoice: query.paymentStatus && {
        paymentStatus: { in: query.paymentStatus },
      },
      checkInDate: {
        gte: query.checkInFrom && fromCalendarDate(query.checkInFrom),
        lte: query.checkInTo && fromCalendarDate(query.checkInTo),
      },
      OR: search
        ? [
            {
              invoice: {
                invoiceNumber: { contains: search, mode: 'insensitive' },
              },
            },
            { guestName: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    } satisfies Prisma.BookingWhereInput;

    const [rows, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: bookingSummaryInclude,
        orderBy: [...ORDER[query.sort], { bookingId: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.booking.count({ where }),
    ]);
    return Paginated.of(rows.map(toBookingSummary), { ...query, total });
  }
}
