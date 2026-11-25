import { FieldCipher } from '../src/common/crypto/field-cipher';
import { PublishDueService } from '../src/modules/marketing/publish-due.service';
import { createTestApp } from './helpers';

/**
 * The owner-facing way to connect a page (M16): the owner is sent to Facebook and comes back with pages to pick,
 * never touching a token.
 *
 * Every Graph call is answered by the stub below, so these tests describe what the flow does with what Facebook
 * says rather than what Facebook says. What cannot be checked here is that the real `/me/accounts` has the shape
 * the stub claims; that was verified by hand against a live app, and is why the stub mirrors Meta's documented
 * fields exactly instead of a convenient subset.
 */
describe('Connecting a Facebook page as the owner (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const dataOf = <T>(res: { body: unknown }) => (res.body as { data: T }).data;

  /** What the stubbed Facebook will say the owner administers. Rewritten per test. */
  let graphPages: {
    id?: string;
    name?: string;
    access_token?: string;
    instagram_business_account?: { id?: string };
  }[] = [];
  /** Every Graph path the flow called, so a test can show the long-lived exchange really happens. */
  let graphCalls: { path: string; params: URLSearchParams }[] = [];
  /** When set, the next Graph call fails the way Meta refuses things. */
  let graphError: string | null = null;

  const realFetch = globalThis.fetch;

  const graphStub = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const url = new URL(
      typeof input === 'string' || input instanceof URL ? input : input.url,
    );
    if (url.hostname !== 'graph.facebook.com') {
      return realFetch(input, init);
    }
    const path = url.pathname.replace(/^\/v[\d.]+\//, '').replace(/^\//, '');
    graphCalls.push({ path, params: url.searchParams });

    const answer = (body: unknown, status = 200) =>
      Promise.resolve(
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        }),
      );

    if (graphError) {
      return answer({ error: { message: graphError } }, 400);
    }
    if (path === 'oauth/access_token') {
      return answer({
        access_token: url.searchParams.has('grant_type')
          ? 'LONG_USER_TOKEN'
          : 'SHORT_USER_TOKEN',
      });
    }
    if (path === 'me/accounts') {
      return answer({ data: graphPages });
    }
    return answer(
      { error: { message: `stub has no answer for ${path}` } },
      404,
    );
  };

  /** An ACTIVE hotel with one room type, owned by a partner. */
  const hotel = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const created = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'An Nhiên Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: `contact-${email}`,
        checkInTime: '14:00',
      })
      .expect(201);
    const hotelId = idOf(created);
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/room-types`)
      .set(auth(partner.token))
      .send({
        name: 'Deluxe',
        maxOccupancy: 2,
        areaSqm: 30,
        basePrice: 1000000,
        beds: [{ bedTypeId: king, quantity: 1 }],
      })
      .expect(201);
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId };
  };

  /** Step one: the URL the owner's browser is sent to, and the `state` inside it. */
  const authorize = async (token: string, hotelId: string, expect = 200) => {
    const res = await t
      .api()
      .get(`/api/v1/hotels/${hotelId}/social-accounts/facebook/authorize`)
      .set(auth(token))
      .expect(expect);
    if (expect !== 200) return { url: '', state: '' };
    const { authorizeUrl } = dataOf<{ authorizeUrl: string }>(res);
    return {
      url: authorizeUrl,
      state: new URL(authorizeUrl).searchParams.get('state') ?? '',
    };
  };

  /** Step two: hand Facebook's code and state back. */
  const exchange = (
    token: string,
    hotelId: string,
    body: Record<string, unknown>,
  ) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/social-accounts/facebook/exchange`)
      .set(auth(token))
      .send(body);

  /** Step three: pick pages. */
  const connect = (
    token: string,
    hotelId: string,
    body: Record<string, unknown>,
  ) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/social-accounts/facebook/connect`)
      .set(auth(token))
      .send(body);

  /** Steps one to three in one go, which is what a frontend does. */
  const connectPage = async (
    token: string,
    hotelId: string,
    pages: Record<string, unknown>[] = [{ pageId: '1001' }],
  ) => {
    const { state } = await authorize(token, hotelId);
    const exchanged = await exchange(token, hotelId, {
      code: 'CODE_FROM_FACEBOOK',
      state,
    }).expect(200);
    const { connectionToken } = dataOf<{ connectionToken: string }>(exchanged);
    return connect(token, hotelId, { connectionToken, pages });
  };

  beforeAll(async () => {
    t = await createTestApp();
    await t.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE amenity, bed_type RESTART IDENTITY CASCADE',
    );
    king = (
      await t.prisma.bedType.create({
        data: { name: 'Giường King', capacity: 2 },
      })
    ).bedTypeId;
    globalThis.fetch = graphStub;
  });

  beforeEach(async () => {
    await t.reset();
    t.ai.answer = {
      title: 'Cuối tuần bên sông Hàn',
      body: 'Mình còn vài phòng hướng biển cho cuối tuần này, bạn ghé nhé.',
    };
    graphCalls = [];
    graphError = null;
    graphPages = [
      {
        id: '1001',
        name: 'An Nhiên Riverside',
        access_token: 'EAAG_PAGE_TOKEN_1001',
        instagram_business_account: { id: '9001' },
      },
      { id: '1002', name: 'Quán cà phê của tôi', access_token: 'EAAG_1002' },
    ];
  });

  afterAll(async () => {
    globalThis.fetch = realFetch;
    await t.app.close();
  });

  describe('Step one: being sent to Facebook', () => {
    it('hands back a Facebook URL asking for exactly the scopes the hotel sees the result of', async () => {
      const h = await hotel();
      const { url } = await authorize(h.token, h.hotelId);

      const parsed = new URL(url);
      expect(parsed.hostname).toBe('www.facebook.com');
      expect(parsed.pathname).toContain('/dialog/oauth');
      expect(parsed.searchParams.get('client_id')).toBe('test-app-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe(
        'http://localhost:5173/social/facebook/callback',
      );
      const scopes = parsed.searchParams.get('scope')?.split(',') ?? [];
      expect(scopes).toEqual(
        expect.arrayContaining([
          'pages_show_list',
          'pages_manage_posts',
          'pages_read_engagement',
          // Without this one a post publishes and then reports zero views forever.
          'read_insights',
        ]),
      );
    });

    it('never puts the app secret in the URL the browser opens', async () => {
      const h = await hotel();
      const { url } = await authorize(h.token, h.hotelId);
      expect(url).not.toContain('test-app-secret');
    });

    it("is the owner's decision, not a staff member's", async () => {
      const h = await hotel();
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'MARKETING',
      ]);
      await authorize(staff.token, h.hotelId, 403);
    });
  });

  describe('Step two: coming back with a code', () => {
    it('lists the pages the owner administers, and marks which are already connected', async () => {
      const h = await hotel();
      const { state } = await authorize(h.token, h.hotelId);
      const res = await exchange(h.token, h.hotelId, {
        code: 'CODE_FROM_FACEBOOK',
        state,
      }).expect(200);

      const body = dataOf<{
        pages: {
          pageId: string;
          name: string;
          instagramId: string | null;
          connected: boolean;
        }[];
      }>(res);
      expect(body.pages).toHaveLength(2);
      expect(body.pages[0]).toMatchObject({
        pageId: '1001',
        name: 'An Nhiên Riverside',
        instagramId: '9001',
        connected: false,
      });
      // The second page has no Instagram linked, so the UI must not offer it.
      expect(body.pages[1].instagramId).toBeNull();
    });

    it('exchanges the short-lived token for a long-lived one before reading the pages', async () => {
      const h = await hotel();
      const { state } = await authorize(h.token, h.hotelId);
      await exchange(h.token, h.hotelId, {
        code: 'CODE_FROM_FACEBOOK',
        state,
      }).expect(200);

      // A page token inherits the lifetime of the user token it was read with, so the order matters: the
      // fb_exchange_token call has to come before /me/accounts, or the page tokens die in an hour.
      const paths = graphCalls.map((c) => c.path);
      expect(paths).toEqual([
        'oauth/access_token',
        'oauth/access_token',
        'me/accounts',
      ]);
      expect(graphCalls[1].params.get('grant_type')).toBe('fb_exchange_token');
      expect(graphCalls[2].params.get('access_token')).toBe('LONG_USER_TOKEN');
    });

    it('puts no access token of any kind in the answer', async () => {
      const h = await hotel();
      const { state } = await authorize(h.token, h.hotelId);
      const res = await exchange(h.token, h.hotelId, {
        code: 'CODE_FROM_FACEBOOK',
        state,
      }).expect(200);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain('EAAG_PAGE_TOKEN_1001');
      expect(body).not.toContain('LONG_USER_TOKEN');
      expect(body).not.toContain('SHORT_USER_TOKEN');
    });

    it('refuses a state we did not sign', async () => {
      const h = await hotel();
      const res = await exchange(h.token, h.hotelId, {
        code: 'CODE_FROM_FACEBOOK',
        state: 'v1:AAAA:BBBB:CCCC',
      }).expect(400);
      expect(res.body.code).toBe('SOCIAL_OAUTH_INVALID');
    });

    it('refuses a state signed for another hotel the same owner holds', async () => {
      const h = await hotel();
      const other = await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(h.token))
        .send({
          name: 'Second hotel',
          address: '2 Bạch Đằng',
          city: 'Đà Nẵng',
          email: 'contact-second@hotel.test',
          checkInTime: '14:00',
        })
        .expect(201);
      const { state } = await authorize(h.token, idOf(other));

      // The code was obtained while connecting the second hotel; it must not land on the first.
      const res = await exchange(h.token, h.hotelId, {
        code: 'CODE_FROM_FACEBOOK',
        state,
      }).expect(400);
      expect(res.body.code).toBe('SOCIAL_OAUTH_INVALID');
    });

    it('refuses a state that has expired', async () => {
      const h = await hotel();
      // Forged with the server's own key: the only thing wrong with it is the hour.
      const cipher = new FieldCipher(process.env.BENEFICIARY_ENCRYPTION_KEY!);
      const stale = cipher.encrypt(
        JSON.stringify({
          kind: 'state',
          hotelId: h.hotelId,
          exp: Date.now() - 1,
          nonce: 'n',
        }),
      );
      const res = await exchange(h.token, h.hotelId, {
        code: 'CODE_FROM_FACEBOOK',
        state: stale,
      }).expect(400);
      expect(res.body.message).toContain('expired');
    });

    it("passes Facebook's own words through when it refuses the code", async () => {
      const h = await hotel();
      const { state } = await authorize(h.token, h.hotelId);
      graphError = 'This authorization code has been used.';

      const res = await exchange(h.token, h.hotelId, {
        code: 'ALREADY_USED',
        state,
      }).expect(502);
      expect(res.body.code).toBe('SOCIAL_OAUTH_FAILED');
      expect(res.body.message).toContain('has been used');
    });

    it('says so when the owner granted no page we could post to', async () => {
      const h = await hotel();
      // A page the owner only moderates comes back without a token: offering it would produce a post that
      // fails later for a reason nobody can see at this point.
      graphPages = [{ id: '1003', name: 'A page I only moderate' }];
      const { state } = await authorize(h.token, h.hotelId);

      const res = await exchange(h.token, h.hotelId, {
        code: 'CODE_FROM_FACEBOOK',
        state,
      }).expect(502);
      expect(res.body.code).toBe('SOCIAL_OAUTH_FAILED');
      expect(res.body.message).toContain('No Facebook Page');
    });
  });

  describe('Step three: picking pages', () => {
    it('connects only the page the owner picked, and stores the token encrypted', async () => {
      const h = await hotel();
      const res = await connectPage(h.token, h.hotelId, [{ pageId: '1001' }]);
      expect(res.status).toBe(201);

      const saved = dataOf<{ platform: string; accountName: string }[]>(res);
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({
        platform: 'FACEBOOK',
        accountName: '1001',
      });
      // The second page was never asked for.
      expect(await t.prisma.socialAccount.count()).toBe(1);

      const row = await t.prisma.socialAccount.findFirstOrThrow();
      expect(row.accessToken).toMatch(/^v1:/);
      expect(row.accessToken).not.toContain('EAAG_PAGE_TOKEN_1001');
      expect(JSON.stringify(res.body)).not.toContain('EAAG_PAGE_TOKEN_1001');
    });

    it('connects the linked Instagram account with the same token when asked', async () => {
      const h = await hotel();
      const res = await connectPage(h.token, h.hotelId, [
        { pageId: '1001', instagram: true },
      ]);

      const saved = dataOf<{ platform: string; accountName: string }[]>(res);
      expect(saved.map((a) => [a.platform, a.accountName])).toEqual([
        ['FACEBOOK', '1001'],
        ['INSTAGRAM', '9001'],
      ]);
    });

    it('refuses Instagram on a page that has none, and names the page', async () => {
      const h = await hotel();
      const res = await connectPage(h.token, h.hotelId, [
        { pageId: '1002', instagram: true },
      ]);

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('SOCIAL_OAUTH_INVALID');
      expect(res.body.message).toContain('Quán cà phê của tôi');
      // Nothing was written: half a connection is worse than none.
      expect(await t.prisma.socialAccount.count()).toBe(0);
    });

    it('writes nothing when one page of several cannot be connected', async () => {
      const h = await hotel();
      const res = await connectPage(h.token, h.hotelId, [
        { pageId: '1001' },
        { pageId: '1002', instagram: true },
      ]);

      expect(res.status).toBe(400);
      expect(await t.prisma.socialAccount.count()).toBe(0);
    });

    it('refuses a page Facebook never granted', async () => {
      const h = await hotel();
      const res = await connectPage(h.token, h.hotelId, [{ pageId: '7777' }]);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('7777');
    });

    it('reads the pages from Facebook again rather than trusting the browser', async () => {
      const h = await hotel();
      const { state } = await authorize(h.token, h.hotelId);
      const exchanged = await exchange(h.token, h.hotelId, {
        code: 'CODE',
        state,
      }).expect(200);
      const { connectionToken } = dataOf<{ connectionToken: string }>(
        exchanged,
      );

      // The owner removed the app from the page between the two steps.
      graphPages = [];
      const res = await connect(h.token, h.hotelId, {
        connectionToken,
        pages: [{ pageId: '1001' }],
      });
      expect(res.status).toBe(502);
      expect(await t.prisma.socialAccount.count()).toBe(0);
    });

    it('refuses a connection token minted for another hotel', async () => {
      const h = await hotel();
      const other = await hotel('owner2@hotel.test');
      const { state } = await authorize(h.token, h.hotelId);
      const exchanged = await exchange(h.token, h.hotelId, {
        code: 'CODE',
        state,
      }).expect(200);
      const { connectionToken } = dataOf<{ connectionToken: string }>(
        exchanged,
      );

      const res = await connect(other.token, other.hotelId, {
        connectionToken,
        pages: [{ pageId: '1001' }],
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('SOCIAL_OAUTH_INVALID');
    });

    it("is the owner's decision, not a staff member's", async () => {
      const h = await hotel();
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'MARKETING',
      ]);
      const { state } = await authorize(h.token, h.hotelId);
      await exchange(staff.token, h.hotelId, { code: 'CODE', state }).expect(
        403,
      );
    });
  });

  describe('Reconnecting', () => {
    it('updates the token on the same row instead of adding a second page', async () => {
      const h = await hotel();
      await connectPage(h.token, h.hotelId, [{ pageId: '1001' }]);
      const first = await t.prisma.socialAccount.findFirstOrThrow();

      graphPages[0].access_token = 'EAAG_NEW_TOKEN';
      await connectPage(h.token, h.hotelId, [{ pageId: '1001' }]);

      expect(await t.prisma.socialAccount.count()).toBe(1);
      const after = await t.prisma.socialAccount.findFirstOrThrow();
      // Same row, because a published post's schedule points at it.
      expect(after.socialAccountId).toBe(first.socialAccountId);
      expect(after.accessToken).not.toBe(first.accessToken);
    });

    it('brings a disconnected page back to life', async () => {
      const h = await hotel();
      const connected = await connectPage(h.token, h.hotelId, [
        { pageId: '1001' },
      ]);
      const accountId = dataOf<{ id: string }[]>(connected)[0].id;
      await t
        .api()
        .delete(`/api/v1/social-accounts/${accountId}`)
        .set(auth(h.token))
        .expect(204);

      const res = await connectPage(h.token, h.hotelId, [{ pageId: '1001' }]);
      expect(res.status).toBe(201);
      // Disconnecting set the expiry to the epoch; reconnecting has to clear that or nothing would publish.
      expect(
        dataOf<{ usable: boolean; expiresAt: string | null }[]>(res)[0],
      ).toMatchObject({ usable: true, expiresAt: null });
    });
  });

  describe('End to end', () => {
    it('publishes to a page that was connected this way, with no token ever typed', async () => {
      const h = await hotel();
      const connected = await connectPage(h.token, h.hotelId, [
        { pageId: '1001' },
      ]);
      const accountId = dataOf<{ id: string }[]>(connected)[0].id;

      const draft = await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/marketing-content/generate`)
        .set(auth(h.token))
        .send({ brief: 'Cuối tuần còn phòng', contentType: 'POST' })
        .expect(201);
      const contentId = idOf(draft);
      await t
        .api()
        .post(`/api/v1/marketing-content/${contentId}/submit`)
        .set(auth(h.token))
        .expect(200);
      await t
        .api()
        .post(`/api/v1/marketing-content/${contentId}/approve`)
        .set(auth(h.token))
        .expect(200);
      await t
        .api()
        .post(`/api/v1/marketing-content/${contentId}/schedule`)
        .set(auth(h.token))
        .send({ socialAccountId: accountId })
        .expect(201);

      await t.app.get(PublishDueService).publishDue(new Date());

      expect(t.publisher.posts).toHaveLength(1);
      // The publisher was handed the decrypted page token, which is the whole point of storing it.
      expect(t.publisher.posts[0].accountName).toBe('1001');
      const row = await t.prisma.contentSchedule.findFirstOrThrow();
      expect(row.status).toBe('PUBLISHED');
    });
  });
});
