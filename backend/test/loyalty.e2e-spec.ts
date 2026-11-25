import { HoldExpiryService } from '../src/modules/bookings/hold-expiry.service';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Loyalty points (e2e)', () => {
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

  /** A two-night stay for one room: 2,000,000 before anything comes off. */
  const quote = (token: string, roomTypeId: string, pointsToUse?: number) =>
    t
      .api()
      .post('/api/v1/bookings/discount-quote')
      .set(auth(token))
      .send({
        roomTypeId,
        checkIn: day(0),
        checkOut: day(2),
        rooms: 1,
        ...(pointsToUse !== undefined && { pointsToUse }),
      });

  const book = (
    token: string,
    roomTypeId: string,
    expectedTotal: number,
    pointsToUse?: number,
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
        ...(pointsToUse !== undefined && { pointsToUse }),
      });

  /** Books, pays, checks in and out, then frees the rooms, so points are credited at check-out. */
  const completedStay = async (
    guestToken: string,
    h: { token: string; roomTypeId: string; hotelId: string },
    expectedTotal = 2000000,
    pointsToUse?: number,
  ) => {
    const res = await book(
      guestToken,
      h.roomTypeId,
      expectedTotal,
      pointsToUse,
    ).expect(201);
    const booking = res.body.data as { id: string; code: string };
    if (expectedTotal > 0) {
      await t.app.get(PaymentConfirmationService).confirm({
        code: booking.code,
        amount: expectedTotal,
        transactionId: `txn-${booking.code}`,
        paidAt: new Date(),
      });
    }
    await t
      .api()
      .post(`/api/v1/bookings/${booking.id}/check-in`)
      .set(auth(h.token))
      .send({})
      .expect(200);
    await t
      .api()
      .post(`/api/v1/bookings/${booking.id}/check-out`)
      .set(auth(h.token))
      .send({})
      .expect(200);
    const rooms = await t.prisma.room.findMany({
      where: { status: 'CLEANING', roomType: { hotelId: h.hotelId } },
      select: { roomId: true },
    });
    for (const { roomId } of rooms) {
      await t
        .api()
        .post(`/api/v1/rooms/${roomId}/clean`)
        .set(auth(h.token))
        .expect(200);
    }
    return booking;
  };

  const account = (token: string) =>
    t.api().get('/api/v1/me/loyalty').set(auth(token));

  /** Credits points directly, for the tests about spending rather than earning. */
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
    // The seed creates the platform programme; the truncate between tests leaves it, but make it certain.
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

  describe('GET /me/loyalty', () => {
    it('opens an account on first read instead of answering an error', async () => {
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const res = await account(guest.token).expect(200);
      expect(res.body.data).toMatchObject({
        programName: 'StayMiles',
        pointsBalance: 0,
        lifetimePoints: 0,
        tier: 'MEMBER',
        pointValue: 100,
        balanceValue: 0,
        nextTier: { tier: 'SILVER', pointsNeeded: 10000 },
      });
    });
  });

  describe('Earning at check-out', () => {
    it('credits a point per 1,000 dong of what the stay was paid', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await completedStay(guest.token, h);

      const res = await account(guest.token).expect(200);
      expect(res.body.data).toMatchObject({
        pointsBalance: 2000,
        lifetimePoints: 2000,
        balanceValue: 200000,
      });
    });

    it('earns on what was actually paid, so a discount lowers the points too', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await t
        .api()
        .post(`/api/v1/hotels/${h.hotelId}/promotions`)
        .set(auth(h.token))
        .send({
          name: 'Giảm 500k',
          discountType: 'FIXED_AMOUNT',
          discountValue: 500000,
        })
        .expect(201);

      await completedStay(guest.token, h, 1500000);

      // 1,500,000 paid, not the 2,000,000 list price.
      const res = await account(guest.token).expect(200);
      expect(res.body.data.pointsBalance).toBe(1500);
    });

    it('credits nothing before check-out', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await book(guest.token, h.roomTypeId, 2000000).expect(201);

      const res = await account(guest.token).expect(200);
      expect(res.body.data.pointsBalance).toBe(0);
    });
  });

  describe('Spending on a booking', () => {
    it('quotes the points, caps them at the stay and takes them off the total', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);

      const res = await quote(guest.token, h.roomTypeId, 5000).expect(200);
      expect(res.body.data.points).toMatchObject({
        pointsBalance: 5000,
        maxPointsUsable: 5000,
        pointsUsed: 5000,
        amount: 500000,
      });
      expect(res.body.data.expectedTotal).toBe(1500000);
    });

    it('spends the points and lowers the balance when the booking is made', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);

      await book(guest.token, h.roomTypeId, 1500000, 5000).expect(201);

      const res = await account(guest.token).expect(200);
      expect(res.body.data.pointsBalance).toBe(0);
      // Lifetime points do not fall, so spending cannot drop a tier.
      expect(res.body.data.lifetimePoints).toBe(5000);
    });

    it('records the points on the invoice next to the discount', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);

      const res = await book(guest.token, h.roomTypeId, 1500000, 5000).expect(
        201,
      );
      const invoice = await t.prisma.invoice.findFirstOrThrow({
        where: { bookingId: idOf(res) },
      });
      expect(invoice.subtotal.toNumber()).toBe(2000000);
      expect(invoice.discountAmount.toNumber()).toBe(500000);
      expect(invoice.totalAmount.toNumber()).toBe(1500000);
    });

    it('stacks points on top of a discount, the third subtraction of the price', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);
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

      // 2,000,000 − 200,000 discount − 500,000 points.
      const res = await quote(guest.token, h.roomTypeId, 5000).expect(200);
      expect(res.body.data.discount.amount).toBe(200000);
      expect(res.body.data.points.amount).toBe(500000);
      expect(res.body.data.expectedTotal).toBe(1300000);
      await book(guest.token, h.roomTypeId, 1300000, 5000).expect(201);
    });

    it('spends only what the stay needs and leaves the rest on the balance', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      // 50,000 points are worth 5,000,000 d, far more than the 2,000,000 stay.
      await givePoints(guest.id, 50000);

      const res = await quote(guest.token, h.roomTypeId, 50000).expect(200);
      expect(res.body.data.points).toMatchObject({
        maxPointsUsable: 20000,
        pointsUsed: 20000,
        amount: 2000000,
      });
      expect(res.body.data.expectedTotal).toBe(0);

      await book(guest.token, h.roomTypeId, 0, 50000).expect(201);
      const after = await account(guest.token).expect(200);
      expect(after.body.data.pointsBalance).toBe(30000);
    });

    it('refuses more points than the customer holds', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 1000);

      const res = await quote(guest.token, h.roomTypeId, 5000);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('LOYALTY_POINTS_INSUFFICIENT');
    });

    it('refuses a total that does not match what the backend computes', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);

      const res = await book(guest.token, h.roomTypeId, 2000000, 5000);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('BOOKING_PRICE_CHANGED');
    });
  });

  describe('Giving points back', () => {
    it('credits them again when the hold expires unpaid', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);
      const res = await book(guest.token, h.roomTypeId, 1500000, 5000).expect(
        201,
      );

      await t.prisma.roomCalendars.updateMany({
        where: { bookingId: idOf(res) },
        data: { holdExpiresAt: new Date(Date.now() - 60_000) },
      });
      await t.app.get(HoldExpiryService).expireDue();

      const after = await account(guest.token).expect(200);
      expect(after.body.data.pointsBalance).toBe(5000);
    });

    it('credits them again when a paid booking is cancelled with nothing to refund', async () => {
      const h = await hotel();
      await t
        .api()
        .patch(`/api/v1/hotels/${h.hotelId}/cancellation-policy`)
        .set(auth(h.token))
        .send({ freeCancellationDays: null, feePercent: 100 })
        .expect(200);
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);

      const res = await book(guest.token, h.roomTypeId, 1500000, 5000).expect(
        201,
      );
      const booking = res.body.data as { id: string; code: string };
      await t.app.get(PaymentConfirmationService).confirm({
        code: booking.code,
        amount: 1500000,
        transactionId: `txn-${booking.code}`,
        paidAt: new Date(),
      });
      await t
        .api()
        .post(`/api/v1/bookings/${booking.id}/cancel`)
        .set(auth(guest.token))
        .send({ reason: 'Đổi kế hoạch' })
        .expect(200);

      const after = await account(guest.token).expect(200);
      expect(after.body.data.pointsBalance).toBe(5000);
    });
  });

  describe('GET /me/loyalty/entries', () => {
    it('reads the movements back, newest first, with the hotel they came from', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);
      await completedStay(guest.token, h, 1500000, 5000);

      const res = await t
        .api()
        .get('/api/v1/me/loyalty/entries')
        .set(auth(guest.token))
        .expect(200);

      const entries = res.body.data as {
        kind: string;
        points: number;
        hotelName: string | null;
      }[];
      // Earned at check-out on the 1,500,000 paid, after spending 5,000 at booking.
      expect(entries.map((e) => e.kind)).toEqual(['EARNED', 'SPENT']);
      expect(entries[0]).toMatchObject({
        points: 1500,
        hotelName: 'Riverside',
      });
      expect(entries[1]).toMatchObject({ points: -5000 });
    });
  });

  describe('Tiers', () => {
    it('moves up on lifetime points and never falls when they are spent', async () => {
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 30000);

      const res = await account(guest.token).expect(200);
      expect(res.body.data).toMatchObject({
        tier: 'GOLD',
        nextTier: { tier: 'PLATINUM', pointsNeeded: 70000 },
      });

      const h = await hotel();
      await book(guest.token, h.roomTypeId, 0, 20000).expect(201);

      const after = await account(guest.token).expect(200);
      expect(after.body.data).toMatchObject({
        pointsBalance: 10000,
        lifetimePoints: 30000,
        tier: 'GOLD',
      });
    });
  });

  describe("A hotel's own rules (L8–L11)", () => {
    const rulesUrl = (hotelId: string) =>
      `/api/v1/hotels/${hotelId}/loyalty-program`;
    const saveRules = (
      token: string,
      hotelId: string,
      rules: Partial<{
        isActive: boolean;
        pointsPerCurrency: number;
        acceptsPoints: boolean;
        maxRedeemPercent: number;
      }> = {},
    ) =>
      t
        .api()
        .put(rulesUrl(hotelId))
        .set(auth(token))
        .send({
          isActive: true,
          pointsPerCurrency: 0.001,
          acceptsPoints: true,
          maxRedeemPercent: 100,
          ...rules,
        });

    it('shows the platform rules while the hotel has saved none', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .get(rulesUrl(h.hotelId))
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data).toEqual({
        custom: false,
        appliesNow: false,
        isActive: false,
        pointsPerCurrency: 0.001,
        earnMultiplier: 1,
        acceptsPoints: true,
        maxRedeemPercent: 100,
        platform: {
          name: 'StayMiles',
          isActive: true,
          pointsPerCurrency: 0.001,
          pointValue: 100,
        },
        limits: {
          minPointsPerCurrency: 0.001,
          // 1x until the hotel giving bonus points also pays for them (money-rules §9).
          maxPointsPerCurrency: 0.001,
          minRedeemPercent: 1,
          maxRedeemPercent: 100,
        },
      });
    });

    it('saves the rules, reads them back and writes the change to the audit log', async () => {
      const h = await hotel();
      const saved = await saveRules(h.token, h.hotelId, {
        acceptsPoints: false,
        maxRedeemPercent: 30,
      }).expect(200);
      expect(saved.body.data).toMatchObject({
        custom: true,
        appliesNow: true,
        pointsPerCurrency: 0.001,
        earnMultiplier: 1,
        acceptsPoints: false,
        maxRedeemPercent: 30,
      });

      const read = await t
        .api()
        .get(rulesUrl(h.hotelId))
        .set(auth(h.token))
        .expect(200);
      expect(read.body.data).toEqual(saved.body.data);

      // Saving again updates the one row of the hotel instead of adding a second.
      await saveRules(h.token, h.hotelId, { isActive: false }).expect(200);
      expect(
        await t.prisma.loyaltyProgram.count({ where: { hotelId: h.hotelId } }),
      ).toBe(1);

      const logs = await t.prisma.auditLog.findMany({
        where: { action: 'LOYALTY_PROGRAM_UPDATED' },
        orderBy: { createdAt: 'asc' },
      });
      expect(logs).toHaveLength(2);
      expect(JSON.parse(logs[0].newValue ?? '{}')).toMatchObject({
        hotelId: h.hotelId,
        before: null,
        after: { acceptsPoints: false, maxRedeemPercent: 30 },
      });
      expect(JSON.parse(logs[1].newValue ?? '{}')).toMatchObject({
        before: { isActive: true, acceptsPoints: false },
        after: { isActive: false, acceptsPoints: true },
      });
    });

    it('keeps a single platform programme', async () => {
      // The partial unique index of migration 20261118090000: hotel_id NULL is not covered by the unique key.
      await expect(
        t.prisma.loyaltyProgram.create({
          data: { name: 'Second', pointsPerCurrency: 0.001, pointValue: 100 },
        }),
      ).rejects.toThrow();
      expect(
        await t.prisma.loyaltyProgram.count({ where: { hotelId: null } }),
      ).toBe(1);
    });

    it('logs what each of two saves sent at once really replaced', async () => {
      const h = await hotel();
      await Promise.all([
        saveRules(h.token, h.hotelId, { maxRedeemPercent: 20 }).expect(200),
        saveRules(h.token, h.hotelId, { maxRedeemPercent: 40 }).expect(200),
      ]);

      // One of them created the row; the other replaced exactly that, never `null` a second time.
      const logs = (
        await t.prisma.auditLog.findMany({
          where: { action: 'LOYALTY_PROGRAM_UPDATED' },
          orderBy: { createdAt: 'asc' },
        })
      ).map(
        (l) =>
          JSON.parse(l.newValue ?? '{}') as {
            before: { maxRedeemPercent: number } | null;
            after: { maxRedeemPercent: number };
          },
      );
      expect(logs).toHaveLength(2);
      const first = logs.find((l) => l.before === null);
      const second = logs.find((l) => l.before !== null);
      expect(first).toBeDefined();
      expect(second?.before?.maxRedeemPercent).toBe(
        first?.after.maxRedeemPercent,
      );
    });

    it('refuses any earning rate but the platform one while the limit is 1x', async () => {
      const h = await hotel();
      for (const pointsPerCurrency of [0.0005, 0.0011, 0.003]) {
        const res = await saveRules(h.token, h.hotelId, {
          pointsPerCurrency,
        }).expect(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
        expect(res.body.details).toEqual([
          {
            field: 'pointsPerCurrency',
            message: 'must be 0.001, the platform rate',
          },
        ]);
      }
      for (const maxRedeemPercent of [0, 100.5, 33.333]) {
        await saveRules(h.token, h.hotelId, { maxRedeemPercent }).expect(400);
      }
      expect(
        await t.prisma.loyaltyProgram.count({ where: { hotelId: h.hotelId } }),
      ).toBe(0);
    });

    it('lets only the owner change the rules; staff and other partners are kept out', async () => {
      const h = await hotel();
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'FRONT_DESK',
      ]);
      await saveRules(staff.token, h.hotelId).expect(403);
      await t.api().get(rulesUrl(h.hotelId)).set(auth(staff.token)).expect(403);

      const other = await hotel('other@hotel.test');
      await saveRules(other.token, h.hotelId).expect(404);
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      // The access guard hides a hotel from every account outside it.
      await saveRules(guest.token, h.hotelId).expect(404);
    });

    it('never pays out a bonus rate at check-out while the limit is 1x', async () => {
      const h = await hotel();
      await saveRules(h.token, h.hotelId).expect(200);
      // A rate saved before the limit came down, or written straight to the table.
      await t.prisma.loyaltyProgram.update({
        where: { hotelId: h.hotelId },
        data: { pointsPerCurrency: 0.003 },
      });
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await completedStay(guest.token, h);

      // 2,000,000 paid at the platform's 1 point per 1,000 d, not 3.
      const res = await account(guest.token).expect(200);
      expect(res.body.data.pointsBalance).toBe(2000);
    });

    it('caps the points at the share of the stay the hotel allows', async () => {
      const h = await hotel();
      await saveRules(h.token, h.hotelId, { maxRedeemPercent: 30 }).expect(200);
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 50000);

      // 30 % of 2,000,000 = 600,000, so 6,000 points at 100 d each.
      const res = await quote(guest.token, h.roomTypeId, 50000).expect(200);
      expect(res.body.data.points).toMatchObject({
        maxPointsUsable: 6000,
        pointsUsed: 6000,
        amount: 600000,
        acceptsPoints: true,
        maxRedeemPercent: 30,
      });
      expect(res.body.data.expectedTotal).toBe(1400000);

      await book(guest.token, h.roomTypeId, 1400000, 50000).expect(201);
      const after = await account(guest.token).expect(200);
      expect(after.body.data.pointsBalance).toBe(44000);
    });

    it('refuses points at a hotel that does not take them', async () => {
      const h = await hotel();
      await saveRules(h.token, h.hotelId, { acceptsPoints: false }).expect(200);
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);

      const plain = await quote(guest.token, h.roomTypeId).expect(200);
      expect(plain.body.data.points).toMatchObject({
        acceptsPoints: false,
        maxPointsUsable: 0,
        pointsUsed: 0,
      });
      expect(plain.body.data.expectedTotal).toBe(2000000);

      const quoted = await quote(guest.token, h.roomTypeId, 1000).expect(409);
      expect(quoted.body.code).toBe('LOYALTY_POINTS_NOT_ACCEPTED');
      const booked = await book(
        guest.token,
        h.roomTypeId,
        1900000,
        1000,
      ).expect(409);
      expect(booked.body.code).toBe('LOYALTY_POINTS_NOT_ACCEPTED');

      // A booking without points goes through, and the balance is untouched.
      await book(guest.token, h.roomTypeId, 2000000).expect(201);
      const after = await account(guest.token).expect(200);
      expect(after.body.data.pointsBalance).toBe(5000);
    });

    it('goes back to the platform rules when the hotel switches its own off', async () => {
      const h = await hotel();
      await saveRules(h.token, h.hotelId, {
        isActive: false,
        acceptsPoints: false,
        maxRedeemPercent: 10,
      }).expect(200);
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      await givePoints(guest.id, 5000);

      // The saved rules are kept but not applied: points are taken and earned at the platform rate.
      const res = await quote(guest.token, h.roomTypeId, 5000).expect(200);
      expect(res.body.data.points).toMatchObject({
        acceptsPoints: true,
        pointsUsed: 5000,
      });
      await completedStay(guest.token, h, 1500000, 5000);
      const after = await account(guest.token).expect(200);
      expect(after.body.data.pointsBalance).toBe(1500);
    });
  });
});
