import { createTestApp } from './helpers';

describe('Availability calendar (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const date = (value: string) => new Date(`${value}T00:00:00Z`);

  /** A partner with one hotel, one room type and `rooms` physical rooms (101, 102, ...). */
  const setUp = async (email = 'owner@hotel.test', rooms = 4) => {
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
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    const roomType = await t
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
    const roomTypeId = roomType.body.data.id as string;
    const roomIds: string[] = [];
    for (let i = 1; i <= rooms; i++) {
      const room = await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/rooms`)
        .set(auth(partner.token))
        .send({ roomTypeId, roomNumber: `${100 + i}` })
        .expect(201);
      roomIds.push(room.body.data.id as string);
    }
    return { ...partner, hotelId, roomTypeId, roomIds };
  };

  const calendar = (
    roomId: string,
    day: string,
    status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED',
  ) =>
    t.prisma.roomCalendars.create({
      data: { roomId, date: date(day), status },
    });

  const list = (token: string, hotelId: string, query: string) =>
    t
      .api()
      .get(`/api/v1/hotels/${hotelId}/availability?${query}`)
      .set(auth(token));

  const update = (
    token: string,
    hotelId: string,
    body: Record<string, unknown>,
  ) =>
    t
      .api()
      .patch(`/api/v1/hotels/${hotelId}/availability`)
      .set(auth(token))
      .send(body);

  const onSale = (days: unknown) =>
    (days as { date: string; onSale: number }[]).map((d) => [d.date, d.onSale]);

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

  describe('GET /hotels/:hotelId/availability', () => {
    it('counts booked, held and closed nights, without rooms locked for maintenance', async () => {
      const owner = await setUp();
      const [r1, r2, r3, r4] = owner.roomIds;
      await t
        .api()
        .post(`/api/v1/rooms/${r4}/lock`)
        .set(auth(owner.token))
        .send({ reason: 'Leak' })
        .expect(200);
      await calendar(r1, '2027-03-01', 'BOOKED');
      await calendar(r2, '2027-03-01', 'HELD');
      await calendar(r3, '2027-03-02', 'BLOCKED');
      await calendar(r4, '2027-03-02', 'BLOCKED'); // a locked room: not counted
      await calendar(r1, '2027-03-02', 'AVAILABLE');

      const res = await list(
        owner.token,
        owner.hotelId,
        'from=2027-03-01&to=2027-03-03',
      ).expect(200);
      const day = { roomTypeId: owner.roomTypeId, totalRooms: 3 };
      expect(res.body.data).toEqual([
        {
          ...day,
          date: '2027-03-01',
          booked: 1,
          held: 1,
          closed: 0,
          onSale: 1,
        },
        {
          ...day,
          date: '2027-03-02',
          booked: 0,
          held: 0,
          closed: 1,
          onSale: 2,
        },
        {
          ...day,
          date: '2027-03-03',
          booked: 0,
          held: 0,
          closed: 0,
          onSale: 3,
        },
      ]);
    });

    it('is open to the staff, filters by room type and checks the range', async () => {
      const owner = await setUp();
      const other = await setUp('other@hotel.test', 1);
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test');

      const res = await list(
        staff.token,
        owner.hotelId,
        `from=2027-03-01&to=2027-03-01&roomTypeId=${other.roomTypeId}`,
      ).expect(200);
      expect(res.body.data).toEqual([]);

      const tooLong = await list(
        owner.token,
        owner.hotelId,
        'from=2027-03-01&to=2027-05-02',
      ).expect(400);
      expect(tooLong.body.details).toEqual([
        { field: 'to', message: 'at most 62 days per request' },
      ]);

      await list(
        other.token,
        owner.hotelId,
        'from=2027-03-01&to=2027-03-01',
      ).expect(404);
    });
  });

  describe('PATCH /hotels/:hotelId/availability', () => {
    it('closes and reopens rooms so that onSale rooms stay on sale', async () => {
      const owner = await setUp();
      const [r1, r2] = owner.roomIds;
      await calendar(r1, '2027-03-02', 'BOOKED');
      await calendar(r2, '2027-03-01', 'AVAILABLE');

      const closed = await update(owner.token, owner.hotelId, {
        roomTypeId: owner.roomTypeId,
        from: '2027-03-01',
        to: '2027-03-02',
        onSale: 1,
      }).expect(200);
      expect(onSale(closed.body.data)).toEqual([
        ['2027-03-01', 1],
        ['2027-03-02', 1],
      ]);
      expect(closed.body.data[1]).toMatchObject({ booked: 1, closed: 2 });
      // The booked night is never closed.
      const booked = await t.prisma.roomCalendars.findFirstOrThrow({
        where: { roomId: r1, date: date('2027-03-02') },
      });
      expect(booked.status).toBe('BOOKED');

      const reopened = await update(owner.token, owner.hotelId, {
        roomTypeId: owner.roomTypeId,
        from: '2027-03-01',
        to: '2027-03-02',
        onSale: 3,
      }).expect(200);
      expect(onSale(reopened.body.data)).toEqual([
        ['2027-03-01', 3],
        ['2027-03-02', 3],
      ]);

      const allClosed = await update(owner.token, owner.hotelId, {
        roomTypeId: owner.roomTypeId,
        from: '2027-03-01',
        to: '2027-03-01',
        onSale: 0,
      }).expect(200);
      expect(allClosed.body.data[0]).toMatchObject({ closed: 4, onSale: 0 });
    });

    it('refuses more rooms than are left on some day and changes nothing', async () => {
      const owner = await setUp();
      const [r1, r2] = owner.roomIds;
      await calendar(r1, '2027-03-02', 'BOOKED');
      await calendar(r2, '2027-03-02', 'HELD');
      await calendar(r1, '2027-03-01', 'BLOCKED');

      const res = await update(owner.token, owner.hotelId, {
        roomTypeId: owner.roomTypeId,
        from: '2027-03-01',
        to: '2027-03-02',
        onSale: 3,
      }).expect(409);
      expect(res.body).toMatchObject({
        code: 'AVAILABILITY_BELOW_BOOKED',
        details: [
          {
            field: 'onSale',
            message: '2027-03-02: at most 2 rooms can be on sale',
          },
        ],
      });
      const blocked = await t.prisma.roomCalendars.count({
        where: { status: 'BLOCKED' },
      });
      expect(blocked).toBe(1);
    });

    it('is for the owner of the room type only', async () => {
      const owner = await setUp();
      const other = await setUp('other@hotel.test', 1);
      const body = {
        roomTypeId: owner.roomTypeId,
        from: '2027-03-01',
        to: '2027-03-01',
        onSale: 0,
      };

      const wrongType = await update(owner.token, owner.hotelId, {
        ...body,
        roomTypeId: other.roomTypeId,
      }).expect(404);
      expect(wrongType.body.code).toBe('ROOM_TYPE_NOT_FOUND');

      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'BOOKING',
      ]);
      await update(staff.token, owner.hotelId, body).expect(403);
      await update(other.token, owner.hotelId, body).expect(404);
    });
  });
});
