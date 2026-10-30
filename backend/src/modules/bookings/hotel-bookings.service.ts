import { ForbiddenException, Injectable } from '@nestjs/common';
import type { BookingSummary, HotelBookingsQuery } from '@stayreco/shared';
import { escapeLike } from '../../common/db/like';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { fromCalendarDate } from '../../common/http/calendar-date';
import type { HotelAccess } from '../../common/hotel-access/hotel-access.service';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { assertCanSeeBookings } from './booking-access';
import { pendingChangeBookingIds } from './booking-history';
import { bookingSummaryInclude, toBookingSummary } from './booking.mapper';

const ORDER: Record<
  HotelBookingsQuery['sort'],
  Prisma.BookingOrderByWithRelationInput[]
> = {
  'check-in-asc': [{ checkInDate: 'asc' }, { createdAt: 'asc' }],
  'check-in-desc': [{ checkInDate: 'desc' }, { createdAt: 'desc' }],
  'created-desc': [{ createdAt: 'desc' }],
};

/**
 * The bookings of one hotel, read-only (UC57); the refund queue is the `REFUND_PENDING` filter, the change-request
 * queue `changeRequest=PENDING`.
 */
@Injectable()
export class HotelBookingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** `access` was resolved by `HotelAccessRequired('member')`. */
  async list(
    access: HotelAccess,
    query: HotelBookingsQuery,
  ): Promise<Paginated<BookingSummary>> {
    assertCanSeeBookings(access);
    // The refund queue is for the owner and the staff who handle refunds (partner.md, "Refund requests").
    if (
      query.paymentStatus?.includes('REFUND_PENDING') &&
      access.role === 'STAFF' &&
      !access.permissions.includes('REFUND')
    ) {
      throw new ForbiddenException({
        code: ErrorCode.FORBIDDEN,
        message: 'Missing staff permission REFUND for the refund queue',
      });
    }
    const search = query.search && escapeLike(query.search);
    // The change-request queue: waiting requests live in audit_log, not on the booking row.
    const pendingChanges =
      query.changeRequest &&
      (await pendingChangeBookingIds(this.prisma, access.hotelId));
    const where = {
      roomType: { hotelId: access.hotelId },
      bookingId: pendingChanges ? { in: pendingChanges } : undefined,
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
