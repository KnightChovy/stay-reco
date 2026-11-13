import { Injectable } from '@nestjs/common';
import type { ContentIdea } from '@stayreco/shared';
import {
  addDays,
  fromCalendarDate,
  todayInVietnam,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { PrismaService } from '../../prisma/prisma.service';

/** How far ahead "this coming week" reaches when looking for empty rooms. */
const WINDOW_NIGHTS = 7;
/** A review has to be at least this good to be worth quoting. */
const GREAT_REVIEW = 4.5;

/**
 * What is worth posting about, read out of the hotel's own figures (M8).
 *
 * This is the part a general-purpose scheduler cannot do. Postiz and the rest start by asking the user what to
 * write; a booking system already knows - which nights are still empty, which discount is running, which guest just
 * left five stars. Staff pick an idea and it becomes the brief of a generate call.
 *
 * Nothing here calls the model: these are database queries, so suggestions cost nothing and can be refreshed freely.
 */
@Injectable()
export class ContentIdeasService {
  constructor(private readonly prisma: PrismaService) {}

  async forHotel(
    hotelId: string,
    today = todayInVietnam(),
  ): Promise<ContentIdea[]> {
    const [rooms, promotion, review] = await Promise.all([
      this.emptyRooms(hotelId, today),
      this.runningPromotion(hotelId, today),
      this.recentGreatReview(hotelId),
    ]);
    return [rooms, promotion, review].filter(
      (i): i is ContentIdea => i !== null,
    );
  }

  /** Rooms with no booking on any of the next seven nights: the thing most worth filling. */
  private async emptyRooms(
    hotelId: string,
    today: string,
  ): Promise<ContentIdea | null> {
    const roomTypes = await this.prisma.roomType.findMany({
      where: { hotelId },
      select: { name: true, rooms: { select: { roomId: true } } },
    });
    const total = roomTypes.reduce((n, r) => n + r.rooms.length, 0);
    if (!total) return null;

    const booked = await this.prisma.roomCalendars.findMany({
      where: {
        room: { roomType: { hotelId } },
        date: {
          gte: fromCalendarDate(today),
          lt: fromCalendarDate(addDays(today, WINDOW_NIGHTS)),
        },
        status: { in: ['HELD', 'BOOKED'] },
      },
      select: { roomId: true },
      distinct: ['roomId'],
    });
    const free = total - booked.length;
    if (free <= 0) return null;

    return {
      kind: 'FREE_ROOMS',
      brief: `Còn ${free} phòng trống trong 7 ngày tới, mời khách đặt sớm`,
      detail: `${free}/${total} phòng chưa có khách từ ${today} trong ${WINDOW_NIGHTS} đêm`,
    };
  }

  /** A discount already running, which a post can point at. */
  private async runningPromotion(
    hotelId: string,
    today: string,
  ): Promise<ContentIdea | null> {
    const promotion = await this.prisma.promotion.findFirst({
      where: {
        isActive: true,
        OR: [{ hotelId }, { hotelId: null }],
        AND: [
          {
            OR: [
              { validFrom: null },
              { validFrom: { lte: fromCalendarDate(today) } },
            ],
          },
          {
            OR: [
              { validTo: null },
              { validTo: { gte: fromCalendarDate(today) } },
            ],
          },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!promotion) return null;

    const off =
      promotion.discountType === 'PERCENTAGE'
        ? `${toNumber(promotion.discountValue)}%`
        : `${toNumber(promotion.discountValue).toLocaleString('vi-VN')} ₫`;
    return {
      kind: 'PROMOTION',
      brief: `Giới thiệu chương trình "${promotion.name}", giảm ${off}`,
      detail: promotion.validTo
        ? `Chạy tới ${promotion.validTo.toISOString().slice(0, 10)}`
        : 'Không giới hạn ngày kết thúc',
    };
  }

  /** A recent review good enough to quote, so a post can say something a guest actually said. */
  private async recentGreatReview(
    hotelId: string,
  ): Promise<ContentIdea | null> {
    const review = await this.prisma.review.findFirst({
      where: { hotelId, isVisible: true, overallRating: { gte: GREAT_REVIEW } },
      orderBy: { createdAt: 'desc' },
    });
    if (!review) return null;

    return {
      kind: 'GREAT_REVIEW',
      brief: 'Cảm ơn khách vừa để lại đánh giá tốt và nhắc lại điều họ khen',
      detail: `${toNumber(review.overallRating)}★ — "${review.content.slice(0, 120)}"`,
    };
  }
}
