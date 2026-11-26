import { createTestApp } from './helpers';

/**
 * More cases for the phase 5 marketing writer (docs/api/marketing.md): who may use each endpoint, what the inputs
 * accept, the status machine around approval, the AI picture and the brand voice staff can read but not change.
 * The model is FakeAi, as in marketing-content.e2e-spec.ts.
 */
describe('Marketing edge cases (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;

  /** An ACTIVE hotel; the partner who owns it. */
  const hotel = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const hotelId = idOf(
      await t
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
        .expect(201),
    );
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId };
  };

  const writer = (hotelId: string, email = 'writer@hotel.test') =>
    t.signInStaff(hotelId, email, ['MARKETING']);

  const generate = (token: string, hotelId: string, body: object = {}) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/marketing-content/generate`)
      .set(auth(token))
      .send({ contentType: 'POST', brief: 'Cuối tuần còn phòng', ...body });

  const create = (token: string, hotelId: string, body: object = {}) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/marketing-content`)
      .set(auth(token))
      .send({
        contentType: 'POST',
        title: 'Tiêu đề',
        body: 'Nội dung.',
        ...body,
      });

  const action = (token: string, id: string, name: string, body?: object) =>
    t
      .api()
      .post(`/api/v1/marketing-content/${id}/${name}`)
      .set(auth(token))
      .send(body ?? {});

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    t.ai.answer = {
      title: 'Cuối tuần bên sông Hàn',
      body: 'Mình còn vài phòng hướng biển cho cuối tuần này, bạn ghé nhé.',
    };
  });

  afterAll(() => t.app.close());

  describe('who may write', () => {
    it('asks a signed-out caller to sign in, without calling the model', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/marketing-content/generate`)
        .send({ contentType: 'POST', brief: 'Cuối tuần còn phòng' })
        .expect(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
      expect(t.ai.calls).toHaveLength(0);
    });

    // Someone outside the hotel is told it does not exist (HOTEL_NOT_FOUND), not that they lack a right.
    it('keeps a customer out of every marketing endpoint as if the hotel did not exist', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const calls = [
        () => generate(me.token, h.hotelId),
        () =>
          t
            .api()
            .get(`/api/v1/hotels/${h.hotelId}/marketing-content`)
            .set(auth(me.token)),
        () =>
          t
            .api()
            .get(`/api/v1/hotels/${h.hotelId}/ai-budget`)
            .set(auth(me.token)),
      ];
      for (const call of calls) {
        const res = await call().expect(404);
        expect(res.body.code).toBe('HOTEL_NOT_FOUND');
      }
      expect(t.ai.calls).toHaveLength(0);
    });

    it("keeps a writer of one hotel out of another hotel's writer", async () => {
      const mine = await hotel('a@hotel.test');
      const theirs = await hotel('b@hotel.test');
      const staff = await writer(mine.hotelId);
      const res = await generate(staff.token, theirs.hotelId).expect(404);
      expect(res.body.code).toBe('HOTEL_NOT_FOUND');
      expect(t.ai.calls).toHaveLength(0);
      expect(await t.prisma.marketingContent.count()).toBe(0);
    });

    it('lets any staff member read the budget, but only MARKETING staff list or write', async () => {
      const h = await hotel();
      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const budget = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/ai-budget`)
        .set(auth(desk.token))
        .expect(200);
      expect(budget.body.data).toEqual({
        spentUsd: 0,
        limitUsd: 5,
        remainingUsd: 5,
      });
      const list = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/marketing-content`)
        .set(auth(desk.token))
        .expect(403);
      expect(list.body.code).toBe('FORBIDDEN');
      await generate(desk.token, h.hotelId).expect(403);
    });

    it('lets the owner write without a staff permission', async () => {
      const h = await hotel();
      const res = await generate(h.token, h.hotelId).expect(201);
      expect(res.body.data.status).toBe('DRAFT');
    });
  });

  describe('what a brief may be', () => {
    it.each([
      ['a brief under 5 characters', { brief: 'abc' }],
      ['a brief of spaces', { brief: '        ' }],
      ['a brief over 500 characters', { brief: 'a'.repeat(501) }],
      ['an unknown content type', { contentType: 'TWEET' }],
      ['an unknown platform', { platform: 'MYSPACE' }],
      ['an unknown field', { tone: 'vui vẻ' }],
    ])('refuses %s, without calling the model', async (_label, body) => {
      const h = await hotel();
      const res = await generate(h.token, h.hotelId, body).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(t.ai.calls).toHaveLength(0);
    });

    it.each(['POST', 'PROMOTION', 'CAPTION', 'BLOG'])(
      'writes a %s draft',
      async (contentType) => {
        const h = await hotel();
        const res = await generate(h.token, h.hotelId, { contentType }).expect(
          201,
        );
        expect(res.body.data).toMatchObject({ contentType, status: 'DRAFT' });
      },
    );

    it('takes a 5-character and a 500-character brief', async () => {
      const h = await hotel();
      await generate(h.token, h.hotelId, { brief: 'abcde' }).expect(201);
      await generate(h.token, h.hotelId, { brief: 'a'.repeat(500) }).expect(
        201,
      );
      expect(t.ai.calls).toHaveLength(2);
    });

    it('puts the brief, as typed, in the prompt', async () => {
      const h = await hotel();
      await generate(h.token, h.hotelId, {
        brief: 'Ưu đãi trăng mật tháng 12, tặng bánh kem',
      }).expect(201);
      expect(t.ai.calls[0].prompt).toContain(
        'Ưu đãi trăng mật tháng 12, tặng bánh kem',
      );
    });
  });

  describe('saving a picked version', () => {
    it.each([
      ['an empty body', { body: '' }],
      ['a body of spaces', { body: '   ' }],
      ['a body over 10,000 characters', { body: 'a'.repeat(10_001) }],
      ['a title over 255 characters', { title: 'a'.repeat(256) }],
      ['no content type', { contentType: undefined }],
      ['a status, which the server owns', { status: 'APPROVED' }],
    ])('refuses %s', async (_label, body) => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const res = await create(staff.token, h.hotelId, body).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(await t.prisma.marketingContent.count()).toBe(0);
    });

    it('saves a version without a title', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const res = await create(staff.token, h.hotelId, {
        title: null,
        body: 'Chỉ có thân bài.',
      }).expect(201);
      expect(res.body.data).toMatchObject({ title: null, status: 'DRAFT' });
    });

    it('keeps line breaks and emoji in the body', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const body = 'Dòng một 🌊\n\nDòng hai\n- gạch đầu dòng';
      const res = await create(staff.token, h.hotelId, { body }).expect(201);
      expect(res.body.data.body).toBe(body);
    });

    it('refuses variants when the model is over budget, and saves nothing', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      t.ai.budgetLeft = 0;
      const res = await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/marketing-content/variants`)
        .set(auth(staff.token))
        .send({ contentType: 'POST', brief: 'Cuối tuần còn phòng' })
        .expect(403);
      expect(res.body.code).toBe('AI_BUDGET_EXCEEDED');
      expect(await t.prisma.marketingContent.count()).toBe(0);
    });
  });

  describe('the status machine', () => {
    it('refuses to submit twice', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const id = idOf(await create(staff.token, h.hotelId).expect(201));
      await action(staff.token, id, 'submit').expect(200);
      const again = await action(staff.token, id, 'submit').expect(409);
      expect(again.body.code).toBe('CONTENT_STATUS_CONFLICT');
    });

    it('refuses to approve or reject a draft that was never submitted', async () => {
      const h = await hotel();
      const id = idOf(await create(h.token, h.hotelId).expect(201));
      const approve = await action(h.token, id, 'approve').expect(409);
      expect(approve.body.code).toBe('CONTENT_STATUS_CONFLICT');
      const reject = await action(h.token, id, 'reject', {
        reason: 'Chưa gửi',
      }).expect(409);
      expect(reject.body.code).toBe('CONTENT_STATUS_CONFLICT');
    });

    it.each([
      ['no reason', {}],
      ['an empty reason', { reason: '   ' }],
      ['a reason over 1,000 characters', { reason: 'a'.repeat(1001) }],
    ])('refuses a rejection with %s', async (_label, body) => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const id = idOf(await create(staff.token, h.hotelId).expect(201));
      await action(staff.token, id, 'submit').expect(200);
      const res = await action(h.token, id, 'reject', body).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      const stored = await t.prisma.marketingContent.findFirstOrThrow();
      expect(stored.status).toBe('PENDING_APPROVAL');
    });

    it('lets staff with MARKETING approve what an older client submitted, but not the front desk', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const other = await writer(h.hotelId, 'other@hotel.test');
      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const id = idOf(await create(staff.token, h.hotelId).expect(201));
      await action(staff.token, id, 'submit').expect(200);
      await action(desk.token, id, 'approve').expect(403);
      await action(other.token, id, 'approve').expect(200);
    });

    it('refuses an edit that changes nothing, or a field it does not know', async () => {
      const h = await hotel();
      const id = idOf(await create(h.token, h.hotelId).expect(201));
      for (const body of [{}, { status: 'APPROVED' }, { body: '' }]) {
        const res = await t
          .api()
          .patch(`/api/v1/marketing-content/${id}`)
          .set(auth(h.token))
          .send(body)
          .expect(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
      }
    });

    it('can still edit a piece an older client submitted', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const id = idOf(await create(staff.token, h.hotelId).expect(201));
      await action(staff.token, id, 'submit').expect(200);
      const res = await t
        .api()
        .patch(`/api/v1/marketing-content/${id}`)
        .set(auth(staff.token))
        .send({ body: 'Sửa lúc đang chờ duyệt' })
        .expect(200);
      expect(res.body.data.body).toBe('Sửa lúc đang chờ duyệt');
    });

    it('deletes a draft, which then reads as not found', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const id = idOf(await create(staff.token, h.hotelId).expect(201));
      await t
        .api()
        .delete(`/api/v1/marketing-content/${id}`)
        .set(auth(staff.token))
        .expect(204);
      const res = await t
        .api()
        .get(`/api/v1/marketing-content/${id}`)
        .set(auth(staff.token))
        .expect(404);
      expect(res.body.code).toBe('CONTENT_NOT_FOUND');
    });

    it('answers CONTENT_NOT_FOUND for an id that is not a uuid', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .get('/api/v1/marketing-content/not-a-uuid')
        .set(auth(h.token))
        .expect(404);
      expect(res.body.code).toBe('CONTENT_NOT_FOUND');
    });
  });

  describe('listing', () => {
    it('pages the list, newest first, and filters by content type', async () => {
      const h = await hotel();
      for (const contentType of ['POST', 'BLOG', 'POST']) {
        await create(h.token, h.hotelId, {
          contentType,
          body: `Bài ${contentType}`,
        }).expect(201);
      }
      const page = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/marketing-content?page=1&pageSize=2`)
        .set(auth(h.token))
        .expect(200);
      expect(page.body.data).toHaveLength(2);
      expect(page.body.meta).toMatchObject({ total: 3, page: 1 });

      const blogs = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/marketing-content?contentType=BLOG`)
        .set(auth(h.token))
        .expect(200);
      expect(
        (blogs.body.data as { contentType: string }[]).map(
          (c) => c.contentType,
        ),
      ).toEqual(['BLOG']);
    });

    it('refuses an unknown status filter', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/marketing-content?status=LOST`)
        .set(auth(h.token))
        .expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('the AI picture', () => {
    it.each([
      ['a prompt under 5 characters', { prompt: 'abc' }],
      ['a prompt over 500 characters', { prompt: 'a'.repeat(501) }],
      ['an unknown field', { size: '1024x1024' }],
    ])('refuses %s, without drawing', async (_label, body) => {
      const h = await hotel();
      const id = idOf(await create(h.token, h.hotelId).expect(201));
      const res = await action(h.token, id, 'image/generate', body).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(t.ai.images).toHaveLength(0);
    });

    it('needs the MARKETING permission to draw', async () => {
      const h = await hotel();
      const id = idOf(await create(h.token, h.hotelId).expect(201));
      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      await action(desk.token, id, 'image/generate').expect(403);
      expect(t.ai.images).toHaveLength(0);
    });

    it('will not draw for a post that has gone out', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      const id = idOf(await create(staff.token, h.hotelId).expect(201));
      await t.prisma.marketingContent.update({
        where: { marketingContentId: id },
        data: { status: 'PUBLISHED' },
      });
      const res = await action(staff.token, id, 'image/generate').expect(409);
      expect(res.body.code).toBe('CONTENT_STATUS_CONFLICT');
      expect(t.ai.images).toHaveLength(0);
    });
  });

  describe('the brand voice', () => {
    it('lets staff with MARKETING change it, and the rest of the staff only read it', async () => {
      const h = await hotel();
      const staff = await writer(h.hotelId);
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(h.token))
        .send({ summary: 'Ấm áp, xưng "mình".' })
        .expect(200);

      const read = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(staff.token))
        .expect(200);
      expect(read.body.data.summary).toBe('Ấm áp, xưng "mình".');

      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(desk.token))
        .expect(200);
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(desk.token))
        .send({ summary: 'Đổi giọng' })
        .expect(403);
      await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/brand-voice/learn`)
        .set(auth(desk.token))
        .send({ samples: ['Bài một khá dài để học.', 'Bài hai cũng khá dài.'] })
        .expect(403);
      expect(t.ai.calls).toHaveLength(0);

      const changed = await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(staff.token))
        .send({ summary: 'Đổi giọng' })
        .expect(200);
      expect(changed.body.data.summary).toBe('Đổi giọng');
    });

    it('sends the voice the owner set to the writer', async () => {
      const h = await hotel();
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(h.token))
        .send({ summary: 'Trẻ trung, nhiều emoji', forbiddenWords: 'rẻ nhất' })
        .expect(200);
      await generate(h.token, h.hotelId).expect(201);
      expect(t.ai.calls[0].system).toContain('Trẻ trung, nhiều emoji');
      expect(t.ai.calls[0].system).toContain('rẻ nhất');
    });
  });
});
