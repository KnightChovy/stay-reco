import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { ModelRefreshService } from './model-refresh.service';

type Fake = EventEmitter & {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: jest.Mock;
};

const config = (values: Partial<Env>) =>
  ({ get: (key: keyof Env) => values[key] }) as unknown as ConfigService<
    Env,
    true
  >;

function harness(
  values: Partial<Env> = {
    RECOMMENDER_PYTHON: 'python',
    RECOMMENDER_SCRIPT: '/r/train.py',
  },
) {
  const service = new ModelRefreshService(config(values));
  const started: { args: string[]; env: NodeJS.ProcessEnv; child: Fake }[] = [];
  service.useSpawner((_command, args, options) => {
    const child = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
      kill: jest.fn(),
    });
    started.push({ args, env: options.env, child });
    return child as unknown as ChildProcess;
  });
  return { service, started };
}

describe('ModelRefreshService', () => {
  it('runs train.py --customer for the customer, with UTF-8 output', () => {
    const { service, started } = harness();
    service.refresh('c1');
    expect(started).toHaveLength(1);
    expect(started[0].args).toEqual(['/r/train.py', '--customer', 'c1']);
    expect(started[0].env.PYTHONIOENCODING).toBe('utf-8');
  });

  it('does nothing when no Python is configured', () => {
    const { service, started } = harness({});
    service.refresh('c1');
    expect(service.enabled).toBe(false);
    expect(started).toHaveLength(0);
  });

  it('runs one process per customer, and exactly one more for changes made meanwhile', () => {
    const { service, started } = harness();
    service.refresh('c1');
    service.refresh('c1');
    service.refresh('c1');
    expect(started).toHaveLength(1);

    started[0].child.emit('close', 0);
    expect(started).toHaveLength(2);
    started[1].child.emit('close', 0);
    expect(started).toHaveLength(2);
  });

  it('runs two at once and queues the rest', () => {
    const { service, started } = harness();
    for (const id of ['c1', 'c2', 'c3']) service.refresh(id);
    expect(started.map((s) => s.args[2])).toEqual(['c1', 'c2']);

    started[0].child.emit('close', 1);
    expect(started.map((s) => s.args[2])).toEqual(['c1', 'c2', 'c3']);
  });

  it('moves on when the process cannot start', () => {
    const { service, started } = harness();
    service.refresh('c1');
    started[0].child.emit('error', new Error('ENOENT'));
    service.refresh('c1');
    expect(started).toHaveLength(2);
  });
});
