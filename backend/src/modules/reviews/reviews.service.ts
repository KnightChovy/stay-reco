import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  CreateReviewInput,
  RatingCriterion,
  RatingSummary,
  Review,
  ReviewEligibility,
  ReviewListQuery,
  UpdateReviewInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { pageArgs } from '../../common/http/pagination';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import { round1, starBucket, weightedAverage } from './rating';
import { reviewInclude, toReview } from './reviews.mapper';

const DAY = 86_400_000;

const notFound = () =>
  new NotFoundException({
    code: ErrorCode.REVIEW_NOT_FOUND,
    message: 'Review not found',
  });

const windowClosed = () =>
  new ConflictException({
    code: ErrorCode.REVIEW_WINDOW_CLOSED,
    message: 'The review window for this stay has closed',
  });

/**
 * Post-stay reviews (BR-12). One review per completed booking, written by the customer who stayed, inside the review
 * window (`REVIEW_WINDOW_DAYS` after check-out). The overall rating is always the weighted average of the sub-ratings,
 * computed here, so a client cannot send a score that disagrees with the criteria it filled in.
 *
 * Each sub-rating is also written to `user_item_rating`, the user-item matrix the recommender reads in phase 5. That
 * table holds one score per (customer, hotel, criterion), so a second stay at the same hotel updates the earlier
 * score instead of adding a row.
 */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  /** The criteria a guest scores, heaviest first so the review screen can show them in that order. */
  async criteria(): Promise<RatingCriterion[]> {
    const rows = await this.prisma.ratingCriterion.findMany({
      orderBy: [{ weight: 'desc' }, { name: 'asc' }],
    });
    return rows.map((c) => ({
      id: c.ratingCriterionId,
      name: c.name,
      description: c.description,
      weight: toNumber(c.weight),
    }));
  }

  /** When the review window of a stay closes; null when the stay never completed. */
  private closesAt(checkOutDate: Date, status: string): Date | null {
    if (status !== 'COMPLETED') return null;
    const days = this.config.get('REVIEW_WINDOW_DAYS', { infer: true });
    return new Date(checkOutDate.getTime() + days * DAY);
  }

  /** Whether the signed-in customer may still review this stay, for the "Write a review" button. */
  async eligibility(
    customerId: string,
    bookingId: string,
    now = new Date(),
  ): Promise<ReviewEligibility> {
    const booking = await this.ownBooking(customerId, bookingId);
    const closesAt = this.closesAt(booking.checkOutDate, booking.status);
    const reason = booking.review
      ? ErrorCode.REVIEW_ALREADY_EXISTS
      : !closesAt
        ? ErrorCode.REVIEW_NOT_ALLOWED
        : closesAt <= now
          ? ErrorCode.REVIEW_WINDOW_CLOSED
          : null;
    return {
      canReview: reason === null,
      reason,
      reviewId: booking.review?.reviewId ?? null,
      closesAt: closesAt?.toISOString() ?? null,
    };
  }

  /** The caller's own booking, with the hotel it belongs to; someone else's is simply not found. */
  private async ownBooking(customerId: string, bookingId: string) {
    const booking = isUuid(bookingId)
      ? await this.prisma.booking.findFirst({
          where: { bookingId, customerId },
          select: {
            bookingId: true,
            status: true,
            checkOutDate: true,
            hotelId: true,
            review: { select: { reviewId: true } },
          },
        })
      : null;
    if (!booking) {
      throw new NotFoundException({
        code: ErrorCode.BOOKING_NOT_FOUND,
        message: 'Booking not found',
      });
    }
    return booking;
  }

  /**
   * Scores every criterion, weighted by its share. The weights are normalised by the total weight of the criteria
   * scored, so the result stays on the 1-5 scale even if the seeded weights do not add up to exactly 1.
   */
  private async weightedOverall(
    subRatings: CreateReviewInput['subRatings'],
  ): Promise<Prisma.Decimal> {
    const criteria = await this.prisma.ratingCriterion.findMany();
    const weights = new Map(
      criteria.map((c) => [c.ratingCriterionId, toNumber(c.weight)]),
    );
    const seen = new Set<string>();
    for (const r of subRatings) {
      if (!weights.has(r.criterionId) || seen.has(r.criterionId)) {
        throw new NotFoundException({
          code: ErrorCode.RATING_CRITERION_NOT_FOUND,
          message: 'Unknown or repeated rating criterion',
        });
      }
      seen.add(r.criterionId);
    }
    // Every criterion must be scored: a partial review would let a guest choose what their overall rating weighs.
    if (seen.size !== criteria.length) {
      throw new ConflictException({
        code: ErrorCode.REVIEW_NOT_ALLOWED,
        message: 'Every rating criterion must be scored exactly once',
      });
    }

    // Decimal(3, 1) in the database; rounded in `weightedAverage` so the stored value is what the client is told.
    return new Prisma.Decimal(
      weightedAverage(
        subRatings.map((r) => ({
          score: r.score,
          weight: weights.get(r.criterionId) ?? 0,
        })),
      ),
    );
  }

  /** The customer writes the one review of a completed stay. */
  async create(
    customerId: string,
    bookingId: string,
    input: CreateReviewInput,
    meta: RequestMeta = {},
    now = new Date(),
  ): Promise<Review> {
    const booking = await this.ownBooking(customerId, bookingId);
    if (booking.review) {
      throw new ConflictException({
        code: ErrorCode.REVIEW_ALREADY_EXISTS,
        message: 'This stay already has a review',
      });
    }
    const closesAt = this.closesAt(booking.checkOutDate, booking.status);
    if (!closesAt) {
      throw new ConflictException({
        code: ErrorCode.REVIEW_NOT_ALLOWED,
        message: 'Only a completed stay can be reviewed',
      });
    }
    if (closesAt <= now) throw windowClosed();

    const { hotelId } = booking;
    const overallRating = await this.weightedOverall(input.subRatings);
    const review = await this.prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          customerId,
          hotelId,
          bookingId,
          overallRating,
          title: input.title ?? null,
          content: input.content,
        },
      });
      await writeSubRatings(
        tx,
        customerId,
        hotelId,
        created.reviewId,
        input.subRatings,
      );
      return tx.review.findUniqueOrThrow({
        where: { reviewId: created.reviewId },
        include: reviewInclude,
      });
    });
    await this.audit.log(AuditAction.REVIEW_CREATED, customerId, meta, {
      reviewId: review.reviewId,
      bookingId,
      hotelId,
      overallRating: toNumber(review.overallRating),
    });
    return toReview(review);
  }

  /** The author edits their own review while the window is still open. */
  /**
   * The caller's own review, refused once the review window has closed. Shared with the photo endpoints, so a photo
   * can be added or removed exactly as long as the text can be edited.
   */
  async assertEditable(reviewId: string, customerId: string, now = new Date()) {
    const existing = isUuid(reviewId)
      ? await this.prisma.review.findFirst({
          where: { reviewId, customerId },
          include: {
            booking: { select: { checkOutDate: true, status: true } },
          },
        })
      : null;
    if (!existing) throw notFound();

    const closesAt = this.closesAt(
      existing.booking.checkOutDate,
      existing.booking.status,
    );
    if (!closesAt || closesAt <= now) throw windowClosed();
    return existing;
  }

  async update(
    customerId: string,
    reviewId: string,
    input: UpdateReviewInput,
    meta: RequestMeta = {},
    now = new Date(),
  ): Promise<Review> {
    const existing = await this.assertEditable(reviewId, customerId, now);

    const overallRating = input.subRatings
      ? await this.weightedOverall(input.subRatings)
      : undefined;
    const review = await this.prisma.$transaction(async (tx) => {
      await tx.review.update({
        where: { reviewId },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.content !== undefined && { content: input.content }),
          ...(overallRating && { overallRating }),
        },
      });
      if (input.subRatings) {
        await writeSubRatings(
          tx,
          customerId,
          existing.hotelId,
          reviewId,
          input.subRatings,
        );
      }
      return tx.review.findUniqueOrThrow({
        where: { reviewId },
        include: reviewInclude,
      });
    });
    await this.audit.log(AuditAction.REVIEW_UPDATED, customerId, meta, {
      reviewId,
      changed: Object.keys(input),
      overallRating: toNumber(review.overallRating),
    });
    return toReview(review);
  }

  /**
   * A platform manager hides a review, or shows it again (R12). The hotel being reviewed cannot: one left free to
   * hide what it dislikes would hide every bad review, so it reports one like anybody else and a manager decides.
   */
  async setVisibility(
    user: AuthUser,
    reviewId: string,
    isVisible: boolean,
    meta: RequestMeta = {},
  ): Promise<Review> {
    const review = isUuid(reviewId)
      ? await this.prisma.review.findUnique({
          where: { reviewId },
          select: { hotelId: true },
        })
      : null;
    if (!review) throw notFound();
    await this.prisma.review.update({
      where: { reviewId },
      data: { isVisible },
    });
    await this.audit.log(
      AuditAction.REVIEW_VISIBILITY_CHANGED,
      user.accountId,
      meta,
      { reviewId, hotelId: review.hotelId, isVisible },
    );
    return toReview(
      await this.prisma.review.findUniqueOrThrow({
        where: { reviewId },
        include: reviewInclude,
      }),
    );
  }

  /** The reviews shown on a hotel page: the visible ones only. */
  listForHotel(hotelId: string, query: ReviewListQuery) {
    return this.list({ hotelId, isVisible: true }, query);
  }

  /** The caller's own reviews, hidden ones included: the author always sees what they wrote. */
  listMine(customerId: string, query: ReviewListQuery) {
    return this.list({ customerId }, query);
  }

  private async list(
    scope: Prisma.ReviewWhereInput,
    query: ReviewListQuery,
  ): Promise<Paginated<Review>> {
    const where = {
      ...scope,
      ...(query.minRating !== undefined && {
        overallRating: { gte: new Prisma.Decimal(query.minRating) },
      }),
    } satisfies Prisma.ReviewWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: reviewInclude,
        orderBy: ORDER_BY[query.sort],
        ...pageArgs(query),
      }),
      this.prisma.review.count({ where }),
    ]);
    return Paginated.of(rows.map(toReview), { ...query, total });
  }

  /**
   * The rating figures of a hotel page: the average and count of its visible reviews, how they fall into the five
   * star buckets, and the average of each criterion.
   */
  async summary(hotelId: string): Promise<RatingSummary> {
    const where = {
      hotelId,
      isVisible: true,
    } satisfies Prisma.ReviewWhereInput;
    const [aggregate, overalls, criteria, perCriterion] = await Promise.all([
      this.prisma.review.aggregate({
        where,
        _avg: { overallRating: true },
        _count: true,
      }),
      this.prisma.review.findMany({ where, select: { overallRating: true } }),
      this.prisma.ratingCriterion.findMany({
        orderBy: [{ weight: 'desc' }, { name: 'asc' }],
      }),
      this.prisma.userItemRating.groupBy({
        by: ['ratingCriterionId'],
        where: { hotelId, review: { isVisible: true } },
        _avg: { score: true },
      }),
    ]);

    const distribution = [1, 2, 3, 4, 5].map((star) => ({
      star,
      count: overalls.filter(
        (r) => starBucket(toNumber(r.overallRating)) === star,
      ).length,
    }));
    const byCriterion = new Map(
      perCriterion.map((p) => [
        p.ratingCriterionId,
        p._avg.score ? toNumber(p._avg.score) : 0,
      ]),
    );

    return {
      average: aggregate._avg.overallRating
        ? round1(toNumber(aggregate._avg.overallRating))
        : 0,
      count: aggregate._count,
      distribution,
      criteria: criteria.map((c) => ({
        criterionId: c.ratingCriterionId,
        name: c.name,
        average: round1(byCriterion.get(c.ratingCriterionId) ?? 0),
      })),
    };
  }
}

