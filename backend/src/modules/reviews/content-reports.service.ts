import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  ContentReport,
  DecideReportInput,
  ReportListQuery,
  ReportReviewInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { lockReview } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';

const reportInclude = {
  review: { select: { hotelId: true, hotel: { select: { name: true } } } },
  reporter: { select: { fullName: true, role: true } },
} satisfies Prisma.ContentReportInclude;

type ReportRow = Prisma.ContentReportGetPayload<{
  include: typeof reportInclude;
}>;

const toReport = (r: ReportRow): ContentReport => ({
  id: r.contentReportId,
  reviewId: r.reviewId,
  reviewImageId: r.reviewImageId,
  imageUrl: r.imageUrl,
  hotelId: r.review.hotelId,
  hotelName: r.review.hotel.name,
  reason: r.reason,
  note: r.note,
  status: r.status,
  reporterName: r.reporter.fullName,
  reporterRole: r.reporter.role,
  resolution: r.resolution,
  resolvedAt: r.resolvedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
});

const reportNotFound = () =>
  new NotFoundException({
    code: ErrorCode.REPORT_NOT_FOUND,
    message: 'Report not found',
  });

/**
 * The flag under every review (R11), and the queue a platform manager works through.
 *
 * Anyone signed in may raise one, including the hotel being reviewed: a hotel can ask for a review to be looked at,
 * but it cannot take the review down itself. That split is the point. A hotel left free to hide whatever it dislikes
 * would hide every bad review, which is why Tripadvisor does not let one, and why `PATCH /reviews/:id/visibility`
 * now answers only to a platform manager.
 */
@Injectable()
export class ContentReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Flags a review, or one of its photos. */
  async raise(
    reporterId: string,
    reviewId: string,
    input: ReportReviewInput,
    meta: RequestMeta = {},
  ): Promise<ContentReport> {
    const review = isUuid(reviewId)
      ? await this.prisma.review.findUnique({
          where: { reviewId },
          select: { reviewId: true },
        })
      : null;
    if (!review) {
      throw new NotFoundException({
        code: ErrorCode.REVIEW_NOT_FOUND,
        message: 'Review not found',
      });
    }
    try {
      // With the review locked, so the photo cannot be removed between this check and the report pointing at it.
      const report = await this.prisma.$transaction(async (tx) => {
        await lockReview(tx, reviewId);
        const image = input.reviewImageId
          ? await tx.reviewImage.findFirst({
              where: { reviewImageId: input.reviewImageId, reviewId },
              select: { imageUrl: true, storageKey: true },
            })
          : null;
        if (input.reviewImageId && !image) {
          throw new NotFoundException({
            code: ErrorCode.REVIEW_IMAGE_NOT_FOUND,
            message: 'Review photo not found',
          });
        }
        return tx.contentReport.create({
          data: {
            reporterId,
            reviewId,
            reviewImageId: input.reviewImageId ?? null,
            // A copy of the photo's place, so the report keeps its evidence if the author removes the photo.
            imageUrl: image?.imageUrl ?? null,
            imageStorageKey: image?.storageKey ?? null,
            reason: input.reason,
            note: input.note ?? null,
          },
          include: reportInclude,
        });
      });
      await this.audit.log(AuditAction.REVIEW_REPORTED, reporterId, meta, {
        reportId: report.contentReportId,
        reviewId,
        reviewImageId: input.reviewImageId ?? null,
        reason: input.reason,
      });
      return toReport(report);
    } catch (err) {
      // The unique key is what stops the same person clicking the flag twice.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException({
          code: ErrorCode.REPORT_ALREADY_RAISED,
          message: 'You have already reported this',
        });
      }
      throw err;
    }
  }

  /** The queue, oldest first so nothing waits for ever; `status` defaults to the ones still needing a decision. */
  async list(query: ReportListQuery): Promise<Paginated<ContentReport>> {
    const where = {
      status: { in: query.status ?? ['OPEN', 'INVESTIGATING'] },
    } satisfies Prisma.ContentReportWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.contentReport.findMany({
        where,
        include: reportInclude,
        orderBy: [{ createdAt: 'asc' }, { contentReportId: 'asc' }],
        ...pageArgs(query),
      }),
      this.prisma.contentReport.count({ where }),
    ]);
    return Paginated.of(rows.map(toReport), { ...query, total });
  }

  /**
   * The manager's decision. `hide` is what actually acts on the content: the flagged photo if the report named one,
   * otherwise the whole review. Dismissing leaves everything as it is.
   */
  async decide(
    user: AuthUser,
    reportId: string,
    input: DecideReportInput,
    meta: RequestMeta = {},
  ): Promise<ContentReport> {
    const report = isUuid(reportId)
      ? await this.prisma.contentReport.findUnique({
          where: { contentReportId: reportId },
        })
      : null;
    if (!report) throw reportNotFound();
    const alreadyDecided = () =>
      new ConflictException({
        code: ErrorCode.REPORT_STATUS_CONFLICT,
        message: 'This report has already been decided',
      });
    if (report.status === 'RESOLVED' || report.status === 'DISMISSED') {
      throw alreadyDecided();
    }

    const decided = await this.prisma.$transaction(async (tx) => {
      // Conditional on a status still open: two managers deciding at once cannot both act; the second is told.
      const { count } = await tx.contentReport.updateMany({
        where: {
          contentReportId: reportId,
          status: { in: ['OPEN', 'INVESTIGATING'] },
        },
        data: {
          status: input.status,
          resolution: input.resolution ?? null,
          platformManagerId: user.accountId,
          ...(input.status !== 'INVESTIGATING' && { resolvedAt: new Date() }),
        },
      });
      if (!count) throw alreadyDecided();
      if (input.hide) {
        // A photo report keeps `imageStorageKey` even once the author removed the photo, which also clears
        // `reviewImageId`: then there is nothing left to hide, and the whole review must not be hidden in its place.
        if (report.imageStorageKey !== null) {
          if (report.reviewImageId) {
            // Hidden, not deleted: the photo stays as the evidence the decision was made on.
            await tx.reviewImage.update({
              where: { reviewImageId: report.reviewImageId },
              data: { isVisible: false },
            });
          }
        } else {
          await tx.review.update({
            where: { reviewId: report.reviewId },
            data: { isVisible: false },
          });
        }
      }
      return tx.contentReport.findUniqueOrThrow({
        where: { contentReportId: reportId },
        include: reportInclude,
      });
    });

    await this.audit.log(
      AuditAction.REVIEW_REPORT_DECIDED,
      user.accountId,
      meta,
      {
        reportId,
        reviewId: report.reviewId,
        status: input.status,
        hid: input.hide ?? false,
      },
    );
    return toReport(decided);
  }
}
