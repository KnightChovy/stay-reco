import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { WELCOME_PROMOTION_ID } from '../src/modules/onboarding/welcome-voucher.service';
import type { Onboarding } from '@stayreco/shared';
import { createTestApp } from './helpers';

/** First-login preferences and the welcome voucher (docs/design/onboarding-welcome-voucher.md). */
describe('Onboarding and the welcome voucher (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let seaView: string;
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel in `city` with one room type at 1,000,000 a night and two rooms. */
  const hotel = async (email = 'owner@hotel.test', city = 'Đà Nẵng') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const hotelId = idOf(
      await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(partner.token))
        .send({
          name: `Riverside ${city}`,
          address: '1 Bạch Đằng',
          city,
          email: `contact-${email}`,
          checkInTime: '14:00',
        })
        .expect(201),
    );
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    const roomTypeId = idOf(
      await t
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
        .expect(201),
    );
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

  const onboarding = (token: string) =>
    t.api().get('/api/v1/me/onboarding').set(auth(token)).expect(200);
  const complete = (token: string, body: object) =>
    t.api().post('/api/v1/me/onboarding').set(auth(token)).send(body);

  /** A two-night stay for one room: 2,000,000 before any discount. */
  const stay = { checkIn: day(0), checkOut: day(2), rooms: 1 };

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
    await t.prisma.amenity.deleteMany();
    seaView = (
      await t.prisma.amenity.create({
        data: { name: 'Hướng biển', category: 'Tầm nhìn', icon: 'waves' },
      })
    ).amenityId;
    await t.prisma.amenity.create({
      data: { name: 'Hồ bơi', category: 'Thư giãn', icon: 'waves' },
    });
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('offers the cities, hotels and views a new customer can pick from', async () => {
    const h = await hotel();
    await hotel('other@hotel.test', 'Huế');
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');

    const res = (await onboarding(guest.token)).body.data as Onboarding & {
      options: NonNullable<Onboarding['options']>;
    };
    expect(res.status).toBe('NEW');
    expect(res.voucher).toBeNull();
    expect(res.options.destinations).toEqual(
      expect.arrayContaining([
        { city: 'Đà Nẵng', hotels: 1, imageUrl: null },
        { city: 'Huế', hotels: 1, imageUrl: null },
      ]),
    );
    expect(res.options.hotels.map((x) => x.id)).toContain(h.hotelId);
    // Only the "Tầm nhìn" amenities are views.
    expect(res.options.views).toEqual([
      expect.objectContaining({ id: seaView, category: 'Tầm nhìn' }),
    ]);
  });

  it('saves the picks as preferences and issues the welcome code', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');

    const res = await complete(guest.token, {
      cities: ['Đà Nẵng'],
      hotelIds: [h.hotelId],
      viewIds: [seaView],
      travelStyles: ['resort'],
      budgetPerNight: 2000000,
    }).expect(200);
    expect(res.body.data).toMatchObject({
      status: 'COMPLETED',
      options: null,
      voucher: {
        promotionId: WELCOME_PROMOTION_ID,
        hotelId: null,
        discountType: 'PERCENTAGE',
        discountValue: 5,
        maxDiscount: 200000,
        minBookingAmount: 500000,
        usable: true,
        // The 30th day counting today, to its last instant in Vietnam.
        expiresAt: `${day(29)}T16:59:59.999Z`,
      },
    });

    const prefs = await t
      .api()
      .get('/api/v1/me/preferences')
      .set(auth(guest.token))
      .expect(200);
    // The keys /account/preferences already reads, plus the new ones.
    expect(prefs.body.data.preferences).toMatchObject({
      favouriteCity: 'Đà Nẵng',
      preferredCities: 'Đà Nẵng',
      likedHotels: h.hotelId,
      preferredViews: seaView,
      travelStyles: 'resort',
      budgetPerNight: '2000000',
      onboardingStatus: 'COMPLETED',
    });

    const told = await t.prisma.notification.findMany({
      where: { userAccountId: guest.id },
    });
    expect(told).toHaveLength(1);
    expect(told[0].message).toContain(res.body.data.voucher.code);
  });

  it('issues the code once, ever, and refuses a second finish', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    const picks = {
      cities: ['Đà Nẵng'],
      hotelIds: [h.hotelId],
      viewIds: [seaView],
    };

    // Two at once: the account lock lets one through and the other sees it finished.
    const answers = await Promise.all([
      complete(guest.token, picks),
      complete(guest.token, picks),
    ]);
    expect(answers.map((a) => a.status).sort()).toEqual([200, 409]);
    expect(answers.find((a) => a.status === 409)?.body.code).toBe(
      'ONBOARDING_ALREADY_COMPLETED',
    );
    expect(
      await t.prisma.voucher.count({ where: { customerId: guest.id } }),
    ).toBe(1);

    const again = (await onboarding(guest.token)).body.data;
    expect(again).toMatchObject({ status: 'COMPLETED', options: null });
    expect(again.voucher.code).toBe(
      answers.find((a) => a.status === 200)?.body.data.voucher.code,
    );
  });

  it('needs at least three picks, and only ones it offered', async () => {
    await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');

    const few = await complete(guest.token, {
      cities: ['Đà Nẵng'],
      travelStyles: ['resort'],
    });
    expect(few.status).toBe(400);

    const unknown = await complete(guest.token, {
      cities: ['Hà Nội'],
      viewIds: [seaView],
      travelStyles: ['resort'],
    });
    expect(unknown.status).toBe(400);
    expect(unknown.body.details).toEqual([
      { field: 'cities.0', message: 'no bookable hotel there' },
    ]);
    expect(await t.prisma.voucher.count()).toBe(0);
  });

  it('remembers a skip, and finishing later still earns the code', async () => {
    await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');

    const skipped = await t
      .api()
      .post('/api/v1/me/onboarding/skip')
      .set(auth(guest.token))
      .expect(200);
    expect(skipped.body.data).toMatchObject({
      status: 'SKIPPED',
      voucher: null,
    });
    expect(skipped.body.data.options).not.toBeNull();

    const done = await complete(guest.token, {
      cities: ['Đà Nẵng'],
      viewIds: [seaView],
      roomAmenities: ['pool'],
    }).expect(200);
    expect(done.body.data.voucher).not.toBeNull();
  });

  it('caps a platform discount at 8 % of the rooms, whatever the code says', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    const platform = await t.prisma.promotion.create({
      data: {
        hotelId: null,
        name: 'Nền tảng 20%',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        requiresCode: true,
      },
    });
    await t.prisma.voucher.create({
      data: {
        promotionId: platform.promotionId,
        customerId: guest.id,
        code: 'PLATFORM20X',
        discountType: 'PERCENTAGE',
        discountValue: 20,
      },
    });

    const res = await t
      .api()
      .post('/api/v1/bookings/discount-quote')
      .set(auth(guest.token))
      .send({ roomTypeId: h.roomTypeId, ...stay, code: 'PLATFORM20X' })
      .expect(200);
    // 20 % would be 400,000; the platform pays for its discounts out of an 8 % commission.
    expect(res.body.data.discount).toMatchObject({ amount: 160000 });
    expect(res.body.data.expectedTotal).toBe(1840000);
  });

  it('pays for the welcome code out of the commission, so the hotel nets what it would have', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    const manager = await t.signIn('PLATFORM_MANAGER', 'manager@mail.test');
    const { code } = (
      await complete(guest.token, {
        cities: ['Đà Nẵng'],
        hotelIds: [h.hotelId],
        viewIds: [seaView],
      }).expect(200)
    ).body.data.voucher;

    // 5 % of 2,000,000 = 100,000, under the 200,000 cap.
    const booking = (
      await t
        .api()
        .post('/api/v1/bookings')
        .set(auth(guest.token))
        .send({
          roomTypeId: h.roomTypeId,
          ...stay,
          guests: 1,
          guestName: 'Nguyễn Văn A',
          contactPhone: '0905123456',
          expectedTotal: 1900000,
          code,
        })
        .expect(201)
    ).body.data as { id: string; code: string };
    await t.app.get(PaymentConfirmationService).confirm({
      code: booking.code,
      amount: 1900000,
      transactionId: `txn-${booking.code}`,
      paidAt: new Date(),
    });

    // Before check-out the platform screen already forecasts the commission net of the discount...
    const period = `from=${day(-1)}&to=${day(3)}`;
    const expected = await t
      .api()
      .get(`/api/v1/platform/commissions?${period}`)
      .set(auth(manager.token))
      .expect(200);
    expect(expected.body.data).toEqual([
      expect.objectContaining({
        status: 'EXPECTED',
        total: 1900000,
        rate: 8,
        // 8 % of the 2,000,000 the stay was worth, less the 100,000 the platform gave away.
        amount: 60000,
      }),
    ]);

    for (const action of ['check-in', 'check-out']) {
      await t
        .api()
        .post(`/api/v1/bookings/${booking.id}/${action}`)
        .set(auth(h.token))
        .send({})
        .expect(200);
    }

    // ...and check-out charges exactly that.
    const charged = await t
      .api()
      .get(`/api/v1/platform/commissions?${period}`)
      .set(auth(manager.token))
      .expect(200);
    expect(charged.body.data).toEqual([
      expect.objectContaining({ status: 'CHARGED', amount: 60000 }),
    ]);

    // The hotel nets 2,000,000 − 8 % = 1,840,000, exactly as if the guest had paid in full.
    const wallet = await t.prisma.wallet.findFirstOrThrow({
      where: { hotelId: h.hotelId },
    });
    const { _sum } = await t.prisma.walletTransaction.aggregate({
      where: { walletId: wallet.walletId, bookingId: booking.id },
      _sum: { amount: true },
    });
    expect(_sum.amount?.toNumber()).toBe(1840000);
  });
});
