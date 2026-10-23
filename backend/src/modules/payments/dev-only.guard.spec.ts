import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { DevOnlyGuard } from './dev-only.guard';

const guardFor = (nodeEnv: Env['NODE_ENV']) =>
  new DevOnlyGuard({
    get: () => nodeEnv,
  } as unknown as ConfigService<Env, true>);

describe('DevOnlyGuard', () => {
  it('lets requests through outside production', () => {
    expect(guardFor('development').canActivate()).toBe(true);
    expect(guardFor('test').canActivate()).toBe(true);
  });

  it('answers 404 in production, as if the route did not exist', () => {
    expect(() => guardFor('production').canActivate()).toThrow(
      NotFoundException,
    );
  });
});
