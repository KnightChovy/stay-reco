import { createTestApp } from './helpers';

const newHotel = {
  name: 'An Nhiên Riverside',
  address: '12 Bạch Đằng',
  city: 'Đà Nẵng',
  email: 'contact@annhien.test',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  website: 'https://annhien.test',
};

describe('Hotels (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let amenityIds: string[];

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const ids = (items: unknown) => (items as { id: string }[]).map((i) => i.id);
  const fields = (details: unknown) =>
    (details as { field: string }[]).map((d) => d.field);

  /** Signs in a partner and creates one hotel through the API. */
  const partnerWithHotel = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send(newHotel)
      .expect(201);
    return { ...partner, hotelId: res.body.data.id as string };
  };

  beforeAll(async () => {
    t = await createTestApp();
    // Catalog tables are not touched by reset(), so give them a known content once.
    await t.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE amenity, bed_type RESTART IDENTITY CASCADE',
    );
    await t.prisma.amenity.createMany({
      data: [
        { name: 'Wi-Fi miễn phí', icon: 'wifi', category: 'Chung' },
        { name: 'Hồ bơi', icon: 'waves', category: 'Thư giãn' },
      ],
    });
    await t.prisma.bedType.create({
      data: { name: 'Giường King', capacity: 2 },
    });
    amenityIds = (await t.prisma.amenity.findMany()).map((a) => a.amenityId);
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  describe('catalog', () => {
    it('lists amenities and bed types without signing in', async () => {
      const amenities = await t.api().get('/api/v1/amenities').expect(200);
      expect(amenities.body.data).toHaveLength(2);
      expect(amenities.body.data[0]).toEqual({
        id: expect.any(String),
        name: 'Wi-Fi miễn phí',
        icon: 'wifi',
        category: 'Chung',
      });

      const beds = await t.api().get('/api/v1/bed-types').expect(200);
      expect(beds.body.data).toEqual([
        {
          id: expect.any(String),
          name: 'Giường King',
          description: null,
          capacity: 2,
        },
      ]);
    });
  });

  describe('create and read', () => {
    it('creates a DRAFT hotel and lists it under /me/hotels', async () => {
      const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
      const created = await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(partner.token))
        .send(newHotel)
        .expect(201);
      expect(created.body.data).toMatchObject({
        name: 'An Nhiên Riverside',
        country: 'Vietnam',
        status: 'DRAFT',
        checkInTime: '14:00',
        checkOutTime: '12:00',
        amenities: [],
        images: [],
        policies: {},
        roomConfig: null,
        cancellationPolicy: { freeCancellationDays: 1, feePercent: 100 },
      });

      const mine = await t
        .api()
        .get('/api/v1/me/hotels')
        .set(auth(partner.token))
        .expect(200);
      expect(mine.body.data).toEqual([
        {
          id: created.body.data.id,
          name: 'An Nhiên Riverside',
          city: 'Đà Nẵng',
          starRating: null,
          status: 'DRAFT',
          coverImageUrl: null,
          myRole: 'OWNER',
        },
      ]);
    });

    it('only partners can create hotels', async () => {
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(customer.token))
        .send(newHotel)
        .expect(403);
    });

    it('rejects invalid input', async () => {
      const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
      const res = await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(partner.token))
        .send({ ...newHotel, checkInTime: '25:00', starRating: 6 })
        .expect(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(fields(res.body.details).sort()).toEqual([
        'checkInTime',
        'starRating',
      ]);
    });

    it('rejects over-long phones, non-http websites and half coordinates with 400', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const cases: [Record<string, unknown>, string][] = [
        // 21 characters: longer than the phone column, so it must fail validation instead of the insert.
        [{ phone: '+84 905 123 456 789 0' }, 'phone'],
        [{ website: 'javascript:alert(1)' }, 'website'],
        [{ latitude: 16.06 }, 'longitude'],
        [{ latitude: null, longitude: 108.22 }, 'longitude'],
      ];
      for (const [patch, field] of cases) {
        const res = await t
          .api()
          .patch(`/api/v1/hotels/${hotelId}`)
          .set(auth(token))
          .send(patch)
          .expect(400);
        expect(fields(res.body.details)).toEqual([field]);
      }

      await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(token))
        .send({ ...newHotel, phone: '+84 905 123 456 789 0' })
        .expect(400);
      await t
        .api()
        .patch(`/api/v1/hotels/${hotelId}`)
        .set(auth(token))
        .send({ latitude: 16.06, longitude: 108.22, phone: '+84 905 123 456' })
        .expect(200);
    });
  });

  describe('tenant isolation', () => {
    it("hides a hotel from other partners, customers and other hotels' staff", async () => {
      const a = await partnerWithHotel('a@hotel.test');
      const b = await partnerWithHotel('b@hotel.test');
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const staffOfB = await t.signInStaff(b.hotelId, 'staff-b@hotel.test');

      for (const token of [b.token, customer.token, staffOfB.token]) {
        const res = await t
          .api()
          .get(`/api/v1/hotels/${a.hotelId}`)
          .set(auth(token))
          .expect(404);
        expect(res.body.code).toBe('HOTEL_NOT_FOUND');
      }
      await t
        .api()
        .patch(`/api/v1/hotels/${a.hotelId}`)
        .set(auth(b.token))
        .send({ name: 'Hijacked' })
        .expect(404);
      await t
        .api()
        .get('/api/v1/hotels/not-a-uuid')
        .set(auth(a.token))
        .expect(404);

      const mineB = await t
        .api()
        .get('/api/v1/me/hotels')
        .set(auth(b.token))
        .expect(200);
      expect(ids(mineB.body.data)).toEqual([b.hotelId]);
    });

    it('staff can read their hotel but not edit it', async () => {
      const owner = await partnerWithHotel();
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'FRONT_DESK',
      ]);

      const mine = await t
        .api()
        .get('/api/v1/me/hotels')
        .set(auth(staff.token))
        .expect(200);
      expect(mine.body.data).toEqual([
        expect.objectContaining({ id: owner.hotelId, myRole: 'STAFF' }),
      ]);
      await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}`)
        .set(auth(staff.token))
        .expect(200);

      const res = await t
        .api()
        .patch(`/api/v1/hotels/${owner.hotelId}`)
        .set(auth(staff.token))
        .send({ name: 'Renamed' })
        .expect(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });

  describe('suspended partner', () => {
    it('can still read its hotels but cannot create or change them', async () => {
      const { id, token, hotelId } = await partnerWithHotel();
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: id },
        data: { status: 'SUSPENDED' },
      });

      await t
        .api()
        .get(`/api/v1/hotels/${hotelId}`)
        .set(auth(token))
        .expect(200);
      await t.api().get('/api/v1/me/hotels').set(auth(token)).expect(200);

      // Built lazily: supertest opens a server per request when it is created.
      const requests = [
        () => t.api().post('/api/v1/hotels').send(newHotel),
        () =>
          t.api().patch(`/api/v1/hotels/${hotelId}`).send({ name: 'Renamed' }),
        () =>
          t
            .api()
            .put(`/api/v1/hotels/${hotelId}/room-config`)
            .send({ totalRooms: 5, basePrice: 1000000 }),
      ];
      for (const send of requests) {
        const res = await send().set(auth(token)).expect(403);
        expect(res.body.code).toBe('PARTNER_SUSPENDED');
      }
    });
  });

  describe('owner edits', () => {
    it('updates only the sent fields and clears fields set to null', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const res = await t
        .api()
        .patch(`/api/v1/hotels/${hotelId}`)
        .set(auth(token))
        .send({ starRating: 4, website: null, checkInTime: '15:00' })
        .expect(200);
      expect(res.body.data).toMatchObject({
        name: 'An Nhiên Riverside',
        country: 'Vietnam',
        starRating: 4,
        website: null,
        checkInTime: '15:00',
        checkOutTime: '12:00',
      });
    });

    it('replaces amenities and rejects unknown ids', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const url = `/api/v1/hotels/${hotelId}/amenities`;

      const res = await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ amenityIds })
        .expect(200);
      expect(res.body.data.amenities).toHaveLength(2);

      const replaced = await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ amenityIds: [amenityIds[1]] })
        .expect(200);
      expect(ids(replaced.body.data.amenities)).toEqual([amenityIds[1]]);

      const bad = await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ amenityIds: ['3f1c2b9e-0000-4000-8000-000000000000'] })
        .expect(400);
      expect(bad.body.code).toBe('VALIDATION_ERROR');
    });

    it('replaces policies', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const url = `/api/v1/hotels/${hotelId}/policies`;

      await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ policies: { cancellation: 'Free 24h', children: 'Welcome' } })
        .expect(200);
      const res = await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ policies: { cancellation: 'Free 48h' } })
        .expect(200);
      expect(res.body.data.policies).toEqual({ cancellation: 'Free 48h' });

      await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ policies: { 'Bad Key': 'x' } })
        .expect(400);
    });

    it('sets the cancellation policy, kept apart from the policy texts', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const url = `/api/v1/hotels/${hotelId}/cancellation-policy`;

      const res = await t
        .api()
        .patch(url)
        .set(auth(token))
        .send({ freeCancellationDays: 3, feePercent: 30 })
        .expect(200);
      expect(res.body.data.cancellationPolicy).toEqual({
        freeCancellationDays: 3,
        feePercent: 30,
      });
      expect(res.body.data.policies).toEqual({});

      // Non-refundable: no free period, 100% fee. Replacing the policy texts leaves it as it is.
      await t
        .api()
        .patch(url)
        .set(auth(token))
        .send({ freeCancellationDays: null, feePercent: 100 })
        .expect(200);
      const after = await t
        .api()
        .put(`/api/v1/hotels/${hotelId}/policies`)
        .set(auth(token))
        .send({ policies: { cancellation: 'Non-refundable' } })
        .expect(200);
      expect(after.body.data.cancellationPolicy).toEqual({
        freeCancellationDays: null,
        feePercent: 100,
      });

      const bad = await t
        .api()
        .patch(url)
        .set(auth(token))
        .send({ freeCancellationDays: 31, feePercent: 100.5 })
        .expect(400);
      expect(fields(bad.body.details)).toEqual([
        'freeCancellationDays',
        'feePercent',
      ]);

      const staff = await t.signInStaff(hotelId, 'staff@hotel.test');
      await t
        .api()
        .patch(url)
        .set(auth(staff.token))
        .send({ freeCancellationDays: 3, feePercent: 30 })
        .expect(403);
    });

    it('keeps one room config and never below the existing rooms', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const url = `/api/v1/hotels/${hotelId}/room-config`;

      await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ totalRooms: 10, basePrice: 1500000 })
        .expect(200);
      const updated = await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ totalRooms: 3, basePrice: 1850000.5 })
        .expect(200);
      expect(updated.body.data.roomConfig).toEqual({
        totalRooms: 3,
        basePrice: 1850000.5,
      });
      expect(await t.prisma.hotelRoomConfig.count({ where: { hotelId } })).toBe(
        1,
      );

      // Rooms are created through the API in a later step; insert them directly for now.
      const roomType = await t.prisma.roomType.create({
        data: { hotelId, name: 'Deluxe', maxOccupancy: 2, baseAreaSqm: 30 },
      });
      await t.prisma.room.createMany({
        data: ['101', '102', '103'].map((roomNumber) => ({
          roomTypeId: roomType.roomTypeId,
          roomNumber,
        })),
      });
      const res = await t
        .api()
        .put(url)
        .set(auth(token))
        .send({ totalRooms: 2, basePrice: 1850000 })
        .expect(409);
      expect(res.body.code).toBe('ROOM_LIMIT_REACHED');
    });
  });
});