/**
 * Writes the sub-ratings into the user-item matrix. One row per (customer, hotel, criterion), so a repeat stay
 * overwrites the earlier score and points the row at the newest review.
 */
async function writeSubRatings(
  tx: Prisma.TransactionClient,
  customerId: string,
  hotelId: string,
  reviewId: string,
  subRatings: CreateReviewInput['subRatings'],
) {
  for (const r of subRatings) {
    await tx.userItemRating.upsert({
      where: {
        customerId_hotelId_ratingCriterionId: {
          customerId,
          hotelId,
          ratingCriterionId: r.criterionId,
        },
      },
      create: {
        customerId,
        hotelId,
        ratingCriterionId: r.criterionId,
        reviewId,
        score: new Prisma.Decimal(r.score),
      },
      update: { reviewId, score: new Prisma.Decimal(r.score) },
    });
  }
}

const ORDER_BY: Record<
  ReviewListQuery['sort'],
  Prisma.ReviewOrderByWithRelationInput[]
> = {
  newest: [{ createdAt: 'desc' }, { reviewId: 'asc' }],
  oldest: [{ createdAt: 'asc' }, { reviewId: 'asc' }],
  'rating-desc': [{ overallRating: 'desc' }, { createdAt: 'desc' }],
  'rating-asc': [{ overallRating: 'asc' }, { createdAt: 'desc' }],
};
