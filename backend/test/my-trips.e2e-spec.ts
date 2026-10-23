import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { verifyVoucher } from '../src/modules/bookings/voucher-token';
import { createTestApp } from './helpers';

describe('My trips and vouchers (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel with one room type (1,000,000 a night) and 8 rooms. */
  const hotel = async () => {
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
    for (let n = 1; n <= 8; n++) {
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

  /** A PENDING booking of one room for 2 nights starting `from` days ahead. */
  const book = async (token: string, roomTypeId: string, from = 30) =>
    (
      await t
        .api()
        .post('/api/v1/bookings')
        .set(auth(token))
        .send({
          roomTypeId,
          checkIn: day(from),
          checkOut: day(from + 2),
          guests: 2,
          guestName: 'Nguyễn Văn A',
          contactPhone: '0905123456',
          expectedTotal: 2000000,
        })
        .expect(201)
    ).body.data as { id: string; code: string };

  const pay = (code: string) =>
    t.app.get(PaymentConfirmationService).confirm({
      code,
      amount: 2000000,
      transactionId: `txn-${code}`,
      paidAt: new Date(),
    });

  const setStatus = (
    bookingId: string,
    status: 'CHECKED_IN' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED' | 'EXPIRED',
  ) => t.prisma.booking.update({ where: { bookingId }, data: { status } });

  const trips = (token: string, query = '') =>
    t.api().get(`/api/v1/me/bookings${query}`).set(auth(token)).expect(200);
  const ids = (body: unknown) =>
    (body as { data: { id: string }[] }).data.map((b) => b.id);

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

  describe('GET /me/bookings', () => {
    it('sorts the bookings into tabs, newest first', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const pending = await book(me.token, h.roomTypeId, 10);
      const confirmed = await book(me.token, h.roomTypeId, 20);
      await pay(confirmed.code);
      const staying = await book(me.token, h.roomTypeId, 30);
      await setStatus(staying.id, 'CHECKED_IN');
      const completed = await book(me.token, h.roomTypeId, 40);
      await setStatus(completed.id, 'COMPLETED');
      const noShow = await book(me.token, h.roomTypeId, 50);
      await setStatus(noShow.id, 'NO_SHOW');
      const cancelled = await book(me.token, h.roomTypeId, 60);
      await setStatus(cancelled.id, 'CANCELLED');
      const expired = await book(me.token, h.roomTypeId, 70);
      await setStatus(expired.id, 'EXPIRED');

      const upcoming = await trips(me.token);
      expect(ids(upcoming.body)).toEqual([confirmed.id, pending.id]);
      expect(upcoming.body.data[0]).toMatchObject({
        code: confirmed.code,
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        hotel: { id: h.hotelId, name: 'Riverside' },
        roomType: { id: h.roomTypeId, name: 'Deluxe' },
        checkIn: day(20),
        nights: 2,
        rooms: 1,
        guests: 2,
        totalAmount: 2000000,
      });
      expect(upcoming.body.meta).toEqual({
        page: 1,
        pageSize: 10,
        total: 2,
        totalPages: 1,
      });
      expect(ids((await trips(me.token, '?tab=staying')).body)).toEqual([
        staying.id,
      ]);
      expect(ids((await trips(me.token, '?tab=completed')).body)).toEqual([
        noShow.id,
        completed.id,
      ]);
      expect(ids((await trips(me.token, '?tab=cancelled')).body)).toEqual([
        expired.id,
        cancelled.id,
      ]);
    });

    it('searches the booking code, pages, and shows only my bookings', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const other = await t.signIn('CUSTOMER', 'other@mail.test');
      const first = await book(me.token, h.roomTypeId, 10);
      await book(me.token, h.roomTypeId, 20);
      await book(other.token, h.roomTypeId, 30);

      // Case-insensitive: the code typed in lower case still matches.
      const found = await trips(
        me.token,
        `?search=${first.code.toLowerCase()}`,
      );
      expect(ids(found.body)).toEqual([first.id]);

      const page2 = await trips(me.token, '?pageSize=1&page=2');
      expect(ids(page2.body)).toEqual([first.id]);
      expect(page2.body.meta).toMatchObject({ total: 2, totalPages: 2 });

      // `%` is a plain character, not a wildcard.
      expect((await trips(me.token, '?search=%25')).body.data).toEqual([]);
      await t.api().get('/api/v1/me/bookings').set(auth(h.token)).expect(403);
      await t
        .api()
        .get('/api/v1/me/bookings?tab=all')
        .set(auth(me.token))
        .expect(400);
    });
  });

  describe('GET /bookings/:id/voucher', () => {
    it('gives the customer a signed voucher once the booking is paid', async () => {
      const h = await hotel();
      const me = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await book(me.token, h.roomTypeId);
      const url = `/api/v1/bookings/${booking.id}/voucher`;

      const unpaid = await t.api().get(url).set(auth(me.token)).expect(409);
      expect(unpaid.body.code).toBe('BOOKING_STATUS_CONFLICT');

      await pay(booking.code);
      const res = await t.api().get(url).set(auth(me.token)).expect(200);
      expect(res.body.data).toEqual({
        code: booking.code,
        hotelName: 'Riverside',
        roomTypeName: 'Deluxe',
        checkIn: day(30),
        checkOut: day(32),
        rooms: 1,
        guests: 2,
        guestName: 'Nguyễn Văn A',
        amountPaid: 2000000,
        qrToken: expect.any(String),
      });
      expect(
        verifyVoucher(
          res.body.data.qrToken as string,
          process.env.VOUCHER_SIGNING_SECRET!,
        ),
      ).toBe(booking.code);

      const other = await t.signIn('CUSTOMER', 'other@mail.test');
      const hidden = await t.api().get(url).set(auth(other.token)).expect(404);
      expect(hidden.body.code).toBe('BOOKING_NOT_FOUND');
      await t.api().get(url).set(auth(h.token)).expect(403);
    });
  });
});
