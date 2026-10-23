import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Booking cancellation (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const checkIn = day(30);

  /** An ACTIVE hotel with one room type (1,000,000 a night, 1 room) and the given cancellation policy. */
  const hotel = async (policy?: {
    freeCancellationDays: number | null;
    feePercent: number;
  }) => {
    const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@hotel.test',
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
    await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set(auth(partner.token))
      .send({ roomTypeId, roomNumber: '101' })
      .expect(201);
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId, roomTypeId };
  };

  /** A booking of 2 nights (total 2,000,000), paid unless `paid` is false. */
  const book = async (token: string, roomTypeId: string, paid = true) => {
    const res = await t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        roomTypeId,
        checkIn,
        checkOut: day(32),
        guests: 1,
        guestName: 'Nguyễn Văn A',
        contactPhone: '0905123456',
        expectedTotal: 2000000,
      })
      .expect(201);
    const booking = res.body.data as { id: string; code: string };
    if (paid) {
      await t.app.get(PaymentConfirmationService).confirm({
        code: booking.code,
        amount: 2000000,
        transactionId: `txn-${booking.code}`,
        paidAt: new Date(),
      });
    }
    return booking;
  };

  const quote = (token: string, id: string) =>
    t.api().get(`/api/v1/bookings/${id}/cancellation-quote`).set(auth(token));
  const cancel = (token: string, id: string, reason = 'Plans changed') =>
    t
      .api()
      .post(`/api/v1/bookings/${id}/cancel`)
      .set(auth(token))
      .send({ reason });
  const nights = (bookingId: string) =>
    t.prisma.roomCalendars.count({ where: { bookingId } });

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

  it('turns a cancellation before the deadline into a refund request', async () => {
    const h = await hotel(); // default: free until 14:00 the day before
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    const q = await quote(me.token, booking.id).expect(200);
    expect(q.body.data).toEqual({
      freeUntil: new Date(`${day(29)}T14:00:00+07:00`).toISOString(),
      feePercent: 100,
      paid: 2000000,
      fee: 0,
      refund: 2000000,
      needsApproval: true,
    });

    const res = await cancel(me.token, booking.id).expect(200);
    expect(res.body.data).toMatchObject({
      status: 'CONFIRMED',
      paymentStatus: 'REFUND_PENDING',
      refund: { status: 'REFUND_PENDING', amount: 2000000 },
      cancelReason: 'Plans changed',
      cancelledAt: null,
    });
    expect(
      (res.body.data.timeline as { event: string }[]).map((e) => e.event),
    ).toEqual(['CREATED', 'PAID', 'CANCEL_REQUESTED']);
    // The rooms stay held for the guest until the hotel decides.
    expect(await nights(booking.id)).toBe(2);

    const again = await cancel(me.token, booking.id).expect(409);
    expect(again.body.code).toBe('BOOKING_STATUS_CONFLICT');
    await quote(me.token, booking.id).expect(409);

    const audit = await t.prisma.auditLog.findFirstOrThrow({
      where: { action: 'BOOKING_CANCEL_REQUESTED', entityId: booking.id },
    });
    expect(audit).toMatchObject({ customerId: me.id, entityType: 'booking' });
    expect(JSON.parse(audit.newValue!)).toEqual({
      reason: 'Plans changed',
      paid: 2000000,
      fee: 0,
      refund: 2000000,
    });
  });

  it('cancels at once and releases the nights when nothing is refunded', async () => {
    const h = await hotel({ freeCancellationDays: null, feePercent: 100 });
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    const q = await quote(me.token, booking.id).expect(200);
    expect(q.body.data).toMatchObject({
      freeUntil: null,
      fee: 2000000,
      refund: 0,
      needsApproval: false,
    });

    const res = await cancel(me.token, booking.id).expect(200);
    expect(res.body.data).toMatchObject({
      status: 'CANCELLED',
      paymentStatus: 'PAID',
      refund: null,
      cancelReason: 'Plans changed',
    });
    expect(res.body.data.cancelledAt).toEqual(expect.any(String));
    expect(
      (res.body.data.timeline as { event: string }[]).map((e) => e.event),
    ).toEqual(['CREATED', 'PAID', 'CANCEL_REQUESTED', 'CANCELLED']);
    expect(await nights(booking.id)).toBe(0);

    // The hotel keeps the money; the room can be booked again.
    const wallet = await t.prisma.wallet.findUniqueOrThrow({
      where: { hotelId: h.hotelId },
    });
    expect(wallet.balancePending.toNumber()).toBe(2000000);
    const other = await t.signIn('CUSTOMER', 'other@mail.test');
    await book(other.token, h.roomTypeId, false);
  });

  it('keeps the fee percent after the deadline', async () => {
    const h = await hotel({ freeCancellationDays: null, feePercent: 30 });
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    const res = await cancel(me.token, booking.id).expect(200);
    expect(res.body.data).toMatchObject({
      paymentStatus: 'REFUND_PENDING',
      refund: { status: 'REFUND_PENDING', amount: 1400000 },
    });
  });

  it("refuses unpaid, checked-in and other people's bookings", async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const unpaid = await book(me.token, h.roomTypeId, false);
    expect((await cancel(me.token, unpaid.id).expect(409)).body.code).toBe(
      'BOOKING_STATUS_CONFLICT',
    );
    await t.prisma.roomCalendars.deleteMany();

    const stayed = await book(me.token, h.roomTypeId);
    await t.prisma.booking.update({
      where: { bookingId: stayed.id },
      data: { status: 'CHECKED_IN' },
    });
    expect((await cancel(me.token, stayed.id).expect(409)).body.code).toBe(
      'CANCELLATION_NOT_ALLOWED',
    );

    const other = await t.signIn('CUSTOMER', 'other@mail.test');
    expect((await cancel(other.token, stayed.id).expect(404)).body.code).toBe(
      'BOOKING_NOT_FOUND',
    );
    await cancel(h.token, stayed.id).expect(403);
    const empty = await cancel(me.token, stayed.id, '  ').expect(400);
    expect(empty.body.code).toBe('VALIDATION_ERROR');
  });

  it('applies two cancels sent at once only once', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    const results = await Promise.all([
      cancel(me.token, booking.id),
      cancel(me.token, booking.id),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(
      await t.prisma.auditLog.count({
        where: { action: 'BOOKING_CANCEL_REQUESTED' },
      }),
    ).toBe(1);
  });
});
