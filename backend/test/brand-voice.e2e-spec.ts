import { createTestApp } from './helpers';

describe('Brand voice and the AI budget (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;

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
    return { ...partner, hotelId: idOf(created) };
  };

  const samples = [
    'Sáng nay sương còn trên sông Hàn, mình pha sẵn cà phê chờ bạn xuống. Phòng hướng biển vẫn còn vài chỗ cuối tuần này nhé.',
    'Bữa sáng hôm nay có bánh mì nóng và mì Quảng. Ăn xong đi bộ 5 phút là tới chợ đêm, tiện lắm bạn ơi.',
  ];

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('GET /hotels/:hotelId/brand-voice', () => {
    it('is empty until a voice has been set up', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        summary: null,
        audience: null,
        highlights: null,
        forbiddenWords: null,
        updatedAt: null,
      });
    });
  });

  describe('POST /hotels/:hotelId/brand-voice/learn', () => {
    it('reads the posts and saves the voice the model found', async () => {
      const h = await hotel();

      const res = await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/brand-voice/learn`)
        .set(auth(h.token))
        .send({ samples })
        .expect(200);

      expect(res.body.data.summary).toContain('xưng "mình"');
      expect(res.body.data.updatedAt).not.toBeNull();

      // Both posts reached the model, under the purpose the usage log records.
      expect(t.ai.calls).toHaveLength(1);
      expect(t.ai.calls[0].purpose).toBe('brand-voice');
      expect(t.ai.calls[0].prompt).toContain('sông Hàn');
      expect(t.ai.calls[0].prompt).toContain('mì Quảng');
    });

    it('keeps the voice on a second read, replacing it rather than piling up', async () => {
      const h = await hotel();
      await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/brand-voice/learn`)
        .set(auth(h.token))
        .send({ samples })
        .expect(200);

      t.ai.answer = {
        summary: 'Trang trọng, xưng "quý khách".',
        audience: 'Khách doanh nhân',
        highlights: 'phòng họp, đưa đón sân bay',
      };
      const res = await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/brand-voice/learn`)
        .set(auth(h.token))
        .send({ samples })
        .expect(200);

      expect(res.body.data.summary).toContain('quý khách');
      const rows = await t.prisma.aiConfig.count({
        where: { configKey: 'brand_voice_summary' },
      });
      expect(rows).toBe(1);
    });

    it('refuses fewer than two posts, and one that is barely a sentence', async () => {
      const h = await hotel();
      for (const bad of [[samples[0]], ['quá ngắn', samples[0]]]) {
        const res = await t
          .api()
          .post(`/api/v1/hotels/${h.hotelId}/brand-voice/learn`)
          .set(auth(h.token))
          .send({ samples: bad });
        expect(res.status).toBe(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
      }
      expect(t.ai.calls).toHaveLength(0);
    });

    it('refuses a hotel that has used its budget, without calling the model', async () => {
      const h = await hotel();
      t.ai.budgetLeft = 0;

      const res = await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/brand-voice/learn`)
        .set(auth(h.token))
        .send({ samples });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('AI_BUDGET_EXCEEDED');
      expect(t.ai.calls).toHaveLength(0);
    });

    it("keeps one hotel out of another's brand voice", async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');

      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(other.token));
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /hotels/:hotelId/brand-voice', () => {
    it('writes the fields given, removes nulls and leaves the rest alone', async () => {
      const h = await hotel();
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(h.token))
        .send({ summary: 'Thân thiện', forbiddenWords: 'sang chảnh, đẳng cấp' })
        .expect(200);

      const res = await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(h.token))
        .send({ forbiddenWords: null, audience: 'Khách nước ngoài' })
        .expect(200);

      expect(res.body.data).toMatchObject({
        summary: 'Thân thiện',
        forbiddenWords: null,
        audience: 'Khách nước ngoài',
      });
    });

    it('refuses an empty body', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(h.token))
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /hotels/:hotelId/ai-budget', () => {
    it('reports what is left of the monthly cap', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/ai-budget`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        spentUsd: 0,
        limitUsd: 5,
        remainingUsd: 5,
      });
    });
  });
});
