import { vietnamDateTime } from '../src/common/http/calendar-date';
import { CHANGE_CLOSED_REASON } from '../src/modules/bookings/booking-history';
import { BookingMailer } from '../src/modules/bookings/booking-mailer';
import {
  type MailMessage,
  MailService,
} from '../src/modules/mail/mail.service';
import { NoShowService } from '../src/modules/bookings/no-show.service';
import { SettlementService } from '../src/modules/bookings/settlement.service';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { PLATFORM_WALLET_ID } from '../src/modules/wallets/wallet-ledger';
import { createTestApp } from './helpers';

describe('Hotel operations: front desk, settlement, change requests (e2e)', () => {
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

  const checkOut = (token: string, id: string) =>
    t.api().post(`/api/v1/bookings/${id}/check-out`).set(auth(token));

  /** The booking's wallet movements in order: type, amount, idempotency key. */
  const ledger = async (bookingId: string) => {
    const rows = await t.prisma.walletTransaction.findMany({
      where: { bookingId },
      orderBy: [{ createdAt: 'asc' }, { amount: 'asc' }],
    });
    return rows.map((r) => [r.type, r.amount.toNumber(), r.idempotencyKey]);
  };

  const balances = async (hotelId: string) => {
    const hotel = await t.prisma.wallet.findUniqueOrThrow({
      where: { hotelId },
    });
    const platform = await t.prisma.wallet.findUniqueOrThrow({
      where: { walletId: PLATFORM_WALLET_ID },
    });
    return {
      hotel: {
        pending: hotel.balancePending.toNumber(),
        available: hotel.balanceAvailable.toNumber(),
      },
      platform: platform.balanceAvailable.toNumber(),
    };
  };

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
      // Room options follow check-in: no night left means nothing to offer.
      const options = await t
        .api()
        .get(`/api/v1/bookings/${past.id}/room-options`)
        .set(auth(h.token))
        .expect(409);
      expect(options.body.code).toBe('CHECK_IN_NOT_OPEN');
    });

    it('never checks in a booking the customer is cancelling at the same moment', async () => {
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: null,
        feePercent: 50,
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      // Three tries, each on its own room.
      for (let i = 0; i < 3; i++) {
        const booking = await paidBooking(me.token, h.roomTypeId);
        const [checkedIn, cancelled] = await Promise.all([
          checkIn(h.token, booking.id),
          t
            .api()
            .post(`/api/v1/bookings/${booking.id}/cancel`)
            .set(auth(me.token))
            .send({ reason: 'Plans changed' }),
        ]);
        const row = await t.prisma.booking.findUniqueOrThrow({
          where: { bookingId: booking.id },
          select: {
            status: true,
            invoice: { select: { paymentStatus: true } },
          },
        });
        // Exactly one wins, and the loser leaves no trace in the state.
        expect([checkedIn.status, cancelled.status].sort()).toEqual([200, 409]);
        expect([row.status, row.invoice!.paymentStatus]).toEqual(
          checkedIn.status === 200
            ? ['CHECKED_IN', 'PAID']
            : ['CONFIRMED', 'REFUND_PENDING'],
        );
      }
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
      const options = await t
        .api()
        .get(`/api/v1/bookings/${booking.id}/room-options`)
        .set(auth(h.token))
        .expect(409);
      expect(options.body.code).toBe('REFUND_DECISION_PENDING');
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

  describe('no-show', () => {
    const noShow = (token: string, id: string) =>
      t.api().post(`/api/v1/bookings/${id}/no-show`).set(auth(token));

    it('is marked by staff from the day after check-in: nights from today released, commission charged', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await shift(booking.id, 1); // the check-in date was yesterday

      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const res = await noShow(desk.token, booking.id).expect(200);
      expect(res.body.data).toMatchObject({
        status: 'NO_SHOW',
        paymentStatus: 'PAID',
        refund: null,
      });
      expect(
        (res.body.data.timeline as { event: string }[]).map((e) => e.event),
      ).toEqual(['CREATED', 'PAID', 'NO_SHOW']);
      expect((await nights(booking.id)).map((n) => n.date)).toEqual([day(-1)]);
      expect((await ledger(booking.id)).slice(1)).toEqual([
        ['COMMISSION', -160000, `commission:${booking.id}:hotel`],
        ['COMMISSION', 160000, `commission:${booking.id}:platform`],
      ]);
      const audit = await t.prisma.auditLog.findFirstOrThrow({
        where: { entityId: booking.id, action: 'BOOKING_NO_SHOW' },
      });
      expect(audit.hotelStaffId).toBe(desk.id);
      expect(JSON.parse(audit.newValue!)).toEqual({
        commission: 160000,
        releasedNights: [day(0)],
      });

      const again = await noShow(desk.token, booking.id).expect(409);
      expect(again.body.code).toBe('BOOKING_STATUS_CONFLICT');
      await checkIn(desk.token, booking.id).expect(409);
    });

    it('waits for the day after check-in, a refund decision and FRONT_DESK', async () => {
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: null,
        feePercent: 50,
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const today = await paidBooking(me.token, h.roomTypeId);
      const early = await noShow(h.token, today.id).expect(409);
      expect(early.body).toMatchObject({
        code: 'NO_SHOW_NOT_ALLOWED',
        message: `A no-show can be marked from ${day(1)}`,
      });

      const staff = await t.signInStaff(h.hotelId, 'booking@hotel.test', [
        'BOOKING',
      ]);
      await shift(today.id, 1);
      await noShow(staff.token, today.id).expect(403);

      await t
        .api()
        .post(`/api/v1/bookings/${today.id}/cancel`)
        .set(auth(me.token))
        .send({ reason: 'Plans changed' })
        .expect(200);
      const pending = await noShow(h.token, today.id).expect(409);
      expect(pending.body.code).toBe('REFUND_DECISION_PENDING');
    });

    it('is marked by the job at the check-out time on the check-out date', async () => {
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: null,
        feePercent: 50,
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const away = await paidBooking(me.token, h.roomTypeId);
      const staying = await paidBooking(me.token, h.roomTypeId);
      const refunding = await paidBooking(me.token, h.roomTypeId);
      await checkIn(h.token, staying.id).expect(200);
      await t
        .api()
        .post(`/api/v1/bookings/${refunding.id}/cancel`)
        .set(auth(me.token))
        .send({ reason: 'Plans changed' })
        .expect(200);
      for (const b of [away, staying, refunding]) await shift(b.id, 2); // check-out date today

      const job = t.app.get(NoShowService);
      // No check-out time set: 12:00.
      expect(await job.markDue(vietnamDateTime(day(0), '11:59'))).toBe(0);
      expect(await job.markDue(vietnamDateTime(day(0), '12:00'))).toBe(1);
      expect(await job.markDue(vietnamDateTime(day(0), '12:05'))).toBe(0);

      const statuses = await t.prisma.booking.findMany({
        where: { bookingId: { in: [away.id, staying.id, refunding.id] } },
        select: { bookingId: true, status: true },
      });
      expect(
        Object.fromEntries(statuses.map((b) => [b.bookingId, b.status])),
      ).toEqual({
        [away.id]: 'NO_SHOW',
        [staying.id]: 'CHECKED_IN',
        [refunding.id]: 'CONFIRMED',
      });
      const audit = await t.prisma.auditLog.findFirstOrThrow({
        where: { entityId: away.id, action: 'BOOKING_NO_SHOW' },
      });
      expect([audit.hotelStaffId, audit.hotelPartnerId]).toEqual([null, null]);
      // Nothing left to release on the check-out date.
      expect(JSON.parse(audit.newValue!)).toMatchObject({ releasedNights: [] });
    });

    it('follows the hotel check-out time and marks once when staff and the job race', async () => {
      const h = await hotel();
      await t.prisma.hotel.update({
        where: { hotelId: h.hotelId },
        data: { checkOutTime: new Date('1970-01-01T10:00:00.000Z') },
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await shift(booking.id, 2);

      const job = t.app.get(NoShowService);
      expect(await job.markDue(vietnamDateTime(day(0), '09:59'))).toBe(0);
      const [byStaff, byJob] = await Promise.all([
        noShow(h.token, booking.id),
        job.markDue(vietnamDateTime(day(0), '10:00')),
      ]);
      // Exactly one of them marks it; the other finds it already NO_SHOW.
      expect([byStaff.status, byJob]).toEqual(
        byStaff.status === 200 ? [200, 0] : [409, 1],
      );
      expect(await ledger(booking.id)).toHaveLength(3);
      expect(
        await t.prisma.auditLog.count({
          where: { entityId: booking.id, action: 'BOOKING_NO_SHOW' },
        }),
      ).toBe(1);
    });
  });

  describe('POST /bookings/:id/check-out', () => {
    it('completes the stay, sends the rooms to cleaning and charges the commission once', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId, { rooms: 2 });
      await checkIn(h.token, booking.id).expect(200);
      await shift(booking.id, 2); // the check-out date is today

      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const results = await Promise.all([
        checkOut(desk.token, booking.id),
        checkOut(h.token, booking.id),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      const done = results.find((r) => r.status === 200)!;
      expect(done.body.data).toMatchObject({
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        assignedRooms: [
          { id: h.rooms['101'], roomNumber: '101' },
          { id: h.rooms['102'], roomNumber: '102' },
        ],
      });
      expect(
        (done.body.data.timeline as { event: string }[]).map((e) => e.event),
      ).toEqual(['CREATED', 'PAID', 'CHECKED_IN', 'COMPLETED']);
      expect(await roomStatus(h.rooms['101'])).toBe('CLEANING');
      expect(await roomStatus(h.rooms['102'])).toBe('CLEANING');
      // Nothing to release on the check-out date: the nights stay as the record of the stay.
      expect(await nights(booking.id)).toHaveLength(4);

      // 4,000,000 × 8% = 320,000.
      expect(await ledger(booking.id)).toEqual([
        ['BOOKING_PAYMENT', 4000000, `sepay:txn-${booking.code}`],
        ['COMMISSION', -320000, `commission:${booking.id}:hotel`],
        ['COMMISSION', 320000, `commission:${booking.id}:platform`],
      ]);
      expect(await balances(h.hotelId)).toEqual({
        hotel: { pending: 3680000, available: 0 },
        platform: 320000,
      });
      const audit = await t.prisma.auditLog.findFirstOrThrow({
        where: { entityId: booking.id, action: 'BOOKING_CHECKED_OUT' },
      });
      expect(JSON.parse(audit.newValue!)).toEqual({
        commission: 320000,
        releasedNights: [],
      });
    });

    it('releases the nights from today on when the guest leaves early, without refund', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await shift(booking.id, 1); // second day of a two-night stay
      await checkIn(h.token, booking.id).expect(200);

      const res = await checkOut(h.token, booking.id).expect(200);
      expect(res.body.data).toMatchObject({
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        refund: null,
        totalAmount: 2000000,
      });
      expect((await nights(booking.id)).map((n) => n.date)).toEqual([day(-1)]);
      // Tonight is free again for another guest.
      const availability = await t
        .api()
        .get(
          `/api/v1/hotels/${h.hotelId}/availability?from=${day(0)}&to=${day(0)}`,
        )
        .set(auth(h.token))
        .expect(200);
      expect(availability.body.data[0]).toMatchObject({ booked: 0 });
      expect(await balances(h.hotelId)).toEqual({
        hotel: { pending: 1840000, available: 0 },
        platform: 160000,
      });
    });

    it('needs a CHECKED_IN booking and FRONT_DESK', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      const early = await checkOut(h.token, booking.id).expect(409);
      expect(early.body.code).toBe('BOOKING_STATUS_CONFLICT');

      await checkIn(h.token, booking.id).expect(200);
      const staff = await t.signInStaff(h.hotelId, 'booking@hotel.test', [
        'BOOKING',
      ]);
      await checkOut(staff.token, booking.id).expect(403);
      const stranger = await hotel('other@hotel.test');
      await checkOut(stranger.token, booking.id).expect(404);
      expect(await ledger(booking.id)).toHaveLength(1);
    });
  });

  describe('POST /rooms/:id/clean', () => {
    it('puts a cleaned room back on sale', async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      await t.prisma.room.update({
        where: { roomId: h.rooms['101'] },
        data: { status: 'CLEANING' },
      });
      const clean = (token: string, roomId = h.rooms['101']) =>
        t.api().post(`/api/v1/rooms/${roomId}/clean`).set(auth(token));

      const staff = await t.signInStaff(h.hotelId, 'booking@hotel.test', [
        'BOOKING',
      ]);
      await clean(staff.token).expect(403);
      const hidden = await clean(other.token).expect(404);
      expect(hidden.body.code).toBe('ROOM_NOT_FOUND');

      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const res = await clean(desk.token).expect(200);
      expect(res.body.data).toMatchObject({
        id: h.rooms['101'],
        status: 'AVAILABLE',
      });
      const again = await clean(desk.token).expect(409);
      expect(again.body.code).toBe('ROOM_STATUS_CONFLICT');
      const occupied = await clean(desk.token, h.rooms['102']).expect(409);
      expect(occupied.body.code).toBe('ROOM_STATUS_CONFLICT');
    });
  });

  describe('settlement', () => {
    it('makes the net amount available after the holding period, once', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await checkIn(h.token, booking.id).expect(200);
      await checkOut(h.token, booking.id).expect(200);

      const settlement = t.app.get(SettlementService);
      // WALLET_HOLD_DAYS defaults to 1 day after the check-out.
      expect(await settlement.settleDue(new Date(Date.now() + 3_600_000))).toBe(
        0,
      );
      const later = new Date(Date.now() + 86_400_000 + 60_000);
      const runs = await Promise.all([
        settlement.settleDue(later),
        settlement.settleDue(later),
      ]);
      expect(runs[0] + runs[1]).toBe(1);
      expect(await settlement.settleDue(later)).toBe(0);

      expect((await ledger(booking.id)).slice(3)).toEqual([
        ['SETTLEMENT', -1840000, `settlement:${booking.id}:pending`],
        ['SETTLEMENT', 1840000, `settlement:${booking.id}:available`],
      ]);
      expect(await balances(h.hotelId)).toEqual({
        hotel: { pending: 0, available: 1840000 },
        platform: 160000,
      });
    });

    it('makes the money kept from a cancellation available, without commission', async () => {
      // 30% after a 3-day free period; and non-refundable.
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: 3,
        feePercent: 30,
      });
      const strict = await hotel('strict@hotel.test', {
        freeCancellationDays: null,
        feePercent: 100,
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const cancel = (id: string) =>
        t
          .api()
          .post(`/api/v1/bookings/${id}/cancel`)
          .set(auth(me.token))
          .send({ reason: 'Plans changed' })
          .expect(200);
      const approve = (token: string, id: string) =>
        t
          .api()
          .post(`/api/v1/bookings/${id}/approve-refund`)
          .set(auth(token))
          .expect(200);

      const free = await paidBooking(me.token, h.roomTypeId, { from: 30 });
      await cancel(free.id);
      await approve(h.token, free.id); // REFUNDED: nothing kept
      const late = await paidBooking(me.token, h.roomTypeId);
      await cancel(late.id);
      await approve(h.token, late.id); // PARTIALLY_REFUNDED: 600,000 kept
      const kept = await paidBooking(me.token, strict.roomTypeId);
      await cancel(kept.id); // cancelled at once: 2,000,000 kept

      const settlement = t.app.get(SettlementService);
      expect(await settlement.settleDue(new Date(Date.now() + 3_600_000))).toBe(
        0,
      );
      const later = new Date(Date.now() + 86_400_000 + 60_000);
      expect(await settlement.settleDue(later)).toBe(2);
      expect(await settlement.settleDue(later)).toBe(0);

      expect((await ledger(late.id)).slice(-2)).toEqual([
        ['SETTLEMENT', -600000, `settlement:${late.id}:pending`],
        ['SETTLEMENT', 600000, `settlement:${late.id}:available`],
      ]);
      expect(await ledger(free.id)).toHaveLength(3); // payment and the two refund rows
      expect(await balances(h.hotelId)).toEqual({
        hotel: { pending: 0, available: 600000 },
        platform: 0,
      });
      expect(await balances(strict.hotelId)).toEqual({
        hotel: { pending: 0, available: 2000000 },
        platform: 0,
      });
    });
  });

  describe('notifications next to the booking emails', () => {
    const inbox = async (token: string) => {
      await t.app.get(BookingMailer).idle();
      const res = await t
        .api()
        .get('/api/v1/me/notifications')
        .set(auth(token))
        .expect(200);
      return res.body.data as {
        type: string;
        title: string;
        message: string;
        link: string;
      }[];
    };

    it('writes one for each email, to the same person, with the screen to open', async () => {
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: null,
        feePercent: 50,
      });
      const refunds = await t.signInStaff(h.hotelId, 'refund@hotel.test', [
        'REFUND',
      ]);
      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);

      expect(await inbox(me.token)).toEqual([
        {
          id: expect.any(String),
          type: 'BOOKING',
          title: `Xác nhận đặt phòng ${booking.code}`,
          message: `Đơn đặt phòng ${booking.code} đã được thanh toán và xác nhận.`,
          link: `/account/bookings/${booking.id}`,
          isRead: false,
          createdAt: expect.any(String),
        },
      ]);

      // Every notification of the refund request exists before the first of its emails goes out.
      const mail = t.app.get(MailService);
      const send: MailService['send'] = mail.send.bind(mail);
      const seenAtSend: number[] = [];
      mail.send = async (m: MailMessage) => {
        seenAtSend.push(
          await t.prisma.notification.count({ where: { type: 'PAYMENT' } }),
        );
        return send(m);
      };
      try {
        await t
          .api()
          .post(`/api/v1/bookings/${booking.id}/cancel`)
          .set(auth(me.token))
          .send({ reason: 'Plans changed' })
          .expect(200);
        await t.app.get(BookingMailer).idle();
      } finally {
        mail.send = send;
      }
      // Customer, owner and the REFUND staff member: three notifications, then three emails.
      expect(seenAtSend).toEqual([3, 3, 3]);
      const [requested] = await inbox(me.token);
      expect(requested).toMatchObject({
        type: 'PAYMENT',
        title: `Đã nhận yêu cầu hủy đơn ${booking.code}`,
      });
      // The hotel side: the owner and the staff with REFUND, each with their own screen.
      const title = `Yêu cầu hoàn tiền mới: ${booking.code}`;
      expect((await inbox(h.token))[0]).toMatchObject({
        type: 'PAYMENT',
        title,
        link: '/partner/bookings',
      });
      expect((await inbox(refunds.token))[0]).toMatchObject({
        type: 'PAYMENT',
        title,
        link: `/staff/bookings/${booking.id}`,
      });
      expect(await inbox(desk.token)).toEqual([]);
    });
  });

  describe('change requests', () => {
    const requestChange = (token: string, id: string, body: object) =>
      t
        .api()
        .post(`/api/v1/bookings/${id}/change-request`)
        .set(auth(token))
        .send(body);
    const accept = (token: string, id: string) =>
      t.api().post(`/api/v1/bookings/${id}/accept-change`).set(auth(token));
    const reject = (token: string, id: string, reason = 'Không đổi được') =>
      t
        .api()
        .post(`/api/v1/bookings/${id}/reject-change`)
        .set(auth(token))
        .send({ reason });
    const queue = async (token: string, hotelId: string) => {
      const res = await t
        .api()
        .get(`/api/v1/hotels/${hotelId}/bookings?changeRequest=PENDING`)
        .set(auth(token))
        .expect(200);
      return (res.body.data as { id: string }[]).map((b) => b.id);
    };
    const mailsTo = async () => {
      await t.app.get(BookingMailer).idle();
      const sent = t.outbox.map((m) => [m.to, m.subject]);
      t.outbox.length = 0;
      return sent;
    };

    it('keeps the changed fields, queues the request and applies it when accepted', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      const other = await paidBooking(me.token, h.roomTypeId);
      const desk = await t.signInStaff(h.hotelId, 'booking@hotel.test', [
        'BOOKING',
      ]);
      await t.signInStaff(h.hotelId, 'refund@hotel.test', ['REFUND']);
      await mailsTo();

      // The phone is the booking's own: only the name and the requests change.
      const res = await requestChange(me.token, booking.id, {
        guestName: 'Trần Văn B',
        contactPhone: '0905123456',
        specialRequests: 'Phòng tầng cao',
      }).expect(200);
      expect(res.body.data.changeRequest).toMatchObject({
        status: 'PENDING',
        changes: { guestName: 'Trần Văn B', specialRequests: 'Phòng tầng cao' },
        decidedAt: null,
        reason: null,
      });
      expect(res.body.data.changeRequest.changes).not.toHaveProperty(
        'contactPhone',
      );
      expect(res.body.data.guestName).toBe('Nguyễn Văn A');
      // The owner and staff with BOOKING, not the refund-only staff.
      const subject = `Yêu cầu đổi thông tin đơn ${booking.code}`;
      expect((await mailsTo()).sort()).toEqual([
        ['booking@hotel.test', subject],
        ['owner@hotel.test', subject],
      ]);

      const twice = await requestChange(me.token, booking.id, {
        guestName: 'Lê C',
      }).expect(409);
      expect(twice.body.code).toBe('CHANGE_REQUEST_PENDING');
      expect(await queue(desk.token, h.hotelId)).toEqual([booking.id]);
      expect(await queue(h.token, h.hotelId)).not.toContain(other.id);

      const accepted = await accept(desk.token, booking.id).expect(200);
      expect(accepted.body.data).toMatchObject({
        guestName: 'Trần Văn B',
        specialRequests: 'Phòng tầng cao',
        changeRequest: { status: 'ACCEPTED', reason: null },
      });
      expect(
        (accepted.body.data.timeline as { event: string }[]).map(
          (e) => e.event,
        ),
      ).toEqual(['CREATED', 'PAID', 'CHANGE_REQUESTED', 'CHANGE_ACCEPTED']);
      expect(await mailsTo()).toEqual([
        ['guest@mail.test', `Đơn ${booking.code} đã được cập nhật`],
      ]);
      expect(await queue(desk.token, h.hotelId)).toEqual([]);
      const again = await accept(desk.token, booking.id).expect(409);
      expect(again.body.code).toBe('CHANGE_REQUEST_STATUS_CONFLICT');
    });

    it('rejects with a reason, after which the customer may ask again', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await requestChange(me.token, booking.id, {
        arrivalTime: '21:00',
      }).expect(200);

      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      await reject(desk.token, booking.id).expect(403);
      await mailsTo();
      const res = await reject(
        h.token,
        booking.id,
        'Hết phòng tầng cao',
      ).expect(200);
      expect(res.body.data).toMatchObject({
        arrivalTime: null,
        changeRequest: {
          status: 'REJECTED',
          changes: { arrivalTime: '21:00' },
          reason: 'Hết phòng tầng cao',
        },
      });
      expect(await mailsTo()).toEqual([
        [
          'guest@mail.test',
          `Yêu cầu đổi thông tin đơn ${booking.code} bị từ chối`,
        ],
      ]);
      await reject(h.token, booking.id).expect(409);

      // A new request replaces the rejected one; clearing a value it already lacks is no change.
      const empty = await requestChange(me.token, booking.id, {
        specialRequests: null,
      }).expect(400);
      expect(empty.body.details).toEqual([
        { field: 'specialRequests', message: 'same as the booking' },
      ]);
      const next = await requestChange(me.token, booking.id, {
        arrivalTime: '19:00',
      }).expect(200);
      expect(next.body.data.changeRequest).toMatchObject({
        status: 'PENDING',
        changes: { arrivalTime: '19:00' },
      });

      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: h.id },
        data: { status: 'SUSPENDED' },
      });
      const suspended = await accept(h.token, booking.id).expect(403);
      expect(suspended.body.code).toBe('PARTNER_SUSPENDED');
    });

    it('is only for the customer, a CONFIRMED booking and one request at a time', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'other@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);

      await requestChange(me.token, booking.id, {}).expect(400);
      const hidden = await requestChange(stranger.token, booking.id, {
        guestName: 'X',
      }).expect(404);
      expect(hidden.body.code).toBe('BOOKING_NOT_FOUND');
      await requestChange(h.token, booking.id, { guestName: 'X' }).expect(403);

      const results = await Promise.all([
        requestChange(me.token, booking.id, { guestName: 'Lê C' }),
        requestChange(me.token, booking.id, { guestName: 'Lê D' }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);

      // Checking in closes the waiting request: nothing is left to decide.
      const checkedIn = await checkIn(h.token, booking.id).expect(200);
      expect(checkedIn.body.data.changeRequest).toMatchObject({
        status: 'REJECTED',
        reason: CHANGE_CLOSED_REASON,
      });
      const events = (checkedIn.body.data.timeline as { event: string }[]).map(
        (e) => e.event,
      );
      expect(events.slice(-2)).toEqual(['CHANGE_REJECTED', 'CHECKED_IN']);
      const late = await accept(h.token, booking.id).expect(409);
      expect(late.body.code).toBe('CHANGE_REQUEST_STATUS_CONFLICT');
      const closed = await requestChange(me.token, booking.id, {
        guestName: 'Lê E',
      }).expect(409);
      expect(closed.body.code).toBe('BOOKING_STATUS_CONFLICT');
    });

    it('waits for a refund decision and closes the request when the booking is cancelled', async () => {
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: null,
        feePercent: 50,
      });
      const strict = await hotel('strict@hotel.test', {
        freeCancellationDays: null,
        feePercent: 100,
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const cancel = (id: string) =>
        t
          .api()
          .post(`/api/v1/bookings/${id}/cancel`)
          .set(auth(me.token))
          .send({ reason: 'Plans changed' })
          .expect(200);

      // A request made before the cancel: it cannot be accepted until the owner decides the refund.
      const refunding = await paidBooking(me.token, h.roomTypeId);
      await requestChange(me.token, refunding.id, { guestName: 'Lê B' }).expect(
        200,
      );
      await cancel(refunding.id);
      const blocked = await accept(h.token, refunding.id).expect(409);
      expect(blocked.body.code).toBe('REFUND_DECISION_PENDING');
      const asked = await requestChange(me.token, refunding.id, {
        arrivalTime: '20:00',
      }).expect(409);
      expect(asked.body.code).toBe('REFUND_DECISION_PENDING');
      expect(await queue(h.token, h.hotelId)).toEqual([refunding.id]);
      // The refund approval cancels the booking and closes the request.
      const approved = await t
        .api()
        .post(`/api/v1/bookings/${refunding.id}/approve-refund`)
        .set(auth(h.token))
        .expect(200);
      expect(approved.body.data.changeRequest).toMatchObject({
        status: 'REJECTED',
        reason: CHANGE_CLOSED_REASON,
      });
      expect(await queue(h.token, h.hotelId)).toEqual([]);

      // Cancelled at once (nothing to refund): closed in the same step.
      const kept = await paidBooking(me.token, strict.roomTypeId);
      await requestChange(me.token, kept.id, { guestName: 'Lê C' }).expect(200);
      const res = await cancel(kept.id);
      expect(res.body.data).toMatchObject({
        status: 'CANCELLED',
        changeRequest: { status: 'REJECTED', reason: CHANGE_CLOSED_REASON },
      });
    });
  });
});
