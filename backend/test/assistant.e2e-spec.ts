import { createTestApp } from './helpers';

/**
 * Recommendations served from a training run, and the assistant's tool loop with the model scripted (FakeAi): what
 * the tools hand the model, what is stored, and that only the customer's own click books.
 */
describe('Recommendations and assistant (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel in Đà Nẵng with one room type and two rooms. */
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
    return { hotelId, roomTypeId };
  };

  /** A finished training run that ranks `hotelIds` for `customerId` (and for signed-out visitors), in that order. */
  const run = async (customerId: string, hotelIds: string[]) => {
    const r = await t.prisma.modelRun.create({
      data: {
        algorithm: 'stayreco-two-sided',
        version: '1.0',
        status: 'COMPLETED',
        startedAt: new Date(),
        finishedAt: new Date(),
      },
    });
    await t.prisma.recommendation.createMany({
      data: [customerId, null].flatMap((c) =>
        hotelIds.map((hotelId, i) => ({
          customerId: c,
          hotelId,
          modelRunId: r.modelRunId,
          score: 4.5 - i * 0.1,
          rank: i + 1,
          reason: c ? `Lý do ${i + 1}` : 'Được khách StayReco đánh giá cao.',
        })),
      ),
    });
    return r.modelRunId;
  };

  const start = (token: string, content: string) =>
    t.api().post('/api/v1/me/conversations').set(auth(token)).send({ content });

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

  describe('recommendations', () => {
    it('is empty before the first training run', async () => {
      const res = await t.api().get('/api/v1/recommendations').expect(200);
      expect(res.body.data).toEqual({
        personalized: false,
        modelRun: null,
        items: [],
      });
    });

    it("serves the customer's own list, filtered by city ignoring accents", async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const b = await hotel('Núi Đồi', 'b@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await run(me.id, [b.hotelId, a.hotelId]);

      const res = await t
        .api()
        .get('/api/v1/me/recommendations?city=da%20nang')
        .set(auth(me.token))
        .expect(200);
      const data = res.body.data as {
        personalized: boolean;
        items: {
          name: string;
          rank: number;
          reason: string;
          isNew: boolean;
          pricePerNightFrom: number;
        }[];
      };
      expect(data.personalized).toBe(true);
      expect(data.items.map((h) => [h.name, h.rank, h.reason])).toEqual([
        ['Núi Đồi', 1, 'Lý do 1'],
        ['Biển Xanh', 2, 'Lý do 2'],
      ]);
      expect(data.items[0]).toMatchObject({
        isNew: true,
        pricePerNightFrom: 1000000,
      });

      const elsewhere = await t
        .api()
        .get('/api/v1/me/recommendations?city=Hà Nội')
        .set(auth(me.token))
        .expect(200);
      expect(elsewhere.body.data.items).toEqual([]);
    });

    it('gives a customer the run did not know the signed-out list, and never a suspended hotel', async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const b = await hotel('Núi Đồi', 'b@hotel.test');
      const known = await t.signIn('CUSTOMER', 'known@guest.test');
      await run(known.id, [a.hotelId, b.hotelId]);
      await t.prisma.hotel.update({
        where: { hotelId: a.hotelId },
        data: { status: 'SUSPENDED' },
      });
      const newcomer = await t.signIn('CUSTOMER', 'new@guest.test');

      const res = await t
        .api()
        .get('/api/v1/me/recommendations')
        .set(auth(newcomer.token))
        .expect(200);
      expect(res.body.data.personalized).toBe(false);
      expect(
        (res.body.data.items as { name: string }[]).map((h) => h.name),
      ).toEqual(['Núi Đồi']);
    });
  });

  describe('assistant', () => {
    it("searches with the customer's recommendations first, and stores the turn with its tool calls", async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const b = await hotel('Núi Đồi', 'b@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await run(me.id, [b.hotelId]);
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
        { text: 'Bạn có thể thử Núi Đồi hoặc Biển Xanh.' },
      ];

      const res = await start(me.token, 'Đi Đà Nẵng 2 đêm, 2 người').expect(
        201,
      );

      const [search] = t.ai.lastToolResults();
      const found = (
        search.response as {
          hotels: {
            name: string;
            recommendedForThisGuest: number | null;
            totalForStay: number;
          }[];
        }
      ).hotels;
      expect(found.map((h) => [h.name, h.recommendedForThisGuest])).toEqual([
        ['Núi Đồi', 1],
        ['Biển Xanh', null],
      ]);
      expect(found[0].totalForStay).toBe(2000000);
      expect(t.ai.chats[0].system).toContain('me');

      const reply = res.body.data.reply as {
        role: string;
        content: string;
        hotels: { id: string; reason: string | null }[];
        proposal: unknown;
      };
      expect(reply.role).toBe('ASSISTANT');
      expect(reply.hotels.map((h) => [h.id, h.reason])).toEqual([
        [b.hotelId, 'Lý do 1'],
        [a.hotelId, null],
      ]);
      expect(reply.proposal).toBeNull();

      const conversation = await t
        .api()
        .get(`/api/v1/conversations/${res.body.data.conversationId}`)
        .set(auth(me.token))
        .expect(200);
      expect(
        (conversation.body.data.messages as { role: string }[]).map(
          (m) => m.role,
        ),
      ).toEqual(['USER', 'ASSISTANT']);
      expect(await t.prisma.aiFunctionCall.count()).toBe(1);
    });

    it("books a proposal once, on the customer's click, and links the booking to the recommendation", async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await run(me.id, [a.hotelId]);
      const stay = {
        hotelId: a.hotelId,
        checkIn: day(10),
        checkOut: day(12),
        guests: 2,
      };
      t.ai.script = [
        {
          calls: [
            {
              name: 'propose_booking',
              args: {
                ...stay,
                roomTypeId: a.roomTypeId,
                contactPhone: '0901234567',
              },
            },
          ],
        },
        { text: 'Bấm "Xác nhận đặt phòng" nhé.' },
      ];
      const res = await start(me.token, 'Đặt phòng Deluxe ở Biển Xanh').expect(
        201,
      );
      const { conversationId } = res.body.data as { conversationId: string };
      const proposal = res.body.data.reply.proposal as {
        id: string;
        total: number;
        bookingId: string | null;
      };
      expect(proposal).toMatchObject({ total: 2000000, bookingId: null });
      // The assistant only proposed: nothing is booked yet.
      expect(await t.prisma.booking.count()).toBe(0);

      const confirm = () =>
        t
          .api()
          .post(`/api/v1/conversations/${conversationId}/confirm-booking`)
          .set(auth(me.token))
          .send({ proposalId: proposal.id });
      const booked = await confirm().expect(201);
      expect(booked.body.data).toMatchObject({ status: 'PENDING' });
      const again = await confirm().expect(409);
      expect(again.body.code).toBe('BOOKING_PROPOSAL_INVALID');

      const booking = await t.prisma.booking.findFirstOrThrow({
        select: { recommendationId: true, contactPhone: true },
      });
      expect(booking.recommendationId).not.toBeNull();
      expect(booking.contactPhone).toBe('0901234567');
      const after = await t
        .api()
        .get(`/api/v1/conversations/${conversationId}`)
        .set(auth(me.token))
        .expect(200);
      const messages = after.body.data.messages as {
        role: string;
        proposal: { bookingId: string } | null;
      }[];
      expect(messages.map((m) => m.role)).toEqual([
        'USER',
        'ASSISTANT',
        'SYSTEM',
      ]);
      expect(messages[1].proposal!.bookingId).toBe(booked.body.data.id);
    });

    it('tells the model why a proposal cannot be made, instead of making one', async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const b = await hotel('Núi Đồi', 'b@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const stay = { checkIn: day(10), checkOut: day(12), guests: 2 };
      t.ai.script = [
        {
          calls: [
            // Another hotel's room type, then a stay too big for the room, then no phone on the account.
            {
              name: 'propose_booking',
              args: {
                ...stay,
                hotelId: a.hotelId,
                roomTypeId: b.roomTypeId,
                contactPhone: '0901234567',
              },
            },
            {
              name: 'propose_booking',
              args: {
                ...stay,
                guests: 3,
                hotelId: a.hotelId,
                roomTypeId: a.roomTypeId,
                contactPhone: '0901234567',
              },
            },
            {
              name: 'propose_booking',
              args: { ...stay, hotelId: a.hotelId, roomTypeId: a.roomTypeId },
            },
          ],
        },
        { text: 'Cho mình xin số điện thoại nhé.' },
      ];
      const res = await start(me.token, 'Đặt giúp mình').expect(201);
      const errors = t.ai
        .lastToolResults()
        .map((r) => (r.response as { error?: string }).error);
      expect(errors).toEqual([
        'Loại phòng này không thuộc khách sạn đã chọn',
        expect.stringContaining('tối đa 2 khách'),
        expect.stringContaining('số điện thoại'),
      ]);
      expect(res.body.data.reply.proposal).toBeNull();
    });

    it("keeps one customer out of another's conversation", async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const other = await t.signIn('CUSTOMER', 'other@guest.test');
      t.ai.script = [{ text: 'Chào bạn!' }];
      const res = await start(me.token, 'Xin chào').expect(201);
      const id = res.body.data.conversationId as string;

      for (const path of [
        `/api/v1/conversations/${id}`,
        '/api/v1/conversations/not-a-uuid',
      ]) {
        const r = await t.api().get(path).set(auth(other.token)).expect(404);
        expect(r.body.code).toBe('CONVERSATION_NOT_FOUND');
      }
      await t
        .api()
        .post(`/api/v1/conversations/${id}/messages`)
        .set(auth(other.token))
        .send({ content: 'hi' })
        .expect(404);
      const mine = await t
        .api()
        .get('/api/v1/me/conversations')
        .set(auth(other.token))
        .expect(200);
      expect(mine.body.data).toEqual([]);
    });

    it('stores nothing when the customer is over the assistant budget', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.budgetLeft = 0;
      const res = await start(me.token, 'Xin chào').expect(403);
      expect(res.body.code).toBe('AI_BUDGET_EXCEEDED');
      expect(await t.prisma.conversation.count()).toBe(0);
    });
  });
});
