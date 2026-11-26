import { createTestApp } from './helpers';

/**
 * More cases for the customer assistant and the recommendations it reads (docs/api/assistant.md): who may call it,
 * what it accepts, multi-turn history, the tool loop's edges, and every way confirming a proposal can go wrong.
 * The model is scripted with FakeAi, as in assistant.e2e-spec.ts.
 */
describe('Assistant edge cases (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel in Đà Nẵng with one room type (1,000,000 a night) and two rooms. */
  const hotel = async (name: string, email: string) => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const hotelId = idOf(
      await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(partner.token))
        .send({
          name,
          address: '1 Bạch Đằng',
          city: 'Đà Nẵng',
          email: `contact-${email}`,
          checkInTime: '14:00',
        })
        .expect(201),
    );
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    const roomTypeId = idOf(
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
        .expect(201),
    );
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
    return { hotelId, roomTypeId, partner };
  };

  const start = (token: string, body: Record<string, unknown>) =>
    t.api().post('/api/v1/me/conversations').set(auth(token)).send(body);

  /** Has the scripted model propose the Deluxe room of `h` for two nights, and returns the proposal. */
  const propose = async (
    token: string,
    h: { hotelId: string; roomTypeId: string },
  ) => {
    t.ai.script = [
      {
        calls: [
          {
            name: 'propose_booking',
            args: {
              hotelId: h.hotelId,
              roomTypeId: h.roomTypeId,
              checkIn: day(10),
              checkOut: day(12),
              guests: 2,
              contactPhone: '0901234567',
            },
          },
        ],
      },
      { text: 'Bấm "Xác nhận đặt phòng" nhé.' },
    ];
    const res = await start(token, { content: 'Đặt phòng Deluxe' }).expect(201);
    return {
      conversationId: res.body.data.conversationId as string,
      proposal: res.body.data.reply.proposal as {
        id: string;
        total: number;
        expiresAt: string;
      },
    };
  };

  const confirm = (token: string, conversationId: string, proposalId: string) =>
    t
      .api()
      .post(`/api/v1/conversations/${conversationId}/confirm-booking`)
      .set(auth(token))
      .send({ proposalId });

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
    await t.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE model_run RESTART IDENTITY CASCADE',
    );
  });

  afterAll(() => t.app.close());

  describe('who may chat', () => {
    it('asks a signed-out visitor to sign in on every assistant endpoint', async () => {
      const id = '00000000-0000-4000-8000-000000000000';
      // Factories: a supertest request starts its server when built, so each is built right before it is sent.
      const calls = [
        () => t.api().get('/api/v1/me/conversations'),
        () =>
          t
            .api()
            .post('/api/v1/me/conversations')
            .send({ content: 'Xin chào' }),
        () => t.api().get(`/api/v1/conversations/${id}`),
        () =>
          t
            .api()
            .post(`/api/v1/conversations/${id}/messages`)
            .send({ content: 'Xin chào' }),
        () =>
          t
            .api()
            .post(`/api/v1/conversations/${id}/confirm-booking`)
            .send({ proposalId: id }),
      ];
      for (const call of calls) {
        const res = await call().expect(401);
        expect(res.body.code).toBe('UNAUTHENTICATED');
      }
      expect(t.ai.chats).toHaveLength(0);
    });

    it.each(['HOTEL_PARTNER', 'PLATFORM_MANAGER', 'ADMIN'] as const)(
      'refuses a %s, who is not a customer, without calling the model',
      async (role) => {
        const other = await t.signIn(
          role,
          `x-${role.toLowerCase().replace('_', '-')}@role.test`,
        );
        await t
          .api()
          .get('/api/v1/me/conversations')
          .set(auth(other.token))
          .expect(403);
        await start(other.token, { content: 'Xin chào' }).expect(403);
        expect(t.ai.chats).toHaveLength(0);
        expect(await t.prisma.conversation.count()).toBe(0);
      },
    );

    it('refuses hotel staff too', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'BOOKING',
        'MARKETING',
      ]);
      await start(staff.token, { content: 'Xin chào' }).expect(403);
      expect(t.ai.chats).toHaveLength(0);
    });
  });

  describe('what a message may be', () => {
    it.each([
      ['an empty message', { content: '' }],
      ['only spaces', { content: '    ' }],
      ['no content at all', {}],
      ['a number', { content: 12345 }],
      ['over 2,000 characters', { content: 'a'.repeat(2001) }],
      ['an unknown channel', { content: 'Xin chào', channel: 'SMS' }],
      ['an unknown field', { content: 'Xin chào', hotelId: 'x' }],
    ])('refuses %s and stores nothing', async (_label, body) => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const res = await start(me.token, body).expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(t.ai.chats).toHaveLength(0);
      expect(await t.prisma.conversation.count()).toBe(0);
    });

    it('takes exactly 2,000 characters, trimmed', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [{ text: 'Đã đọc.' }];
      const res = await start(me.token, {
        content: `  ${'a'.repeat(2000)}  `,
      }).expect(201);
      expect(res.body.data.message.content).toBe('a'.repeat(2000));
    });

    it('records the channel of a new conversation, WEB by default', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [{ text: 'Chào!' }, { text: 'Chào lần nữa!' }];
      const web = await start(me.token, { content: 'Từ web' }).expect(201);
      const mobile = await start(me.token, {
        content: 'Từ điện thoại',
        channel: 'MOBILE',
      }).expect(201);
      const channelOf = async (id: string) =>
        (
          await t.prisma.conversation.findUniqueOrThrow({
            where: { conversationId: id },
          })
        ).channel;
      expect(await channelOf(web.body.data.conversationId as string)).toBe(
        'WEB',
      );
      expect(await channelOf(mobile.body.data.conversationId as string)).toBe(
        'MOBILE',
      );
    });

    it('keeps Vietnamese text and emoji exactly as typed', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [{ text: 'Dạ, mình tìm ngay ạ 🏖️' }];
      const text = 'Phòng view biển ở Nha Trang, giá dưới 2 triệu nhé 😊';
      const res = await start(me.token, { content: text }).expect(201);
      expect(res.body.data.message.content).toBe(text);
      expect(res.body.data.reply.content).toBe('Dạ, mình tìm ngay ạ 🏖️');
    });
  });

  describe('conversations', () => {
    it('lists only my conversations, newest first, with the first question cut to 120 characters', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [{ text: '1' }, { text: '2' }, { text: '3' }];
      const first = await start(me.token, {
        content: 'x'.repeat(200),
      }).expect(201);
      const second = await start(me.token, { content: 'Câu thứ hai' }).expect(
        201,
      );
      // Writing in the first one moves it back to the top.
      await t
        .api()
        .post(
          `/api/v1/conversations/${first.body.data.conversationId}/messages`,
        )
        .set(auth(me.token))
        .send({ content: 'Thêm một câu' })
        .expect(201);

      const list = await t
        .api()
        .get('/api/v1/me/conversations')
        .set(auth(me.token))
        .expect(200);
      const items = list.body.data as {
        id: string;
        preview: string;
        status: string;
      }[];
      expect(items.map((c) => c.id)).toEqual([
        first.body.data.conversationId,
        second.body.data.conversationId,
      ]);
      expect(items[0].preview).toBe('x'.repeat(120));
      expect(items[0].status).toBe('OPEN');
    });

    it('answers CONVERSATION_NOT_FOUND for an id that never existed', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const missing = '00000000-0000-4000-8000-000000000000';
      const get = await t
        .api()
        .get(`/api/v1/conversations/${missing}`)
        .set(auth(me.token))
        .expect(404);
      expect(get.body.code).toBe('CONVERSATION_NOT_FOUND');
      const send = await t
        .api()
        .post(`/api/v1/conversations/${missing}/messages`)
        .set(auth(me.token))
        .send({ content: 'Còn đó không?' })
        .expect(404);
      expect(send.body.code).toBe('CONVERSATION_NOT_FOUND');
      expect(t.ai.chats).toHaveLength(0);
    });

    it('replays the earlier turns, with the hotels shown, to the model on the next message', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [
        {
          calls: [
            {
              name: 'search_hotels',
              args: {
                destination: 'Đà Nẵng',
                checkIn: day(10),
                checkOut: day(12),
                guests: 2,
              },
            },
          ],
        },
        { text: 'Có Biển Xanh nhé.' },
        { text: 'Biển Xanh có phòng Deluxe.' },
      ];
      const res = await start(me.token, { content: 'Đà Nẵng 2 đêm' }).expect(
        201,
      );
      const id = res.body.data.conversationId as string;
      await t
        .api()
        .post(`/api/v1/conversations/${id}/messages`)
        .set(auth(me.token))
        .send({ content: 'Chỗ đầu tiên có phòng gì?' })
        .expect(201);

      const last = t.ai.chats.at(-1)!;
      const sent = JSON.stringify(last.contents);
      expect(sent).toContain('Đà Nẵng 2 đêm');
      expect(sent).toContain('Có Biển Xanh nhé.');
      expect(sent).toContain('Chỗ đầu tiên có phòng gì?');
      // The hotel's id still reaches the model, as lookup data in the system instruction, never in the model's own
      // turns, where the model learned to copy it into its answers.
      expect(last.system).toContain(`hotelId=${h.hotelId}`);
      expect(sent).not.toContain(h.hotelId);

      const thread = await t
        .api()
        .get(`/api/v1/conversations/${id}`)
        .set(auth(me.token))
        .expect(200);
      expect(
        (thread.body.data.messages as { role: string }[]).map((m) => m.role),
      ).toEqual(['USER', 'ASSISTANT', 'USER', 'ASSISTANT']);
    });

    it('stores nothing of a failed follow-up and keeps the conversation as it was', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [{ text: 'Chào bạn!' }];
      const res = await start(me.token, { content: 'Xin chào' }).expect(201);
      const id = res.body.data.conversationId as string;

      t.ai.budgetLeft = 0;
      const fail = await t
        .api()
        .post(`/api/v1/conversations/${id}/messages`)
        .set(auth(me.token))
        .send({ content: 'Câu này không được lưu' })
        .expect(403);
      expect(fail.body.code).toBe('AI_BUDGET_EXCEEDED');
      expect(
        await t.prisma.message.count({ where: { conversationId: id } }),
      ).toBe(2);
    });
  });

  describe('the tool loop', () => {
    it('tells the model about a tool it does not have, and still answers', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [
        { calls: [{ name: 'delete_everything', args: {} }] },
        { text: 'Xin lỗi, mình không làm được việc đó.' },
      ];
      const res = await start(me.token, { content: 'Làm gì đó lạ' }).expect(
        201,
      );
      expect(t.ai.lastToolResults()[0].response).toEqual({
        error: 'Không có công cụ delete_everything',
      });
      expect(res.body.data.reply.content).toBe(
        'Xin lỗi, mình không làm được việc đó.',
      );
    });

    it('hands back bad dates as a tool error instead of failing the turn', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [
        {
          calls: [
            {
              name: 'propose_booking',
              args: {
                hotelId: h.hotelId,
                roomTypeId: h.roomTypeId,
                checkIn: day(12),
                checkOut: day(10),
                guests: 2,
                contactPhone: '0901234567',
              },
            },
            {
              name: 'propose_booking',
              args: {
                hotelId: h.hotelId,
                roomTypeId: h.roomTypeId,
                checkIn: 'ngày mai',
                checkOut: 'ngày kia',
                guests: 2,
                contactPhone: '0901234567',
              },
            },
          ],
        },
        { text: 'Bạn cho mình ngày chính xác nhé.' },
      ];
      const res = await start(me.token, { content: 'Đặt giúp mình' }).expect(
        201,
      );
      for (const r of t.ai.lastToolResults()) {
        expect((r.response as { error?: string }).error).toBeTruthy();
      }
      expect(res.body.data.reply.proposal).toBeNull();
      expect(await t.prisma.booking.count()).toBe(0);
    });

    it('refuses to propose more rooms than are left', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [
        {
          calls: [
            {
              name: 'propose_booking',
              args: {
                hotelId: h.hotelId,
                roomTypeId: h.roomTypeId,
                checkIn: day(10),
                checkOut: day(12),
                guests: 3,
                rooms: 3,
                contactPhone: '0901234567',
              },
            },
          ],
        },
        { text: 'Chỉ còn 2 phòng.' },
      ];
      const res = await start(me.token, { content: 'Đặt 3 phòng' }).expect(201);
      expect(
        (t.ai.lastToolResults()[0].response as { error: string }).error,
      ).toContain('Chỉ còn 2 phòng');
      expect(res.body.data.reply.proposal).toBeNull();
    });

    it('stops after five rounds of tools and still writes a reply', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const search = {
        calls: [
          {
            name: 'search_hotels',
            args: {
              destination: 'Đà Nẵng',
              checkIn: day(10),
              checkOut: day(12),
              guests: 2,
            },
          },
        ],
      };
      // A model that never stops asking for tools.
      t.ai.script = Array.from({ length: 10 }, () => search);
      const res = await start(me.token, { content: 'Tìm mãi' }).expect(201);
      expect(t.ai.chats).toHaveLength(6);
      expect(res.body.data.reply.content.length).toBeGreaterThan(0);
    });

    it('gives a fallback answer when the model says nothing', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [{ text: '   ' }];
      const res = await start(me.token, { content: 'Ừm' }).expect(201);
      expect(res.body.data.reply.content).toContain('nói rõ hơn');
    });
  });

  describe('confirming a proposal', () => {
    it('refuses a proposal id that is not a uuid', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const { conversationId } = await propose(me.token, h);
      const res = await confirm(me.token, conversationId, 'not-a-uuid').expect(
        400,
      );
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(await t.prisma.booking.count()).toBe(0);
    });

    it('answers BOOKING_PROPOSAL_NOT_FOUND for a proposal of another conversation', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const first = await propose(me.token, h);
      t.ai.script = [{ text: 'Chào!' }];
      const other = await start(me.token, { content: 'Cuộc khác' }).expect(201);
      const res = await confirm(
        me.token,
        other.body.data.conversationId as string,
        first.proposal.id,
      ).expect(404);
      expect(res.body.code).toBe('BOOKING_PROPOSAL_NOT_FOUND');
      expect(await t.prisma.booking.count()).toBe(0);
    });

    it('will not let another customer book my proposal', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const other = await t.signIn('CUSTOMER', 'other@guest.test');
      const { conversationId, proposal } = await propose(me.token, h);
      const res = await confirm(
        other.token,
        conversationId,
        proposal.id,
      ).expect(404);
      expect(res.body.code).toBe('CONVERSATION_NOT_FOUND');
      expect(await t.prisma.booking.count()).toBe(0);
    });

    it('refuses a proposal older than 30 minutes', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const { conversationId, proposal } = await propose(me.token, h);
      await t.prisma.$executeRaw`
        UPDATE message
        SET metadata = jsonb_set(metadata, '{proposal,expiresAt}', to_jsonb((now() - interval '1 minute')::text))
        WHERE metadata->'proposal'->>'id' = ${proposal.id}`;
      const res = await confirm(me.token, conversationId, proposal.id).expect(
        409,
      );
      expect(res.body.code).toBe('BOOKING_PROPOSAL_INVALID');
      expect(await t.prisma.booking.count()).toBe(0);
    });

    it('answers BOOKING_PRICE_CHANGED when the price moved, and books once it is back', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const { conversationId, proposal } = await propose(me.token, h);
      expect(proposal.total).toBe(2000000);

      await t.prisma.price.updateMany({
        where: { roomTypeId: h.roomTypeId, ruleType: 'BASE' },
        data: { pricePerNight: 1500000 },
      });
      const moved = await confirm(me.token, conversationId, proposal.id).expect(
        409,
      );
      expect(moved.body.code).toBe('BOOKING_PRICE_CHANGED');
      expect(await t.prisma.booking.count()).toBe(0);

      // The failed click released the proposal: it books at the proposed price once that is right again.
      await t.prisma.price.updateMany({
        where: { roomTypeId: h.roomTypeId, ruleType: 'BASE' },
        data: { pricePerNight: 1000000 },
      });
      await confirm(me.token, conversationId, proposal.id).expect(201);
      expect(await t.prisma.booking.count()).toBe(1);
    });

    it('books once when the button is pressed twice at the same time', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const { conversationId, proposal } = await propose(me.token, h);
      const results = await Promise.all([
        confirm(me.token, conversationId, proposal.id),
        confirm(me.token, conversationId, proposal.id),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(await t.prisma.booking.count()).toBe(1);
    });

    it('books with the guest, phone and dates of the proposal, PENDING and unpaid', async () => {
      const h = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const { conversationId, proposal } = await propose(me.token, h);
      const res = await confirm(me.token, conversationId, proposal.id).expect(
        201,
      );
      expect(res.body.data).toMatchObject({
        status: 'PENDING',
        checkIn: day(10),
        checkOut: day(12),
        guests: 2,
        contactPhone: '0901234567',
      });
      const conversation = await t.prisma.conversation.findUniqueOrThrow({
        where: { conversationId },
      });
      expect(conversation.bookingId).toBe(res.body.data.id);
      expect(conversation.hotelId).toBe(h.hotelId);
    });
  });

  describe('recommendations', () => {
    it.each([
      ['limit 0', '?limit=0'],
      ['limit 21', '?limit=21'],
      ['a limit that is not a number', '?limit=abc'],
      ['an empty city', '?city='],
    ])('refuses %s', async (_label, query) => {
      const res = await t
        .api()
        .get(`/api/v1/recommendations${query}`)
        .expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('searches signed out without a token, but answers 401 to a revoked one so the app refreshes it', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const search = () =>
        t
          .api()
          .get('/api/v1/hotels')
          .query({
            destination: 'Đà Nẵng',
            checkIn: day(10),
            checkOut: day(12),
            guests: 2,
          });
      await search().expect(200);
      await search().set(auth(me.token)).expect(200);
      await t.prisma.authSession.updateMany({
        where: { userAccountId: me.id },
        data: { revokedAt: new Date() },
      });
      const res = await search().set(auth(me.token)).expect(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('serves the signed-out list without an account, and /me only to a signed-in customer', async () => {
      await t.api().get('/api/v1/recommendations').expect(200);
      await t.api().get('/api/v1/me/recommendations').expect(401);
      const partner = await t.signIn('HOTEL_PARTNER', 'p@hotel.test');
      await t
        .api()
        .get('/api/v1/me/recommendations')
        .set(auth(partner.token))
        .expect(403);
    });

    it('returns at most `limit` hotels, best first', async () => {
      const hotels: Awaited<ReturnType<typeof hotel>>[] = [];
      for (const n of [1, 2, 3])
        hotels.push(await hotel(`Khách sạn ${n}`, `h${n}@hotel.test`));
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const run = await t.prisma.modelRun.create({
        data: {
          algorithm: 'stayreco-two-sided',
          version: '1.0',
          status: 'COMPLETED',
          startedAt: new Date(),
          finishedAt: new Date(),
        },
      });
      await t.prisma.recommendation.createMany({
        data: hotels.map((h, i) => ({
          customerId: me.id,
          hotelId: h.hotelId,
          modelRunId: run.modelRunId,
          score: 4.5 - i * 0.1,
          rank: i + 1,
          reason: `Lý do ${i + 1}`,
        })),
      });
      const res = await t
        .api()
        .get('/api/v1/me/recommendations?limit=2')
        .set(auth(me.token))
        .expect(200);
      expect(res.body.data.personalized).toBe(true);
      expect(
        (res.body.data.items as { rank: number; reason: string }[]).map((i) => [
          i.rank,
          i.reason,
        ]),
      ).toEqual([
        [1, 'Lý do 1'],
        [2, 'Lý do 2'],
      ]);
    });
  });
});
