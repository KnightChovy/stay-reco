import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PeriodicJob } from '../../common/jobs/periodic-job';
import type { Env } from '../../config/env';
import { ScheduleService } from './schedule.service';

const EVERY_MINUTE = 60_000;

/** How many posts one run sends. A cap keeps a backlog from turning into a burst of calls at one platform. */
const PER_RUN = 20;

/**
 * Sends the posts that have come due (M13).
 *
 * The only thing that publishes (decision M14). `PeriodicJob` keeps the runs of one process apart, and
 * `publishOne` claims each row (SCHEDULED -> PUBLISHING) before calling the platform, so several instances, or two
 * environments sharing a database, cannot send the same post twice either.
 *
 * Posts are sent one at a time rather than in parallel. Twenty at once is twenty simultaneous calls to Meta from
 * one app, which is how an app meets its rate limit; the queue here is a minute long, and nothing is waiting.
 */
@Injectable()
export class PublishDueService extends PeriodicJob {
  constructor(
    private readonly schedules: ScheduleService,
    config: ConfigService<Env, true>,
  ) {
    super('PublishDue', EVERY_MINUTE, config);
  }

  /** Tests call `publishDue` themselves instead of waiting for the timer. */
  protected run() {
    return this.publishDue();
  }

  /** Resolves to how many posts went out and how many failed. */
  async publishDue(
    now = new Date(),
  ): Promise<{ published: number; failed: number }> {
    const ids = await this.schedules.due(now, PER_RUN);
    let published = 0;
    let failed = 0;
    for (const id of ids) {
      // A thrown error here would stop the whole run and leave the rest of the queue for the next minute, so each
      // post is kept to itself. `publishOne` already records a platform refusal on the row.
      try {
        const outcome = await this.schedules.publishOne(id);
        // SKIPPED: another run or instance claimed it first, or it was cancelled; not a failure.
        if (outcome === 'PUBLISHED') published++;
        else if (outcome === 'FAILED') failed++;
      } catch (err) {
        failed++;
        this.logger.error(`Publishing ${id} threw: ${String(err)}`);
      }
    }
    if (ids.length) {
      this.logger.log(`Published ${published}, failed ${failed}`);
    }
    return { published, failed };
  }
}
