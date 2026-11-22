import { Injectable } from '@nestjs/common';
import type { ContentIdea } from '@stayreco/shared';
import {
  addDays,
  fromCalendarDate,
  toCalendarDate,
  todayInVietnam,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { campaignUsable } from '../promotions/discount';

/** How far ahead "this coming week" reaches when looking for empty rooms. */
const WINDOW_NIGHTS = 7;
/** A review has to be at least this good to be worth quoting. */
const GREAT_REVIEW = 4.5;
/** How much of the review goes into the brief; a brief is at most 500 characters. */
const REVIEW_QUOTE_CHARS = 300;

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

  /**
   * Rooms with no booking on any of the next seven nights: the thing most worth filling.
   *
   * Counted the way the search counts what it can sell: a room under maintenance is not for sale, and neither is a
   * night the partner closed (`BLOCKED`). Counting either would put a number in a public post that no guest could
   * actually book.
   */
  private async emptyRooms(
    hotelId: string,
    today: string,
  ): Promise<ContentIdea | null> {
    const total = await this.prisma.room.count({
      where: { roomType: { hotelId }, status: { not: 'MAINTENANCE' } },
    });
    if (!total) return null;

    const booked = await this.prisma.roomCalendars.findMany({
      where: {
        room: { roomType: { hotelId }, status: { not: 'MAINTENANCE' } },
        date: {
          gte: fromCalendarDate(today),
          lt: fromCalendarDate(addDays(today, WINDOW_NIGHTS)),
        },
        status: { in: ['HELD', 'BOOKED', 'BLOCKED'] },
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

  /**
   * A discount any guest gets today, which a post can point at.
   *
   * Only what the booking itself would apply (`DiscountService`): a campaign that is out of uses gives nothing, and
   * one that handed out personal codes applies only to those codes, so advertising either would promise the public a
   * discount it cannot have. The minimum stay and the last day go into the brief, because the writer is told never to
   * invent terms or dates and can only state the ones it is given.
   */
  private async runningPromotion(
    hotelId: string,
    today: string,
  ): Promise<ContentIdea | null> {
    const campaigns = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
        vouchers: { none: {} },
        OR: [{ hotelId }, { hotelId: null }],
      },
      orderBy: [{ createdAt: 'desc' }, { promotionId: 'asc' }],
    });
    const promotion = campaigns.find((p) => campaignUsable(p, today));
    if (!promotion) return null;

    const dong = (n: Prisma.Decimal) =>
      `${toNumber(n).toLocaleString('vi-VN')} ₫`;
    const off =
      promotion.discountType === 'PERCENTAGE'
        ? `${toNumber(promotion.discountValue)}%`
        : dong(promotion.discountValue);
    const terms = [
      promotion.minBookingAmount &&
        `cho đơn từ ${dong(promotion.minBookingAmount)}`,
      promotion.validTo && `đến hết ngày ${toCalendarDate(promotion.validTo)}`,
    ]
      .filter(Boolean)
      .join(', ');
    return {
      kind: 'PROMOTION',
      brief: `Giới thiệu chương trình "${promotion.name}", giảm ${off}${terms ? `, ${terms}` : ''}`,
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

    // The guest's own words go into the brief: the writer may only repeat praise it has been shown, and a brief
    // that only says "repeat what they praised" leaves it nothing to repeat but what it makes up. No name, since the
    // post is public and the guest did not write for it.
    return {
      kind: 'GREAT_REVIEW',
      brief: `Cảm ơn khách vừa để lại đánh giá ${toNumber(review.overallRating)}★ và nhắc lại điều họ khen, chỉ dựa trên lời khách: "${review.content.slice(0, REVIEW_QUOTE_CHARS)}"`,
      detail: `${toNumber(review.overallRating)}★ — "${review.content.slice(0, 120)}"`,
    };
  }
}
