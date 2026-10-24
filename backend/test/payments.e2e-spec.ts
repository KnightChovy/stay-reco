import { HoldExpiryService } from '../src/modules/bookings/hold-expiry.service';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Payment confirmation (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let payments: PaymentConfirmationService;
  let king: string;
  let seq = 0;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const checkIn = day(30);
  const checkOut = day(32);

  /** An ACTIVE hotel with one room type priced 1,000,000 a night and 2 rooms. */
  const hotel = async () => {
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
    return { ...partner, hotelId, roomTypeId };
  };

  /** A PENDING booking of one room for 2 nights (total 2,000,000). */
  const book = async (token: string, roomTypeId: string) =>
    (
      await t
        .api()
        .post('/api/v1/bookings')
        .set(auth(token))
        .send({
          roomTypeId,
          checkIn,
          checkOut,
          guests: 1,
          guestName: 'Nguyễn Văn A',
          contactPhone: '0905123456',
          expectedTotal: 2000000,
        })
        .expect(201)
    ).body.data as { id: string; code: string };

  const notice = (code: string, overrides: Record<string, unknown> = {}) => ({
    code,
    amount: 2000000,
    transactionId: 'txn-1',
    paidAt: new Date(),
    ...overrides,
  });

  const hotelWallet = (hotelId: string) =>
    t.prisma.wallet.findUnique({
      where: { hotelId },
      include: { walletTransactions: { orderBy: { createdAt: 'asc' } } },
    });

  beforeAll(async () => {
    t = await createTestApp();
    payments = t.app.get(PaymentConfirmationService);
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

  describe('POST /dev/bookings/:id/simulate-payment', () => {
    it('confirms the booking, books the nights and credits the hotel wallet', async () => {
      const h = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await book(customer.token, h.roomTypeId);

      const res = await t
        .api()
        .post(`/api/v1/dev/bookings/${booking.id}/simulate-payment`)
        .set(auth(customer.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        holdExpiresAt: null,
        payment: null,
      });
      expect(res.body.data.paidAt).toEqual(expect.any(String));
      expect(
        (res.body.data.timeline as { event: string }[]).map((e) => e.event),
      ).toEqual(['CREATED', 'PAID']);

      const nights = await t.prisma.roomCalendars.findMany({
        where: { bookingId: booking.id },
      });
      expect(nights.map((n) => [n.status, n.holdExpiresAt])).toEqual([
        ['BOOKED', null],
        ['BOOKED', null],
      ]);

      const wallet = await hotelWallet(h.hotelId);
      expect(wallet).toMatchObject({ ownerType: 'HOTEL' });
      expect(wallet!.balancePending.toNumber()).toBe(2000000);
      expect(wallet!.balanceAvailable.toNumber()).toBe(0);
      expect(wallet!.walletTransactions).toEqual([
        expect.objectContaining({
          type: 'BOOKING_PAYMENT',
          bookingId: booking.id,
          idempotencyKey: expect.stringMatching(/^sepay:sim-/),
        }),
      ]);
      expect(wallet!.walletTransactions[0].amount.toNumber()).toBe(2000000);
      expect(wallet!.walletTransactions[0].balanceAfter.toNumber()).toBe(
        2000000,
      );

      // Paying again is refused; another customer cannot see the booking.
      const again = await t
        .api()
        .post(`/api/v1/dev/bookings/${booking.id}/simulate-payment`)
        .set(auth(customer.token))
        .expect(409);
      expect(again.body.code).toBe('BOOKING_STATUS_CONFLICT');
      const stranger = await t.signIn('CUSTOMER', 'other@mail.test');
      await t
        .api()
        .post(`/api/v1/dev/bookings/${booking.id}/simulate-payment`)
        .set(auth(stranger.token))
        .expect(404);
    });
  });

  describe('PaymentConfirmationService', () => {
    it('ignores a transaction seen before, also when delivered twice at once', async () => {
      const h = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await book(customer.token, h.roomTypeId);

      const results = await Promise.all([
        payments.confirm(notice(booking.code)),
        payments.confirm(notice(booking.code)),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([
        'CONFIRMED',
        'DUPLICATE',
      ]);
      expect((await payments.confirm(notice(booking.code))).status).toBe(
        'DUPLICATE',
      );
      const wallet = await hotelWallet(h.hotelId);
      expect(wallet!.walletTransactions).toHaveLength(1);
      expect(wallet!.balancePending.toNumber()).toBe(2000000);
    });

    it('confirms nothing for an unknown code or a different amount', async () => {
      const h = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await book(customer.token, h.roomTypeId);

      expect(await payments.confirm(notice('SR-000000-0000'))).toEqual({
        status: 'UNKNOWN_CODE',
      });
      expect(
        await payments.confirm(notice(booking.code, { amount: 1999999 })),
      ).toEqual({ status: 'AMOUNT_MISMATCH', bookingId: booking.id });
      const stored = await t.prisma.booking.findUniqueOrThrow({
        where: { bookingId: booking.id },
        include: { invoice: true },
      });
      expect([stored.status, stored.invoice!.paymentStatus]).toEqual([
        'PENDING',
        'UNPAID',
      ]);
      expect(
        await t.prisma.wallet.count({ where: { hotelId: h.hotelId } }),
      ).toBe(0);
    });

    it('reports late and second transfers without touching the money', async () => {
      const h = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const late = await book(customer.token, h.roomTypeId);
      const paid = await book(customer.token, h.roomTypeId);

      await t.prisma.roomCalendars.updateMany({
        where: { bookingId: late.id },
        data: { holdExpiresAt: new Date(Date.now() - 1000) },
      });
      await t.app.get(HoldExpiryService).expireDue();
      expect(
        await payments.confirm(notice(late.code, { transactionId: 'late' })),
      ).toEqual({
        status: 'NOT_PENDING',
        bookingId: late.id,
        bookingStatus: 'EXPIRED',
      });

      await payments.confirm(notice(paid.code, { transactionId: 'first' }));
      expect(
        await payments.confirm(notice(paid.code, { transactionId: 'second' })),
      ).toEqual({
        status: 'NOT_PENDING',
        bookingId: paid.id,
        bookingStatus: 'CONFIRMED',
      });

      const wallet = await hotelWallet(h.hotelId);
      expect(wallet!.walletTransactions).toHaveLength(1);
      expect(wallet!.balancePending.toNumber()).toBe(2000000);
    });

    it('keeps one wallet per hotel and a running balance', async () => {
      const h = await hotel();
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      const first = await book(customer.token, h.roomTypeId);
      const second = await book(customer.token, h.roomTypeId);

      await payments.confirm(notice(first.code, { transactionId: 'a' }));
      await payments.confirm(notice(second.code, { transactionId: 'b' }));
      const wallet = await hotelWallet(h.hotelId);
      expect(
        wallet!.walletTransactions.map((w) => w.balanceAfter.toNumber()),
      ).toEqual([2000000, 4000000]);
      expect(wallet!.balancePending.toNumber()).toBe(4000000);
    });
  });
});
