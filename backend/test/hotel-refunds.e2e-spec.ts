import { RefundDecisionsService } from '../src/modules/bookings/refund-decisions.service';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Hotel bookings and refund decisions (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel (check-in 14:00) with one room type (1,000,000 a night, 4 rooms). */
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
    for (let n = 1; n <= 4; n++) {
      await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/rooms`)
        .set(auth(partner.token))
        .send({ roomTypeId, roomNumber: `10${n}` })
        .expect(201);
    }
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId, roomTypeId };
  };

  /** A paid booking of 2 nights (2,000,000) starting `from` days ahead, for `guestName`. */
  const paidBooking = async (
    token: string,
    roomTypeId: string,
    { from = 30, guestName = 'Nguyễn Văn A' } = {},
  ) => {
    const res = await t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        roomTypeId,
        checkIn: day(from),
        checkOut: day(from + 2),
        guests: 1,
        guestName,
        contactPhone: '0905123456',
        expectedTotal: 2000000,
      })
      .expect(201);
    const booking = res.body.data as { id: string; code: string };
    await t.app.get(PaymentConfirmationService).confirm({
      code: booking.code,
      amount: 2000000,
      transactionId: `txn-${booking.code}`,
      paidAt: new Date(),
    });
    return booking;
  };

  const cancel = (token: string, id: string) =>
    t
      .api()
      .post(`/api/v1/bookings/${id}/cancel`)
      .set(auth(token))
      .send({ reason: 'Plans changed' })
      .expect(200);
  const post = (token: string, path: string, body: object = {}) =>
    t.api().post(`/api/v1/bookings/${path}`).set(auth(token)).send(body);
  const events = (body: unknown) =>
    (body as { data: { timeline: { event: string }[] } }).data.timeline.map(
      (e) => e.event,
    );
  const balances = async (hotelId: string, customerId: string) => {
    const [hotelWallet, customerWallet] = await Promise.all([
      t.prisma.wallet.findUnique({ where: { hotelId } }),
      t.prisma.wallet.findUnique({ where: { customerId } }),
    ]);
    return {
      hotelPending: hotelWallet?.balancePending.toNumber() ?? 0,
      customerAvailable: customerWallet?.balanceAvailable.toNumber() ?? 0,
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

  describe('GET /hotels/:hotelId/bookings', () => {
    it('lists, filters, searches and sorts the hotel bookings', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const late = await paidBooking(me.token, h.roomTypeId, {
        from: 40,
        guestName: 'Trần Thị B',
      });
      const early = await paidBooking(me.token, h.roomTypeId, { from: 20 });
      await cancel(me.token, late.id);
      const url = `/api/v1/hotels/${h.hotelId}/bookings`;
      const ids = (body: unknown) =>
        (body as { data: { id: string }[] }).data.map((b) => b.id);

      const all = await t.api().get(url).set(auth(h.token)).expect(200);
      expect(ids(all.body)).toEqual([early.id, late.id]);
      expect(all.body.meta).toMatchObject({ total: 2 });

      const queue = await t
        .api()
        .get(`${url}?paymentStatus=REFUND_PENDING`)
        .set(auth(h.token))
        .expect(200);
      expect(ids(queue.body)).toEqual([late.id]);

      const byName = await t
        .api()
        .get(`${url}?search=trần&sort=check-in-desc`)
        .set(auth(h.token))
        .expect(200);
      expect(ids(byName.body)).toEqual([late.id]);
      const byCode = await t
        .api()
        .get(
          `${url}?search=${early.code}&checkInFrom=${day(10)}&checkInTo=${day(25)}`,
        )
        .set(auth(h.token))
        .expect(200);
      expect(ids(byCode.body)).toEqual([early.id]);
    });

    it('is for the owner and staff with BOOKING or REFUND', async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const url = `/api/v1/hotels/${h.hotelId}/bookings`;
      const queue = `${url}?paymentStatus=REFUND_PENDING`;
      for (const permission of ['BOOKING', 'REFUND'] as const) {
        const staff = await t.signInStaff(
          h.hotelId,
          `${permission.toLowerCase()}@hotel.test`,
          [permission],
        );
        await t.api().get(url).set(auth(staff.token)).expect(200);
        // The refund queue is only for staff who handle refunds.
        await t
          .api()
          .get(queue)
          .set(auth(staff.token))
          .expect(permission === 'REFUND' ? 200 : 403);
      }
      await t.api().get(queue).set(auth(h.token)).expect(200);
      const front = await t.signInStaff(h.hotelId, 'front@hotel.test', [
        'FRONT_DESK',
      ]);
      await t.api().get(url).set(auth(front.token)).expect(403);
      const hidden = await t.api().get(url).set(auth(other.token)).expect(404);
      expect(hidden.body.code).toBe('HOTEL_NOT_FOUND');
    });
  });

  describe('refund decisions', () => {
    it('lets REFUND staff forward a request with a note, and nobody else', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      const refundStaff = await t.signInStaff(h.hotelId, 'r@hotel.test', [
        'REFUND',
      ]);
      const bookingStaff = await t.signInStaff(h.hotelId, 'b@hotel.test', [
        'BOOKING',
      ]);

      const early = await post(
        refundStaff.token,
        `${booking.id}/forward-refund`,
        { note: 'Within the free period' },
      ).expect(409);
      expect(early.body.code).toBe('REFUND_STATUS_CONFLICT');

      await cancel(me.token, booking.id);
      await post(bookingStaff.token, `${booking.id}/forward-refund`, {
        note: 'x',
      }).expect(403);
      await post(h.token, `${booking.id}/forward-refund`, {
        note: 'x',
      }).expect(403);
      const res = await post(
        refundStaff.token,
        `${booking.id}/forward-refund`,
        { note: 'Within the free period' },
      ).expect(200);
      expect(events(res.body)).toEqual([
        'CREATED',
        'PAID',
        'CANCEL_REQUESTED',
        'REFUND_FORWARDED',
      ]);
      expect(res.body.data.paymentStatus).toBe('REFUND_PENDING');
    });

    it('approves a full refund: hotel wallet to customer wallet, nights released', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await cancel(me.token, booking.id);

      const res = await post(h.token, `${booking.id}/approve-refund`).expect(
        200,
      );
      expect(res.body.data).toMatchObject({
        status: 'CANCELLED',
        paymentStatus: 'REFUNDED',
        refund: { status: 'REFUNDED', amount: 2000000 },
        refundRejection: null,
      });
      expect(events(res.body)).toEqual([
        'CREATED',
        'PAID',
        'CANCEL_REQUESTED',
        'REFUND_APPROVED',
        'CANCELLED',
      ]);
      expect(await t.prisma.roomCalendars.count()).toBe(0);
      expect(await balances(h.hotelId, me.id)).toEqual({
        hotelPending: 0,
        customerAvailable: 2000000,
      });
      const rows = await t.prisma.walletTransaction.findMany({
        where: { bookingId: booking.id, type: 'REFUND' },
        orderBy: { idempotencyKey: 'asc' },
      });
      expect(rows.map((r) => [r.idempotencyKey, r.amount.toNumber()])).toEqual([
        [`refund:${booking.id}:customer`, 2000000],
        [`refund:${booking.id}:hotel`, -2000000],
      ]);

      const again = await post(h.token, `${booking.id}/approve-refund`).expect(
        409,
      );
      expect(again.body.code).toBe('REFUND_STATUS_CONFLICT');
    });

    it('approves a partial refund with the amount fixed at cancellation', async () => {
      const h = await hotel('owner@hotel.test', {
        freeCancellationDays: null,
        feePercent: 30,
      });
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await cancel(me.token, booking.id);
      // A later policy change does not move the amount.
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/cancellation-policy`)
        .set(auth(h.token))
        .send({ freeCancellationDays: null, feePercent: 100 })
        .expect(200);

      const res = await post(h.token, `${booking.id}/approve-refund`).expect(
        200,
      );
      expect(res.body.data).toMatchObject({
        paymentStatus: 'PARTIALLY_REFUNDED',
        refund: { status: 'PARTIALLY_REFUNDED', amount: 1400000 },
      });
      expect(await balances(h.hotelId, me.id)).toEqual({
        hotelPending: 600000,
        customerAvailable: 1400000,
      });
    });

    it('rejects with a reason the customer sees, and allows a new request', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await cancel(me.token, booking.id);

      const res = await post(h.token, `${booking.id}/reject-refund`, {
        reason: 'Duplicate request',
      }).expect(200);
      expect(res.body.data).toMatchObject({
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        refund: null,
        refundRejection: { reason: 'Duplicate request' },
      });
      expect(events(res.body)).toEqual([
        'CREATED',
        'PAID',
        'CANCEL_REQUESTED',
        'REFUND_REJECTED',
      ]);
      expect(await t.prisma.roomCalendars.count()).toBe(2);
      expect(await balances(h.hotelId, me.id)).toEqual({
        hotelPending: 2000000,
        customerAvailable: 0,
      });

      const again = await cancel(me.token, booking.id);
      expect(again.body.data).toMatchObject({
        paymentStatus: 'REFUND_PENDING',
        refundRejection: null,
      });
      await post(h.token, `${booking.id}/reject-refund`, {
        reason: '',
      }).expect(400);
    });

    it('lets a suspended partner approve but not reject', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const first = await paidBooking(me.token, h.roomTypeId);
      const second = await paidBooking(me.token, h.roomTypeId, { from: 40 });
      await cancel(me.token, first.id);
      await cancel(me.token, second.id);
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: h.id },
        data: { status: 'SUSPENDED' },
      });

      const rejected = await post(h.token, `${first.id}/reject-refund`, {
        reason: 'Fraud',
      }).expect(403);
      expect(rejected.body.code).toBe('PARTNER_SUSPENDED');
      await post(h.token, `${second.id}/approve-refund`).expect(200);

      const staff = await t.signInStaff(h.hotelId, 'r@hotel.test', ['REFUND']);
      await post(staff.token, `${first.id}/approve-refund`).expect(403);
      const other = await hotel('other@hotel.test');
      const hidden = await post(
        other.token,
        `${first.id}/approve-refund`,
      ).expect(404);
      expect(hidden.body.code).toBe('BOOKING_NOT_FOUND');
    });

    it('applies an approval and a rejection sent at once only once', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(me.token, h.roomTypeId);
      await cancel(me.token, booking.id);

      const results = await Promise.all([
        post(h.token, `${booking.id}/approve-refund`),
        post(h.token, `${booking.id}/reject-refund`, { reason: 'Fraud' }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(
        await t.prisma.walletTransaction.count({ where: { type: 'REFUND' } }),
      ).toBeLessThanOrEqual(2);
    });
  });

  describe('automatic approval at the check-in time', () => {
    it('approves requests made before the check-in time, and only those', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const before = await paidBooking(me.token, h.roomTypeId);
      const after = await paidBooking(me.token, h.roomTypeId);
      await cancel(me.token, before.id);
      await cancel(me.token, after.id);
      const checkInAt = new Date(`${day(30)}T14:00:00+07:00`);
      // The second request was made after the check-in time.
      await t.prisma.auditLog.updateMany({
        where: { action: 'BOOKING_CANCEL_REQUESTED', entityId: after.id },
        data: { createdAt: new Date(checkInAt.getTime() + 60_000) },
      });
      const job = t.app.get(RefundDecisionsService);

      expect(await job.approveDue(new Date(checkInAt.getTime() - 1000))).toBe(
        0,
      );
      expect(
        await job.approveDue(new Date(checkInAt.getTime() + 120_000)),
      ).toBe(1);

      const approved = await t.prisma.booking.findUniqueOrThrow({
        where: { bookingId: before.id },
        include: { invoice: true },
      });
      expect([approved.status, approved.invoice!.paymentStatus]).toEqual([
        'CANCELLED',
        'REFUNDED',
      ]);
      const waiting = await t.prisma.invoice.findUniqueOrThrow({
        where: { bookingId: after.id },
      });
      expect(waiting.paymentStatus).toBe('REFUND_PENDING');
      const audit = await t.prisma.auditLog.findFirstOrThrow({
        where: { action: 'REFUND_AUTO_APPROVED', entityId: before.id },
      });
      expect(audit.hotelPartnerId).toBeNull();
    });
  });
});
