import type { BookingStatus, PaymentStatus } from '@stayreco/shared';
import { addDays, todayInVietnam } from '../src/common/http/calendar-date';
import { createTestApp } from './helpers';

describe('Partner dashboard (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let customerId: string;
  let seq = 0;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const date = (d: string) => new Date(`${d}T00:00:00Z`);
  const today = () => todayInVietnam();

  /** A hotel with one room type (2 guests) and the given rooms. */
  const hotel = async (
    email: string,
    roomNumbers: string[],
    status: 'ACTIVE' | 'DRAFT' = 'ACTIVE',
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
        email: 'contact@hotel.test',
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
    const rooms: string[] = [];
    for (const roomNumber of roomNumbers) {
      const room = await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/rooms`)
        .set(auth(partner.token))
        .send({ roomTypeId, roomNumber })
        .expect(201);
      rooms.push(room.body.data.id as string);
    }
    await t.prisma.hotel.update({ where: { hotelId }, data: { status } });
    return { ...partner, hotelId, roomTypeId, rooms };
  };
  type Hotel = Awaited<ReturnType<typeof hotel>>;

  /** A booking written directly, with the nights' calendar rows when given. */
  const book = async (
    h: Hotel,
    o: {
      checkIn: string;
      prices: number[];
      rooms?: number;
      status: BookingStatus;
      createdAt: Date;
      cancelledAt?: Date;
      paymentStatus?: PaymentStatus;
      arrivalTime?: string;
      calendar?: {
        roomId: string;
        status: 'BOOKED' | 'HELD';
        holdExpiresAt?: Date;
      }[];
    },
  ) => {
    const rooms = o.rooms ?? 1;
    const total = o.prices.reduce((sum, p) => sum + p, 0) * rooms;
    const nights = o.prices.map((price, i) => ({
      date: addDays(o.checkIn, i),
      price,
    }));
    const booking = await t.prisma.booking.create({
      data: {
        customerId,
        roomTypeId: h.roomTypeId,
        checkInDate: date(o.checkIn),
        checkOutDate: date(addDays(o.checkIn, o.prices.length)),
        numGuests: rooms * 2,
        numRooms: rooms,
        nightlyPrices: nights,
        totalAmount: total,
        status: o.status,
        guestName: `Khách ${++seq}`,
        contactPhone: '0905123456',
        arrivalTime: o.arrivalTime
          ? new Date(`1970-01-01T${o.arrivalTime}:00.000Z`)
          : null,
        cancelFeePercent: 100,
        commissionRate: 8,
        createdAt: o.createdAt,
        cancelledAt: o.cancelledAt ?? null,
        invoice: {
          create: {
            invoiceNumber: `SR-TEST-${String(seq).padStart(4, '0')}`,
            subtotal: total,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: total,
            paymentMethod: 'SEPAY',
            paymentStatus: o.paymentStatus ?? 'PAID',
          },
        },
      },
    });
    for (const night of nights) {
      for (const c of o.calendar ?? []) {
        await t.prisma.roomCalendars.create({
          data: {
            roomId: c.roomId,
            date: date(night.date),
            bookingId: booking.bookingId,
            status: c.status,
            holdExpiresAt: c.holdExpiresAt ?? null,
          },
        });
      }
    }
    return booking;
  };

  const block = (roomId: string, d: string) =>
    t.prisma.roomCalendars.create({
      data: { roomId, date: date(d), status: 'BLOCKED' },
    });

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
    customerId = (await t.signIn('CUSTOMER', 'guest@mail.test')).id;
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('overview and series (October 2026, against September 2026)', () => {
    let h: Hotel;

    beforeEach(async () => {
      h = await hotel('owner@hotel.test', ['101', '102']);
      // Both rooms exist from 1 September (Vietnam time).
      await t.prisma.room.updateMany({
        where: { roomId: { in: h.rooms } },
        data: { createdAt: new Date('2026-09-01T00:00:00+07:00') },
      });
      // 2 rooms, 3 nights from 30/10: 2 nights × 2 rooms in October.
      await book(h, {
        checkIn: '2026-10-30',
        prices: [1000000, 1000000, 1000000],
        rooms: 2,
        status: 'CONFIRMED',
        createdAt: new Date('2026-10-10T03:00:00Z'),
      });
      // Across the month boundary, a different price each night.
      await book(h, {
        checkIn: '2026-09-30',
        prices: [1200000, 800000],
        status: 'COMPLETED',
        createdAt: new Date('2026-09-15T03:00:00Z'),
      });
      await book(h, {
        checkIn: '2026-10-20',
        prices: [900000],
        status: 'CANCELLED',
        createdAt: new Date('2026-10-05T03:00:00Z'),
        cancelledAt: new Date('2026-10-06T03:00:00Z'),
      });
      await book(h, {
        checkIn: '2026-10-25',
        prices: [900000],
        status: 'EXPIRED',
        paymentStatus: 'FAILED',
        createdAt: new Date('2026-10-07T03:00:00Z'),
      });
      // Booked at 00:30 on 1 October in Vietnam (still 30 September in UTC); a no-show counts as sold.
      await book(h, {
        checkIn: '2026-10-15',
        prices: [500000],
        status: 'NO_SHOW',
        createdAt: new Date('2026-09-30T17:30:00Z'),
      });
      await block(h.rooms[1], '2026-10-10');
      await block(h.rooms[1], '2026-10-11');

      const wallet = await t.prisma.wallet.create({
        data: {
          ownerType: 'HOTEL',
          hotelId: h.hotelId,
          balancePending: 6700000,
        },
      });
      const ledger = (
        type: 'BOOKING_PAYMENT' | 'REFUND' | 'COMMISSION' | 'PAYOUT',
        amount: number,
        at: string,
      ) =>
        t.prisma.walletTransaction.create({
          data: {
            walletId: wallet.walletId,
            type,
            amount,
            balanceAfter: 0,
            idempotencyKey: `test:${++seq}`,
            createdAt: new Date(at),
          },
        });
      await ledger('BOOKING_PAYMENT', 2000000, '2026-09-15T03:00:00Z');
      await ledger('BOOKING_PAYMENT', 6000000, '2026-10-10T03:00:00Z');
      await ledger('REFUND', -300000, '2026-10-12T03:00:00Z');
      await ledger('COMMISSION', -100000, '2026-10-20T03:00:00Z');
      await ledger('PAYOUT', -1000000, '2026-10-25T03:00:00Z');
      // 00:30 on 1 November in Vietnam: not October.
      await ledger('BOOKING_PAYMENT', 500000, '2026-10-31T17:30:00Z');
    });

    it('computes every KPI of the period and of the previous one', async () => {
      const res = await t
        .api()
        .get(
          `/api/v1/hotels/${h.hotelId}/stats/overview?from=2026-10-01&to=2026-10-31`,
        )
        .set(auth(h.token))
        .expect(200);
      const o = res.body.data;
      expect(o.period).toEqual({
        from: '2026-10-01',
        to: '2026-10-31',
        days: 31,
      });
      expect(o.previous).toEqual({
        from: '2026-08-31',
        to: '2026-09-30',
        days: 31,
      });
      expect(o.performance).toEqual({
        roomRevenue: { value: 5300000, previous: 1200000, deltaPercent: 341.7 },
        roomNightsSold: { value: 6, previous: 1, deltaPercent: 500 },
        // 2 rooms × 31 days − 2 blocked nights; September: 30 days (31 August had no rooms yet).
        roomNightsAvailable: { value: 60, previous: 60, deltaPercent: 0 },
        occupancyRate: { value: 10, previous: 1.7, deltaPoints: 8.3 },
        adr: { value: 883333.33, previous: 1200000, deltaPercent: -26.4 },
        revpar: { value: 88333.33, previous: 20000, deltaPercent: 341.7 },
        bookingsCreated: { value: 3, previous: 1, deltaPercent: 200 },
        cancellations: { value: 1, previous: 0, deltaPercent: null },
        cancellationRate: { value: 33.3, previous: 0, deltaPoints: 33.3 },
        avgLengthOfStay: { value: 2, previous: 2, deltaPercent: 0 },
        avgLeadTimeDays: { value: 16.3, previous: 15, deltaPercent: 8.7 },
      });
      expect(o.cash).toEqual({
        netEarnings: { value: 5600000, previous: 2000000, deltaPercent: 180 },
        commission: { value: 100000, previous: 0, deltaPercent: null },
        refunds: { value: 300000, previous: 0, deltaPercent: null },
      });
      expect(o.reviews).toEqual({
        avgRating: { value: null, previous: null, deltaPercent: null },
        reviewCount: { value: 0, previous: 0, deltaPercent: null },
      });
      expect(o.wallet).toEqual({ available: 0, pending: 6700000, reserved: 0 });
    });

    it('splits the same figures into weeks starting on Monday', async () => {
      const res = await t
        .api()
        .get(
          `/api/v1/hotels/${h.hotelId}/stats/series?from=2026-10-01&to=2026-10-31&granularity=week`,
        )
        .set(auth(h.token))
        .expect(200);
      const { granularity, points } = res.body.data as {
        granularity: string;
        points: Record<string, number | string | null>[];
      };
      expect(granularity).toBe('week');
      expect(points.map((p) => [p.periodStart, p.days])).toEqual([
        ['2026-10-01', 4],
        ['2026-10-05', 7],
        ['2026-10-12', 7],
        ['2026-10-19', 7],
        ['2026-10-26', 6],
      ]);
      expect(points[0]).toMatchObject({
        roomRevenue: 800000,
        roomNightsSold: 1,
        roomNightsAvailable: 8,
        occupancyRate: 12.5,
        bookingsCreated: 1,
      });
      expect(points[1]).toMatchObject({
        roomNightsAvailable: 12,
        bookingsCreated: 2,
        cancellations: 1,
        netEarnings: 6000000,
      });
      expect(points[4]).toMatchObject({
        roomRevenue: 4000000,
        roomNightsSold: 4,
        occupancyRate: 33.3,
        adr: 1000000,
        netEarnings: 0,
      });
      const sum = (k: string) =>
        points.reduce((s, p) => s + (p[k] as number), 0);
      expect(sum('roomRevenue')).toBe(5300000);
      expect(sum('roomNightsAvailable')).toBe(60);
    });

    it('defaults to the month to date and validates the period', async () => {
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/stats/series`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data.period).toMatchObject({
        from: `${today().slice(0, 8)}01`,
        to: today(),
      });
      expect(res.body.data.granularity).toBe('day');

      const half = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/stats/overview?from=2026-10-01`)
        .set(auth(h.token))
        .expect(400);
      expect(half.body.details).toEqual([
        { field: 'to', message: 'from and to must be sent together' },
      ]);
      await t
        .api()
        .get(
          `/api/v1/hotels/${h.hotelId}/stats/series?from=2026-01-01&to=2026-04-30&granularity=day`,
        )
        .set(auth(h.token))
        .expect(400);
    });

    it('keeps the money to the owner, also while suspended, and hides the hotel from others', async () => {
      const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
        'BOOKING',
        'REFUND',
      ]);
      for (const path of ['stats/overview', 'stats/series']) {
        const res = await t
          .api()
          .get(`/api/v1/hotels/${h.hotelId}/${path}`)
          .set(auth(staff.token))
          .expect(403);
        expect(res.body.code).toBe('FORBIDDEN');
      }
      const other = await t.signIn('HOTEL_PARTNER', 'other@hotel.test');
      for (const path of ['stats/overview', 'stats/today', 'action-items']) {
        const res = await t
          .api()
          .get(`/api/v1/hotels/${h.hotelId}/${path}`)
          .set(auth(other.token))
          .expect(404);
        expect(res.body.code).toBe('HOTEL_NOT_FOUND');
      }
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: h.id },
        data: { status: 'SUSPENDED' },
      });
      await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/stats/overview`)
        .set(auth(h.token))
        .expect(200);
    });
  });

  describe('today, the forecast and the action items', () => {
    let h: Hotel;
    let refundAt: Date;

    beforeEach(async () => {
      h = await hotel('owner@hotel.test', ['101', '102', '103']);
      const [r101, r102, r103] = h.rooms;
      // Locked for 8 days.
      await t.prisma.$executeRaw`
        UPDATE room SET status = 'MAINTENANCE', updated_at = now() - interval '8 days' WHERE room_id = ${r103}::uuid`;
      const now = Date.now();
      // Arrives today with 2 rooms for 2 nights.
      await book(h, {
        checkIn: today(),
        prices: [1000000, 1000000],
        rooms: 2,
        status: 'CONFIRMED',
        arrivalTime: '15:00',
        createdAt: new Date(now - 5 * 86_400_000),
        calendar: [
          { roomId: r101, status: 'BOOKED' },
          { roomId: r102, status: 'BOOKED' },
        ],
      });
      // Leaves today.
      await book(h, {
        checkIn: addDays(today(), -1),
        prices: [1000000],
        status: 'CONFIRMED',
        createdAt: new Date(now - 6 * 86_400_000),
      });
      // A hold in 5 days, still running.
      await book(h, {
        checkIn: addDays(today(), 5),
        prices: [1000000],
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        createdAt: new Date(now),
        calendar: [
          {
            roomId: r101,
            status: 'HELD',
            holdExpiresAt: new Date(now + 10 * 60_000),
          },
        ],
      });
      // In 3 days: one room booked with a refund request waiting, the other closed.
      const refunded = await book(h, {
        checkIn: addDays(today(), 3),
        prices: [1000000],
        status: 'CONFIRMED',
        paymentStatus: 'REFUND_PENDING',
        createdAt: new Date(now - 2 * 86_400_000),
        calendar: [{ roomId: r101, status: 'BOOKED' }],
      });
      refundAt = new Date(now - 86_400_000);
      await t.prisma.auditLog.create({
        data: {
          action: 'BOOKING_CANCEL_REQUESTED',
          entityType: 'booking',
          entityId: refunded.bookingId,
          newValue: JSON.stringify({
            reason: 'Đổi kế hoạch',
            paid: 1000000,
            fee: 0,
            refund: 1000000,
          }),
          createdAt: refundAt,
        },
      });
      await block(r102, addDays(today(), 3));
      // An invitation not accepted for 4 days.
      await t.prisma.userAccount.create({
        data: {
          email: 'invited@hotel.test',
          fullName: 'Invited',
          role: 'HOTEL_STAFF',
          status: 'INVITED',
          createdAt: new Date(now - 4 * 86_400_000),
          hotelStaff: { create: { hotelId: h.hotelId, position: 'Lễ tân' } },
        },
      });
    });

    it("shows today's arrivals, departures, rooms and holds", async () => {
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/stats/today`)
        .set(auth(h.token))
        .expect(200);
      const d = res.body.data;
      expect(d.date).toBe(today());
      expect(d.arrivals).toEqual({ expected: 1, checkedIn: 0 });
      expect(d.departures).toEqual({ expected: 1, checkedOut: 0 });
      expect(d.inHouse).toEqual({ bookings: 0, guests: 0 });
      // 3 rooms, one in maintenance: 2 sellable, both booked tonight.
      expect(d.tonight).toEqual({
        roomsSold: 2,
        roomsAvailable: 2,
        occupancyRate: 100,
      });
      expect(d.rooms).toEqual({
        total: 3,
        AVAILABLE: 2,
        OCCUPIED: 0,
        CLEANING: 0,
        MAINTENANCE: 1,
      });
      expect(d.holds.active).toBe(1);
      expect(d.holds.nextExpiresAt).not.toBeNull();
      expect(d.upcomingArrivals).toEqual([
        expect.objectContaining({
          rooms: 2,
          nights: 2,
          arrivalTime: '15:00',
          roomNumbers: ['101', '102'],
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        }),
      ]);
    });

    it('forecasts the coming days from the calendar', async () => {
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/stats/occupancy-forecast?days=7`)
        .set(auth(h.token))
        .expect(200);
      const days = res.body.data.days as Record<string, unknown>[];
      expect(days).toHaveLength(7);
      expect(days[0]).toEqual({
        date: today(),
        roomsTotal: 2,
        booked: 2,
        held: 0,
        blocked: 0,
        free: 0,
        occupancyRate: 100,
      });
      expect(days[3]).toMatchObject({
        booked: 1,
        blocked: 1,
        free: 0,
        occupancyRate: 100,
      });
      expect(days[5]).toMatchObject({
        booked: 0,
        held: 1,
        free: 1,
        occupancyRate: 0,
      });
      expect(days[6]).toMatchObject({ booked: 0, free: 2, occupancyRate: 0 });
    });

    it('lists what the owner should act on, in order of severity', async () => {
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/action-items`)
        .set(auth(h.token))
        .expect(200);
      expect(res.body.data.items).toEqual([
        {
          type: 'REFUND_REQUESTS_PENDING',
          severity: 'WARNING',
          count: 1,
          params: { oldestAt: refundAt.toISOString() },
        },
        {
          type: 'ROOMS_LOCKED_LONG',
          severity: 'WARNING',
          count: 1,
          params: { roomIds: [h.rooms[2]], days: 7 },
        },
        {
          type: 'NO_AVAILABILITY_DATES',
          severity: 'WARNING',
          count: 1,
          params: { dates: [addDays(today(), 3)] },
        },
        {
          type: 'STAFF_INVITES_PENDING',
          severity: 'INFO',
          count: 1,
          params: { staffIds: [expect.any(String)] },
        },
        {
          type: 'HIGH_DEMAND_DATES',
          severity: 'INFO',
          count: 3,
          params: { firstDate: today(), threshold: 90 },
        },
      ]);
    });

    it('gives staff only the items of their permission groups', async () => {
      const refund = await t.signInStaff(h.hotelId, 'refund@hotel.test', [
        'REFUND',
      ]);
      const desk = await t.signInStaff(h.hotelId, 'desk@hotel.test', [
        'FRONT_DESK',
      ]);
      const forRefund = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/action-items`)
        .set(auth(refund.token))
        .expect(200);
      const items = forRefund.body.data.items as { type: string }[];
      expect(items.map((i) => i.type)).toEqual(['REFUND_REQUESTS_PENDING']);
      const forDesk = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/action-items`)
        .set(auth(desk.token))
        .expect(200);
      expect(forDesk.body.data.items).toEqual([]);
      // Staff read today and the forecast (no money).
      await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/stats/today`)
        .set(auth(desk.token))
        .expect(200);
      await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/stats/occupancy-forecast`)
        .set(auth(desk.token))
        .expect(200);
    });
  });

  it('flags a returned verification request and the missing setup steps of a draft hotel', async () => {
    const h = await hotel('owner@hotel.test', ['101'], 'DRAFT');
    const request = await t.prisma.hotelVerificationRequest.create({
      data: {
        hotelId: h.hotelId,
        status: 'NEEDS_REVISION',
        requestType: 'INITIAL',
      },
    });
    const res = await t
      .api()
      .get(`/api/v1/hotels/${h.hotelId}/action-items`)
      .set(auth(h.token))
      .expect(200);
    expect(res.body.data.items).toEqual([
      {
        type: 'VERIFICATION_NEEDS_REVISION',
        severity: 'CRITICAL',
        count: 1,
        params: { requestId: request.verificationRequestId },
      },
      {
        type: 'SETUP_INCOMPLETE',
        severity: 'WARNING',
        count: 3,
        params: { missing: ['AMENITIES', 'POLICIES', 'IMAGES'] },
      },
    ]);
  });
});
