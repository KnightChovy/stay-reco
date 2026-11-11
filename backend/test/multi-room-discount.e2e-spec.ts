import { createTestApp } from './helpers';

/**
 * A booking of several room types (PR #109) priced with a discount and points. The other phase 4 specs book the
 * deprecated single `roomTypeId`, so this is the one that walks the `items[]` path: the stay subtotal has to add up
 * every room type before the discount and the points come off it (money-rules §2.1).
 */
describe('Discounts and points on a booking of several room types (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;

  /** A hotel with two room types: Deluxe at 1,000,000 a night and Suite at 1,500,000, two rooms each. */
  const hotel = async () => {
    const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
    const created = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@hotel.test',
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

    const roomType = async (
      name: string,
      basePrice: number,
      numbers: string[],
    ) => {
      const res = await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/room-types`)
        .set(auth(partner.token))
        .send({
          name,
          maxOccupancy: 2,
          areaSqm: 30,
          basePrice,
          beds: [{ bedTypeId: king, quantity: 1 }],
        })
        .expect(201);
      const roomTypeId = idOf(res);
      for (const roomNumber of numbers) {
        await t
          .api()
          .post(`/api/v1/hotels/${hotelId}/rooms`)
          .set(auth(partner.token))
          .send({ roomTypeId, roomNumber })
          .expect(201);
      }
      return roomTypeId;
    };

    const deluxe = await roomType('Deluxe', 1000000, ['101', '102']);
    const suite = await roomType('Suite', 1500000, ['201', '202']);
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId, deluxe, suite };
  };

  /** Two nights of one Deluxe and one Suite: (1,000,000 + 1,500,000) x 2 = 5,000,000. */
  const items = (h: { deluxe: string; suite: string }) => [
    { roomTypeId: h.deluxe, rooms: 1 },
    { roomTypeId: h.suite, rooms: 1 },
  ];

  const quote = (
    token: string,
    h: { deluxe: string; suite: string },
    extra: object = {},
  ) =>
    t
      .api()
      .post('/api/v1/bookings/discount-quote')
      .set(auth(token))
      .send({
        roomTypeId: h.deluxe,
        checkIn: day(0),
        checkOut: day(2),
        rooms: 1,
        ...extra,
      });

  const book = (
    token: string,
    h: { deluxe: string; suite: string },
    expectedTotal: number,
    extra: object = {},
  ) =>
    t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        items: items(h),
        checkIn: day(0),
        checkOut: day(2),
        guests: 2,
        guestName: 'Nguyễn Văn A',
        contactPhone: '0905123456',
        expectedTotal,
        ...extra,
      });

  const campaign = (token: string, hotelId: string, body: object) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/promotions`)
      .set(auth(token))
      .send(body);

  const givePoints = async (customerId: string, points: number) => {
    const programme = await t.prisma.loyaltyProgram.findFirstOrThrow({
      where: { hotelId: null },
    });
    await t.prisma.loyaltyAccount.upsert({
      where: {
        customerId_loyaltyProgramId: {
          customerId,
          loyaltyProgramId: programme.loyaltyProgramId,
        },
      },
      create: {
        customerId,
        loyaltyProgramId: programme.loyaltyProgramId,
        pointsBalance: points,
        lifetimePoints: points,
        tier: 'MEMBER',
      },
      update: { pointsBalance: points, lifetimePoints: points },
    });
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
    const existing = await t.prisma.loyaltyProgram.findFirst({
      where: { hotelId: null },
    });
    if (!existing) {
      await t.prisma.loyaltyProgram.create({
        data: { name: 'StayMiles', pointsPerCurrency: 0.001, pointValue: 100 },
      });
    }
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('takes a percentage off the whole stay, not off one room type', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    await campaign(h.token, h.hotelId, {
      name: 'Giảm 10%',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    }).expect(201);

    // 5,000,000 subtotal, so 10% is 500,000. Ten percent of the Deluxe alone would be 200,000.
    const res = await book(guest.token, h, 4500000).expect(201);

    const invoice = await t.prisma.invoice.findFirstOrThrow({
      where: { bookingId: idOf(res) },
    });
    expect(invoice.subtotal.toNumber()).toBe(5000000);
    expect(invoice.discountAmount.toNumber()).toBe(500000);
    expect(invoice.totalAmount.toNumber()).toBe(4500000);
  });

  it('refuses a total computed from one room type only', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    await campaign(h.token, h.hotelId, {
      name: 'Giảm 10%',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    }).expect(201);

    // What the old single-room-type arithmetic would have produced.
    const res = await book(guest.token, h, 4800000);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('BOOKING_PRICE_CHANGED');
  });

  it('checks a minimum amount against the whole stay', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    // The Deluxe alone (2,000,000) would miss this; the whole stay (5,000,000) clears it.
    await campaign(h.token, h.hotelId, {
      name: 'Đơn từ 4 triệu',
      discountType: 'FIXED_AMOUNT',
      discountValue: 400000,
      minBookingAmount: 4000000,
    }).expect(201);

    const res = await book(guest.token, h, 4600000).expect(201);
    const invoice = await t.prisma.invoice.findFirstOrThrow({
      where: { bookingId: idOf(res) },
    });
    expect(invoice.discountAmount.toNumber()).toBe(400000);
  });

  it('spends points on what the discount left of the whole stay', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    await givePoints(guest.id, 5000);
    await campaign(h.token, h.hotelId, {
      name: 'Giảm 10%',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    }).expect(201);

    // 5,000,000 − 500,000 discount − 500,000 points.
    const res = await book(guest.token, h, 4000000, {
      pointsToUse: 5000,
    }).expect(201);

    const invoice = await t.prisma.invoice.findFirstOrThrow({
      where: { bookingId: idOf(res) },
    });
    expect(invoice.subtotal.toNumber()).toBe(5000000);
    expect(invoice.discountAmount.toNumber()).toBe(1000000);
    expect(invoice.totalAmount.toNumber()).toBe(4000000);

    const account = await t
      .api()
      .get('/api/v1/me/loyalty')
      .set(auth(guest.token))
      .expect(200);
    expect(account.body.data.pointsBalance).toBe(0);
  });

  it('pays a multi-room-type booking from the wallet in one go', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    await t.prisma.wallet.upsert({
      where: { customerId: guest.id },
      create: {
        customerId: guest.id,
        ownerType: 'CUSTOMER',
        balanceAvailable: 5000000,
      },
      update: { balanceAvailable: 5000000 },
    });

    const res = await book(guest.token, h, 5000000).expect(201);
    await t
      .api()
      .post(`/api/v1/bookings/${idOf(res)}/pay-with-wallet`)
      .set(auth(guest.token))
      .expect(204);

    const hotelWallet = await t.prisma.wallet.findUniqueOrThrow({
      where: { hotelId: h.hotelId },
    });
    expect(hotelWallet.balancePending.toNumber()).toBe(5000000);
    const customerWallet = await t.prisma.wallet.findUniqueOrThrow({
      where: { customerId: guest.id },
    });
    expect(customerWallet.balanceAvailable.toNumber()).toBe(0);
  });

  it('quotes the stay the booking will be priced at', async () => {
    const h = await hotel();
    const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
    await campaign(h.token, h.hotelId, {
      name: 'Giảm 10%',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    }).expect(201);

    // The quote endpoint still takes one room type, so it prices the Deluxe only. Worth pinning down: the FE must
    // not use it as the total of a booking of several room types.
    const res = await quote(guest.token, h).expect(200);
    expect(res.body.data.subtotal).toBe(2000000);
  });
});
