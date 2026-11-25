import { BookingMailer } from '../src/modules/bookings/booking-mailer';
import { HoldExpiryService } from '../src/modules/bookings/hold-expiry.service';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { PLATFORM_WALLET_ID } from '../src/modules/wallets/wallet-ledger';
import { createTestApp } from './helpers';

describe('Customer wallet and preferences (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;

  /** An ACTIVE hotel with one room type at 1,000,000 a night and two rooms. */
  const hotel = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const created = await t
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
    const hotelId = idOf(created);
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    const typeRes = await t
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
    const roomTypeId = idOf(typeRes);
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

  /** A two-night stay for one room: 2,000,000. */
  const book = (token: string, roomTypeId: string) =>
    t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        roomTypeId,
        checkIn: day(0),
        checkOut: day(2),
        rooms: 1,
        guests: 1,
        guestName: 'Nguyễn Văn A',
        contactPhone: '0905123456',
        expectedTotal: 2000000,
      });

  /** Credits a customer wallet directly, standing in for an earlier refund. */
  const giveBalance = async (customerId: string, amount: number) => {
    await t.prisma.wallet.upsert({
      where: { customerId },
      create: {
        customerId,
        ownerType: 'CUSTOMER',
        balanceAvailable: amount,
      },
      update: { balanceAvailable: amount },
    });
  };

  const wallet = (token: string) =>
    t.api().get('/api/v1/me/wallet').set(auth(token));

  const payWithWallet = (token: string, bookingId: string) =>
    t
      .api()
      .post(`/api/v1/bookings/${bookingId}/pay-with-wallet`)
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

  describe('GET /me/wallet', () => {
    it('reads 0 for a customer who has never been refunded', async () => {
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await wallet(guest.token).expect(200);
      expect(res.body.data).toMatchObject({
        balanceAvailable: 0,
        balancePending: 0,
        currency: 'VND',
        updatedAt: null,
      });

      const list = await t
        .api()
        .get('/api/v1/me/wallet/transactions')
        .set(auth(guest.token))
        .expect(200);
      expect(list.body.data).toHaveLength(0);
    });
  });

  describe('POST /bookings/:id/pay-with-wallet', () => {
    it('pays the whole booking, confirms it without a transfer and credits the hotel', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await giveBalance(guest.id, 3000000);
      const res = await book(guest.token, h.roomTypeId).expect(201);
      const bookingId = idOf(res);

      await payWithWallet(guest.token, bookingId).expect(204);

      const booking = await t.prisma.booking.findUniqueOrThrow({
        where: { bookingId },
      });
      expect(booking.status).toBe('CONFIRMED');

      const invoice = await t.prisma.invoice.findFirstOrThrow({
        where: { bookingId },
      });
      expect(invoice.paymentStatus).toBe('PAID');
      expect(invoice.paymentMethod).toBe('WALLET');
      expect(invoice.paidAt).not.toBeNull();

      // The customer paid; the balance drops by exactly the booking total.
      const after = await wallet(guest.token).expect(200);
      expect(after.body.data.balanceAvailable).toBe(1000000);

      // The hotel is credited into pending, exactly as a transfer would (BR-22).
      const hotelWallet = await t.prisma.wallet.findUniqueOrThrow({
        where: { hotelId: h.hotelId },
      });
      expect(hotelWallet.balancePending.toNumber()).toBe(2000000);
      expect(hotelWallet.balanceAvailable.toNumber()).toBe(0);

      // The nights are held no longer: they are booked.
      const nights = await t.prisma.roomCalendars.findMany({
        where: { bookingId },
      });
      expect(nights.every((n) => n.status === 'BOOKED')).toBe(true);
      expect(nights.every((n) => n.holdExpiresAt === null)).toBe(true);
    });

    it('sends the confirmation email, as a transfer would', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await giveBalance(guest.id, 3000000);
      const res = await book(guest.token, h.roomTypeId).expect(201);

      await payWithWallet(guest.token, idOf(res)).expect(204);
      // The mailer runs after the commit; wait for it before reading the outbox.
      await t.app.get(BookingMailer).idle();
      expect(t.outbox.some((m) => m.to.includes('guest@mail.test'))).toBe(true);
    });

    it('records the movement on both wallets against the booking', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await giveBalance(guest.id, 2000000);
      const res = await book(guest.token, h.roomTypeId).expect(201);
      const bookingId = idOf(res);

      await payWithWallet(guest.token, bookingId).expect(204);

      const list = await t
        .api()
        .get('/api/v1/me/wallet/transactions')
        .set(auth(guest.token))
        .expect(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0]).toMatchObject({
        type: 'BOOKING_PAYMENT',
        amount: -2000000,
        balanceAfter: 0,
      });
      expect(list.body.data[0].booking.id).toBe(bookingId);
    });

    it('refuses a balance that does not cover the whole booking', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await giveBalance(guest.id, 1999999);
      const res = await book(guest.token, h.roomTypeId).expect(201);

      const paid = await payWithWallet(guest.token, idOf(res));
      expect(paid.status).toBe(409);
      expect(paid.body.code).toBe('WALLET_INSUFFICIENT');

      // Nothing moved: the booking still waits for payment and the balance is untouched.
      const booking = await t.prisma.booking.findUniqueOrThrow({
        where: { bookingId: idOf(res) },
      });
      expect(booking.status).toBe('PENDING');
      const after = await wallet(guest.token).expect(200);
      expect(after.body.data.balanceAvailable).toBe(1999999);
    });

    it('will not pay one booking twice, nor a booking that is no longer pending', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await giveBalance(guest.id, 5000000);
      const res = await book(guest.token, h.roomTypeId).expect(201);
      const bookingId = idOf(res);

      await payWithWallet(guest.token, bookingId).expect(204);
      const again = await payWithWallet(guest.token, bookingId);
      expect(again.status).toBe(409);
      expect(again.body.code).toBe('BOOKING_STATUS_CONFLICT');

      // Charged once.
      const after = await wallet(guest.token).expect(200);
      expect(after.body.data.balanceAvailable).toBe(3000000);
    });

    it('will not pay a booking whose hold has already expired', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await giveBalance(guest.id, 5000000);
      const res = await book(guest.token, h.roomTypeId).expect(201);
      const bookingId = idOf(res);

      await t.prisma.roomCalendars.updateMany({
        where: { bookingId },
        data: { holdExpiresAt: new Date(Date.now() - 60_000) },
      });
      await t.app.get(HoldExpiryService).expireDue();

      const paid = await payWithWallet(guest.token, bookingId);
      expect(paid.status).toBe(409);
      expect(paid.body.code).toBe('BOOKING_STATUS_CONFLICT');
      const after = await wallet(guest.token).expect(200);
      expect(after.body.data.balanceAvailable).toBe(5000000);
    });

    it("refuses someone else's booking without saying whether it exists", async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'stranger@mail.test');
      await giveBalance(stranger.id, 5000000);
      const res = await book(guest.token, h.roomTypeId).expect(201);

      const paid = await payWithWallet(stranger.token, idOf(res));
      expect(paid.status).toBe(404);
      expect(paid.body.code).toBe('BOOKING_NOT_FOUND');
    });
  });

  describe('A refund fills the wallet, and the wallet pays the next stay', () => {
    it('walks the whole round trip', async () => {
      const h = await hotel();
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/cancellation-policy`)
        .set(auth(h.token))
        .send({ freeCancellationDays: 30, feePercent: 0 })
        .expect(200);
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');

      // Pay the first booking by transfer, then cancel it for a full refund.
      const first = await book(guest.token, h.roomTypeId).expect(201);
      const firstBooking = first.body.data as { id: string; code: string };
      await t.app.get(PaymentConfirmationService).confirm({
        code: firstBooking.code,
        amount: 2000000,
        transactionId: `txn-${firstBooking.code}`,
        paidAt: new Date(),
      });
      await t
        .api()
        .post(`/api/v1/bookings/${firstBooking.id}/cancel`)
        .set(auth(guest.token))
        .send({ reason: 'Đổi kế hoạch' })
        .expect(200);
      const pending = await t.prisma.invoice.findFirstOrThrow({
        where: { bookingId: firstBooking.id },
      });
      expect(pending.paymentStatus).toBe('REFUND_PENDING');
      await t
        .api()
        .post(`/api/v1/bookings/${firstBooking.id}/approve-refund`)
        .set(auth(h.token))
        .send({})
        .expect(200);

      // The refund landed in the wallet.
      const filled = await wallet(guest.token).expect(200);
      expect(filled.body.data.balanceAvailable).toBe(2000000);

      // And it pays the next stay outright.
      const second = await book(guest.token, h.roomTypeId).expect(201);
      await payWithWallet(guest.token, idOf(second)).expect(204);
      const empty = await wallet(guest.token).expect(200);
      expect(empty.body.data.balanceAvailable).toBe(0);

      const platform = await t.prisma.wallet.findUniqueOrThrow({
        where: { walletId: PLATFORM_WALLET_ID },
      });
      // The platform takes nothing until check-out (BR-13).
      expect(platform.balanceAvailable.toNumber()).toBe(0);
    });
  });

  describe('Preferences', () => {
    it('starts empty, saves keys and answers the whole set', async () => {
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');

      const empty = await t
        .api()
        .get('/api/v1/me/preferences')
        .set(auth(guest.token))
        .expect(200);
      expect(empty.body.data.preferences).toEqual({});

      const saved = await t
        .api()
        .put('/api/v1/me/preferences')
        .set(auth(guest.token))
        .send({
          preferences: { city: 'Đà Nẵng', budget: '2000000', beds: 'king' },
        })
        .expect(200);
      expect(saved.body.data.preferences).toEqual({
        city: 'Đà Nẵng',
        budget: '2000000',
        beds: 'king',
      });
    });

    it('writes the keys given, removes nulls and leaves the rest alone', async () => {
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await t
        .api()
        .put('/api/v1/me/preferences')
        .set(auth(guest.token))
        .send({ preferences: { city: 'Đà Nẵng', budget: '2000000' } })
        .expect(200);

      const res = await t
        .api()
        .put('/api/v1/me/preferences')
        .set(auth(guest.token))
        .send({ preferences: { budget: null, beds: 'twin' } })
        .expect(200);

      // city untouched, budget removed, beds added.
      expect(res.body.data.preferences).toEqual({
        city: 'Đà Nẵng',
        beds: 'twin',
      });
    });

    it('keeps one customer out of another preferences', async () => {
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const other = await t.signIn('CUSTOMER', 'other@mail.test');
      await t
        .api()
        .put('/api/v1/me/preferences')
        .set(auth(guest.token))
        .send({ preferences: { city: 'Đà Nẵng' } })
        .expect(200);

      const res = await t
        .api()
        .get('/api/v1/me/preferences')
        .set(auth(other.token))
        .expect(200);
      expect(res.body.data.preferences).toEqual({});
    });

    it('refuses an empty set', async () => {
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await t
        .api()
        .put('/api/v1/me/preferences')
        .set(auth(guest.token))
        .send({ preferences: {} });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });
});
