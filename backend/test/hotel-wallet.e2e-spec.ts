import { createTestApp } from './helpers';

describe('Hotel wallet (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let seq = 0;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const partnerWithHotel = async (email = 'owner@hotel.test') => {
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
      })
      .expect(201);
    return { ...partner, hotelId: res.body.data.id as string };
  };

  /** A paid booking of the hotel written directly, with its invoice `code`. */
  const booking = async (hotelId: string, code: string) => {
    const customer = await t.signIn('CUSTOMER', `guest${++seq}@test.vn`);
    const roomType = await t.prisma.roomType.create({
      data: { hotelId, name: 'Deluxe', maxOccupancy: 2, baseAreaSqm: 30 },
    });
    const b = await t.prisma.booking.create({
      data: {
        customerId: customer.id,
        hotelId,
        checkInDate: new Date('2026-10-10T00:00:00Z'),
        checkOutDate: new Date('2026-10-11T00:00:00Z'),
        items: {
          create: {
            roomTypeId: roomType.roomTypeId,
            numRooms: 1,
            nightlyPrices: [{ date: '2026-10-10', price: 1000000 }],
            subtotal: 1000000,
          },
        },
        totalAmount: 1000000,
        status: 'COMPLETED',
        guestName: 'Khách',
        contactPhone: '0905123456',
        cancelFeePercent: 100,
        commissionRate: 8,
        invoice: {
          create: {
            invoiceNumber: code,
            subtotal: 1000000,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: 1000000,
            paymentMethod: 'SEPAY',
          },
        },
      },
    });
    return b.bookingId;
  };

  const ledger = async (
    hotelId: string,
    rows: {
      type: 'BOOKING_PAYMENT' | 'COMMISSION' | 'SETTLEMENT' | 'PAYOUT';
      amount: number;
      balanceAfter: number;
      at: string;
      bookingId?: string;
    }[],
  ) => {
    const wallet = await t.prisma.wallet.create({
      data: { ownerType: 'HOTEL', hotelId },
    });
    for (const r of rows) {
      await t.prisma.walletTransaction.create({
        data: {
          walletId: wallet.walletId,
          type: r.type,
          amount: r.amount,
          balanceAfter: r.balanceAfter,
          bookingId: r.bookingId,
          description: `${r.type} test`,
          idempotencyKey: `test:${++seq}`,
          createdAt: new Date(r.at),
        },
      });
    }
  };

  const list = (token: string, hotelId: string, query = '') =>
    t
      .api()
      .get(`/api/v1/hotels/${hotelId}/wallet/transactions${query}`)
      .set(auth(token));

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  describe('GET /hotels/:hotelId/wallet/transactions', () => {
    it('lists the movements newest first with the booking code', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const bookingId = await booking(hotelId, 'SR-261010-0001');
      await ledger(hotelId, [
        {
          type: 'BOOKING_PAYMENT',
          amount: 1000000,
          balanceAfter: 1000000,
          at: '2026-10-05T03:00:00Z',
          bookingId,
        },
        {
          type: 'COMMISSION',
          amount: -80000,
          balanceAfter: 920000,
          at: '2026-10-11T05:00:00Z',
          bookingId,
        },
        {
          type: 'PAYOUT',
          amount: -500000,
          balanceAfter: 420000,
          at: '2026-10-20T03:00:00Z',
        },
      ]);

      const res = await list(token, hotelId).expect(200);
      expect(res.body.meta).toEqual({
        page: 1,
        pageSize: 10,
        total: 3,
        totalPages: 1,
      });
      expect(res.body.data).toEqual([
        {
          id: expect.any(String),
          type: 'PAYOUT',
          amount: -500000,
          balanceAfter: 420000,
          description: 'PAYOUT test',
          booking: null,
          createdAt: '2026-10-20T03:00:00.000Z',
        },
        expect.objectContaining({
          type: 'COMMISSION',
          amount: -80000,
          booking: { id: bookingId, code: 'SR-261010-0001' },
        }),
        expect.objectContaining({ type: 'BOOKING_PAYMENT', amount: 1000000 }),
      ]);
    });

    it('filters by repeated type and by Vietnam dates, both inclusive', async () => {
      const { token, hotelId } = await partnerWithHotel();
      await ledger(hotelId, [
        // 23:30 on 30 September in Vietnam.
        {
          type: 'BOOKING_PAYMENT',
          amount: 100,
          balanceAfter: 100,
          at: '2026-09-30T16:30:00Z',
        },
        // 00:30 on 1 October in Vietnam.
        {
          type: 'BOOKING_PAYMENT',
          amount: 200,
          balanceAfter: 300,
          at: '2026-09-30T17:30:00Z',
        },
        {
          type: 'SETTLEMENT',
          amount: -200,
          balanceAfter: 100,
          at: '2026-10-31T16:00:00Z',
        },
        {
          type: 'SETTLEMENT',
          amount: 200,
          balanceAfter: 300,
          at: '2026-10-31T16:00:00Z',
        },
        // 00:00 on 1 November in Vietnam.
        {
          type: 'PAYOUT',
          amount: -50,
          balanceAfter: 250,
          at: '2026-10-31T17:00:00Z',
        },
      ]);
      const amounts = async (query: string) =>
        (
          (await list(token, hotelId, query).expect(200)).body.data as {
            amount: number;
          }[]
        ).map((r) => r.amount);

      expect(await amounts('?from=2026-10-01&to=2026-10-31')).toHaveLength(3);
      expect(await amounts('?from=2026-10-01&to=2026-10-31')).toContain(200);
      expect(await amounts('?to=2026-09-30')).toEqual([100]);
      expect(await amounts('?from=2026-11-01')).toEqual([-50]);
      expect(
        (await amounts('?type=PAYOUT&type=BOOKING_PAYMENT')).sort(),
      ).toEqual([-50, 100, 200].sort());
      expect(await amounts('?type=SETTLEMENT&pageSize=1&page=2')).toHaveLength(
        1,
      );
    });

    it('is empty for a hotel without a wallet and rejects bad filters', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const empty = await list(token, hotelId).expect(200);
      expect(empty.body.data).toEqual([]);
      expect(empty.body.meta.total).toBe(0);

      for (const query of [
        '?type=GIFT',
        '?from=2026-10-31&to=2026-10-01',
        '?from=2026-02-30',
      ]) {
        const res = await list(token, hotelId, query);
        expect([res.status, res.body.code, query]).toEqual([
          400,
          'VALIDATION_ERROR',
          query,
        ]);
      }
    });

    it('is only for the owner: another partner and staff get no access', async () => {
      const { hotelId } = await partnerWithHotel();
      const other = await partnerWithHotel('other@hotel.test');
      await list(other.token, hotelId).expect(404);

      const staff = await t.signInStaff(hotelId, 'desk@hotel.test', [
        'BOOKING',
        'FRONT_DESK',
        'REFUND',
      ]);
      await list(staff.token, hotelId).expect(403);
    });
  });
});
