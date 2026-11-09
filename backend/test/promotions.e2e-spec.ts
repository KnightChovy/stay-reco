import { HoldExpiryService } from '../src/modules/bookings/hold-expiry.service';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Promotions, vouchers and discounts (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  /** The id out of a `{ data: { id } }` envelope, typed so it is not passed around as `any`. */
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

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

  const campaign = (token: string, hotelId: string, body: object) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/promotions`)
      .set(auth(token))
      .send(body);

  /** A two-night stay for one room: 2,000,000 before any discount. */
  const quote = (token: string, roomTypeId: string, code?: string) =>
    t
      .api()
      .post('/api/v1/bookings/discount-quote')
      .set(auth(token))
      .send({
        roomTypeId,
        checkIn: day(0),
        checkOut: day(2),
        rooms: 1,
        ...(code && { code }),
      });

  const book = (
    token: string,
    roomTypeId: string,
    expectedTotal: number,
    code?: string,
  ) =>
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
        expectedTotal,
        ...(code && { code }),
      });

  /** Hands one code to a customer under a campaign, and returns it. */
  const issue = async (
    token: string,
    promotionId: string,
    customerId: string,
    body: object = {},
  ) => {
    const res = await t
      .api()
      .post(`/api/v1/promotions/${promotionId}/vouchers`)
      .set(auth(token))
      .send({ customerIds: [customerId], ...body })
      .expect(201);
    return (res.body.data as { code: string }[])[0].code;
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

  describe('POST /bookings/discount-quote', () => {
    it('applies a campaign on its own, with no code typed', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await campaign(h.token, h.hotelId, {
        name: 'Giảm 10% tháng 11',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      }).expect(201);

      const res = await quote(guest.token, h.roomTypeId).expect(200);
      expect(res.body.data).toMatchObject({
        subtotal: 2000000,
        expectedTotal: 1800000,
      });
      expect(res.body.data.discount).toMatchObject({
        kind: 'PROMOTION',
        name: 'Giảm 10% tháng 11',
        code: null,
        amount: 200000,
      });
    });

    it('answers no discount when nothing applies', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await quote(guest.token, h.roomTypeId).expect(200);
      expect(res.body.data).toMatchObject({
        subtotal: 2000000,
        discount: null,
        expectedTotal: 2000000,
      });
    });

    it('skips a campaign the stay is too small for, and one switched off', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await campaign(h.token, h.hotelId, {
        name: 'Chỉ cho đơn lớn',
        discountType: 'FIXED_AMOUNT',
        discountValue: 500000,
        minBookingAmount: 5000000,
      }).expect(201);
      await campaign(h.token, h.hotelId, {
        name: 'Đã tắt',
        discountType: 'FIXED_AMOUNT',
        discountValue: 900000,
        isActive: false,
      }).expect(201);

      const res = await quote(guest.token, h.roomTypeId).expect(200);
      expect(res.body.data.discount).toBeNull();
    });

    it('takes the larger of several campaigns, never both', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await campaign(h.token, h.hotelId, {
        name: 'Nhỏ',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000,
      }).expect(201);
      await campaign(h.token, h.hotelId, {
        name: 'Lớn',
        discountType: 'PERCENTAGE',
        discountValue: 25,
      }).expect(201);

      const res = await quote(guest.token, h.roomTypeId).expect(200);
      expect(res.body.data.discount).toMatchObject({
        name: 'Lớn',
        amount: 500000,
      });
      expect(res.body.data.expectedTotal).toBe(1500000);
    });

    it('prefers the typed code when it saves more, and keeps the campaign when it saves less', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await campaign(h.token, h.hotelId, {
        name: 'Tự động 10%',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      }).expect(201);
      const big = await campaign(h.token, h.hotelId, {
        name: 'Mã riêng 30%',
        discountType: 'PERCENTAGE',
        discountValue: 30,
      }).expect(201);
      const small = await campaign(h.token, h.hotelId, {
        name: 'Mã riêng nhỏ',
        discountType: 'FIXED_AMOUNT',
        discountValue: 50000,
      }).expect(201);

      const bigCode = await issue(h.token, idOf(big), guest.id);
      const better = await quote(guest.token, h.roomTypeId, bigCode).expect(
        200,
      );
      expect(better.body.data.discount).toMatchObject({
        kind: 'VOUCHER',
        code: bigCode,
        amount: 600000,
      });

      // A code that saves less leaves the customer on the better automatic campaign.
      const smallCode = await issue(h.token, idOf(small), guest.id);
      const worse = await quote(guest.token, h.roomTypeId, smallCode).expect(
        200,
      );
      expect(worse.body.data.discount).toMatchObject({
        kind: 'PROMOTION',
        amount: 200000,
      });
    });

    it("caps a percentage code at the voucher's maxDiscount", async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Giảm 50% tối đa 300k',
        discountType: 'PERCENTAGE',
        discountValue: 50,
      }).expect(201);
      const code = await issue(h.token, idOf(promo), guest.id, {
        maxDiscount: 300000,
      });

      const res = await quote(guest.token, h.roomTypeId, code).expect(200);
      expect(res.body.data.discount.amount).toBe(300000);
      expect(res.body.data.expectedTotal).toBe(1700000);
    });

    it('tells the customer why a code does not work instead of staying silent', async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'stranger@mail.test');

      const unknown = await quote(guest.token, h.roomTypeId, 'NOPE123456');
      expect(unknown.status).toBe(404);
      expect(unknown.body.code).toBe('VOUCHER_NOT_FOUND');

      // Someone else's code is "not found", so codes cannot be probed.
      const mine = await campaign(h.token, h.hotelId, {
        name: 'Của người khác',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000,
      }).expect(201);
      const theirs = await issue(h.token, idOf(mine), stranger.id);
      const borrowed = await quote(guest.token, h.roomTypeId, theirs);
      expect(borrowed.status).toBe(404);
      expect(borrowed.body.code).toBe('VOUCHER_NOT_FOUND');

      // A code of another hotel.
      const elsewhere = await campaign(other.token, other.hotelId, {
        name: 'Khách sạn khác',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000,
      }).expect(201);
      const otherCode = await issue(other.token, idOf(elsewhere), guest.id);
      const wrongHotel = await quote(guest.token, h.roomTypeId, otherCode);
      expect(wrongHotel.status).toBe(409);
      expect(wrongHotel.body.code).toBe('VOUCHER_NOT_APPLICABLE');

      // A stay below the campaign minimum.
      const big = await campaign(h.token, h.hotelId, {
        name: 'Đơn từ 5 triệu',
        discountType: 'FIXED_AMOUNT',
        discountValue: 500000,
        minBookingAmount: 5000000,
      }).expect(201);
      const bigCode = await issue(h.token, idOf(big), guest.id);
      const tooSmall = await quote(guest.token, h.roomTypeId, bigCode);
      expect(tooSmall.status).toBe(409);
      expect(tooSmall.body.code).toBe('VOUCHER_NOT_APPLICABLE');
    });
  });

  describe('POST /bookings with a discount', () => {
    it('charges the discounted total, spends the code and records it on the invoice', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Giảm 300k',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
        maxUses: 5,
      }).expect(201);
      const code = await issue(h.token, idOf(promo), guest.id);

      const res = await book(guest.token, h.roomTypeId, 1700000, code).expect(
        201,
      );
      const bookingId = idOf(res);

      const invoice = await t.prisma.invoice.findFirstOrThrow({
        where: { bookingId },
      });
      expect(invoice.subtotal.toNumber()).toBe(2000000);
      expect(invoice.discountAmount.toNumber()).toBe(300000);
      expect(invoice.totalAmount.toNumber()).toBe(1700000);

      const booking = await t.prisma.booking.findUniqueOrThrow({
        where: { bookingId },
      });
      expect(booking.totalAmount.toNumber()).toBe(1700000);
      expect(booking.promotionId).toBe(idOf(promo));
      expect(booking.voucherId).not.toBeNull();

      const voucher = await t.prisma.voucher.findFirstOrThrow({
        where: { code },
      });
      expect(voucher.usedAt).not.toBeNull();

      const campaignRow = await t.prisma.promotion.findUniqueOrThrow({
        where: { promotionId: idOf(promo) },
      });
      expect(campaignRow.currentUses).toBe(1);
    });

    it('refuses a total that does not match what the backend computes', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await campaign(h.token, h.hotelId, {
        name: 'Giảm 300k',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
      }).expect(201);

      // The customer sends the undiscounted total: the backend prices it lower and refuses.
      const res = await book(guest.token, h.roomTypeId, 2000000);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('BOOKING_PRICE_CHANGED');
    });

    it('will not let one code pay for two bookings', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Giảm 300k',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
      }).expect(201);
      const code = await issue(h.token, idOf(promo), guest.id);

      await book(guest.token, h.roomTypeId, 1700000, code).expect(201);
      const again = await book(guest.token, h.roomTypeId, 1700000, code);
      expect(again.status).toBe(409);
      expect(again.body.code).toBe('VOUCHER_ALREADY_USED');
    });

    it('stops a campaign once it runs out of uses', async () => {
      const h = await hotel();
      const first = await t.signIn('CUSTOMER', 'first@mail.test');
      const second = await t.signIn('CUSTOMER', 'second@mail.test');
      await campaign(h.token, h.hotelId, {
        name: 'Chỉ 1 lượt',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
        maxUses: 1,
      }).expect(201);

      await book(first.token, h.roomTypeId, 1700000).expect(201);
      // The campaign is spent, so the second customer is quoted the full price.
      const res = await quote(second.token, h.roomTypeId).expect(200);
      expect(res.body.data.discount).toBeNull();
      await book(second.token, h.roomTypeId, 2000000).expect(201);
    });

    it('gives the code back when the hold expires unpaid', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Giảm 300k',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
        maxUses: 5,
      }).expect(201);
      const code = await issue(h.token, idOf(promo), guest.id);
      const res = await book(guest.token, h.roomTypeId, 1700000, code).expect(
        201,
      );

      // Push the hold into the past and run the job that expires it.
      await t.prisma.roomCalendars.updateMany({
        where: { bookingId: idOf(res) },
        data: { holdExpiresAt: new Date(Date.now() - 60_000) },
      });
      await t.app.get(HoldExpiryService).expireDue();

      const voucher = await t.prisma.voucher.findFirstOrThrow({
        where: { code },
      });
      expect(voucher.usedAt).toBeNull();
      const campaignRow = await t.prisma.promotion.findUniqueOrThrow({
        where: { promotionId: idOf(promo) },
      });
      expect(campaignRow.currentUses).toBe(0);

      // And it works again on the next booking.
      await book(guest.token, h.roomTypeId, 1700000, code).expect(201);
    });

    it('gives the code back when a paid booking is cancelled with nothing to refund', async () => {
      const h = await hotel();
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/cancellation-policy`)
        .set(auth(h.token))
        .send({ freeCancellationDays: null, feePercent: 100 })
        .expect(200);
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Giảm 300k',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
        maxUses: 5,
      }).expect(201);
      const code = await issue(h.token, idOf(promo), guest.id);

      const res = await book(guest.token, h.roomTypeId, 1700000, code).expect(
        201,
      );
      const booking = res.body.data as { id: string; code: string };
      await t.app.get(PaymentConfirmationService).confirm({
        code: booking.code,
        amount: 1700000,
        transactionId: `txn-${booking.code}`,
        paidAt: new Date(),
      });

      await t
        .api()
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set(auth(guest.token))
        .send({ reason: 'Đổi kế hoạch' })
        .expect(200);

      const voucher = await t.prisma.voucher.findFirstOrThrow({
        where: { code },
      });
      expect(voucher.usedAt).toBeNull();
    });
  });

  describe('Campaign management', () => {
    it('keeps the uses already made when maxUses is lowered', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Giảm 300k',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
        maxUses: 10,
      }).expect(201);
      await book(guest.token, h.roomTypeId, 1700000).expect(201);

      const res = await t
        .api()
        .patch(`/api/v1/promotions/${idOf(promo)}`)
        .set(auth(h.token))
        .send({ maxUses: 1 })
        .expect(200);
      // The booking that already took the discount keeps it; the campaign simply stops.
      expect(res.body.data).toMatchObject({
        currentUses: 1,
        maxUses: 1,
        usable: false,
      });
    });

    it('switches a campaign off rather than deleting it', async () => {
      const h = await hotel();
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Sẽ tắt',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000,
      }).expect(201);

      const res = await t
        .api()
        .delete(`/api/v1/promotions/${idOf(promo)}`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toMatchObject({ isActive: false, usable: false });

      const still = await t.prisma.promotion.findUnique({
        where: { promotionId: idOf(promo) },
      });
      expect(still).not.toBeNull();
    });

    it('refuses a campaign of another hotel', async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Của tôi',
        discountType: 'FIXED_AMOUNT',
        discountValue: 100000,
      }).expect(201);

      const res = await t
        .api()
        .patch(`/api/v1/promotions/${idOf(promo)}`)
        .set(auth(other.token))
        .send({ name: 'Cướp' });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PROMOTION_NOT_FOUND');
    });

    it('refuses a percentage above 100 when the campaign is saved', async () => {
      const h = await hotel();
      const res = await campaign(h.token, h.hotelId, {
        name: 'Quá tay',
        discountType: 'PERCENTAGE',
        discountValue: 150,
      });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /me/vouchers', () => {
    it('lists my codes and marks the spent ones unusable', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const promo = await campaign(h.token, h.hotelId, {
        name: 'Giảm 300k',
        discountType: 'FIXED_AMOUNT',
        discountValue: 300000,
      }).expect(201);
      const code = await issue(h.token, idOf(promo), guest.id);

      const before = await t
        .api()
        .get('/api/v1/me/vouchers')
        .set(auth(guest.token))
        .expect(200);
      expect(before.body.data).toHaveLength(1);
      expect(before.body.data[0]).toMatchObject({ code, usable: true });

      await book(guest.token, h.roomTypeId, 1700000, code).expect(201);

      const after = await t
        .api()
        .get('/api/v1/me/vouchers?active=true')
        .set(auth(guest.token))
        .expect(200);
      expect(after.body.data).toHaveLength(0);
    });
  });
});
