import { NotFoundException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { DevOnlyGuard } from './dev-only.guard';

const guardFor = (env: Pick<Env, 'NODE_ENV' | 'PAYMENT_SIMULATOR'>) =>
  new DevOnlyGuard({
    get: (key: keyof typeof env) => env[key],
  } as unknown as ConfigService<Env, true>);

describe('DevOnlyGuard', () => {
  it('lets requests through when the simulator is turned on outside production', () => {
    for (const NODE_ENV of ['development', 'test'] as const) {
      expect(
        guardFor({ NODE_ENV, PAYMENT_SIMULATOR: true }).canActivate(),
      ).toBe(true);
    }
  });

  it('answers 404 when the flag is not set, whatever NODE_ENV is', () => {
    expect(() =>
      guardFor({
        NODE_ENV: 'development',
        PAYMENT_SIMULATOR: false,
      }).canActivate(),
    ).toThrow(NotFoundException);
  });

  it('answers 404 in production even with the flag on', () => {
    expect(() =>
      guardFor({
        NODE_ENV: 'production',
        PAYMENT_SIMULATOR: true,
      }).canActivate(),
    ).toThrow(NotFoundException);
  });
});
