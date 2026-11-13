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
 * The only thing that publishes, which is what keeps a post from going out twice: `PeriodicJob` does not overlap
 * runs, and there is no endpoint that publishes, so at any moment exactly one piece of code is looking at a
 * SCHEDULED row (decision M14).
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
        if ((await this.schedules.publishOne(id)) === 'PUBLISHED') published++;
        else failed++;
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
