import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import type { Env } from '../../config/env';

/** How long one customer's scoring may take before it is stopped: the nightly run will include them anyway. */
const TIMEOUT_MS = 120_000;
/** Scorings at once. Each one fits the model in its own Python process, so a burst of sign-ups waits its turn. */
const MAX_PARALLEL = 2;

export type Spawner = (
  command: string,
  args: string[],
  options: { cwd: string; env: NodeJS.ProcessEnv },
) => ChildProcess;

/**
 * Gets the trained model's own list for one customer within seconds of their giving preferences (onboarding, or
 * `PUT /me/preferences`), instead of after the next nightly run: runs `recommender/train.py --customer <id>`, which
 * fits the same formula on the same data and writes that customer's list into the run already served. Until it is
 * written, `RecommendationsService` ranks a customer the run does not know from their preferences (`PreferenceRanking`).
 *
 * Fire and forget: the request that triggered it has already answered. Off when `RECOMMENDER_PYTHON` is empty (tests,
 * a deployment without Python beside the API); a failure is logged and changes nothing the customer sees. One process
 * per customer at a time: a second request while one runs schedules exactly one more run after it, with the newest
 * preferences.
 */
@Injectable()
export class ModelRefreshService {
  private readonly logger = new Logger(ModelRefreshService.name);
  private readonly python?: string;
  private readonly script: string;
  private readonly running = new Set<string>();
  private readonly again = new Set<string>();
  private readonly queue: string[] = [];
  private spawner: Spawner = (command, args, options) =>
    spawn(command, args, { ...options, windowsHide: true });

  constructor(config: ConfigService<Env, true>) {
    this.python =
      config.get('RECOMMENDER_PYTHON', { infer: true }) || undefined;
    this.script =
      config.get('RECOMMENDER_SCRIPT', { infer: true }) ||
      resolve(process.cwd(), '..', 'recommender', 'train.py');
  }

  get enabled(): boolean {
    return !!this.python;
  }

  /** For tests: what starts the process. */
  useSpawner(spawner: Spawner) {
    this.spawner = spawner;
  }

  /** Asks for this customer's list to be scored now. Returns at once. */
  refresh(customerId: string): void {
    if (!this.python) return;
    if (this.running.has(customerId)) {
      this.again.add(customerId);
      return;
    }
    if (this.queue.includes(customerId)) return;
    this.queue.push(customerId);
    this.next();
  }

  private next() {
    while (this.running.size < MAX_PARALLEL && this.queue.length) {
      this.start(this.queue.shift()!);
    }
  }

  private start(customerId: string) {
    this.running.add(customerId);
    const started = Date.now();
    let output = '';
    let child: ChildProcess;
    try {
      child = this.spawner(
        this.python!,
        [this.script, '--customer', customerId],
        {
          cwd: resolve(this.script, '..'),
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        },
      );
    } catch (err) {
      this.logger.warn(`Could not start the recommender: ${String(err)}`);
      this.finish(customerId);
      return;
    }
    const keep = (chunk: Buffer) => {
      output = (output + chunk.toString()).slice(-2000);
    };
    child.stdout?.on('data', keep);
    child.stderr?.on('data', keep);
    const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
    let done = false;
    const end = (message: string | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (message) this.logger.warn(message);
      else
        this.logger.log(
          `Scored customer ${customerId} in ${Date.now() - started} ms`,
        );
      this.finish(customerId);
    };
    child.on('error', (err) =>
      end(`Recommender for ${customerId} did not start: ${err.message}`),
    );
    child.on('close', (code) =>
      end(
        code === 0
          ? null
          : `Recommender for ${customerId} exited with ${code}: ${output.trim()}`,
      ),
    );
  }

  private finish(customerId: string) {
    this.running.delete(customerId);
    if (this.again.delete(customerId)) this.queue.push(customerId);
    this.next();
  }
}
