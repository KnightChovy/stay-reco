import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env';
import { InstagramPublisher } from './instagram.publisher';
import type { PublishTarget } from './social-publisher';

/** What the publisher does with what Meta answers, without a network: `fetch` is replaced for each test. */
describe('InstagramPublisher', () => {
  const target: PublishTarget = {
    platform: 'INSTAGRAM',
    accountName: '17841400000000000',
    accessToken: 'PAGE_TOKEN',
  };
  const post = {
    title: null,
    body: 'Phòng hướng biển cho cuối tuần',
    mediaUrl: 'https://res.cloudinary.com/demo/image/upload/room.jpg',
  };

  let calls: { method: string; path: string; params: URLSearchParams }[] = [];
  const realFetch = globalThis.fetch;

  /** Answers each Graph request with the first route whose test matches; GET params are read off the URL, POST off the body. */
  const stub = (
    routes: {
      when: (path: string, params: URLSearchParams) => boolean;
      body: unknown;
      ok?: boolean;
    }[],
  ) => {
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = new URL(
        typeof input === 'string' || input instanceof URL ? input : input.url,
      );
      const method = init?.method ?? 'GET';
      const params =
        method === 'POST'
          ? new URLSearchParams(init?.body as URLSearchParams)
          : url.searchParams;
      const path = url.pathname.replace(/^\/v[\d.]+\//, '');
      calls.push({ method, path, params });
      const route = routes.find((r) => r.when(path, params));
      return Promise.resolve(
        new Response(JSON.stringify(route?.body ?? {}), {
          status: (route?.ok ?? true) ? 200 : 400,
          headers: { 'content-type': 'application/json' },
        }),
      );
    };
  };

  /** A publisher that does not really wait between status checks, and counts how often it would have. */
  class Impatient extends InstagramPublisher {
    pauses = 0;
    protected override pause() {
      this.pauses++;
      return Promise.resolve();
    }
  }
  const publisher = () =>
    new Impatient({ get: () => 'v26.0' } as unknown as ConfigService<
      Env,
      true
    >);

  const container = {
    when: (path: string) => path.endsWith('/media'),
    body: { id: 'CONTAINER' },
  };
  const published = {
    when: (path: string) => path.endsWith('/media_publish'),
    body: { id: 'IG_MEDIA' },
  };
  /** The container's status, answered in turn: one entry per check. */
  const statuses = (...answers: string[]) => {
    let i = 0;
    return {
      when: (path: string, params: URLSearchParams) =>
        path === 'CONTAINER' && params.get('fields') === 'status_code',
      get body() {
        return { status_code: answers[Math.min(i++, answers.length - 1)] };
      },
    };
  };

  beforeEach(() => {
    calls = [];
  });
  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it('publishes only once the container is FINISHED', async () => {
    stub([
      container,
      statuses('IN_PROGRESS', 'IN_PROGRESS', 'FINISHED'),
      published,
    ]);
    const p = publisher();

    await expect(p.publish(target, post)).resolves.toBe('IG_MEDIA');
    expect(p.pauses).toBe(2);
    const order = calls.map((c) => c.path);
    expect(
      order.indexOf(`${target.accountName}/media_publish`),
    ).toBeGreaterThan(order.lastIndexOf('CONTAINER'));
  });

  it('fails at once, with the reason, when the container comes back ERROR', async () => {
    stub([container, statuses('ERROR'), published]);
    const p = publisher();

    await expect(p.publish(target, post)).rejects.toThrow(/ERROR/);
    expect(calls.some((c) => c.path.endsWith('/media_publish'))).toBe(false);
    expect(p.pauses).toBe(0);
  });

  it('gives up rather than publishing a container that never finishes', async () => {
    stub([container, statuses('IN_PROGRESS'), published]);

    await expect(publisher().publish(target, post)).rejects.toThrow(
      /still being prepared/,
    );
    expect(calls.some((c) => c.path.endsWith('/media_publish'))).toBe(false);
  });

  it('reads views with the metric Instagram still answers, not the retired one', async () => {
    stub([
      {
        when: (path, params) =>
          path.endsWith('/insights') && params.get('metric') === 'views',
        body: { data: [{ name: 'views', values: [{ value: 321 }] }] },
      },
      {
        when: (path) => path.endsWith('/insights'),
        ok: false,
        body: {
          error: {
            message: '(#100) The value must be a valid insights metric',
            code: 100,
          },
        },
      },
      {
        when: (path) => path === 'IG_MEDIA',
        body: { like_count: 12, comments_count: 3 },
      },
    ]);

    await expect(publisher().metrics(target, 'IG_MEDIA')).resolves.toEqual({
      views: 321,
      likes: 12,
      comments: 3,
      shares: 0,
    });
  });
});
