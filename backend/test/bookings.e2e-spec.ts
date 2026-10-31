import { HoldExpiryService } from '../src/modules/bookings/hold-expiry.service';
import { createTestApp } from './helpers';

describe('Bookings with a hold (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let seq = 0;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** `days` from today in Vietnam, as the API counts them. */
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const checkIn = day(30);
  const checkOut = day(32);

  /** An ACTIVE hotel with one room type priced 1,000,000 a night and `rooms` physical rooms. */
  const hotel = async (rooms = 2, status: 'ACTIVE' | 'DRAFT' = 'ACTIVE') => {
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
        checkInTime: '14:00',
      })
      .expect(201);
    const hotelId = res.body.data.id as string;
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    const rt = await t
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
    const roomTypeId = rt.body.data.id as string;
    for (let n = 1; n <= rooms; n++) {
      await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/rooms`)
        .set(auth(partner.token))
        .send({ roomTypeId, roomNumber: `10${n}` })
        .expect(201);
    }
    await t.prisma.hotel.update({ where: { hotelId }, data: { status } });
    return { ...partner, hotelId, roomTypeId };
  };

  const booking = (
    roomTypeId: string,
    overrides: Record<string, unknown> = {},
  ) => ({
    roomTypeId,
    checkIn,
    checkOut,
    guests: 2,
    rooms: 1,
    guestName: 'Nguyễn Văn A',
    contactPhone: '0905123456',
    arrivalTime: '15:00',
    expectedTotal: 2000000,
    ...overrides,
  });

  const book = (token: string, body: Record<string, unknown>) =>
    t.api().post('/api/v1/bookings').set(auth(token)).send(body);

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

  describe('POST /bookings', () => {
    it('holds the rooms for 15 minutes and returns the payment details', async () => {
      const h = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const before = Date.now();
      const res = await book(customer.token, booking(h.roomTypeId)).expect(201);
      const data = res.body.data;

      expect(data).toMatchObject({
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        hotel: { id: h.hotelId, city: 'Đà Nẵng' },
        roomType: { id: h.roomTypeId, name: 'Deluxe' },
        checkIn,
        checkOut,
        nights: 2,
        rooms: 1,
        guests: 2,
        totalAmount: 2000000,
        guestName: 'Nguyễn Văn A',
        arrivalTime: '15:00',
        nightlyPrices: [
          { date: checkIn, price: 1000000 },
          { date: day(31), price: 1000000 },
        ],
        // Default policy: free until 14:00 the day before check-in.
        cancellation: {
          freeUntil: new Date(`${day(29)}T14:00:00+07:00`).toISOString(),
          feePercent: 100,
        },
        paidAt: null,
        refund: null,
        timeline: [{ event: 'CREATED' }],
      });
      expect(data.code).toMatch(/^SR-\d{6}-\d{4}$/);
      const expiresAt = Date.parse(data.holdExpiresAt as string);
      expect(expiresAt - before).toBeGreaterThanOrEqual(15 * 60_000 - 1000);
      expect(expiresAt - before).toBeLessThanOrEqual(15 * 60_000 + 5000);
      expect(data.payment).toMatchObject({
        method: 'SEPAY',
        amount: 2000000,
        transferContent: data.code,
        expiresAt: data.holdExpiresAt,
      });
      const qr = new URL(data.payment.qrImageUrl as string);
      expect(qr.searchParams.get('amount')).toBe('2000000');
      expect(qr.searchParams.get('des')).toBe(data.code);

      const held = await t.prisma.roomCalendars.findMany({
        where: { bookingId: data.id as string },
      });
      expect(held).toHaveLength(2);
      expect(new Set(held.map((r) => r.roomId)).size).toBe(1);
      expect(held.every((r) => r.status === 'HELD')).toBe(true);

      const availability = await t
        .api()
        .get(
          `/api/v1/hotels/${h.hotelId}/availability?from=${checkIn}&to=${checkIn}`,
        )
        .set(auth(h.token))
        .expect(200);
      expect(availability.body.data[0]).toMatchObject({ held: 1, onSale: 1 });
    });

    it('answers BOOKING_PRICE_CHANGED with the new total and holds nothing', async () => {
      const h = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await book(
        customer.token,
        booking(h.roomTypeId, { rooms: 2, guests: 2, expectedTotal: 2000000 }),
      ).expect(409);
      expect(res.body).toMatchObject({
        code: 'BOOKING_PRICE_CHANGED',
        details: [{ field: 'expectedTotal', message: '4000000' }],
      });
      expect(await t.prisma.booking.count()).toBe(0);
    });

    it('refuses more guests than the rooms take and unbookable room types', async () => {
      const h = await hotel();
      const draft = await hotel(1, 'DRAFT');
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');

      const tooMany = await book(
        customer.token,
        booking(h.roomTypeId, { guests: 3 }),
      ).expect(400);
      expect(tooMany.body.details).toEqual([
        {
          field: 'guests',
          message: 'at most 2 guests in 1 rooms of this type',
        },
      ]);

      const hidden = await book(
        customer.token,
        booking(draft.roomTypeId),
      ).expect(404);
      expect(hidden.body.code).toBe('ROOM_TYPE_NOT_FOUND');

      const past = await book(
        customer.token,
        booking(h.roomTypeId, { checkIn: day(-1), checkOut: day(1) }),
      ).expect(400);
      expect(past.body.details).toEqual([
        { field: 'checkIn', message: 'checkIn must not be in the past' },
      ]);

      // Only customers book.
      await book(h.token, booking(h.roomTypeId)).expect(403);
    });

    it('lets only one of two customers hold the last room', async () => {
      const h = await hotel(1);
      const a = await t.signIn('CUSTOMER', 'a@mail.test');
      const b = await t.signIn('CUSTOMER', 'b@mail.test');

      const results = await Promise.all([
        book(a.token, booking(h.roomTypeId)),
        book(b.token, booking(h.roomTypeId)),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      const loser = results.find((r) => r.status === 409)!;
      expect(loser.body.code).toBe('ROOM_SOLD_OUT');
      expect(await t.prisma.booking.count()).toBe(1);
      expect(
        await t.prisma.roomCalendars.count({ where: { status: 'HELD' } }),
      ).toBe(2);
    });
  });

  describe('hold expiry', () => {
    it('expires unpaid holds, fails the invoice and releases the nights', async () => {
      const h = await hotel(1);
      const a = await t.signIn('CUSTOMER', 'a@mail.test');
      const first = await book(a.token, booking(h.roomTypeId)).expect(201);
      const id = first.body.data.id as string;

      await t.prisma.roomCalendars.updateMany({
        where: { bookingId: id },
        data: { holdExpiresAt: new Date(Date.now() - 1000) },
      });
      expect(await t.app.get(HoldExpiryService).expireDue()).toBe(1);

      const expired = await t
        .api()
        .get(`/api/v1/bookings/${id}`)
        .set(auth(a.token))
        .expect(200);
      expect(expired.body.data).toMatchObject({
        status: 'EXPIRED',
        paymentStatus: 'FAILED',
        holdExpiresAt: null,
        payment: null,
        rooms: 1,
        nightlyPrices: [
          { date: checkIn, price: 1000000 },
          { date: day(31), price: 1000000 },
        ],
      });
      expect(
        (expired.body.data.timeline as { event: string }[]).map((e) => e.event),
      ).toEqual(['CREATED', 'EXPIRED']);
      expect(await t.prisma.roomCalendars.count()).toBe(0);
      expect(
        await t.prisma.auditLog.count({
          where: { entityId: id, action: 'BOOKING_EXPIRED' },
        }),
      ).toBe(1);
    });

    it('releases a stale hold of the room type before a new booking', async () => {
      const h = await hotel(1);
      const a = await t.signIn('CUSTOMER', 'a@mail.test');
      const b = await t.signIn('CUSTOMER', 'b@mail.test');
      const first = await book(a.token, booking(h.roomTypeId)).expect(201);
      await t.prisma.roomCalendars.updateMany({
        where: { bookingId: first.body.data.id as string },
        data: { holdExpiresAt: new Date(Date.now() - 1000) },
      });

      await book(b.token, booking(h.roomTypeId)).expect(201);
      const old = await t.prisma.booking.findUniqueOrThrow({
        where: { bookingId: first.body.data.id as string },
      });
      expect(old.status).toBe('EXPIRED');
    });
  });

  describe('GET /bookings/:id', () => {
    it('is visible to the customer, the owner and staff with BOOKING, REFUND or FRONT_DESK only', async () => {
      const h = await hotel();
      const other = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'other@mail.test');
      const res = await book(customer.token, booking(h.roomTypeId)).expect(201);
      const url = `/api/v1/bookings/${res.body.data.id as string}`;

      const front = await t.signInStaff(h.hotelId, 'front@hotel.test', [
        'FRONT_DESK',
      ]);
      const refund = await t.signInStaff(h.hotelId, 'refund@hotel.test', [
        'REFUND',
      ]);
      const care = await t.signInStaff(h.hotelId, 'care@hotel.test', [
        'CUSTOMER_CARE',
      ]);
      const allowed = [customer.token, h.token, refund.token, front.token];
      for (const token of allowed) {
        await t.api().get(url).set(auth(token)).expect(200);
      }
      await t.api().get(url).set(auth(care.token)).expect(403);
      for (const token of [stranger.token, other.token]) {
        const hidden = await t.api().get(url).set(auth(token)).expect(404);
        expect(hidden.body.code).toBe('BOOKING_NOT_FOUND');
      }
      await t
        .api()
        .get('/api/v1/bookings/not-a-uuid')
        .set(auth(customer.token))
        .expect(404);
    });
  });
});
