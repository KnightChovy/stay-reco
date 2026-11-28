import { ConfigService } from '@nestjs/config';
import type { Env } from '../../../config/env';
import { FacebookPublisher } from './facebook.publisher';
import type { PublishTarget } from './social-publisher';

/**
 * What the publisher does with what Meta answers.
 *
 * These cases are not invented: each refusal below was returned by the live Graph API on 2026-11-13 for a Page
 * connected through a Development-mode app, which is how the lost-figures bug and the retired metric name were
 * found at all.
 */
describe('FacebookPublisher metrics', () => {
  const target: PublishTarget = {
    platform: 'FACEBOOK',
    accountName: '1407999722396407',
    accessToken: 'PAGE_TOKEN',
  };
  const POST = '1407999722396407_122098983927549309';

  /** Meta's own wording when a field is behind a permission the token does not hold. */
  const refusal = (permission: string) => ({
    error: {
      message: `(#10) This endpoint requires the '${permission}' permission or the 'Page Public Content Access' feature.`,
      type: 'OAuthException',
      code: 10,
    },
  });

  let calls: { path: string; params: URLSearchParams }[] = [];
  const realFetch = globalThis.fetch;

  /** Answers each Graph request from `routes`: the first entry whose test matches wins. */
  const stub = (
    routes: {
      when: (path: string, params: URLSearchParams) => boolean;
      body: unknown;
      ok?: boolean;
    }[],
  ) => {
    globalThis.fetch = (input: RequestInfo | URL) => {
      const url = new URL(
        typeof input === 'string' || input instanceof URL ? input : input.url,
      );
      const path = url.pathname.replace(/^\/v[\d.]+\//, '');
      calls.push({ path, params: url.searchParams });
      const route = routes.find((r) => r.when(path, url.searchParams));
      const ok = route?.ok ?? true;
      return Promise.resolve(
        new Response(JSON.stringify(route?.body ?? {}), {
          status: ok ? 200 : 400,
          headers: { 'content-type': 'application/json' },
        }),
      );
    };
  };

  const publisher = () =>
    new FacebookPublisher({
      get: () => 'v26.0',
    } as unknown as ConfigService<Env, true>);

  beforeEach(() => {
    calls = [];
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('keeps the post id of a photo post, not the photo id', async () => {
    stub([
      {
        when: (p) => p.endsWith('/photos'),
        body: {
          id: '122105811453557013',
          post_id: '61596710414421_122105811531557013',
        },
      },
    ]);
    const id = await publisher().publish(target, {
      title: 'Phố cổ',
      body: 'Một sớm thong dong',
      mediaUrl: 'https://res.cloudinary.com/demo/image/upload/hotel.jpg',
    });
    // A photo has no shares; the figures live on the post.
    expect(id).toBe('61596710414421_122105811531557013');
  });

  it('keeps the id a text post answers', async () => {
    stub([
      { when: (p) => p.endsWith('/feed'), body: { id: '61596710414421_1' } },
    ]);
    expect(
      await publisher().publish(target, {
        title: null,
        body: 'Chào',
        mediaUrl: null,
      }),
    ).toBe('61596710414421_1');
  });

  it('reads all four figures in two calls when nothing is refused', async () => {
    stub([
      {
        when: (p) => p.endsWith('/insights'),
        body: { data: [{ values: [{ value: 412 }] }] },
      },
      {
        when: (p) => p === POST,
        body: {
          reactions: { summary: { total_count: 9 } },
          comments: { summary: { total_count: 2 } },
          shares: { count: 3 },
        },
      },
    ]);

    expect(await publisher().metrics(target, POST)).toEqual({
      views: 412,
      likes: 9,
      comments: 2,
      shares: 3,
    });
    // One read of the post and one of the insights edge: the per-field fallback must not run for nothing.
    expect(calls).toHaveLength(2);
  });

  it('asks for the comment total only, which needs no permission to read comments', async () => {
    stub([
      { when: (p) => p.endsWith('/insights'), body: { data: [] } },
      {
        when: (p) => p === POST,
        body: { comments: { summary: { total_count: 1 } } },
      },
    ]);
    await publisher().metrics(target, POST);
    const read = calls.find((c) => c.path === POST)!;
    // Without limit(0) Meta also fetches the comments and refuses the field for want of pages_read_user_content.
    expect(read.params.get('fields')).toContain(
      'comments.limit(0).summary(true)',
    );
  });

  it('still reports shares when comments are behind a permission nobody can hold', async () => {
    stub([
      { when: (p) => p.endsWith('/insights'), body: { data: [] } },
      {
        // Meta refuses the combined read because of one field in it, and refuses comments on their own.
        when: (p, q) => p === POST && q.get('fields')!.includes('comments'),
        body: refusal('pages_read_user_content'),
        ok: false,
      },
      {
        when: (p, q) =>
          p === POST && q.get('fields') === 'reactions.limit(0).summary(true)',
        body: { reactions: { summary: { total_count: 9 } } },
      },
      {
        when: (p, q) => p === POST && q.get('fields') === 'shares',
        body: { shares: { count: 3 } },
      },
    ]);

    // Before this fell back per field, one forbidden figure took the other two with it and a post with real
    // shares reported nothing at all.
    expect(await publisher().metrics(target, POST)).toEqual({
      views: 0,
      likes: 9,
      comments: 0,
      shares: 3,
    });
  });

  it('reports zeroes rather than failing when the token may read none of it', async () => {
    stub([
      { when: () => true, body: refusal('pages_read_engagement'), ok: false },
    ]);

    // A metrics refresh must never be the thing that breaks a published post's row.
    await expect(publisher().metrics(target, POST)).resolves.toEqual({
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
    });
  });

  it('asks for the impressions metric that still exists', async () => {
    stub([
      {
        when: (p) => p.endsWith('/insights'),
        body: { data: [{ values: [{ value: 7 }] }] },
      },
      { when: () => true, body: {} },
    ]);

    await publisher().metrics(target, POST);
    const insights = calls.find((c) => c.path.endsWith('/insights'))!;
    // `post_impressions` was retired in June 2026 across every version and answers "must be a valid insights
    // metric", which the catch turns into a permanent, silent zero.
    expect(insights.params.get('metric')).toBe('post_media_view');
    expect(insights.params.get('metric')).not.toBe('post_impressions');
  });

  it('reads likes on a photo id stored before posts kept their post id', async () => {
    const nonexisting = (field: string) => ({
      error: {
        message: `(#100) Tried accessing nonexisting field (${field})`,
        code: 100,
      },
    });
    stub([
      { when: (p) => p.endsWith('/insights'), body: { data: [] } },
      {
        when: (p, q) => p === POST && q.get('fields')!.includes('reactions'),
        body: nonexisting('reactions'),
        ok: false,
      },
      {
        when: (p, q) =>
          p === POST && q.get('fields') === 'likes.limit(0).summary(true)',
        body: { likes: { summary: { total_count: 1 } } },
      },
      {
        when: (p, q) =>
          p === POST && q.get('fields') === 'comments.limit(0).summary(true)',
        body: { comments: { summary: { total_count: 1 } } },
      },
      {
        when: (p, q) => p === POST && q.get('fields') === 'shares',
        body: nonexisting('shares'),
        ok: false,
      },
    ]);
    expect(await publisher().metrics(target, POST)).toEqual({
      views: 0,
      likes: 1,
      comments: 1,
      shares: 0,
    });
  });

  it('reads the counts at the id in the post link when the stored id is refused', async () => {
    const ALIAS = '122105840667557013_122105838357557013';
    stub([
      { when: (p) => p.endsWith('/insights'), body: { data: [] } },
      {
        when: (p, q) => p === POST && q.get('fields') === 'permalink_url',
        body: {
          permalink_url:
            'https://www.facebook.com/122105840667557013/posts/122105838357557013',
        },
      },
      // Under the stored id Meta refuses everything but shares, as it did on a live post.
      {
        when: (p, q) => p === POST && q.get('fields') !== 'shares',
        body: refusal('pages_read_user_content'),
        ok: false,
      },
      { when: (p) => p === POST, body: {} },
      {
        when: (p) => p === ALIAS,
        body: {
          reactions: { summary: { total_count: 1 } },
          comments: { summary: { total_count: 1 } },
        },
      },
    ]);
    expect(await publisher().metrics(target, POST)).toEqual({
      views: 0,
      likes: 1,
      comments: 1,
      shares: 0,
    });
  });

  it('treats a figure Meta left out as zero', async () => {
    // Meta omits `shares` entirely rather than sending nought, which is the shape a real post with no shares has.
    stub([
      { when: (p) => p.endsWith('/insights'), body: { data: [] } },
      { when: () => true, body: { likes: { summary: { total_count: 1 } } } },
    ]);

    expect(await publisher().metrics(target, POST)).toEqual({
      views: 0,
      likes: 1,
      comments: 0,
      shares: 0,
    });
  });
});
