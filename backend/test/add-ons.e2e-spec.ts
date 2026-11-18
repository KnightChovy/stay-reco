import type { Booking, HotelAddOn } from '@stayreco/shared';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

/**
 * Hotel add-ons (services before, during and after the stay). Prepaid ones ride on the booking transfer but are
 * never discounted and are refunded in full on cancellation; front-desk ones are collected at check-out, outside the
 * booking total.
 */
describe('Hotel add-ons (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;

  /** A hotel with one Deluxe room type at 1,000,000 a night, two rooms. */
  const hotel = async () => {
    const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
    const hotelId = idOf(
      await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(partner.token))
        .send({
          name: 'Riverside',
          address: '1 Bạch Đằng',
          city: 'Đà Nẵng',
          email: 'contact@hotel.test',
          checkInTime: '00:00',
        })
        .expect(201),
    );
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    const deluxe = idOf(
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
        .send({ roomTypeId: deluxe, roomNumber })
        .expect(201);
    }
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });

    const addOn = async (body: object) =>
      idOf(
        await t
          .api()
          .post(`/api/v1/hotels/${hotelId}/add-ons`)
          .set(auth(partner.token))
          .send(body)
          .expect(201),
      );
    const pickup = await addOn({
      name: 'Đón sân bay',
      price: 300000,
      timing: 'BEFORE_STAY',
    });
    const breakfast = await addOn({
      name: 'Bữa sáng',
      price: 150000,
      timing: 'DURING_STAY',
    });
    const minibar = await addOn({
      name: 'Minibar',
      price: 50000,
      timing: 'DURING_STAY',
      prebookable: false,
    });
    return { ...partner, hotelId, deluxe, pickup, breakfast, minibar };
  };

  type Hotel = Awaited<ReturnType<typeof hotel>>;

  /** Two nights of one Deluxe from `from` days ahead: 2,000,000 of rooms. */
  const book = (
    token: string,
    h: Hotel,
    expectedTotal: number,
    extra: object = {},
    from = 0,
  ) =>
    t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        items: [{ roomTypeId: h.deluxe, rooms: 1 }],
        checkIn: day(from),
        checkOut: day(from + 2),
        guests: 2,
        guestName: 'Nguyễn Văn A',
        contactPhone: '0905123456',
        expectedTotal,
        ...extra,
      });

  const pay = async (res: { body: unknown }, amount: number) => {
    const { code } = (res.body as { data: { code: string } }).data;
    await t.app.get(PaymentConfirmationService).confirm({
      code,
      amount,
      transactionId: `txn-${code}`,
      paidAt: new Date(),
    });
  };

  const detail = async (token: string, id: string) =>
    (
      (await t.api().get(`/api/v1/bookings/${id}`).set(auth(token)).expect(200))
        .body as { data: Booking }
    ).data;

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

  describe('the catalogue', () => {
    it('is kept by the owner and shown to customers while on sale', async () => {
      const h = await hotel();
      const staff = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/add-ons`)
        .set(auth(staff.token))
        .send({ name: 'Spa', price: 500000, timing: 'DURING_STAY' })
        .expect(403);

      await t
        .api()
        .patch(`/api/v1/add-ons/${h.breakfast}`)
        .set(auth(h.token))
        .send({ isActive: false })
        .expect(200);

      const all = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/add-ons`)
        .set(auth(staff.token))
        .expect(200);
      // Off sale last.
      const names = (all.body as { data: HotelAddOn[] }).data.map(
        (a) => a.name,
      );
      expect(names).toEqual(['Đón sân bay', 'Minibar', 'Bữa sáng']);

      const listing = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/listing`)
        .expect(200);
      expect(listing.body.data.hotel.addOns).toEqual([
        expect.objectContaining({
          name: 'Đón sân bay',
          price: 300000,
          timing: 'BEFORE_STAY',
        }),
        expect.objectContaining({ name: 'Minibar', prebookable: false }),
      ]);
    });
  });

  describe('prepaid add-ons', () => {
    it('are paid in the transfer but never discounted', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/promotions`)
        .set(auth(h.token))
        .send({
          name: 'Giảm 10%',
          discountType: 'PERCENTAGE',
          discountValue: 10,
        })
        .expect(201);
      const addOns = [
        { addOnId: h.pickup, quantity: 1 },
        { addOnId: h.breakfast, quantity: 2 },
      ];

      const quote = await t
        .api()
        .post('/api/v1/bookings/discount-quote')
        .set(auth(guest.token))
        .send({
          roomTypeId: h.deluxe,
          checkIn: day(0),
          checkOut: day(2),
          addOns,
        })
        .expect(200);
      // 2,000,000 rooms − 200,000 discount + 300,000 + 2 × 150,000.
      expect(quote.body.data).toMatchObject({
        subtotal: 2000000,
        addOnsTotal: 600000,
        expectedTotal: 2400000,
      });

      const res = await book(guest.token, h, 2400000, { addOns }).expect(201);
      const booking = await detail(guest.token, idOf(res));
      expect(booking.totalAmount).toBe(2400000);
      expect(booking.payment?.amount).toBe(2400000);
      expect(booking.invoice).toMatchObject({
        subtotal: 2600000,
        addOnsTotal: 600000,
        discount: { amount: 200000 },
        total: 2400000,
        frontDeskDue: 0,
      });
      // Booked together: by name.
      expect(booking.addOns).toEqual([
        expect.objectContaining({
          name: 'Bữa sáng',
          quantity: 2,
          amount: 300000,
          payment: 'PREPAID',
        }),
        expect.objectContaining({
          name: 'Đón sân bay',
          unitPrice: 300000,
          quantity: 1,
          amount: 300000,
          payment: 'PREPAID',
        }),
      ]);

      // A later price change does not touch the booking.
      await t
        .api()
        .patch(`/api/v1/add-ons/${h.pickup}`)
        .set(auth(h.token))
        .send({ price: 999000 })
        .expect(200);
      expect((await detail(guest.token, idOf(res))).invoice.total).toBe(
        2400000,
      );
    });

    it('refuses an add-on the customer cannot book in advance', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await book(guest.token, h, 2050000, {
        addOns: [{ addOnId: h.minibar, quantity: 1 }],
      });
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('ADD_ON_NOT_FOUND');
      expect(await t.prisma.booking.count()).toBe(0);
    });

    it('are refunded in full: the cancellation fee is on the rooms only', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await book(
        guest.token,
        h,
        2300000,
        { addOns: [{ addOnId: h.pickup, quantity: 1 }] },
        5,
      ).expect(201);
      await pay(res, 2300000);
      await t.prisma.booking.update({
        where: { bookingId: idOf(res) },
        data: { freeCancelUntil: null, cancelFeePercent: 50 },
      });

      const quote = await t
        .api()
        .get(`/api/v1/bookings/${idOf(res)}/cancellation-quote`)
        .set(auth(guest.token))
        .expect(200);
      // Half of the 2,000,000 of rooms; the 300,000 pick-up comes back whole.
      expect(quote.body.data).toMatchObject({
        paid: 2300000,
        fee: 1000000,
        refund: 1300000,
      });
    });
  });

  describe('front-desk add-ons', () => {
    it('are added during the stay and collected at check-out', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const res = await book(guest.token, h, 2000000).expect(201);
      const id = idOf(res);
      const add = (body: object) =>
        t
          .api()
          .post(`/api/v1/bookings/${id}/add-ons`)
          .set(auth(desk.token))
          .send(body);

      // Not before the stay is paid.
      expect(
        (await add({ addOnId: h.minibar, quantity: 1 }).expect(409)).body.code,
      ).toBe('BOOKING_STATUS_CONFLICT');
      await pay(res, 2000000);
      await t
        .api()
        .post(`/api/v1/bookings/${id}/check-in`)
        .set(auth(desk.token))
        .send({})
        .expect(200);

      // Not prebookable, but staff may add it.
      await add({ addOnId: h.minibar, quantity: 3 }).expect(200);
      const withBreakfast = (
        (await add({ addOnId: h.breakfast, quantity: 1 }).expect(200)).body as {
          data: Booking;
        }
      ).data;
      expect(withBreakfast.totalAmount).toBe(2000000);
      expect(withBreakfast.invoice.frontDeskDue).toBe(300000);
      expect(withBreakfast.timeline.map((e) => e.event)).toEqual(
        expect.arrayContaining(['ADD_ON_ADDED']),
      );

      const breakfastLine = withBreakfast.addOns.find(
        (l) => l.name === 'Bữa sáng',
      )!;
      const after = await t
        .api()
        .delete(`/api/v1/bookings/${id}/add-ons/${breakfastLine.id}`)
        .set(auth(desk.token))
        .expect(200);
      expect(after.body.data.invoice.frontDeskDue).toBe(150000);

      const checkOut = await t
        .api()
        .get(`/api/v1/bookings/${id}/check-out-quote`)
        .set(auth(desk.token))
        .expect(200);
      expect(checkOut.body.data).toMatchObject({
        amountPaid: 2000000,
        addOnsDue: 150000,
      });
    });

    it('cannot remove a prepaid line and is for the front desk only', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await book(guest.token, h, 2300000, {
        addOns: [{ addOnId: h.pickup, quantity: 1 }],
      }).expect(201);
      await pay(res, 2300000);
      const id = idOf(res);
      const booking = await detail(guest.token, id);

      await t
        .api()
        .delete(`/api/v1/bookings/${id}/add-ons/${booking.addOns[0].id}`)
        .set(auth(h.token))
        .expect(404);
      const sales = await t.signInStaff(h.hotelId, 'sales@hotel.test', [
        'BOOKING',
      ]);
      await t
        .api()
        .post(`/api/v1/bookings/${id}/add-ons`)
        .set(auth(sales.token))
        .send({ addOnId: h.minibar })
        .expect(403);
      // The customer is an outsider to the front desk.
      await t
        .api()
        .post(`/api/v1/bookings/${id}/add-ons`)
        .set(auth(guest.token))
        .send({ addOnId: h.minibar })
        .expect(404);
    });
  });
});
