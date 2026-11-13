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
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
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

  /** Puts approved content on the calendar, aimed at one connected page. */
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
    );
    // SCHEDULED is allowed as well as APPROVED: one approved piece may go to several pages, and the first
    // scheduling is what moved it off APPROVED.
    if (content!.status !== 'APPROVED' && content!.status !== 'SCHEDULED') {
      throw new ConflictException({
        code: ErrorCode.CONTENT_NOT_APPROVED,
        message: 'Only content the owner has approved can be scheduled',
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
      const created = await tx.contentSchedule.create({
        data: {
          marketingContentId: contentId,
          socialAccountId: input.socialAccountId,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          status: 'SCHEDULED',
        },
        include: scheduleInclude,
      });
      await tx.marketingContent.update({
        where: { marketingContentId: contentId },
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
        // Soonest first, which is what a calendar reads. A null time is due now, so it sorts first.
        orderBy: [{ scheduledAt: 'asc' }, { contentScheduleId: 'asc' }],
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
    const updated = await this.prisma.contentSchedule.update({
      where: { contentScheduleId: scheduleId },
      data: { status: 'CANCELLED' },
      include: scheduleInclude,
    });
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
      orderBy: { scheduledAt: 'asc' },
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
  async publishOne(scheduleId: string): Promise<'PUBLISHED' | 'FAILED'> {
    const row = await this.prisma.contentSchedule.findUnique({
      where: { contentScheduleId: scheduleId },
      include: scheduleInclude,
    });
    if (!row || row.status !== 'SCHEDULED') return 'FAILED';

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

  private async fail(row: ScheduleRow, reason: string) {
    await this.prisma.contentSchedule.update({
      where: { contentScheduleId: row.contentScheduleId },
      data: { status: 'FAILED', failureReason: reason },
    });
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
    );
    return row!;
  }
}
