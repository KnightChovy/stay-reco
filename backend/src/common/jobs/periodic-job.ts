import {
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';

/**
 * A job that runs `run()` at startup and then every `everyMs` while the app is up. Not started in tests: they call the
 * job's method themselves. A run still going when the next one is due is not overlapped; the next one is skipped.
 */
export abstract class PeriodicJob
  implements OnApplicationBootstrap, OnModuleDestroy
{
  protected readonly logger: Logger;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    name: string,
    private readonly everyMs: number,
    private readonly jobConfig: ConfigService<Env, true>,
  ) {
    this.logger = new Logger(name);
  }

  protected abstract run(): Promise<unknown>;

  onApplicationBootstrap() {
    if (this.jobConfig.get('NODE_ENV', { infer: true }) === 'test') return;
    // Once at startup too: after a restart (or an idle instance waking up) nothing waits a full interval.
    void this.tick();
    this.timer = setInterval(() => void this.tick(), this.everyMs);
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.run();
    } catch (err) {
      this.logger.error(`Run failed: ${String(err)}`);
    } finally {
      this.running = false;
    }
  }
}
