import { ServiceUnavailableException } from '@nestjs/common';
import { AppController, HEALTH_DB_TIMEOUT_MS } from './app.controller';
import type { PrismaService } from './prisma/prisma.service';

function createController(query: () => Promise<unknown>) {
  const prisma = { $queryRaw: jest.fn(query) };
  return new AppController(prisma as unknown as PrismaService);
}

const expectUnavailable = (err: unknown) => {
  expect(err).toBeInstanceOf(ServiceUnavailableException);
  expect((err as ServiceUnavailableException).getResponse()).toMatchObject({
    code: 'SERVICE_UNAVAILABLE',
  });
};

describe('AppController.health', () => {
  afterEach(() => jest.useRealTimers());

  it('returns ok when the database answers', async () => {
    const controller = createController(() => Promise.resolve([{ 1: 1 }]));
    await expect(controller.health()).resolves.toEqual({ status: 'ok' });
  });

  it('returns 503 when the database query fails', async () => {
    const controller = createController(() =>
      Promise.reject(new Error('connect ECONNREFUSED')),
    );
    await controller.health().then(
      () => {
        throw new Error('expected a 503');
      },
      (err: unknown) => expectUnavailable(err),
    );
  });

  it('returns 503 when the database does not answer in time', async () => {
    jest.useFakeTimers();
    const controller = createController(() => new Promise(() => {}));
    const result = controller.health().catch((err: unknown) => err);
    await jest.advanceTimersByTimeAsync(HEALTH_DB_TIMEOUT_MS);
    expectUnavailable(await result);
  });
});
