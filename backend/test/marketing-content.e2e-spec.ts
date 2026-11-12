import { createTestApp } from './helpers';

describe('Marketing content and approval (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel with one room type and two rooms. */
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
    const typeRes = await t
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
    const roomTypeId = idOf(typeRes);
    for (const roomNumber of ['101', '102']) {
      await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/rooms`)
        .set(auth(partner.token))
        .send({ roomTypeId, roomNumber })
        .expect(201);
    }
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId, roomTypeId };
  };

  const generate = (token: string, hotelId: string, body: object = {}) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/marketing-content/generate`)
      .set(auth(token))
      .send({ contentType: 'POST', brief: 'Cuối tuần còn phòng', ...body });

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

  describe('Generating', () => {
    it('writes a draft and sends the brand voice to the model', async () => {
      const h = await hotel();
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/brand-voice`)
        .set(auth(h.token))
        .send({ summary: 'Ấm áp, xưng "mình"', forbiddenWords: 'đẳng cấp' })
        .expect(200);

      const res = await generate(h.token, h.hotelId).expect(201);
      expect(res.body.data).toMatchObject({
        status: 'DRAFT',
        contentType: 'POST',
        title: 'Cuối tuần bên sông Hàn',
      });

      const call = t.ai.calls.at(-1)!;
      expect(call.purpose).toBe('marketing-content');
      expect(call.system).toContain('xưng "mình"');
      expect(call.system).toContain('đẳng cấp');
      expect(call.prompt).toContain('Cuối tuần còn phòng');
    });

    it('still writes for a hotel that has set no voice up', async () => {
      const h = await hotel();
      await generate(h.token, h.hotelId).expect(201);
      expect(t.ai.calls.at(-1)!.system).toContain('no brand voice');
    });

    it('shapes the brief by platform', async () => {
      const h = await hotel();
      await generate(h.token, h.hotelId, { platform: 'TIKTOK' }).expect(201);
      expect(t.ai.calls.at(-1)!.prompt).toContain('TikTok');
    });

    it('tells the model never to invent a price or a date', async () => {
      const h = await hotel();
      await generate(h.token, h.hotelId).expect(201);
      expect(t.ai.calls.at(-1)!.system).toContain('Never invent a fact');
    });

    it('refuses a hotel over its budget, without calling the model', async () => {
      const h = await hotel();
      t.ai.budgetLeft = 0;
      const res = await generate(h.token, h.hotelId);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('AI_BUDGET_EXCEEDED');
      expect(t.ai.calls).toHaveLength(0);
    });
  });

  describe('The approval round trip', () => {
    it('goes draft, submitted, approved', async () => {
      const h = await hotel();
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'MARKETING',
      ]);
      const draft = await generate(staff.token, h.hotelId).expect(201);
      const id = idOf(draft);
      // The staff member who asked for it is on the record.
      expect(draft.body.data.authorName).toBe('Staff');

      const submitted = await t
        .api()
        .post(`/api/v1/marketing-content/${id}/submit`)
        .set(auth(staff.token))
        .expect(200);
      expect(submitted.body.data.status).toBe('PENDING_APPROVAL');

      const approved = await t
        .api()
        .post(`/api/v1/marketing-content/${id}/approve`)
        .set(auth(h.token))
        .expect(200);
      expect(approved.body.data.status).toBe('APPROVED');
    });

    it('keeps staff from approving their own writing', async () => {
      const h = await hotel();
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'MARKETING',
      ]);
      const id = idOf(await generate(staff.token, h.hotelId).expect(201));
      await t
        .api()
        .post(`/api/v1/marketing-content/${id}/submit`)
        .set(auth(staff.token))
        .expect(200);

      const res = await t
        .api()
        .post(`/api/v1/marketing-content/${id}/approve`)
        .set(auth(staff.token));
      expect(res.status).toBe(403);
    });

    it('sends content back with a reason the writer can read', async () => {
      const h = await hotel();
      const id = idOf(await generate(h.token, h.hotelId).expect(201));
      await t
        .api()
        .post(`/api/v1/marketing-content/${id}/submit`)
        .set(auth(h.token))
        .expect(200);

      await t
        .api()
        .post(`/api/v1/marketing-content/${id}/reject`)
        .set(auth(h.token))
        .send({ reason: 'Đừng nhắc giá, mình chưa chốt.' })
        .expect(200);

      const res = await t
        .api()
        .get(`/api/v1/marketing-content/${id}`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        status: 'REJECTED',
        rejectedReason: 'Đừng nhắc giá, mình chưa chốt.',
      });
    });

    it('puts a rejected piece back to draft when it is edited', async () => {
      const h = await hotel();
      const id = idOf(await generate(h.token, h.hotelId).expect(201));
      await t
        .api()
        .post(`/api/v1/marketing-content/${id}/submit`)
        .set(auth(h.token))
        .expect(200);
      await t
        .api()
        .post(`/api/v1/marketing-content/${id}/reject`)
        .set(auth(h.token))
        .send({ reason: 'Viết lại' })
        .expect(200);

      const res = await t
        .api()
        .patch(`/api/v1/marketing-content/${id}`)
        .set(auth(h.token))
        .send({ body: 'Bản viết lại.' })
        .expect(200);
      expect(res.body.data).toMatchObject({
        status: 'DRAFT',
        body: 'Bản viết lại.',
      });
    });

    it('freezes the text once it is approved', async () => {
      const h = await hotel();
      const id = idOf(await generate(h.token, h.hotelId).expect(201));
      for (const action of ['submit', 'approve']) {
        await t
          .api()
          .post(`/api/v1/marketing-content/${id}/${action}`)
          .set(auth(h.token))
          .expect(200);
      }

      const edit = await t
        .api()
        .patch(`/api/v1/marketing-content/${id}`)
        .set(auth(h.token))
        .send({ body: 'Sửa sau khi duyệt' });
      expect(edit.status).toBe(409);
      expect(edit.body.code).toBe('CONTENT_STATUS_CONFLICT');

      const remove = await t
        .api()
        .delete(`/api/v1/marketing-content/${id}`)
        .set(auth(h.token));
      expect(remove.status).toBe(409);
    });

    it("keeps one hotel out of another's content", async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const id = idOf(await generate(h.token, h.hotelId).expect(201));

      const res = await t
        .api()
        .get(`/api/v1/marketing-content/${id}`)
        .set(auth(other.token));
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('CONTENT_NOT_FOUND');
    });
  });

  describe('Listing', () => {
    it('filters by status, which is what an approval queue needs', async () => {
      const h = await hotel();
      const waiting = idOf(await generate(h.token, h.hotelId).expect(201));
      await generate(h.token, h.hotelId).expect(201);
      await t
        .api()
        .post(`/api/v1/marketing-content/${waiting}/submit`)
        .set(auth(h.token))
        .expect(200);

      const res = await t
        .api()
        .get(
          `/api/v1/hotels/${h.hotelId}/marketing-content?status=PENDING_APPROVAL`,
        )
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(waiting);
    });
  });

  describe('Ideas', () => {
    it('suggests the empty rooms and the running promotion, without calling the model', async () => {
      const h = await hotel();
      await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/promotions`)
        .set(auth(h.token))
        .send({
          name: 'Giảm 10% cuối năm',
          discountType: 'PERCENTAGE',
          discountValue: 10,
        })
        .expect(201);

      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/marketing-content/ideas`)
        .set(auth(h.token))
        .expect(200);

      const kinds = (res.body.data as { kind: string }[]).map((i) => i.kind);
      expect(kinds).toContain('FREE_ROOMS');
      expect(kinds).toContain('PROMOTION');
      // Suggestions are database queries; they must cost nothing.
      expect(t.ai.calls).toHaveLength(0);
    });

    it('drops the empty-rooms idea once every room is taken', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      for (let i = 0; i < 2; i++) {
        await t
          .api()
          .post('/api/v1/bookings')
          .set(auth(guest.token))
          .send({
            roomTypeId: h.roomTypeId,
            checkIn: day(0),
            checkOut: day(2),
            rooms: 1,
            guests: 1,
            guestName: 'Nguyễn Văn A',
            contactPhone: '0905123456',
            expectedTotal: 2000000,
          })
          .expect(201);
      }

      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/marketing-content/ideas`)
        .set(auth(h.token))
        .expect(200);
      const kinds = (res.body.data as { kind: string }[]).map((i) => i.kind);
      expect(kinds).not.toContain('FREE_ROOMS');
    });
  });
});
