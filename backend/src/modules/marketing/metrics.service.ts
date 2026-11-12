import { ConflictException, Injectable } from '@nestjs/common';
import type { ContentMetric } from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import type { ContentMetric as MetricRow } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SocialAccountsService } from './social-accounts.service';
import { PublisherRegistry } from './publishers/publisher.registry';
import { ScheduleService } from './schedule.service';

const toMetric = (row: MetricRow): ContentMetric => ({
  id: row.contentMetricId,
  scheduleId: row.contentScheduleId,
  platform: row.platform,
  views: row.views,
  likes: row.likes,
  shares: row.shares,
  comments: row.comments,
  recordedAt: row.recordedAt.toISOString(),
});

/**
 * How a published post did (M15).
 *
 * Every refresh appends a row rather than overwriting one, so the history is kept: a post that gained most of its
 * reach on day three is a different thing from one that got it all in the first hour, and an owner deciding when to
 * post needs to be able to see which happened. `latest` is what a screen shows; the rows behind it are what a
 * report would read.
 *
 * Refreshing is a request, not a job. A platform's insight numbers move for days after a post, so a job would have
 * to decide how long to keep asking about every post a hotel has ever made; asking when someone opens the screen
 * costs one call and answers the question actually being asked.
 */
@Injectable()
export class MetricsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly schedules: ScheduleService,
    private readonly accounts: SocialAccountsService,
    private readonly publishers: PublisherRegistry,
  ) {}

  /** Every reading taken for this post, newest first. */
  async history(user: AuthUser, scheduleId: string): Promise<ContentMetric[]> {
    await this.schedules.owned(user, scheduleId, 'member');
    const rows = await this.prisma.contentMetric.findMany({
      where: { contentScheduleId: scheduleId },
      orderBy: { recordedAt: 'desc' },
    });
    return rows.map(toMetric);
  }

  /** Asks the platform how the post is doing now, and keeps the answer. */
  async refresh(user: AuthUser, scheduleId: string): Promise<ContentMetric> {
    const row = await this.schedules.owned(user, scheduleId, 'member');
    if (row.status !== 'PUBLISHED' || !row.externalPostId) {
      throw new ConflictException({
        code: ErrorCode.SCHEDULE_STATUS_CONFLICT,
        message: 'Only a post that went out has figures to read',
      });
    }
    const target = await this.accounts.targetFor(row.socialAccountId);
    if (!target) {
      throw new ConflictException({
        code: ErrorCode.SCHEDULE_STATUS_CONFLICT,
        message: 'The page has no usable token: reconnect it to read figures',
      });
    }

    const metrics = await this.publishers
      .for(target.platform)
      .metrics(target, row.externalPostId);

    const created = await this.prisma.contentMetric.create({
      data: {
        contentScheduleId: scheduleId,
        platform: target.platform,
        ...metrics,
      },
    });
    return toMetric(created);
  }
}
