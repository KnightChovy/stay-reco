import { createTestApp } from './helpers';

describe('Search and listings (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let wifi: string;
  let seq = 0;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** `days` from today in Vietnam, as the API counts them. */
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const checkIn = day(30);
  const checkOut = day(32);
  const stay = `checkIn=${checkIn}&checkOut=${checkOut}`;

  interface RoomTypeSpec {
    name?: string;
    basePrice: number;
    rooms: number;
    maxOccupancy?: number;
  }

  /** A partner's hotel with room types and physical rooms; ACTIVE unless told otherwise. */
  const hotel = async (
    fields: Record<string, unknown>,
    roomTypes: RoomTypeSpec[],
    status: 'ACTIVE' | 'DRAFT' = 'ACTIVE',
  ) => {
    const partner = await t.signIn('HOTEL_PARTNER', `p${++seq}@hotel.test`);
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: `Hotel ${seq}`,
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: `contact${seq}@hotel.test`,
        ...fields,
      })
      .expect(201);
    const hotelId = res.body.data.id as string;
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 50, basePrice: 1000000 })
      .expect(200);

    const roomTypeIds: string[] = [];
    for (const [i, spec] of roomTypes.entries()) {
      const rt = await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/room-types`)
        .set(auth(partner.token))
        .send({
          name: spec.name ?? `Type ${i + 1}`,
          maxOccupancy: spec.maxOccupancy ?? 2,
          areaSqm: 30,
          basePrice: spec.basePrice,
          beds: [{ bedTypeId: king, quantity: 1 }],
        })
        .expect(201);
      const roomTypeId = rt.body.data.id as string;
      roomTypeIds.push(roomTypeId);
      for (let n = 1; n <= spec.rooms; n++) {
        await t
          .api()
          .post(`/api/v1/hotels/${hotelId}/rooms`)
          .set(auth(partner.token))
          .send({ roomTypeId, roomNumber: `${i + 1}0${n}` })
          .expect(201);
      }
    }
    await t.prisma.hotel.update({ where: { hotelId }, data: { status } });
    return { ...partner, hotelId, roomTypeIds };
  };

  const search = (query: string) =>
    t.api().get(`/api/v1/hotels?${query}`).expect(200);
  const names = (body: unknown) =>
    (body as { data: { name: string }[] }).data.map((h) => h.name);

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
    wifi = (
      await t.prisma.amenity.create({
        data: { name: 'Wi-Fi', category: 'Phòng' },
      })
    ).amenityId;
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('GET /hotels', () => {
    it('finds bookable hotels without a token, ignoring accents, with the cheapest total', async () => {
      const river = await hotel({ name: 'Riverside', starRating: 4 }, [
        { basePrice: 2000000, rooms: 1 },
        { basePrice: 1500000, rooms: 2 },
      ]);
      await hotel(
        { name: 'Draft Inn' },
        [{ basePrice: 900000, rooms: 1 }],
        'DRAFT',
      );
      await hotel({ name: 'Hà Nội Hotel', city: 'Hà Nội' }, [
        { basePrice: 900000, rooms: 1 },
      ]);
      const suspended = await hotel({ name: 'Suspended' }, [
        { basePrice: 900000, rooms: 1 },
      ]);
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: suspended.id },
        data: { status: 'SUSPENDED' },
      });

      const res = await search(`destination=da nang&${stay}&guests=2`);
      expect(res.body.data).toEqual([
        {
          id: river.hotelId,
          name: 'Riverside',
          city: 'Đà Nẵng',
          address: '1 Bạch Đằng',
          starRating: 4,
          coverImageUrl: null,
          latitude: null,
          longitude: null,
          rating: null,
          nights: 2,
          fromTotal: 3000000,
          // Default policy: free until the check-in time the day before.
          freeCancellation: true,
        },
      ]);
      expect(res.body.meta).toEqual({
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('prices the stay with the pricing rules', async () => {
      const river = await hotel({ name: 'Riverside' }, [
        { basePrice: 1000000, rooms: 1 },
      ]);
      await t
        .api()
        .post(`/api/v1/hotels/${river.hotelId}/pricing-rules`)
        .set(auth(river.token))
        .send({
          roomTypeId: river.roomTypeIds[0],
          name: 'Peak',
          ruleType: 'SEASON',
          adjustmentType: 'SET_PRICE',
          adjustmentValue: 1500000,
          validFrom: checkIn,
          validTo: checkIn,
        })
        .expect(201);

      const res = await search(`destination=Riverside&${stay}&guests=1`);
      expect(res.body.data[0].fromTotal).toBe(2500000);
    });

    it('leaves out hotels without a room type for the whole booking', async () => {
      await hotel({ name: 'Small rooms' }, [
        { basePrice: 1000000, rooms: 3, maxOccupancy: 1 },
      ]);
      const full = await hotel({ name: 'Fully booked' }, [
        { basePrice: 1000000, rooms: 2 },
      ]);
      const [room] = await t.prisma.room.findMany({
        where: { roomTypeId: full.roomTypeIds[0] },
      });
      await t.prisma.roomCalendars.create({
        data: {
          roomId: room.roomId,
          date: new Date(`${day(31)}T00:00:00Z`),
          status: 'BOOKED',
        },
      });

      // 2 rooms for 3 guests: the 1-person rooms are too small, the other hotel has 1 room left on the second night.
      const res = await search(`destination=da nang&${stay}&guests=3&rooms=2`);
      expect(res.body.data).toEqual([]);

      const fits = await search(`destination=da nang&${stay}&guests=2&rooms=2`);
      expect(names(fits.body)).toEqual(['Small rooms']);
    });

    it('filters by stars, price, amenities and free cancellation, and sorts', async () => {
      const cheap = await hotel({ name: 'Cheap', starRating: 3 }, [
        { basePrice: 800000, rooms: 1 },
      ]);
      const mid = await hotel({ name: 'Mid', starRating: 4 }, [
        { basePrice: 1200000, rooms: 1 },
      ]);
      await hotel({ name: 'Lux', starRating: 5 }, [
        { basePrice: 3000000, rooms: 1 },
      ]);
      await t
        .api()
        .put(`/api/v1/hotels/${mid.hotelId}/amenities`)
        .set(auth(mid.token))
        .send({ amenityIds: [wifi] })
        .expect(200);
      await t
        .api()
        .patch(`/api/v1/hotels/${cheap.hotelId}/cancellation-policy`)
        .set(auth(cheap.token))
        .send({ freeCancellationDays: null, feePercent: 100 })
        .expect(200);
      const base = `destination=da nang&${stay}&guests=1`;

      expect(names((await search(base)).body)).toEqual(['Lux', 'Mid', 'Cheap']);
      expect(names((await search(`${base}&sort=price-asc`)).body)).toEqual([
        'Cheap',
        'Mid',
        'Lux',
      ]);
      expect(
        names((await search(`${base}&starRating=3&starRating=4`)).body),
      ).toEqual(['Mid', 'Cheap']);
      expect(names((await search(`${base}&priceMax=2400000`)).body)).toEqual([
        'Mid',
        'Cheap',
      ]);
      expect(names((await search(`${base}&amenityIds=${wifi}`)).body)).toEqual([
        'Mid',
      ]);
      const free = await search(`${base}&freeCancellation=true&sort=price-asc`);
      expect(names(free.body)).toEqual(['Mid', 'Lux']);

      const page2 = await search(`${base}&sort=price-asc&pageSize=2&page=2`);
      expect(names(page2.body)).toEqual(['Lux']);
      expect(page2.body.meta).toMatchObject({ total: 3, totalPages: 2 });
    });

    it('checks the dates against today in Vietnam', async () => {
      const res = await t
        .api()
        .get(
          `/api/v1/hotels?destination=x&checkIn=${day(-1)}&checkOut=${day(1)}&guests=1`,
        )
        .expect(400);
      expect(res.body.details).toEqual([
        { field: 'checkIn', message: 'checkIn must not be in the past' },
      ]);
    });
  });

  describe('GET /hotels/:hotelId/listing and /room-types/:id/listing', () => {
    it('shows room types without prices when there are no dates', async () => {
      const river = await hotel({ name: 'Riverside', checkInTime: '15:00' }, [
        { name: 'Deluxe', basePrice: 1000000, rooms: 1 },
      ]);
      const res = await t
        .api()
        .get(`/api/v1/hotels/${river.hotelId}/listing`)
        .expect(200);
      expect(res.body.data.hotel).toMatchObject({
        id: river.hotelId,
        name: 'Riverside',
        checkInTime: '15:00',
        cancellationPolicy: { freeCancellationDays: 1, feePercent: 100 },
      });
      expect(res.body.data.hotel).not.toHaveProperty('status');
      expect(res.body.data.roomTypes).toEqual([
        {
          roomType: expect.objectContaining({
            name: 'Deluxe',
            maxOccupancy: 2,
          }),
          offer: null,
        },
      ]);
    });

    it('gives each room type an offer for the stay, sold-out ones included', async () => {
      const river = await hotel({ name: 'Riverside', checkInTime: '15:00' }, [
        { name: 'Deluxe', basePrice: 1000000, rooms: 2 },
        { name: 'Suite', basePrice: 3000000, rooms: 0 },
      ]);
      const res = await t
        .api()
        .get(`/api/v1/hotels/${river.hotelId}/listing?${stay}&guests=3&rooms=2`)
        .expect(200);
      const [deluxe, suite] = res.body.data.roomTypes;
      expect(deluxe.offer).toEqual({
        available: 2,
        fitsGuests: true,
        nightlyPrices: [
          { date: checkIn, price: 1000000 },
          { date: day(31), price: 1000000 },
        ],
        perRoomTotal: 2000000,
        total: 4000000,
        freeCancellationUntil: new Date(
          `${day(29)}T15:00:00+07:00`,
        ).toISOString(),
        cancellationFeePercent: 100,
      });
      expect(suite.offer).toMatchObject({ available: 0, total: 12000000 });

      const roomType = await t
        .api()
        .get(
          `/api/v1/room-types/${river.roomTypeIds[0]}/listing?${stay}&guests=3&rooms=2`,
        )
        .expect(200);
      expect(roomType.body.data).toEqual(deluxe);
    });

    it('hides hotels and room types that cannot be booked', async () => {
      const draft = await hotel(
        { name: 'Draft' },
        [{ basePrice: 1000000, rooms: 1 }],
        'DRAFT',
      );
      const hotelRes = await t
        .api()
        .get(`/api/v1/hotels/${draft.hotelId}/listing`)
        .expect(404);
      expect(hotelRes.body.code).toBe('HOTEL_NOT_FOUND');
      const typeRes = await t
        .api()
        .get(`/api/v1/room-types/${draft.roomTypeIds[0]}/listing`)
        .expect(404);
      expect(typeRes.body.code).toBe('ROOM_TYPE_NOT_FOUND');
      await t.api().get('/api/v1/hotels/not-a-uuid/listing').expect(404);
    });

    it('needs both dates together', async () => {
      const river = await hotel({ name: 'Riverside' }, [
        { basePrice: 1000000, rooms: 1 },
      ]);
      const res = await t
        .api()
        .get(`/api/v1/hotels/${river.hotelId}/listing?checkIn=${checkIn}`)
        .expect(400);
      expect(res.body.details).toEqual([
        {
          field: 'checkOut',
          message: 'checkIn and checkOut must be sent together',
        },
      ]);
    });
  });
});
