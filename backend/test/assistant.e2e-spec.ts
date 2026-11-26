import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
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
    return { hotelId, roomTypeId, owner: partner.token };
  };

  /** A finished training run that ranks `hotelIds` for `customerId` (and for signed-out visitors), in that order. */
  const run = async (customerId: string, hotelIds: string[]) => {
    const r = await t.prisma.modelRun.create({
      data: {
        algorithm: 'two-sided-shrinkage',
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
        source: 'POPULAR',
        modelRun: null,
        items: [],
        profile: null,
      });
    });

    it('ranks a customer the run does not know from the preferences they just gave, at once', async () => {
      const resort = await hotel('Sơn Trà Resort & Spa', 'a@hotel.test');
      const kids = await hotel('Mỹ Khê Kids Club Hotel', 'b@hotel.test');
      const away = await hotel('Hội An Beach Resort', 'c@hotel.test');
      await t.prisma.hotel.update({
        where: { hotelId: resort.hotelId },
        data: {
          description:
            'Khu nghỉ dưỡng ven biển, hồ bơi vô cực, spa và villa để thư giãn.',
        },
      });
      await t.prisma.hotel.update({
        where: { hotelId: kids.hotelId },
        data: {
          description:
            'Khách sạn gia đình, trẻ em, khu vui chơi, kids club và hồ bơi trẻ em.',
        },
      });
      await t.prisma.hotel.update({
        where: { hotelId: away.hotelId },
        data: {
          city: 'Hội An',
          description: 'Khu nghỉ dưỡng ven biển, bãi biển riêng, spa, villa.',
        },
      });
      const known = await t.signIn('CUSTOMER', 'known@guest.test');
      // A run exists, but it was made before this customer signed up.
      await run(known.id, [kids.hotelId]);
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await t.prisma.customerPreference.createMany({
        data: [
          {
            customerId: me.id,
            preferenceKey: 'travelStyles',
            preferenceValue: 'resort',
          },
          {
            customerId: me.id,
            preferenceKey: 'preferredCities',
            preferenceValue: 'Đà Nẵng',
          },
        ],
      });

      const res = await t
        .api()
        .get('/api/v1/me/recommendations')
        .set(auth(me.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        personalized: true,
        source: 'PREFERENCES',
      });
      const items = res.body.data.items as {
        id: string;
        reason: string;
        recommendationId: unknown;
      }[];
      // The resort in the city picked, then the resort elsewhere, then the hotel of another style.
      expect(items.map((h) => h.id)).toEqual([
        resort.hotelId,
        away.hotelId,
        kids.hotelId,
      ]);
      expect(items[0].reason).toBe(
        'Hợp sở thích bạn vừa chọn: phong cách nghỉ dưỡng & thư giãn; ở Đà Nẵng.',
      );
      expect(items[1].reason).toMatch(/^Ngoài điểm đến bạn chọn\./);
      expect(items[0].recommendationId).toBeNull();
      // Explained as the model would: everything from the preferences, no history yet.
      expect(res.body.data.items[0].explanation).toMatchObject({
        weights: { history: 0, content: 1, group: 0 },
        stays: 0,
        styles: ['nghỉ dưỡng & thư giãn'],
        inCity: true,
      });
      expect(res.body.data.profile).toMatchObject({
        stays: 0,
        weights: { history: 0, content: 1, group: 0 },
      });

      // Each card says what style the hotel is, read from its own description.
      expect(
        (res.body.data.items as { styles: string[] }[]).map((h) => h.styles),
      ).toEqual([['resort'], ['resort'], ['family']]);

      // The search's "Phù hợp nhất" follows the same order for this customer.
      const search = await t
        .api()
        .get(
          `/api/v1/hotels?destination=Đà Nẵng&checkIn=${day(10)}&checkOut=${day(12)}&guests=2`,
        )
        .set(auth(me.token))
        .expect(200);
      expect((search.body.data as { id: string }[]).map((h) => h.id)).toEqual([
        resort.hotelId,
        kids.hotelId,
      ]);
      expect(
        (search.body.data as { styles: string[] }[]).map((h) => h.styles),
      ).toEqual([['resort'], ['family']]);

      // A customer the run knows keeps the model's list.
      const theirs = await t
        .api()
        .get('/api/v1/me/recommendations')
        .set(auth(known.token))
        .expect(200);
      expect(theirs.body.data).toMatchObject({
        source: 'MODEL',
        items: [{ id: kids.hotelId }],
      });
    });

    it('explains each hotel of a model list and says what the list is built from', async () => {
      const resort = await hotel('Sơn Trà Resort & Spa', 'a@hotel.test');
      const fresh = await hotel('Mỹ Khê Bay Retreat', 'b@hotel.test');
      const booked = await hotel('Hàn River Loft', 'c@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await t.prisma.customerPreference.createMany({
        data: [
          ['travelStyles', 'resort,nature'],
          ['preferredCities', 'Đà Nẵng,Đà Lạt'],
          ['roomAmenities', 'pool'],
          ['likedHotels', resort.hotelId],
        ].map(([preferenceKey, preferenceValue]) => ({
          customerId: me.id,
          preferenceKey,
          preferenceValue,
        })),
      });
      // Their next stay: never on their list, and counted as left out.
      await t.prisma.booking.create({
        data: {
          customerId: me.id,
          hotelId: booked.hotelId,
          checkInDate: new Date(`${day(5)}T00:00:00Z`),
          checkOutDate: new Date(`${day(6)}T00:00:00Z`),
          totalAmount: 1000000,
          status: 'CONFIRMED',
          guestName: 'Khách',
          contactPhone: '0905123456',
          cancelFeePercent: 100,
          commissionRate: 8,
        },
      });
      // A stay that went ahead does not take the hotel off the list: the model brings back what they liked.
      await t.prisma.booking.create({
        data: {
          customerId: me.id,
          hotelId: resort.hotelId,
          checkInDate: new Date('2026-10-10T00:00:00Z'),
          checkOutDate: new Date('2026-10-11T00:00:00Z'),
          totalAmount: 1000000,
          status: 'COMPLETED',
          guestName: 'Khách',
          contactPhone: '0905123456',
          cancelFeePercent: 100,
          commissionRate: 8,
        },
      });
      const runId = await run(me.id, [resort.hotelId, fresh.hotelId]);
      const explain = (history: number, hotelRatings: number) => ({
        weights: { history, content: 1 - history, group: 0 },
        scores: { history: history ? 4.2 : null, content: 4.1, group: null },
        stays: 30,
        hotelRatings,
        own: null,
        similar: null,
        picked: null,
        styles: ['nghỉ dưỡng'],
        inCity: true,
        overBudget: false,
      });
      await t.prisma.recommendation.updateMany({
        where: {
          modelRunId: runId,
          customerId: me.id,
          hotelId: resort.hotelId,
        },
        data: { explanation: explain(0.8, 120) },
      });
      await t.prisma.recommendation.updateMany({
        where: { modelRunId: runId, customerId: me.id, hotelId: fresh.hotelId },
        data: { explanation: explain(0, 0) },
      });

      const res = await t
        .api()
        .get('/api/v1/me/recommendations')
        .set(auth(me.token))
        .expect(200);
      const data = res.body.data;
      expect(data.source).toBe('MODEL');
      expect((data.items as { id: string }[]).map((h) => h.id)).toEqual([
        resort.hotelId,
        fresh.hotelId,
      ]);
      expect(data.items[0].explanation).toEqual(explain(0.8, 120));
      expect(data.items[1].explanation.hotelRatings).toBe(0);
      expect(data.profile).toEqual({
        stays: 30,
        // The customer's side of the formula: 30 / (30 + 5).
        weights: { history: 0.857, content: 0.143, group: 0 },
        preferences: {
          cities: ['Đà Nẵng', 'Đà Lạt'],
          travelStyles: ['resort', 'nature'],
          roomAmenities: ['pool'],
          budgetPerNight: null,
          pickedHotels: 1,
        },
        budgetConflict: null,
        excluded: { disliked: 0, upcoming: 1 },
      });

      // The signed-out list has nothing to explain about a person.
      const pub = await t.api().get('/api/v1/recommendations').expect(200);
      expect(pub.body.data.profile).toBeNull();
    });

    it('says when no hotel of the chosen style is within budget, and lists hotels of one style on request', async () => {
      const kids = await hotel('Mỹ Khê Kids Club Hotel', 'a@hotel.test');
      const cafe = await hotel('Trại Mát Coffee House', 'b@hotel.test');
      await t.prisma.hotel.update({
        where: { hotelId: kids.hotelId },
        data: {
          description:
            'Khách sạn gia đình, trẻ em, khu vui chơi, kids club và hồ bơi trẻ em.',
        },
      });
      await t.prisma.hotel.update({
        where: { hotelId: cafe.hotelId },
        data: {
          description: 'Homestay cà phê, góc chụp ảnh, decor vintage.',
        },
      });
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await t.prisma.customerPreference.createMany({
        data: [
          ['travelStyles', 'family'],
          ['preferredCities', 'Đà Nẵng'],
          // Every room of the test hotels is 1,000,000 a night: over 500,000 with its 20% slack.
          ['budgetPerNight', '500000'],
        ].map(([preferenceKey, preferenceValue]) => ({
          customerId: me.id,
          preferenceKey,
          preferenceValue,
        })),
      });

      const res = await t
        .api()
        .get('/api/v1/me/recommendations')
        .set(auth(me.token))
        .expect(200);
      expect(res.body.data.profile.budgetConflict).toEqual({
        styles: ['family'],
        cities: ['Đà Nẵng'],
        budgetPerNight: 500000,
        cheapest: 1000000,
      });
      expect(
        (res.body.data.items as { styles: string[] }[]).map((h) => h.styles),
      ).toEqual(expect.arrayContaining([['family'], ['chill']]));

      const family = await t
        .api()
        .get('/api/v1/me/recommendations?style=family')
        .set(auth(me.token))
        .expect(200);
      expect(
        (family.body.data.items as { id: string }[]).map((h) => h.id),
      ).toEqual([kids.hotelId]);
      expect(family.body.data.items[0].explanation.overBudget).toBe(true);

      // Within budget, nothing to warn about.
      await t.prisma.customerPreference.updateMany({
        where: { customerId: me.id, preferenceKey: 'budgetPerNight' },
        data: { preferenceValue: '2000000' },
      });
      const fine = await t
        .api()
        .get('/api/v1/me/recommendations')
        .set(auth(me.token))
        .expect(200);
      expect(fine.body.data.profile.budgetConflict).toBeNull();
    });

    it('shows the admin how the served run did offline, its long tail and the bookings it brought', async () => {
      const a = await hotel('Sơn Trà Resort & Spa', 'a@hotel.test');
      const b = await hotel('Mỹ Khê Bay Retreat', 'b@hotel.test');
      const guest = await t.signIn('CUSTOMER', 'me@guest.test');
      const runId = await run(guest.id, [a.hotelId, b.hotelId]);
      const method = (recall: number) => ({
        rmse: 0.8,
        precision: 0.09,
        recall,
        ndcg: recall / 2,
        new_share: 0.2,
        coldstart_coverage: 0.9,
        coverage: 0.8,
        tail_share: 0.5,
        by_group: {
          '0-prefs': { users: 16, recall: recall - 0.1, ndcg: 0.2 },
          '5+': { users: 179, recall: recall + 0.1, ndcg: 0.3 },
        },
      });
      await t.prisma.modelRun.update({
        where: { modelRunId: runId },
        data: {
          k: 10,
          relevanceThreshold: 4,
          hyperparameters: {
            comparison: {
              'StayReco two-sided (served)': method(0.47),
              Popularity: method(0.17),
              Random: method(0.14),
            },
            split: {
              train: 3103,
              test: 1706,
              ranked_users: 385,
              catalog: 73,
              hidden_or_new_hotels: 30,
            },
          },
        },
      });
      const rec = await t.prisma.recommendation.findFirstOrThrow({
        where: { modelRunId: runId, customerId: guest.id, rank: 2 },
      });
      await t.prisma.booking.create({
        data: {
          customerId: guest.id,
          hotelId: b.hotelId,
          recommendationId: rec.recommendationId,
          checkInDate: new Date(`${day(5)}T00:00:00Z`),
          checkOutDate: new Date(`${day(6)}T00:00:00Z`),
          totalAmount: 1000000,
          status: 'CONFIRMED',
          guestName: 'Khách',
          contactPhone: '0905123456',
          cancelFeePercent: 100,
          commissionRate: 8,
        },
      });

      await t
        .api()
        .get('/api/v1/admin/recommender/evaluation')
        .set(auth(guest.token))
        .expect(403);
      const admin = await t.signIn('ADMIN', 'admin@stayreco.test');
      const res = await t
        .api()
        .get('/api/v1/admin/recommender/evaluation')
        .set(auth(admin.token))
        .expect(200);
      const data = res.body.data;
      expect(data.run).toMatchObject({ id: runId, customers: 1, hotels: 2 });
      expect(data.split).toEqual({
        train: 3103,
        test: 1706,
        rankedUsers: 385,
        catalog: 73,
        hiddenHotels: 30,
        k: 10,
        threshold: 4,
      });
      expect((data.methods as { key: string }[]).map((m) => m.key)).toEqual([
        'served',
        'popularity',
        'random',
      ]);
      expect(data.methods[0]).toMatchObject({
        recall: 0.47,
        tailShare: 0.5,
        byGroup: [
          { group: '0-prefs', users: 16, recall: 0.37, ndcg: 0.2 },
          { group: '5+', users: 179, recall: 0.57, ndcg: 0.3 },
        ],
      });
      // Every top-10 slot of the one customer list is in some band.
      const slots = (data.longTail as { slotShare: number }[]).reduce(
        (sum, band) => sum + band.slotShare,
        0,
      );
      expect(slots).toBeCloseTo(1);
      expect(data.bookings).toEqual({
        total: 1,
        fromRecommendations: 1,
        medianRank: 2,
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

    it('ranks by score before pagination and falls back for anonymous and unrated customers', async () => {
      const a = await hotel('An Bình', 'a@hotel.test');
      const b = await hotel('Bình An', 'b@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const newcomer = await t.signIn('CUSTOMER', 'new@guest.test');
      const modelRunId = await run(me.id, [a.hotelId, b.hotelId]);
      // The published rank decides, not the raw score: b is ranked first despite the lower predicted rating.
      await t.prisma.recommendation.updateMany({
        where: { modelRunId, customerId: me.id, hotelId: b.hotelId },
        data: { rank: 1 },
      });
      await t.prisma.recommendation.updateMany({
        where: { modelRunId, customerId: me.id, hotelId: a.hotelId },
        data: { rank: 2 },
      });
      await t.prisma.modelRun.createMany({
        data: [
          {
            algorithm: 'two-sided-shrinkage',
            version: 'test',
            status: 'FAILED',
            startedAt: new Date(),
          },
          {
            algorithm: 'unrelated',
            version: 'test',
            status: 'COMPLETED',
            startedAt: new Date(),
            finishedAt: new Date(),
          },
        ],
      });
      const query = {
        checkIn: day(2),
        checkOut: day(4),
        destination: 'Da Nang',
        guests: 2,
        sort: 'recommended',
        page: 1,
        pageSize: 1,
      };
      const publicResult = await t
        .api()
        .get('/api/v1/hotels')
        .query(query)
        .expect(200);
      expect(publicResult.body.data[0]).toMatchObject({ id: a.hotelId });
      const personal = await t
        .api()
        .get('/api/v1/hotels')
        .query(query)
        .set(auth(me.token))
        .expect(200);
      expect(personal.body.data[0]).toMatchObject({ id: b.hotelId });
      const fallback = await t
        .api()
        .get('/api/v1/hotels')
        .query(query)
        .set(auth(newcomer.token))
        .expect(200);
      expect(fallback.body.data).toEqual(publicResult.body.data);
      const suggestion = await t.prisma.recommendation.findFirstOrThrow({
        where: { modelRunId, customerId: me.id, hotelId: b.hotelId },
      });
      const book = (token: string) =>
        t
          .api()
          .post('/api/v1/bookings')
          .set(auth(token))
          .send({
            checkIn: query.checkIn,
            checkOut: query.checkOut,
            guests: 2,
            items: [{ roomTypeId: b.roomTypeId, rooms: 1 }],
            guestName: 'Guest Demo',
            contactPhone: '0901234567',
            expectedTotal: 2000000,
            recommendationId: suggestion.recommendationId,
          })
          .expect(201);
      const foreignBooking = await book(newcomer.token);
      const ownBooking = await book(me.token);
      const linked = await t.prisma.booking.findMany({
        where: { bookingId: { in: [idOf(foreignBooking), idOf(ownBooking)] } },
      });
      expect(
        linked.find((booking) => booking.customerId === newcomer.id)
          ?.recommendationId,
      ).toBeNull();
      expect(
        linked.find((booking) => booking.customerId === me.id)
          ?.recommendationId,
      ).toBe(suggestion.recommendationId);
      // A hotel the customer booked stays searchable, so they can book it again.
      const afterBooking = await t
        .api()
        .get('/api/v1/hotels')
        .query({
          ...query,
          // Other nights: both rooms of these were just booked.
          checkIn: day(6),
          checkOut: day(8),
          destination: 'Bình An',
          pageSize: 10,
        })
        .set(auth(me.token))
        .expect(200);
      expect(
        (afterBooking.body.data as { id: string }[]).map((h) => h.id),
      ).toContain(b.hotelId);
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
        { calls: [{ name: 'recommend_hotels', args: {} }] },

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

    it('keeps ids out of the model turns and out of every answer', async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await run(me.id, [a.hotelId]);
      t.ai.script = [
        { calls: [{ name: 'recommend_hotels', args: {} }] },
        // The habit being fixed: the model copies an internal note, ids and all, under its answer.
        {
          text: `Bạn thử Biển Xanh nhé.\n[Đã hiển thị: Biển Xanh (hotelId=${a.hotelId})]`,
        },
      ];
      const first = await start(me.token, 'Gợi ý giúp mình').expect(201);
      expect(first.body.data.reply.content).toBe('Bạn thử Biển Xanh nhé.');
      const { conversationId } = first.body.data as { conversationId: string };

      t.ai.script = [{ text: 'Biển Xanh có hồ bơi.' }];
      await t
        .api()
        .post(`/api/v1/conversations/${conversationId}/messages`)
        .set(auth(me.token))
        .send({ content: 'Cái đó có hồ bơi không?' })
        .expect(201);

      const sent = t.ai.chats.at(-1)!;
      const modelText = sent.contents
        .filter((c) => c.role === 'model')
        .flatMap((c) => c.parts ?? [])
        .map((p) => (typeof p.text === 'string' ? p.text : ''))
        .join('\n');
      // The id still reaches the model, as lookup data in the system instruction, not as its own words.
      expect(modelText).not.toContain(a.hotelId);
      expect(modelText).not.toContain('[');
      expect(sent.system).toContain(`hotelId=${a.hotelId}`);
      expect(sent.system).toContain('không viết id');
    });

    it('lists the guest vouchers and prices a proposal with a code, points and an add-on', async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const promo = await t
        .api()
        .post(`/api/v1/hotels/${a.hotelId}/promotions`)
        .set(auth(a.owner))
        .send({
          name: 'Giảm 10%',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          requiresCode: true,
        })
        .expect(201);
      const [voucher] = (
        await t
          .api()
          .post(`/api/v1/promotions/${idOf(promo)}/vouchers`)
          .set(auth(a.owner))
          .send({ customerIds: [me.id], expiresAt: day(30) })
          .expect(201)
      ).body.data as { code: string }[];
      const shuttle = idOf(
        await t
          .api()
          .post(`/api/v1/hotels/${a.hotelId}/add-ons`)
          .set(auth(a.owner))
          .send({
            name: 'Đưa đón sân bay',
            price: 300000,
            timing: 'BEFORE_STAY',
            prebookable: true,
          })
          .expect(201),
      );
      t.ai.script = [
        {
          calls: [
            { name: 'my_vouchers', args: {} },
            { name: 'get_hotel_rooms', args: { hotelId: a.hotelId } },
          ],
        },
        {
          calls: [
            {
              name: 'propose_booking',
              args: {
                hotelId: a.hotelId,
                roomTypeId: a.roomTypeId,
                checkIn: day(10),
                checkOut: day(12),
                guests: 2,
                contactPhone: '0901234567',
                code: voucher.code,
                addOns: [{ addOnId: shuttle, quantity: 1 }],
              },
            },
          ],
        },
        { text: 'Đề xuất đã áp mã và thêm xe đưa đón.' },
      ];
      const res = await start(
        me.token,
        'Có mã giảm giá không, thêm xe đưa đón',
      ).expect(201);

      const looked = t.ai.chats[1].contents
        .at(-1)!
        .parts!.map(
          (p) =>
            (p as { functionResponse: { response: unknown } }).functionResponse
              .response,
        );
      const vouchers = (
        looked[0] as { vouchers: { code: string; discount: string }[] }
      ).vouchers;
      expect(vouchers).toEqual([
        expect.objectContaining({ code: voucher.code, discount: '10%' }),
      ]);
      const addOns = (
        looked[1] as { addOns: { id: string; prebookable: boolean }[] }
      ).addOns;
      expect(addOns).toEqual([
        expect.objectContaining({ id: shuttle, prebookable: true }),
      ]);

      const proposal = res.body.data.reply.proposal as {
        id: string;
        total: number;
        subtotal: number;
        discount: { code: string; amount: number };
        addOns: { name: string; amount: number }[];
      };
      // 2,000,000 of rooms less 10%, plus 300,000 of shuttle, which is never discounted.
      expect(proposal).toMatchObject({
        subtotal: 2300000,
        total: 2100000,
        discount: { code: voucher.code, amount: 200000 },
        addOns: [{ name: 'Đưa đón sân bay', quantity: 1, amount: 300000 }],
      });

      const booked = await t
        .api()
        .post(
          `/api/v1/conversations/${res.body.data.conversationId}/confirm-booking`,
        )
        .set(auth(me.token))
        .send({ proposalId: proposal.id })
        .expect(201);
      expect(booked.body.data).toMatchObject({
        status: 'PENDING',
        invoice: { total: 2100000, discount: { code: voucher.code } },
        payment: { amount: 2100000 },
      });
    });

    it('tells the model why a code does not apply instead of proposing', async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [
        {
          calls: [
            {
              name: 'propose_booking',
              args: {
                hotelId: a.hotelId,
                roomTypeId: a.roomTypeId,
                checkIn: day(10),
                checkOut: day(12),
                guests: 2,
                contactPhone: '0901234567',
                code: 'KHONGCO',
              },
            },
          ],
        },
        { text: 'Mã này không dùng được.' },
      ];
      const res = await start(me.token, 'Đặt với mã KHONGCO').expect(201);
      expect(t.ai.lastToolResults()[0].response).toMatchObject({
        code: 'VOUCHER_NOT_FOUND',
      });
      expect(res.body.data.reply.proposal).toBeNull();
    });

    it("shows the guest's bookings and wallet, and cancels only on the guest's click", async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      const other = await t.signIn('CUSTOMER', 'other@guest.test');
      const booking = (
        await t
          .api()
          .post('/api/v1/bookings')
          .set(auth(me.token))
          .send({
            items: [{ roomTypeId: a.roomTypeId, rooms: 1 }],
            checkIn: day(10),
            checkOut: day(12),
            guests: 2,
            guestName: 'Khách',
            contactPhone: '0901234567',
            expectedTotal: 2000000,
          })
          .expect(201)
      ).body.data as { id: string; code: string };
      await t.app.get(PaymentConfirmationService).confirm({
        code: booking.code,
        amount: 2000000,
        transactionId: `txn-${booking.code}`,
        paidAt: new Date(),
      });

      // Another customer cannot even price a cancellation of it.
      t.ai.script = [
        {
          calls: [
            {
              name: 'propose_cancellation',
              args: { bookingCode: booking.code },
            },
          ],
        },
        { text: 'Không tìm thấy đơn.' },
      ];
      await start(other.token, `Huỷ đơn ${booking.code}`).expect(201);
      expect(t.ai.lastToolResults()[0].response).toMatchObject({
        error: expect.stringContaining('Không tìm thấy đơn'),
      });

      t.ai.script = [
        {
          calls: [
            { name: 'my_bookings', args: {} },
            { name: 'my_wallet', args: {} },
            {
              name: 'propose_cancellation',
              args: {
                bookingCode: booking.code.toLowerCase(),
                reason: 'Đổi kế hoạch',
              },
            },
          ],
        },
        {
          text: 'Huỷ bây giờ được hoàn đủ 2.000.000 đ về ví sau khi khách sạn duyệt.',
        },
      ];
      const res = await start(
        me.token,
        'Cho xem đơn của tôi rồi huỷ giúp',
      ).expect(201);
      const [mine, wallet] = t.ai.lastToolResults().map((r) => r.response);
      expect(
        (mine as { bookings: { code: string; status: string }[] }).bookings,
      ).toEqual([
        expect.objectContaining({ code: booking.code, status: 'CONFIRMED' }),
      ]);
      expect(wallet).toMatchObject({ walletBalance: 0, points: null });

      const cancellation = res.body.data.reply.cancellation as {
        id: string;
        refund: number;
        needsApproval: boolean;
        outcome: string | null;
      };
      expect(cancellation).toMatchObject({
        refund: 2000000,
        needsApproval: true,
        outcome: null,
      });
      // Proposed only: the booking is untouched until the click.
      const untouched = await t.prisma.booking.findUniqueOrThrow({
        where: { bookingId: booking.id },
        select: { status: true },
      });
      expect(untouched.status).toBe('CONFIRMED');

      const conversationId = res.body.data.conversationId as string;
      const confirm = () =>
        t
          .api()
          .post(`/api/v1/conversations/${conversationId}/confirm-cancellation`)
          .set(auth(me.token))
          .send({ proposalId: cancellation.id });
      const done = await confirm().expect(201);
      expect(done.body.data).toMatchObject({ paymentStatus: 'REFUND_PENDING' });
      const again = await confirm().expect(409);
      expect(again.body.code).toBe('BOOKING_PROPOSAL_INVALID');

      const after = await t
        .api()
        .get(`/api/v1/conversations/${conversationId}`)
        .set(auth(me.token))
        .expect(200);
      const messages = after.body.data.messages as {
        role: string;
        content: string;
        cancellation: { outcome: string } | null;
      }[];
      expect(messages[1].cancellation!.outcome).toBe('REFUND_PENDING');
      expect(messages[2]).toMatchObject({ role: 'SYSTEM' });
      expect(messages[2].content).toContain('ví StayReco');
    });

    it('streams the answer with what it is doing, and takes the quick replies off the text', async () => {
      const a = await hotel('Biển Xanh', 'a@hotel.test');
      await t.prisma.hotel.update({
        where: { hotelId: a.hotelId },
        data: {
          description: 'Resort nghỉ dưỡng ven biển, spa, hồ bơi vô cực.',
        },
      });
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      await run(me.id, [a.hotelId]);
      t.ai.script = [
        { calls: [{ name: 'recommend_hotels', args: {} }] },
        {
          text: 'Bạn thử Biển Xanh nhé.\n>> Xem phòng ở Biển Xanh | Tìm nơi rẻ hơn',
        },
      ];
      const res = await t
        .api()
        .post('/api/v1/me/conversations/stream')
        .set(auth(me.token))
        .send({ content: 'Gợi ý giúp mình' })
        .buffer(true)
        .parse((r, done) => {
          let body = '';
          r.on('data', (chunk: Buffer) => (body += chunk.toString()));
          r.on('end', () => done(null, body));
        })
        .expect(201)
        .expect('Content-Type', /text\/event-stream/);
      const events = (res.body as string)
        .trim()
        .split('\n\n')
        .map((block) => {
          const [event, data] = block.split('\n');
          return {
            event: event.slice('event: '.length),
            data: JSON.parse(data.slice('data: '.length)) as Record<
              string,
              unknown
            >,
          };
        });
      expect(events.map((e) => e.event)).toEqual([
        'status',
        'delta',
        'delta',
        'done',
      ]);
      expect(events[0].data.text).toBe('Đang chọn khách sạn hợp với bạn…');
      const reply = (
        events[3].data as {
          reply: {
            content: string;
            suggestions: string[];
            hotels: { styles: string[] }[];
          };
        }
      ).reply;
      expect(reply.content).toBe('Bạn thử Biển Xanh nhé.');
      expect(reply.suggestions).toEqual([
        'Xem phòng ở Biển Xanh',
        'Tìm nơi rẻ hơn',
      ]);
      expect(reply.hotels[0].styles).toEqual(['resort']);
      // Stored as shown.
      const stored = await t.prisma.message.findFirstOrThrow({
        where: { role: 'ASSISTANT' },
      });
      expect(stored.content).toBe('Bạn thử Biển Xanh nhé.');
    });

    it('shows a date picker instead of asking for the dates in words, and keeps the 👍 or 👎', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.script = [
        {
          calls: [
            {
              name: 'ask_trip_details',
              args: { destination: 'Đà Lạt', guests: 2, checkIn: 'mai' },
            },
          ],
        },
        { text: 'Bạn chọn ngày đi Đà Lạt ở khung bên dưới nhé.' },
      ];
      const res = await start(me.token, 'Mình muốn đi Đà Lạt').expect(201);
      const { conversationId, reply } = res.body.data as {
        conversationId: string;
        reply: { id: string; askTrip: unknown; suggestions: string[] };
      };
      expect(reply.askTrip).toEqual({
        destination: 'Đà Lạt',
        checkIn: null,
        checkOut: null,
        guests: 2,
      });
      expect(reply.suggestions).toEqual([]);

      const rated = await t
        .api()
        .put(
          `/api/v1/conversations/${conversationId}/messages/${reply.id}/feedback`,
        )
        .set(auth(me.token))
        .send({ value: 'DOWN' })
        .expect(200);
      expect(rated.body.data.feedback).toBe('DOWN');
      const again = await t
        .api()
        .get(`/api/v1/conversations/${conversationId}`)
        .set(auth(me.token))
        .expect(200);
      expect(again.body.data.messages[1]).toMatchObject({
        feedback: 'DOWN',
        askTrip: { destination: 'Đà Lạt' },
      });

      // Only the customer's own answers from the assistant.
      const other = await t.signIn('CUSTOMER', 'other@guest.test');
      await t
        .api()
        .put(
          `/api/v1/conversations/${conversationId}/messages/${reply.id}/feedback`,
        )
        .set(auth(other.token))
        .send({ value: 'UP' })
        .expect(404);
      const question = again.body.data.messages[0].id as string;
      const r = await t
        .api()
        .put(
          `/api/v1/conversations/${conversationId}/messages/${question}/feedback`,
        )
        .set(auth(me.token))
        .send({ value: 'UP' })
        .expect(404);
      expect(r.body.code).toBe('MESSAGE_NOT_FOUND');
    });

    it('answers a streamed turn over budget with a plain JSON error', async () => {
      const me = await t.signIn('CUSTOMER', 'me@guest.test');
      t.ai.budgetLeft = 0;
      const res = await t
        .api()
        .post('/api/v1/me/conversations/stream')
        .set(auth(me.token))
        .send({ content: 'Xin chào' })
        .expect(403);
      expect(res.body.code).toBe('AI_BUDGET_EXCEEDED');
      expect(await t.prisma.conversation.count()).toBe(0);
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
