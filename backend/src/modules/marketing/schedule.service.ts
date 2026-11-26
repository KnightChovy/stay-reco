import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ContentSchedule,
  ScheduleContentInput,
  ScheduleListQuery,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { lockMarketingContent } from '../../common/db/locks';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import {
  type ContentStatus,
  Prisma,
  StaffPermission,
} from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import { settleContent } from './content-status';
import { GRAPH_TIMEOUT_MS } from './publishers/graph-api';
import { PublisherRegistry } from './publishers/publisher.registry';
import { SocialAccountsService } from './social-accounts.service';

const notFound = () =>
  new NotFoundException({
    code: ErrorCode.SCHEDULE_NOT_FOUND,
    message: 'Scheduled post not found',
  });

const wrongStatus = (message: string) =>
  new ConflictException({
    code: ErrorCode.SCHEDULE_STATUS_CONFLICT,
    message,
  });

/**
 * Every status: staff with MARKETING post what they wrote, with no approval step in between (the owner chose to
 * leave marketing to them). `PENDING_APPROVAL`, `APPROVED` and `REJECTED` only remain on pieces from before.
 */
const SCHEDULABLE: readonly ContentStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'SCHEDULED',
  'PUBLISHED',
];
/** Moved to `SCHEDULED` by their first post; a piece already `PUBLISHED` stays so. */
const NOT_YET_ON_A_PAGE: ContentStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
];

const scheduleInclude = {
  marketingContent: true,
  socialAccount: { select: { platform: true, accountName: true } },
} satisfies Prisma.ContentScheduleInclude;

type ScheduleRow = Prisma.ContentScheduleGetPayload<{
  include: typeof scheduleInclude;
}>;

const toSchedule = (row: ScheduleRow): ContentSchedule => ({
  id: row.contentScheduleId,
  contentId: row.marketingContentId,
  socialAccountId: row.socialAccountId,
  platform: row.socialAccount.platform,
  accountName: row.socialAccount.accountName,
  title: row.marketingContent.title,
  body: row.marketingContent.body,
  status: row.status,
  scheduledAt: row.scheduledAt?.toISOString() ?? null,
  publishedAt: row.publishedAt?.toISOString() ?? null,
  externalPostId: row.externalPostId,
  failureReason: row.failureReason,
});

/**
 * How long a claimed post may stay PUBLISHING before the job gives up on it. Derived from the Meta timeout so the two
 * cannot drift apart: an Instagram post makes two calls, and forty timeouts (10 minutes today) leave a wide margin.
 */
const STUCK_AFTER_MS = 40 * GRAPH_TIMEOUT_MS;

/** The reason given to a post whose run never finished: it may or may not be on the page. */
const INTERRUPTED =
  'Publishing was interrupted before the result was saved. Check the page before scheduling it again.';

/** As much of a platform's complaint as the column holds. */
const reasonOf = (err: unknown): string => {
  const message =
    err instanceof Error
      ? ((err as { response?: { message?: string } }).response?.message ??
        err.message)
      : String(err);
  return message.slice(0, 1000);
};

/**
 * The posting calendar, and the one path a post goes out by (M9, M13).
 *
 * Only approved content can be scheduled (M10): a draft the owner has not seen must not reach the hotel's own page,
 * and the text is frozen on approval so what is posted is what was approved.
 *
 * There is no "publish now" endpoint, deliberately (decision M14). Scheduling with no time means the next run of
 * the job, which is within a minute, so "post now" is the same button with a null `scheduledAt`. Keeping the job as
 * the only writer is what makes a double post impossible without a lease column or a PUBLISHING state: a request
 * and a job firing in the same second would otherwise both see a SCHEDULED row and both post it, and a hotel's
 * followers would see the post twice.
 */
