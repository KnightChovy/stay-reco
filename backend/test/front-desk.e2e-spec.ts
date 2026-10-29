import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Front desk: lookup, room options, check-in (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel with one room type (1,000,000 a night) and rooms 101–104. */
  const hotel = async (
    email = 'owner@hotel.test',
    policy?: { freeCancellationDays: number | null; feePercent: number },
  ) => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: `contact-${email}`,
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
    if (policy) {
      await t
        .api()
        .patch(`/api/v1/hotels/${hotelId}/cancellation-policy`)
        .set(auth(partner.token))
        .send(policy)
        .expect(200);
    }
    const roomTypeId = await roomType(partner.token, hotelId, 'Deluxe');
    const rooms: Record<string, string> = {};
    for (let n = 1; n <= 4; n++) {
      rooms[`10${n}`] = await room(
        partner.token,
        hotelId,
        roomTypeId,
        `10${n}`,
      );
    }
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId, roomTypeId, rooms };
  };

  const roomType = async (token: string, hotelId: string, name: string) => {
    const res = await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/room-types`)
      .set(auth(token))
      .send({
        name,
        maxOccupancy: 2,
        areaSqm: 30,
        basePrice: 1000000,
        beds: [{ bedTypeId: king, quantity: 1 }],
      })
      .expect(201);
    return res.body.data.id as string;
  };

  const room = async (
    token: string,
    hotelId: string,
    roomTypeId: string,
    roomNumber: string,
  ) => {
    const res = await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set(auth(token))
      .send({ roomTypeId, roomNumber })
      .expect(201);
    return res.body.data.id as string;
  };

  /** A paid booking of `rooms` rooms for 2 nights starting `from` days ahead. */
  const paidBooking = async (
    token: string,
    roomTypeId: string,
    { from = 0, rooms = 1 } = {},
  ) => {
    const res = await t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        roomTypeId,
        checkIn: day(from),
        checkOut: day(from + 2),
        rooms,
        guests: rooms,
        guestName: 'Nguyễn Văn A',
        contactPhone: '0905123456',
        expectedTotal: 2000000 * rooms,
      })
      .expect(201);
    const booking = res.body.data as { id: string; code: string };
    await t.app.get(PaymentConfirmationService).confirm({
      code: booking.code,
      amount: 2000000 * rooms,
      transactionId: `txn-${booking.code}`,
      paidAt: new Date(),
    });
    return booking;
  };

  /** Moves a booking and its nights `days` earlier, e.g. to check in a day late. */
  const shift = async (bookingId: string, days: number) => {
    await t.prisma.$executeRaw`
      UPDATE booking SET check_in_date = check_in_date - ${days}::int,
        check_out_date = check_out_date - ${days}::int
      WHERE booking_id = ${bookingId}::uuid`;
    await t.prisma.$executeRaw`
      UPDATE room_calendars SET date = date - ${days}::int
      WHERE booking_id = ${bookingId}::uuid`;
  };

  const nights = async (bookingId: string) => {
    const rows = await t.prisma.roomCalendars.findMany({
      where: { bookingId },
      select: {
        date: true,
        status: true,
        priceOverride: true,
        room: { select: { roomNumber: true } },
      },
      orderBy: [{ date: 'asc' }],
    });
    return rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      room: r.room.roomNumber,
      status: r.status,
      price: r.priceOverride?.toNumber(),
    }));
  };

  const roomStatus = async (roomId: string) =>
    (await t.prisma.room.findUniqueOrThrow({ where: { roomId } })).status;

  const checkIn = (token: string, id: string, body: object = {}) =>
    t.api().post(`/api/v1/bookings/${id}/check-in`).set(auth(token)).send(body);

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

  describe('GET /hotels/:hotelId/bookings/lookup', () => {
    it('finds a booking by a typed code or a voucher QR, only in the hotel', async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      const url = `/api/v1/hotels/${h.hotelId}/bookings/lookup`;

      const typed = booking.code.replaceAll('-', ' ').toLowerCase();
      const byCode = await t
        .api()
        .get(url)
        .query({ code: typed })
        .set(auth(h.token))
        .expect(200);
      expect(byCode.body.data).toMatchObject({
        id: booking.id,
        status: 'CONFIRMED',
      });

      const voucher = await t
        .api()
        .get(`/api/v1/bookings/${booking.id}/voucher`)
        .set(auth(me.token))
        .expect(200);
      const qrToken = voucher.body.data.qrToken as string;
      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const byQr = await t
        .api()
        .get(url)
        .query({ qrToken })
        .set(auth(desk.token))
        .expect(200);
      expect(byQr.body.data.id).toBe(booking.id);

      const edited = await t
        .api()
        .get(url)
        .query({ qrToken: `${qrToken}x` })
        .set(auth(desk.token))
        .expect(400);
      expect(edited.body.code).toBe('VOUCHER_INVALID');

      // Another hotel's booking, a code that cannot exist, both or neither parameter.
      const elsewhere = await t
        .api()
        .get(`/api/v1/hotels/${other.hotelId}/bookings/lookup`)
        .query({ code: booking.code })
        .set(auth(other.token))
        .expect(404);
      expect(elsewhere.body.code).toBe('BOOKING_NOT_FOUND');
      await t
        .api()
        .get(url)
        .query({ code: 'SR-1' })
        .set(auth(h.token))
        .expect(404);
      await t
        .api()
        .get(url)
        .query({ code: booking.code, qrToken })
        .set(auth(h.token))
        .expect(400);
      await t.api().get(url).set(auth(h.token)).expect(400);

      const refunds = await t.signInStaff(h.hotelId, 'refund@hotel.test', [
        'REFUND',
      ]);
      const denied = await t
        .api()
        .get(url)
        .query({ code: booking.code })
        .set(auth(refunds.token))
        .expect(403);
      expect(denied.body.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /bookings/:id/room-options', () => {
    it('lists the held rooms and the other free rooms of the type', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const mine = await paidBooking(me.token, h.roomTypeId);
      // Room 102 is taken by another stay on the second night, 104 is locked.
      const next = await paidBooking(me.token, h.roomTypeId, { from: 1 });
      expect((await nights(next.id)).map((n) => n.room)).toEqual([
        '102',
        '102',
      ]);
      await t
        .api()
        .post(`/api/v1/rooms/${h.rooms['104']}/lock`)
        .set(auth(h.token))
        .send({})
        .expect(200);

      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const res = await t
        .api()
        .get(`/api/v1/bookings/${mine.id}/room-options`)
        .set(auth(desk.token))
        .expect(200);
      expect(res.body.data).toEqual({
        held: [{ id: h.rooms['101'], roomNumber: '101', status: 'AVAILABLE' }],
        available: [
          { id: h.rooms['103'], roomNumber: '103', status: 'AVAILABLE' },
        ],
      });

      const booking = await t.signInStaff(h.hotelId, 'booking@hotel.test', [
        'BOOKING',
      ]);
      await t
        .api()
        .get(`/api/v1/bookings/${mine.id}/room-options`)
        .set(auth(booking.token))
        .expect(403);
      const stranger = await hotel('other@hotel.test');
      const hidden = await t
        .api()
        .get(`/api/v1/bookings/${mine.id}/room-options`)
        .set(auth(stranger.token))
        .expect(404);
      expect(hidden.body.code).toBe('BOOKING_NOT_FOUND');
    });
  });

  describe('POST /bookings/:id/check-in', () => {
    it('checks in with the held rooms by default', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId, { rooms: 2 });

      // Before check-in, the hotel sees the held rooms and the customer none.
      const before = await t
        .api()
        .get(`/api/v1/bookings/${booking.id}`)
        .set(auth(me.token))
        .expect(200);
      expect(before.body.data.assignedRooms).toEqual([]);

      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const res = await checkIn(desk.token, booking.id).expect(200);
      const assigned = [
        { id: h.rooms['101'], roomNumber: '101' },
        { id: h.rooms['102'], roomNumber: '102' },
      ];
      expect(res.body.data).toMatchObject({
        status: 'CHECKED_IN',
        assignedRooms: assigned,
      });
      const timeline = res.body.data.timeline as { event: string }[];
      expect(timeline.map((e) => e.event)).toEqual([
        'CREATED',
        'PAID',
        'CHECKED_IN',
      ]);
      expect(await roomStatus(h.rooms['101'])).toBe('OCCUPIED');
      expect(await roomStatus(h.rooms['102'])).toBe('OCCUPIED');
      expect(await roomStatus(h.rooms['103'])).toBe('AVAILABLE');

      const seen = await t
        .api()
        .get(`/api/v1/bookings/${booking.id}`)
        .set(auth(me.token))
        .expect(200);
      expect(seen.body.data.assignedRooms).toEqual(assigned);

      const audit = await t.prisma.auditLog.findFirstOrThrow({
        where: { entityId: booking.id, action: 'BOOKING_CHECKED_IN' },
      });
      expect(audit.hotelStaffId).toBe(desk.id);

      const again = await checkIn(desk.token, booking.id).expect(409);
      expect(again.body.code).toBe('BOOKING_STATUS_CONFLICT');
    });

    it('moves the remaining nights to the chosen rooms of the same type (BR-10)', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      const other = await paidBooking(me.token, h.roomTypeId, { from: 1 });
      const suite = await roomType(h.token, h.hotelId, 'Suite');
      const suiteRoom = await room(h.token, h.hotelId, suite, '201');
      await t.prisma.room.update({
        where: { roomId: h.rooms['104'] },
        data: { status: 'CLEANING' },
      });

      const refused = [
        [suiteRoom], // another room type
        [h.rooms['102']], // taken by `other` on the second night
        [h.rooms['104']], // still being cleaned
      ];
      for (const roomIds of refused) {
        const res = await checkIn(h.token, booking.id, { roomIds }).expect(409);
        expect(res.body.code).toBe('ROOM_NOT_ASSIGNABLE');
      }
      const count = await checkIn(h.token, booking.id, {
        roomIds: [h.rooms['102'], h.rooms['103']],
      }).expect(400);
      expect(count.body.details).toEqual([
        { field: 'roomIds', message: 'the booking has 1 rooms' },
      ]);

      const res = await checkIn(h.token, booking.id, {
        roomIds: [h.rooms['103']],
      }).expect(200);
      expect(res.body.data.assignedRooms).toEqual([
        { id: h.rooms['103'], roomNumber: '103' },
      ]);
      expect(await nights(booking.id)).toEqual([
        { date: day(0), room: '103', status: 'BOOKED', price: 1000000 },
        { date: day(1), room: '103', status: 'BOOKED', price: 1000000 },
      ]);
      expect(await roomStatus(h.rooms['101'])).toBe('AVAILABLE');
      expect(await roomStatus(h.rooms['103'])).toBe('OCCUPIED');
      // The other stay keeps its room.
      expect((await nights(other.id)).map((n) => n.room)).toEqual([
        '102',
        '102',
      ]);
    });

    it('leaves the nights already past where they were on a late check-in', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await shift(booking.id, 1); // checked in on the second day of the stay

      await checkIn(h.token, booking.id, { roomIds: [h.rooms['102']] }).expect(
        200,
      );
      expect((await nights(booking.id)).map((n) => [n.date, n.room])).toEqual([
        [day(-1), '101'],
        [day(0), '102'],
      ]);
    });

    it('is open from the check-in date to the day before check-out', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const ahead = await paidBooking(me.token, h.roomTypeId, { from: 30 });
      const early = await checkIn(h.token, ahead.id).expect(409);
      expect(early.body.code).toBe('CHECK_IN_NOT_OPEN');

      const past = await paidBooking(me.token, h.roomTypeId);
      await shift(past.id, 2); // the check-out date is today
      const late = await checkIn(h.token, past.id).expect(409);
      expect(late.body.code).toBe('CHECK_IN_NOT_OPEN');
    });

    it('waits for a pending refund decision', async () => {
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: null,
        feePercent: 50,
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await t
        .api()
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set(auth(me.token))
        .send({ reason: 'Plans changed' })
        .expect(200);

      const res = await checkIn(h.token, booking.id).expect(409);
      expect(res.body.code).toBe('REFUND_DECISION_PENDING');
    });

    it('needs FRONT_DESK, or an owner who is not suspended', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);

      const staff = await t.signInStaff(h.hotelId, 'booking@hotel.test', [
        'BOOKING',
        'REFUND',
      ]);
      const denied = await checkIn(staff.token, booking.id).expect(403);
      expect(denied.body.code).toBe('FORBIDDEN');

      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: h.id },
        data: { status: 'SUSPENDED' },
      });
      const suspended = await checkIn(h.token, booking.id).expect(403);
      expect(suspended.body.code).toBe('PARTNER_SUSPENDED');
      expect(await roomStatus(h.rooms['101'])).toBe('AVAILABLE');
    });
  });
});
