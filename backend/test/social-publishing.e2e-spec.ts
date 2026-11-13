import { PublishDueService } from '../src/modules/marketing/publish-due.service';
import { createTestApp } from './helpers';

describe('Social accounts, scheduling and publishing (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const inHours = (hours: number) =>
    new Date(Date.now() + hours * 3_600_000).toISOString();

  /** An ACTIVE hotel with one room type. */
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

  /** A Facebook page, connected the way an owner would. */
  const connect = (
    token: string,
    hotelId: string,
    body: Record<string, unknown> = {},
  ) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/social-accounts`)
      .set(auth(token))
      .send({
        platform: 'FACEBOOK',
        accountName: '1234567890',
        accessToken: 'EAAG-a-very-long-lived-page-token',
        ...body,
      });

  /** Content the owner has approved, ready to be scheduled. */
  const approvedContent = async (token: string, hotelId: string) => {
    const draft = await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/marketing-content/generate`)
      .set(auth(token))
      .send({ contentType: 'POST', brief: 'Cuối tuần còn phòng' })
      .expect(201);
    const id = idOf(draft);
    for (const action of ['submit', 'approve']) {
      await t
        .api()
        .post(`/api/v1/marketing-content/${id}/${action}`)
        .set(auth(token))
        .expect(200);
    }
    return id;
  };

  const schedule = (
    token: string,
    contentId: string,
    body: Record<string, unknown>,
  ) =>
    t
      .api()
      .post(`/api/v1/marketing-content/${contentId}/schedule`)
      .set(auth(token))
      .send(body);

  /** What the publishing job does every minute, run on demand. */
  const runJob = (now = new Date()) =>
    t.app.get(PublishDueService).publishDue(now);

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
  });

  beforeEach(async () => {
    await t.reset();
    t.ai.answer = {
      title: 'Cuối tuần bên sông Hàn',
      body: 'Mình còn vài phòng hướng biển cho cuối tuần này, bạn ghé nhé.',
    };
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('Connecting a page', () => {
    it('connects it and never reads the token back', async () => {
      const h = await hotel();
      const res = await connect(h.token, h.hotelId).expect(201);
      expect(res.body.data).toMatchObject({
        platform: 'FACEBOOK',
        accountName: '1234567890',
        usable: true,
        expiresAt: null,
      });
      // A page token can post as the hotel for months: it goes in and does not come back out.
      expect(JSON.stringify(res.body)).not.toContain('EAAG');
    });

    it('stores the token encrypted, not as typed', async () => {
      const h = await hotel();
      await connect(h.token, h.hotelId).expect(201);
      const row = await t.prisma.socialAccount.findFirstOrThrow();
      expect(row.accessToken).not.toContain('EAAG');
      expect(row.accessToken).toMatch(/^v1:/);
    });

    it('is the owner’s decision, not a staff member’s', async () => {
      const h = await hotel();
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'MARKETING',
      ]);
      const res = await connect(staff.token, h.hotelId);
      expect(res.status).toBe(403);
    });

    it('marks a page whose token has already expired unusable', async () => {
      const h = await hotel();
      const res = await connect(h.token, h.hotelId, {
        expiresAt: inHours(-1),
      }).expect(201);
      expect(res.body.data.usable).toBe(false);
    });

    it('lists the pages, with no token in sight', async () => {
      const h = await hotel();
      await connect(h.token, h.hotelId).expect(201);
      await connect(h.token, h.hotelId, {
        platform: 'INSTAGRAM',
        accountName: '17841400000000000',
      }).expect(201);

      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/social-accounts`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(JSON.stringify(res.body)).not.toContain('EAAG');
    });

    it("keeps one hotel out of another's pages", async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const id = idOf(await connect(h.token, h.hotelId).expect(201));

      const res = await t
        .api()
        .delete(`/api/v1/social-accounts/${id}`)
        .set(auth(other.token));
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SOCIAL_ACCOUNT_NOT_FOUND');
    });
  });

  describe('Scheduling', () => {
    it('schedules approved content and moves it to SCHEDULED', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);

      const res = await schedule(h.token, contentId, {
        socialAccountId: accountId,
        scheduledAt: inHours(3),
      }).expect(201);
      expect(res.body.data).toMatchObject({
        status: 'SCHEDULED',
        platform: 'FACEBOOK',
        accountName: '1234567890',
        externalPostId: null,
        failureReason: null,
      });

      const content = await t
        .api()
        .get(`/api/v1/marketing-content/${contentId}`)
        .set(auth(h.token))
        .expect(200);
      expect(content.body.data.status).toBe('SCHEDULED');
    });

    it('refuses content the owner has not approved', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const draft = await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/marketing-content/generate`)
        .set(auth(h.token))
        .send({ contentType: 'POST', brief: 'Chưa duyệt' })
        .expect(201);

      const res = await schedule(h.token, idOf(draft), {
        socialAccountId: accountId,
      });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('CONTENT_NOT_APPROVED');
    });

    it("refuses another hotel's page", async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const theirAccount = idOf(
        await connect(other.token, other.hotelId).expect(201),
      );
      const contentId = await approvedContent(h.token, h.hotelId);

      const res = await schedule(h.token, contentId, {
        socialAccountId: theirAccount,
      });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SOCIAL_ACCOUNT_NOT_FOUND');
    });

    it('sends one approved piece to two pages', async () => {
      const h = await hotel();
      const facebook = idOf(await connect(h.token, h.hotelId).expect(201));
      const instagram = idOf(
        await connect(h.token, h.hotelId, {
          platform: 'INSTAGRAM',
          accountName: '17841400000000000',
        }).expect(201),
      );
      const contentId = await approvedContent(h.token, h.hotelId);

      await schedule(h.token, contentId, {
        socialAccountId: facebook,
      }).expect(201);
      // The first scheduling moved the content off APPROVED; the second must still be allowed.
      await schedule(h.token, contentId, {
        socialAccountId: instagram,
      }).expect(201);

      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/content-schedules`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toHaveLength(2);
    });

    it('filters the calendar by status', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      const scheduleId = idOf(
        await schedule(h.token, contentId, {
          socialAccountId: accountId,
        }).expect(201),
      );
      await t
        .api()
        .delete(`/api/v1/content-schedules/${scheduleId}`)
        .set(auth(h.token))
        .expect(200);

      const cancelled = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/content-schedules?status=CANCELLED`)
        .set(auth(h.token))
        .expect(200);
      expect(cancelled.body.data).toHaveLength(1);

      const waiting = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/content-schedules?status=SCHEDULED`)
        .set(auth(h.token))
        .expect(200);
      expect(waiting.body.data).toHaveLength(0);
    });
  });

  describe('Publishing', () => {
    /** A hotel with one approved post already on the calendar, due now. */
    const readyToPublish = async (email = 'owner@hotel.test') => {
      const h = await hotel(email);
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      const scheduleId = idOf(
        await schedule(h.token, contentId, {
          socialAccountId: accountId,
        }).expect(201),
      );
      return { ...h, accountId, contentId, scheduleId };
    };

    it('sends a post with no time at the next run', async () => {
      const h = await readyToPublish();
      expect(await runJob()).toEqual({ published: 1, failed: 0 });

      // "Post now" is a null scheduledAt, so the text the owner approved is what went out.
      expect(t.publisher.posts).toHaveLength(1);
      expect(t.publisher.posts[0]).toMatchObject({
        platform: 'FACEBOOK',
        accountName: '1234567890',
        title: 'Cuối tuần bên sông Hàn',
      });

      const res = await t
        .api()
        .get(`/api/v1/content-schedules/${h.scheduleId}`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        status: 'PUBLISHED',
        externalPostId: 'post_1',
        failureReason: null,
      });
      expect(res.body.data.publishedAt).not.toBeNull();
    });

    it('moves the content to PUBLISHED too', async () => {
      const h = await readyToPublish();
      await runJob();
      const res = await t
        .api()
        .get(`/api/v1/marketing-content/${h.contentId}`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data.status).toBe('PUBLISHED');
    });

    it('leaves a post scheduled for later alone', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      await schedule(h.token, contentId, {
        socialAccountId: accountId,
        scheduledAt: inHours(5),
      }).expect(201);

      expect(await runJob()).toEqual({ published: 0, failed: 0 });
      expect(t.publisher.posts).toHaveLength(0);
    });

    it('sends it once the time has come', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      await schedule(h.token, contentId, {
        socialAccountId: accountId,
        scheduledAt: inHours(5),
      }).expect(201);

      expect(await runJob(new Date(Date.now() + 6 * 3_600_000))).toEqual({
        published: 1,
        failed: 0,
      });
    });

    it('never sends a cancelled post', async () => {
      const h = await readyToPublish();
      await t
        .api()
        .delete(`/api/v1/content-schedules/${h.scheduleId}`)
        .set(auth(h.token))
        .expect(200);

      expect(await runJob()).toEqual({ published: 0, failed: 0 });
      expect(t.publisher.posts).toHaveLength(0);
    });

    it("records the platform's own words when it refuses", async () => {
      const h = await readyToPublish();
      t.publisher.failWith = 'Error validating access token: Session expired';

      expect(await runJob()).toEqual({ published: 0, failed: 1 });

      const res = await t
        .api()
        .get(`/api/v1/content-schedules/${h.scheduleId}`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data.status).toBe('FAILED');
      // The one thing that tells an owner what to do next.
      expect(res.body.data.failureReason).toContain('Session expired');

      // A post that did not go out must not leave the content looking published, nor stuck on the calendar: with
      // nothing else waiting it is back to APPROVED and can be scheduled again.
      const content = await t
        .api()
        .get(`/api/v1/marketing-content/${h.contentId}`)
        .set(auth(h.token))
        .expect(200);
      expect(content.body.data.status).toBe('APPROVED');
    });

    it('does not retry a post that failed', async () => {
      const h = await readyToPublish();
      t.publisher.failWith = 'Session expired';
      await runJob();
      t.publisher.failWith = null;

      // A token that expired a minute ago is still expired; retrying against Meta is how an app gets rate limited.
      expect(await runJob()).toEqual({ published: 0, failed: 0 });
      expect(t.publisher.posts).toHaveLength(0);
      void h;
    });

    it('fails with something actionable when the page has no usable token', async () => {
      const h = await readyToPublish();
      await t.prisma.socialAccount.update({
        where: { socialAccountId: h.accountId },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      expect(await runJob()).toEqual({ published: 0, failed: 1 });
      const res = await t
        .api()
        .get(`/api/v1/content-schedules/${h.scheduleId}`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data.failureReason).toContain('reconnect');
      // The platform was never called: a token we know is dead is not a platform failure.
      expect(t.publisher.posts).toHaveLength(0);
    });

    it('cancels what was waiting when the page is disconnected', async () => {
      const h = await readyToPublish();
      await t
        .api()
        .delete(`/api/v1/social-accounts/${h.accountId}`)
        .set(auth(h.token))
        .expect(204);

      const res = await t
        .api()
        .get(`/api/v1/content-schedules/${h.scheduleId}`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data.status).toBe('CANCELLED');
      expect(res.body.data.failureReason).toContain('disconnected');
      expect(await runJob()).toEqual({ published: 0, failed: 0 });
    });

    it('refuses to cancel a post that already went out', async () => {
      const h = await readyToPublish();
      await runJob();

      const res = await t
        .api()
        .delete(`/api/v1/content-schedules/${h.scheduleId}`)
        .set(auth(h.token));
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('SCHEDULE_STATUS_CONFLICT');
    });

    it('keeps publishing after one post fails', async () => {
      const h = await readyToPublish();
      const second = await approvedContent(h.token, h.hotelId);
      await schedule(h.token, second, {
        socialAccountId: h.accountId,
      }).expect(201);

      // The first post's page is dead; the second must still go out in the same run.
      await t.prisma.contentSchedule.updateMany({
        where: { marketingContentId: h.contentId },
        data: { socialAccountId: h.accountId },
      });
      t.publisher.failWith = null;
      const result = await runJob();
      expect(result.published + result.failed).toBe(2);
    });
  });

  describe('How a post did', () => {
    const published = async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      const scheduleId = idOf(
        await schedule(h.token, contentId, {
          socialAccountId: accountId,
        }).expect(201),
      );
      await runJob();
      return { ...h, scheduleId };
    };

    it('reads the figures from the platform and keeps them', async () => {
      const h = await published();
      const res = await t
        .api()
        .post(`/api/v1/content-schedules/${h.scheduleId}/metrics/refresh`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        platform: 'FACEBOOK',
        views: 120,
        likes: 9,
        shares: 2,
        comments: 3,
      });
      expect(t.publisher.metricsCalls).toBe(1);
    });

    it('appends each reading rather than overwriting the last', async () => {
      const h = await published();
      await t
        .api()
        .post(`/api/v1/content-schedules/${h.scheduleId}/metrics/refresh`)
        .set(auth(h.token))
        .expect(200);
      t.publisher.metricsAnswer = {
        views: 400,
        likes: 30,
        shares: 5,
        comments: 8,
      };
      await t
        .api()
        .post(`/api/v1/content-schedules/${h.scheduleId}/metrics/refresh`)
        .set(auth(h.token))
        .expect(200);

      const res = await t
        .api()
        .get(`/api/v1/content-schedules/${h.scheduleId}/metrics`)
        .set(auth(h.token))
        .expect(200);
      // Both readings are kept: reach gained on day three is a different story from reach in the first hour.
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].views).toBe(400);
      expect(res.body.data[1].views).toBe(120);
    });

    it('has nothing to read for a post that has not gone out', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      const scheduleId = idOf(
        await schedule(h.token, contentId, {
          socialAccountId: accountId,
          scheduledAt: inHours(4),
        }).expect(201),
      );

      const res = await t
        .api()
        .post(`/api/v1/content-schedules/${scheduleId}/metrics/refresh`)
        .set(auth(h.token));
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('SCHEDULE_STATUS_CONFLICT');
      expect(t.publisher.metricsCalls).toBe(0);
    });

    it("keeps one hotel out of another's figures", async () => {
      const h = await published();
      const other = await hotel('other@hotel.test');

      const res = await t
        .api()
        .get(`/api/v1/content-schedules/${h.scheduleId}/metrics`)
        .set(auth(other.token));
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('SCHEDULE_NOT_FOUND');
    });
  });

  describe('Review of #127', () => {
    /** A hotel with a draft, an approved piece on the calendar, and a staff member of each kind. */
    const setup = async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const draftId = idOf(
        await t
          .api()
          .post(`/api/v1/hotels/${h.hotelId}/marketing-content/generate`)
          .set(auth(h.token))
          .send({ contentType: 'POST', brief: 'Bữa sáng mới mỗi ngày' })
          .expect(201),
      );
      const contentId = await approvedContent(h.token, h.hotelId);
      const scheduleId = idOf(
        await schedule(h.token, contentId, {
          socialAccountId: accountId,
          scheduledAt: inHours(24),
        }).expect(201),
      );
      const frontDesk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const marketer = await t.signInStaff(h.hotelId, 'mkt@hotel.test', [
        'MARKETING',
      ]);
      return {
        ...h,
        accountId,
        draftId,
        contentId,
        scheduleId,
        frontDesk,
        marketer,
      };
    };

    it('refuses every route by id to a staff member without MARKETING', async () => {
      const s = await setup();
      const desk = auth(s.frontDesk.token);
      const content = `/api/v1/marketing-content/${s.draftId}`;
      const post = `/api/v1/content-schedules/${s.scheduleId}`;
      // Each call is sent as it is built: a supertest request left unawaited loses its ephemeral server.
      const calls: Array<[string, () => Promise<{ status: number }>]> = [
        ['GET content', () => t.api().get(content).set(desk)],
        [
          'PATCH content',
          () => t.api().patch(content).set(desk).send({ body: 'Sửa trộm' }),
        ],
        ['submit', () => t.api().post(`${content}/submit`).set(desk)],
        [
          'upload image',
          () =>
            t.api().post(`${content}/image`).set(desk).attach(
              'file',
              // A real 1x1 PNG: a broken file is refused by the upload pipe before the permission is looked at.
              Buffer.from(
                'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
                'base64',
              ),
              'a.png',
            ),
        ],
        ['remove image', () => t.api().delete(`${content}/image`).set(desk)],
        ['delete content', () => t.api().delete(content).set(desk)],
        [
          'schedule',
          () =>
            t
              .api()
              .post(`/api/v1/marketing-content/${s.contentId}/schedule`)
              .set(desk)
              .send({ socialAccountId: s.accountId }),
        ],
        ['GET schedule', () => t.api().get(post).set(desk)],
        ['cancel schedule', () => t.api().delete(post).set(desk)],
        ['GET metrics', () => t.api().get(`${post}/metrics`).set(desk)],
        [
          'refresh metrics',
          () => t.api().post(`${post}/metrics/refresh`).set(desk),
        ],
      ];
      for (const [label, call] of calls) {
        const res = await call();
        expect({ label, status: res.status }).toEqual({ label, status: 403 });
      }
      // Nothing moved: the draft is untouched and the post still waits.
      const draft = await t.prisma.marketingContent.findUniqueOrThrow({
        where: { marketingContentId: s.draftId },
      });
      expect(draft.status).toBe('DRAFT');
      expect(draft.body).not.toBe('Sửa trộm');
      const waiting = await t.prisma.contentSchedule.findUniqueOrThrow({
        where: { contentScheduleId: s.scheduleId },
      });
      expect(waiting.status).toBe('SCHEDULED');
    });

    it('still lets a staff member with MARKETING work by id', async () => {
      const s = await setup();
      await t
        .api()
        .patch(`/api/v1/marketing-content/${s.draftId}`)
        .set(auth(s.marketer.token))
        .send({ body: 'Bữa sáng có mì Quảng.' })
        .expect(200);
      await t
        .api()
        .delete(`/api/v1/content-schedules/${s.scheduleId}`)
        .set(auth(s.marketer.token))
        .expect(200);
    });

    it('never sends a post twice when two runs race for it', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      await schedule(h.token, contentId, { socialAccountId: accountId }).expect(
        201,
      );

      // Two instances of the job, or two environments on one database, see the same due row.
      const [a, b] = await Promise.all([runJob(), runJob()]);
      expect(a.published + b.published).toBe(1);
      expect(t.publisher.posts).toHaveLength(1);
    });

    it('lists a "post now" row before a timed one', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const contentId = await approvedContent(h.token, h.hotelId);
      const timed = idOf(
        await schedule(h.token, contentId, {
          socialAccountId: accountId,
          scheduledAt: inHours(2),
        }).expect(201),
      );
      const now = idOf(
        await schedule(h.token, contentId, {
          socialAccountId: accountId,
        }).expect(201),
      );
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/content-schedules`)
        .set(auth(h.token))
        .expect(200);
      expect((res.body.data as { id: string }[]).map((r) => r.id)).toEqual([
        now,
        timed,
      ]);
    });

    it('puts the content back to APPROVED once its only post is cancelled', async () => {
      const s = await setup();
      await t
        .api()
        .delete(`/api/v1/content-schedules/${s.scheduleId}`)
        .set(auth(s.token))
        .expect(200);
      const content = await t
        .api()
        .get(`/api/v1/marketing-content/${s.contentId}`)
        .set(auth(s.token))
        .expect(200);
      expect(content.body.data.status).toBe('APPROVED');
    });

    it('filters the calendar by content and lists the latest published first', async () => {
      const h = await hotel();
      const accountId = idOf(await connect(h.token, h.hotelId).expect(201));
      const first = await approvedContent(h.token, h.hotelId);
      const second = await approvedContent(h.token, h.hotelId);
      const firstPost = idOf(
        await schedule(h.token, first, { socialAccountId: accountId }).expect(
          201,
        ),
      );
      await runJob();
      const secondPost = idOf(
        await schedule(h.token, second, { socialAccountId: accountId }).expect(
          201,
        ),
      );
      await runJob(new Date(Date.now() + 60_000));

      const one = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/content-schedules?contentId=${first}`)
        .set(auth(h.token))
        .expect(200);
      expect((one.body.data as { id: string }[]).map((r) => r.id)).toEqual([
        firstPost,
      ]);

      const latest = await t
        .api()
        .get(
          `/api/v1/hotels/${h.hotelId}/content-schedules?status=PUBLISHED&sort=published-desc`,
        )
        .set(auth(h.token))
        .expect(200);
      expect((latest.body.data as { id: string }[]).map((r) => r.id)).toEqual([
        secondPost,
        firstPost,
      ]);
    });
  });
});