@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
    private readonly accounts: SocialAccountsService,
    private readonly publishers: PublisherRegistry,
  ) {}

  /** Puts a piece on the calendar, aimed at one connected page. */
  async schedule(
    user: AuthUser,
    contentId: string,
    input: ScheduleContentInput,
    meta: RequestMeta = {},
  ): Promise<ContentSchedule> {
    const content = isUuid(contentId)
      ? await this.prisma.marketingContent.findUnique({
          where: { marketingContentId: contentId },
        })
      : null;
    await this.access.assertResource(
      user,
      content?.hotelId,
      'member',
      () =>
        new NotFoundException({
          code: ErrorCode.CONTENT_NOT_FOUND,
          message: 'Content not found',
        }),
      // Posting on the hotel's page is a marketing action, not something any staff member may do by id.
      StaffPermission.MARKETING,
    );
    // One piece may go to several pages (M9), also after it went out on the first.
    if (!SCHEDULABLE.includes(content!.status)) {
      throw new ConflictException({
        code: ErrorCode.CONTENT_NOT_APPROVED,
        message: 'This piece cannot be scheduled',
      });
    }

    const account = await this.prisma.socialAccount.findUnique({
      where: { socialAccountId: input.socialAccountId },
      select: { hotelId: true },
    });
    // A page of another hotel is "not found" rather than "forbidden": the caller should learn nothing about it.
    if (!account || account.hotelId !== content!.hotelId) {
      throw new NotFoundException({
        code: ErrorCode.SOCIAL_ACCOUNT_NOT_FOUND,
        message: 'Social account not found',
      });
    }

    const row = await this.prisma.$transaction(async (tx) => {
      // Locked so two requests for the same page at once cannot both pass the check below.
      await lockMarketingContent(tx, contentId);
      // The same piece twice on one page is a duplicate post the hotel's followers would see. A post that was
      // cancelled or failed there does not count: sending it again is the way to retry.
      const onPage = await tx.contentSchedule.count({
        where: {
          marketingContentId: contentId,
          socialAccountId: input.socialAccountId,
          status: { in: ['SCHEDULED', 'PUBLISHING', 'PUBLISHED'] },
        },
      });
      if (onPage) {
        throw wrongStatus(
          'This piece is already waiting for that page or has gone out on it',
        );
      }
      const created = await tx.contentSchedule.create({
        data: {
          marketingContentId: contentId,
          socialAccountId: input.socialAccountId,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          status: 'SCHEDULED',
        },
        include: scheduleInclude,
      });
      // A piece already PUBLISHED stays so: it has gone out, and that is what its status records.
      await tx.marketingContent.updateMany({
        where: {
          marketingContentId: contentId,
          status: { in: NOT_YET_ON_A_PAGE },
        },
        data: { status: 'SCHEDULED' },
      });
      return created;
    });

    await this.audit.log(AuditAction.CONTENT_SCHEDULED, user.accountId, meta, {
      scheduleId: row.contentScheduleId,
      contentId,
      socialAccountId: input.socialAccountId,
      scheduledAt: row.scheduledAt?.toISOString() ?? 'next run',
    });
    return toSchedule(row);
  }

  async list(
    hotelId: string,
    query: ScheduleListQuery,
  ): Promise<Paginated<ContentSchedule>> {
    const where = {
      marketingContent: { hotelId },
      ...(query.contentId && { marketingContentId: query.contentId }),
      ...(query.status && { status: { in: query.status } }),
      ...(query.platform && {
        socialAccount: { platform: { in: query.platform } },
      }),
      ...((query.from || query.until) && {
        scheduledAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.until && { lte: new Date(query.until) }),
        },
      }),
    } satisfies Prisma.ContentScheduleWhereInput;

    const [rows, total] = await Promise.all([
      this.prisma.contentSchedule.findMany({
        where,
        include: scheduleInclude,
        orderBy:
          query.sort === 'published-desc'
            ? [
                { publishedAt: { sort: 'desc', nulls: 'last' } },
                { contentScheduleId: 'asc' },
              ]
            : // Soonest first, which is what a calendar reads. A null time is due now, so it sorts first; Postgres
              // would put NULL last on ASC without saying so.
              [
                { scheduledAt: { sort: 'asc', nulls: 'first' } },
                { contentScheduleId: 'asc' },
              ],
        ...pageArgs(query),
      }),
      this.prisma.contentSchedule.count({ where }),
    ]);
    return Paginated.of(rows.map(toSchedule), { ...query, total });
  }

  async findOne(user: AuthUser, scheduleId: string): Promise<ContentSchedule> {
    return toSchedule(await this.owned(user, scheduleId, 'member'));
  }

  /** Takes a post off the calendar. Only before it has gone out: what was published stays on the record. */
  async cancel(
    user: AuthUser,
    scheduleId: string,
    meta: RequestMeta = {},
  ): Promise<ContentSchedule> {
    const row = await this.owned(user, scheduleId, 'member');
    if (row.status !== 'SCHEDULED') {
      throw wrongStatus('Only a post still waiting to go out can be cancelled');
    }
    // Conditional on SCHEDULED: the publisher may have claimed the row since it was read.
    const { count } = await this.prisma.contentSchedule.updateMany({
      where: { contentScheduleId: scheduleId, status: 'SCHEDULED' },
      data: { status: 'CANCELLED' },
    });
    if (count === 0) {
      throw wrongStatus('The post is already being published');
    }
    await this.settleContent(row.marketingContentId);
    const updated = await this.owned(user, scheduleId, 'member');
    await this.audit.log(AuditAction.SCHEDULE_CANCELLED, user.accountId, meta, {
      scheduleId,
    });
    return toSchedule(updated);
  }

  /** The posts the job should send now: SCHEDULED, and either due or with no time at all. */
  async due(now = new Date(), take = 20): Promise<string[]> {
    const rows = await this.prisma.contentSchedule.findMany({
      where: {
        status: 'SCHEDULED',
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
      },
      // "Post now" rows (no time) first, then the most overdue.
      orderBy: [
        { scheduledAt: { sort: 'asc', nulls: 'first' } },
        { contentScheduleId: 'asc' },
      ],
      take,
      select: { contentScheduleId: true },
    });
    return rows.map((r) => r.contentScheduleId);
  }

  /**
   * Sends one post to its platform and writes down what happened. Called by the job, and by nothing else.
   *
   * A failure is recorded on the row rather than thrown, because the caller is a timer with nobody to tell. The
   * status becomes FAILED and `failureReason` carries the platform's own words, so the calendar can say "Session
   * has expired" instead of leaving an owner to guess. A failed post is not retried: a token that expired at 09:00
   * is still expired at 09:01, and a retry loop against Meta is how an app gets rate limited.
   */
  async publishOne(
    scheduleId: string,
  ): Promise<'PUBLISHED' | 'FAILED' | 'SKIPPED'> {
    // Claimed before the platform is called. `PeriodicJob` only keeps runs of one process apart; two instances (or
    // two environments on one database) would otherwise both see SCHEDULED and post twice. Whoever flips the row
    // owns it; anyone else, and a cancel arriving mid-call, finds it no longer SCHEDULED.
    const { count } = await this.prisma.contentSchedule.updateMany({
      where: { contentScheduleId: scheduleId, status: 'SCHEDULED' },
      data: { status: 'PUBLISHING', claimedAt: new Date() },
    });
    if (count === 0) return 'SKIPPED';
    const row = await this.prisma.contentSchedule.findUniqueOrThrow({
      where: { contentScheduleId: scheduleId },
      include: scheduleInclude,
    });

    const target = await this.accounts.targetFor(row.socialAccountId);
    if (!target) {
      await this.fail(row, 'The page has no usable token: reconnect it');
      return 'FAILED';
    }

    let externalPostId: string;
    try {
      externalPostId = await this.publishers
        .for(target.platform)
        .publish(target, {
          title: row.marketingContent.title,
          body: row.marketingContent.body,
          mediaUrl: row.marketingContent.mediaUrl,
        });
    } catch (err) {
      await this.fail(row, reasonOf(err));
      return 'FAILED';
    }

    // Written unconditionally: the post is on the platform now, and the row has to say so even if a cancel landed
    // while the call was in flight. A row claiming CANCELLED with a live post on the page is the worse record.
    await this.prisma.$transaction([
      this.prisma.contentSchedule.update({
        where: { contentScheduleId: scheduleId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
          externalPostId,
          failureReason: null,
        },
      }),
      this.prisma.marketingContent.update({
        where: { marketingContentId: row.marketingContentId },
        data: { status: 'PUBLISHED' },
      }),
    ]);
    await this.audit.log(
      AuditAction.CONTENT_PUBLISHED,
      null,
      {},
      {
        scheduleId,
        platform: target.platform,
        externalPostId,
      },
    );
    this.logger.log(`Published ${scheduleId} to ${target.platform}`);
    return 'PUBLISHED';
  }

  /**
   * Gives up on posts a run claimed and never finished: the process restarted while the platform was being called,
   * or the database failed after it answered. Nothing else ever moves such a row, and a cancel only takes SCHEDULED,
   * so it would show as going out for ever. It becomes FAILED with a reason that says the post may already be on the
   * page, because there is no way to know whether the platform received it.
   *
   * Only rows claimed more than `STUCK_AFTER_MS` ago: a call to the platform times out long before, so a row that
   * old is not being sent by any run. A slow call that does finish still writes PUBLISHED over this, and that record
   * wins. Rows claimed before `claimed_at` existed have none and are given up on too.
   */
  async failInterrupted(now = new Date()): Promise<number> {
    const rows = await this.prisma.contentSchedule.findMany({
      where: {
        status: 'PUBLISHING',
        OR: [
          { claimedAt: null },
          { claimedAt: { lte: new Date(now.getTime() - STUCK_AFTER_MS) } },
        ],
      },
      include: scheduleInclude,
    });
    for (const row of rows) {
      await this.fail(row, INTERRUPTED);
    }
    return rows.length;
  }

  private async fail(row: ScheduleRow, reason: string) {
    // Conditional on PUBLISHING: a post that went out meanwhile keeps its PUBLISHED record.
    const { count } = await this.prisma.contentSchedule.updateMany({
      where: { contentScheduleId: row.contentScheduleId, status: 'PUBLISHING' },
      data: { status: 'FAILED', failureReason: reason },
    });
    if (!count) return;
    await this.settleContent(row.marketingContentId);
    await this.audit.log(
      AuditAction.CONTENT_PUBLISH_FAILED,
      null,
      {},
      {
        scheduleId: row.contentScheduleId,
        platform: row.socialAccount.platform,
        reason,
      },
    );
    this.logger.warn(`Publishing ${row.contentScheduleId} failed: ${reason}`);
  }

  /** See `settleContent` in `content-status.ts`. */
  private settleContent(contentId: string) {
    return settleContent(this.prisma, contentId);
  }

  /** The schedule row, checked to belong to a hotel the caller may act on. */
  async owned(
    user: AuthUser,
    scheduleId: string,
    level: 'member' | 'owner',
  ): Promise<ScheduleRow> {
    const row = isUuid(scheduleId)
      ? await this.prisma.contentSchedule.findUnique({
          where: { contentScheduleId: scheduleId },
          include: scheduleInclude,
        })
      : null;
    await this.access.assertResource(
      user,
      row?.marketingContent.hotelId,
      level,
      notFound,
      // Reading, cancelling and refreshing a post need MARKETING, like the calendar addressed by hotel.
      level === 'member' ? StaffPermission.MARKETING : undefined,
    );
    return row!;
  }
}
