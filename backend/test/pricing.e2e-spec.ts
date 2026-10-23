import { randomUUID } from 'crypto';
import { createTestApp } from './helpers';

describe('Pricing rules (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const ids = (items: unknown) => (items as { id: string }[]).map((i) => i.id);
  const fields = (details: unknown) =>
    (details as { field: string }[]).map((d) => d.field);

  /** A partner with one hotel and one room type priced 2,000,000 a night. */
  const setUp = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const hotel = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@riverside.test',
      })
      .expect(201);
    const hotelId = hotel.body.data.id as string;
    const roomType = await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/room-types`)
      .set(auth(partner.token))
      .send({
        name: 'Deluxe',
        maxOccupancy: 2,
        areaSqm: 30,
        basePrice: 2000000,
        beds: [{ bedTypeId: king, quantity: 1 }],
        amenityIds: [],
      })
      .expect(201);
    return {
      ...partner,
      hotelId,
      roomTypeId: roomType.body.data.id as string,
    };
  };

  const season = (
    roomTypeId: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    roomTypeId,
    name: 'Tết 2027',
    ruleType: 'SEASON',
    adjustmentType: 'PERCENT',
    adjustmentValue: 15,
    validFrom: '2027-02-01',
    validTo: '2027-02-10',
    priority: 10,
    ...overrides,
  });

  const createRule = async (
    owner: { token: string; hotelId: string },
    body: Record<string, unknown>,
  ) =>
    (
      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(owner.token))
        .send(body)
        .expect(201)
    ).body.data as { id: string };

  const preview = (token: string, roomTypeId: string, query: string) =>
    t
      .api()
      .get(`/api/v1/room-types/${roomTypeId}/price-preview?${query}`)
      .set(auth(token));

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
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('POST /hotels/:hotelId/pricing-rules', () => {
    it('creates a rule with defaults for the optional fields', async () => {
      const owner = await setUp();
      const res = await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(owner.token))
        .send(season(owner.roomTypeId, { priority: undefined }))
        .expect(201);

      expect(res.body.data).toEqual({
        id: expect.any(String),
        roomTypeId: owner.roomTypeId,
        name: 'Tết 2027',
        ruleType: 'SEASON',
        adjustmentType: 'PERCENT',
        adjustmentValue: 15,
        validFrom: '2027-02-01',
        validTo: '2027-02-10',
        dayOfWeek: null,
        minDaysBefore: null,
        maxDaysBefore: null,
        priority: 0,
        isActive: true,
        createdAt: expect.any(String),
      });
    });

    it('keeps the room type base price apart from rules without dates', async () => {
      const owner = await setUp();
      await createRule(owner, {
        roomTypeId: owner.roomTypeId,
        name: 'Early bird',
        ruleType: 'EARLY_BIRD',
        adjustmentType: 'SET_PRICE',
        adjustmentValue: 999000,
        minDaysBefore: 30,
      });

      const roomType = await t
        .api()
        .get(`/api/v1/room-types/${owner.roomTypeId}`)
        .set(auth(owner.token))
        .expect(200);
      expect(roomType.body.data.basePrice).toBe(2000000);

      await t
        .api()
        .patch(`/api/v1/room-types/${owner.roomTypeId}`)
        .set(auth(owner.token))
        .send({ basePrice: 2100000 })
        .expect(200);
      const rules = await t.prisma.price.findMany({
        where: { roomTypeId: owner.roomTypeId },
        orderBy: { ruleType: 'asc' },
      });
      expect(
        rules.map((r) => [r.ruleType, r.pricePerNight?.toNumber() ?? null]),
      ).toEqual([
        ['BASE', 2100000],
        ['EARLY_BIRD', null],
      ]);
    });

    it('reports the fields each rule type needs', async () => {
      const owner = await setUp();
      const res = await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(owner.token))
        .send(
          season(owner.roomTypeId, {
            validFrom: undefined,
            validTo: undefined,
            minDaysBefore: 5,
          }),
        )
        .expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(fields(res.body.details)).toEqual(['validFrom', 'minDaysBefore']);
    });

    it('refuses an amount that would bring the base price to 0 or below', async () => {
      const owner = await setUp();
      const res = await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(owner.token))
        .send(
          season(owner.roomTypeId, {
            adjustmentType: 'AMOUNT',
            adjustmentValue: -2000000,
          }),
        )
        .expect(400);
      expect(res.body.details).toEqual([
        {
          field: 'adjustmentValue',
          message: 'the price would be 0 or less (base price 2000000)',
        },
      ]);
    });

    it('answers ROOM_TYPE_NOT_FOUND for a room type of another hotel', async () => {
      const owner = await setUp();
      const other = await setUp('other@hotel.test');
      const res = await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(owner.token))
        .send(season(other.roomTypeId))
        .expect(404);
      expect(res.body.code).toBe('ROOM_TYPE_NOT_FOUND');
    });

    it('is for the owner only, and refused while the partner is suspended', async () => {
      const owner = await setUp();
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'BOOKING',
      ]);
      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(staff.token))
        .send(season(owner.roomTypeId))
        .expect(403);

      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: owner.id },
        data: { status: 'SUSPENDED' },
      });
      const res = await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(owner.token))
        .send(season(owner.roomTypeId))
        .expect(403);
      expect(res.body.code).toBe('PARTNER_SUSPENDED');
    });
  });

  describe('GET /hotels/:hotelId/pricing-rules', () => {
    it('lists rules by priority, then newest, for the owner and the staff', async () => {
      const owner = await setUp();
      const low = await createRule(
        owner,
        season(owner.roomTypeId, { priority: 1 }),
      );
      const high = await createRule(
        owner,
        season(owner.roomTypeId, { priority: 50 }),
      );
      const newerLow = await createRule(
        owner,
        season(owner.roomTypeId, { priority: 1 }),
      );
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test');

      for (const token of [owner.token, staff.token]) {
        const res = await t
          .api()
          .get(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
          .set(auth(token))
          .expect(200);
        expect(ids(res.body.data)).toEqual([high.id, newerLow.id, low.id]);
      }
    });

    it('filters by room type and hides other hotels', async () => {
      const owner = await setUp();
      const other = await setUp('other@hotel.test');
      await createRule(owner, season(owner.roomTypeId));

      const filtered = await t
        .api()
        .get(
          `/api/v1/hotels/${owner.hotelId}/pricing-rules?roomTypeId=${other.roomTypeId}`,
        )
        .set(auth(owner.token))
        .expect(200);
      expect(filtered.body.data).toEqual([]);

      const res = await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/pricing-rules`)
        .set(auth(other.token))
        .expect(404);
      expect(res.body.code).toBe('HOTEL_NOT_FOUND');
    });
  });

  describe('PATCH and DELETE /pricing-rules/:id', () => {
    it('validates the rule as a whole after the change', async () => {
      const owner = await setUp();
      const rule = await createRule(owner, season(owner.roomTypeId));

      const res = await t
        .api()
        .patch(`/api/v1/pricing-rules/${rule.id}`)
        .set(auth(owner.token))
        .send({ ruleType: 'EARLY_BIRD' })
        .expect(400);
      expect(fields(res.body.details)).toEqual(['minDaysBefore']);

      const updated = await t
        .api()
        .patch(`/api/v1/pricing-rules/${rule.id}`)
        .set(auth(owner.token))
        .send({
          ruleType: 'EARLY_BIRD',
          minDaysBefore: 30,
          validFrom: null,
          validTo: null,
          isActive: false,
        })
        .expect(200);
      expect(updated.body.data).toMatchObject({
        ruleType: 'EARLY_BIRD',
        minDaysBefore: 30,
        validFrom: null,
        validTo: null,
        isActive: false,
        name: 'Tết 2027',
      });
    });

    it('does not expose the base price row, other hotels or missing rules', async () => {
      const owner = await setUp();
      const other = await setUp('other@hotel.test');
      const rule = await createRule(owner, season(owner.roomTypeId));
      const base = await t.prisma.price.findFirstOrThrow({
        where: { roomTypeId: owner.roomTypeId, ruleType: 'BASE' },
      });

      for (const [token, id] of [
        [owner.token, base.priceId],
        [other.token, rule.id],
        [owner.token, randomUUID()],
        [owner.token, 'not-a-uuid'],
      ]) {
        const res = await t
          .api()
          .patch(`/api/v1/pricing-rules/${id}`)
          .set(auth(token))
          .send({ priority: 3 })
          .expect(404);
        expect(res.body.code).toBe('PRICING_RULE_NOT_FOUND');
      }
    });

    it('deletes a rule', async () => {
      const owner = await setUp();
      const rule = await createRule(owner, season(owner.roomTypeId));
      await t
        .api()
        .delete(`/api/v1/pricing-rules/${rule.id}`)
        .set(auth(owner.token))
        .expect(204);
      await t
        .api()
        .delete(`/api/v1/pricing-rules/${rule.id}`)
        .set(auth(owner.token))
        .expect(404);
    });
  });

  describe('GET /room-types/:id/price-preview', () => {
    it('returns the base price when no rule matches', async () => {
      const owner = await setUp();
      const res = await preview(
        owner.token,
        owner.roomTypeId,
        'date=2027-03-01&bookedOn=2027-02-27',
      ).expect(200);
      expect(res.body.data).toEqual({
        date: '2027-03-01',
        bookedOn: '2027-02-27',
        basePrice: 2000000,
        rule: null,
        price: 2000000,
      });
    });

    it('applies the highest-priority matching rule, for the staff too', async () => {
      const owner = await setUp();
      const tet = await createRule(owner, season(owner.roomTypeId));
      const early = await createRule(owner, {
        roomTypeId: owner.roomTypeId,
        name: 'Early bird',
        ruleType: 'EARLY_BIRD',
        adjustmentType: 'PERCENT',
        adjustmentValue: -10,
        minDaysBefore: 30,
        priority: 20,
      });
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test');

      // 40 days ahead: both match, the early-bird rule has the higher priority.
      const ahead = await preview(
        staff.token,
        owner.roomTypeId,
        'date=2027-02-06&bookedOn=2026-12-28',
      ).expect(200);
      expect(ahead.body.data).toMatchObject({
        rule: { id: early.id, name: 'Early bird' },
        price: 1800000,
      });

      // 5 days ahead: only the Tết rule matches.
      const late = await preview(
        staff.token,
        owner.roomTypeId,
        'date=2027-02-06&bookedOn=2027-02-01',
      ).expect(200);
      expect(late.body.data).toMatchObject({
        rule: { id: tet.id, name: 'Tết 2027' },
        price: 2300000,
      });
    });

    it('defaults bookedOn to today in Vietnam', async () => {
      const owner = await setUp();
      const res = await preview(
        owner.token,
        owner.roomTypeId,
        'date=2027-03-01',
      ).expect(200);
      const today = new Date(Date.now() + 7 * 3_600_000)
        .toISOString()
        .slice(0, 10);
      expect(res.body.data.bookedOn).toBe(today);
    });

    it('hides room types of other hotels', async () => {
      const owner = await setUp();
      const other = await setUp('other@hotel.test');
      const res = await preview(
        other.token,
        owner.roomTypeId,
        'date=2027-03-01',
      ).expect(404);
      expect(res.body.code).toBe('ROOM_TYPE_NOT_FOUND');
    });
  });
});
