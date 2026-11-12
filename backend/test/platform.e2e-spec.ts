import ExcelJS from 'exceljs';
import { PLATFORM_WALLET_ID } from '../src/modules/wallets/wallet-ledger';
import { createTestApp } from './helpers';

/**
 * Platform money figures (docs/api/manager.md, "Platform figures"), against hand-computed values. October 2026 is the
 * period (previous: 31 August – 30 September). The ledger is written as the real flows leave it:
 *
 * - A, An Nhiên (Đà Nẵng): SePay 2,000,000 paid 5/10, completed 8/10, commission 8% = 160,000, settled 9/10.
 * - B, An Nhiên: SePay 1,000,000 paid 10/10 after a 200,000 voucher and 100,000 of points; cancelled, 600,000 refunded.
 * - C, Sài Gòn (TP. Hồ Chí Minh): paid 500,000 from the customer wallet 20/10, still confirmed, check-out 25/10.
 * - D, Sài Gòn: SePay 3,000,000 paid 20/09, completed 25/09, commission 240,000 (previous period).
 * - An Nhiên withdrew 1,000,000 (asked 14/10, paid 15/10); one unmatched SePay transfer of 150,000 on 7/10.
 * - A draft hotel in Hà Nội with no bookings.
 */
describe('Platform figures (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let seq = 0;
  let manager: { id: string; token: string };
  let customerId: string;
  const ids: Record<string, string> = {};

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const at = (iso: string) => new Date(iso);
  const query = 'from=2026-10-01&to=2026-10-31';

  const hotel = async (
    email: string,
    name: string,
    city: string,
    status: 'ACTIVE' | 'DRAFT',
  ) => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({ name, address: '1 Lê Lợi', city, email: 'contact@hotel.test' })
      .expect(201);
    const hotelId = res.body.data.id as string;
    await t.prisma.hotel.update({ where: { hotelId }, data: { status } });
    const roomType = await t.prisma.roomType.create({
      data: { hotelId, name: 'Deluxe', maxOccupancy: 2, baseAreaSqm: 30 },
    });
    return { ...partner, hotelId, roomTypeId: roomType.roomTypeId };
  };
  type Hotel = Awaited<ReturnType<typeof hotel>>;

  const book = (
    h: Hotel,
    o: {
      code: string;
      total: number;
      discount?: number;
      checkIn: string;
      checkOut: string;
      status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
      method: 'SEPAY' | 'WALLET';
      paidAt: string;
    },
  ) =>
    t.prisma.booking.create({
      data: {
        customerId,
        hotelId: h.hotelId,
        checkInDate: at(`${o.checkIn}T00:00:00Z`),
        checkOutDate: at(`${o.checkOut}T00:00:00Z`),
        items: {
          create: {
            roomTypeId: h.roomTypeId,
            numRooms: 1,
            nightlyPrices: [
              { date: o.checkIn, price: o.total + (o.discount ?? 0) },
            ],
            subtotal: o.total + (o.discount ?? 0),
          },
        },
        totalAmount: o.total,
        status: o.status,
        guestName: 'Khách',
        contactPhone: '0905123456',
        cancelFeePercent: 40,
        commissionRate: 8,
        createdAt: at(o.paidAt),
        cancelledAt:
          o.status === 'CANCELLED' ? at('2026-10-12T03:00:00Z') : null,
        invoice: {
          create: {
            invoiceNumber: o.code,
            subtotal: o.total + (o.discount ?? 0),
            taxAmount: 0,
            discountAmount: o.discount ?? 0,
            totalAmount: o.total,
            paymentMethod: o.method,
            paymentStatus:
              o.status === 'CANCELLED' ? 'PARTIALLY_REFUNDED' : 'PAID',
            paidAt: at(o.paidAt),
          },
        },
      },
    });

  const move = (
    walletId: string,
    type: 'BOOKING_PAYMENT' | 'COMMISSION' | 'REFUND' | 'SETTLEMENT' | 'PAYOUT',
    amount: number,
    when: string,
    bookingId?: string,
    key = `test:${++seq}`,
  ) =>
    t.prisma.walletTransaction.create({
      data: {
        walletId,
        type,
        amount,
        balanceAfter: 0,
        bookingId,
        idempotencyKey: key,
        createdAt: at(when),
      },
    });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    manager = await t.signIn('PLATFORM_MANAGER', 'manager@stayreco.test');
    customerId = (await t.signIn('CUSTOMER', 'guest@mail.test')).id;

    const annhien = await hotel(
      'annhien@hotel.test',
      'An Nhiên Riverside',
      'Đà Nẵng',
      'ACTIVE',
    );
    const saigon = await hotel(
      'saigon@hotel.test',
      'Sài Gòn Central',
      'TP. Hồ Chí Minh',
      'ACTIVE',
    );
    const draft = await hotel(
      'draft@hotel.test',
      'Nháp Hà Nội',
      'Hà Nội',
      'DRAFT',
    );
    Object.assign(ids, {
      annhien: annhien.hotelId,
      saigon: saigon.hotelId,
      draft: draft.hotelId,
    });

    const a = await book(annhien, {
      code: 'SR-A',
      total: 2000000,
      checkIn: '2026-10-07',
      checkOut: '2026-10-08',
      status: 'COMPLETED',
      method: 'SEPAY',
      paidAt: '2026-10-05T03:00:00Z',
    });
    const b = await book(annhien, {
      code: 'SR-B',
      total: 1000000,
      discount: 300000,
      checkIn: '2026-10-20',
      checkOut: '2026-10-21',
      status: 'CANCELLED',
      method: 'SEPAY',
      paidAt: '2026-10-10T03:00:00Z',
    });
    const c = await book(saigon, {
      code: 'SR-C',
      total: 500000,
      checkIn: '2026-10-24',
      checkOut: '2026-10-25',
      status: 'CONFIRMED',
      method: 'WALLET',
      paidAt: '2026-10-20T03:00:00Z',
    });
    const d = await book(saigon, {
      code: 'SR-D',
      total: 3000000,
      checkIn: '2026-09-24',
      checkOut: '2026-09-25',
      status: 'COMPLETED',
      method: 'SEPAY',
      paidAt: '2026-09-20T03:00:00Z',
    });
    ids.a = a.bookingId;
    ids.c = c.bookingId;
    // The voucher part of B's discount; the other 100,000 were points.
    await t.prisma.auditLog.create({
      data: {
        action: 'BOOKING_DISCOUNT_APPLIED',
        newValue: JSON.stringify({
          bookingId: b.bookingId,
          kind: 'VOUCHER',
          amount: 200000,
        }),
        createdAt: at('2026-10-10T02:55:00Z'),
      },
    });

    const h1 = await t.prisma.wallet.create({
      data: {
        ownerType: 'HOTEL',
        hotelId: annhien.hotelId,
        balancePending: 400000,
        balanceAvailable: 840000,
      },
    });
    const h2 = await t.prisma.wallet.create({
      data: {
        ownerType: 'HOTEL',
        hotelId: saigon.hotelId,
        balancePending: 3260000,
      },
    });
    const cw = await t.prisma.wallet.create({
      data: { ownerType: 'CUSTOMER', customerId, balanceAvailable: 100000 },
    });
    await t.prisma.wallet.update({
      where: { walletId: PLATFORM_WALLET_ID },
      data: { balanceAvailable: 400000 },
    });

    // A: paid, commission at check-out, settled the next day.
    await move(
      h1.walletId,
      'BOOKING_PAYMENT',
      2000000,
      '2026-10-05T03:00:00Z',
      a.bookingId,
    );
    await move(
      h1.walletId,
      'COMMISSION',
      -160000,
      '2026-10-08T05:00:00Z',
      a.bookingId,
    );
    await move(
      PLATFORM_WALLET_ID,
      'COMMISSION',
      160000,
      '2026-10-08T05:00:00Z',
      a.bookingId,
      `commission:${a.bookingId}:platform`,
    );
    await move(
      h1.walletId,
      'SETTLEMENT',
      -1840000,
      '2026-10-09T05:00:00Z',
      a.bookingId,
    );
    await move(
      h1.walletId,
      'SETTLEMENT',
      1840000,
      '2026-10-09T05:00:00Z',
      a.bookingId,
    );
    // B: paid, then 600,000 refunded to the customer wallet.
    await move(
      h1.walletId,
      'BOOKING_PAYMENT',
      1000000,
      '2026-10-10T03:00:00Z',
      b.bookingId,
    );
    await move(
      h1.walletId,
      'REFUND',
      -600000,
      '2026-10-12T03:00:00Z',
      b.bookingId,
    );
    await move(
      cw.walletId,
      'REFUND',
      600000,
      '2026-10-12T03:00:00Z',
      b.bookingId,
    );
    // C: paid from the customer wallet.
    await move(
      cw.walletId,
      'BOOKING_PAYMENT',
      -500000,
      '2026-10-20T03:00:00Z',
      c.bookingId,
    );
    await move(
      h2.walletId,
      'BOOKING_PAYMENT',
      500000,
      '2026-10-20T03:00:00Z',
      c.bookingId,
    );
    // D: September.
    await move(
      h2.walletId,
      'BOOKING_PAYMENT',
      3000000,
      '2026-09-20T03:00:00Z',
      d.bookingId,
    );
    await move(
      h2.walletId,
      'COMMISSION',
      -240000,
      '2026-09-25T05:00:00Z',
      d.bookingId,
    );
    await move(
      PLATFORM_WALLET_ID,
      'COMMISSION',
      240000,
      '2026-09-25T05:00:00Z',
      d.bookingId,
      `commission:${d.bookingId}:platform`,
    );
    // The withdrawal of An Nhiên, paid.
    const payout = await move(
      h1.walletId,
      'PAYOUT',
      -1000000,
      '2026-10-14T03:00:00Z',
      undefined,
      'payout:test',
    );
    for (const [action, when] of [
      ['PAYOUT_REQUESTED', '2026-10-14T03:00:00Z'],
      ['PAYOUT_PAID', '2026-10-15T03:00:00Z'],
    ]) {
      await t.prisma.auditLog.create({
        data: {
          action,
          entityType: 'wallet_transaction',
          entityId: payout.walletTransactionId,
          createdAt: at(when),
        },
      });
    }
    await t.prisma.auditLog.create({
      data: {
        action: 'SEPAY_TRANSFER_UNMATCHED',
        entityType: 'sepay_transaction',
        newValue: JSON.stringify({
          sepayId: 77,
          reason: 'NO_CODE',
          code: null,
          amount: 150000,
          content: 'chuyen tien',
        }),
        createdAt: at('2026-10-07T03:00:00Z'),
      },
    });
  });

  afterAll(() => t.app.close());

  const get = (path: string) =>
    t.api().get(`/api/v1/platform${path}`).set(auth(manager.token)).expect(200);

  it('adds up the platform revenue of the period and of the one before', async () => {
    const r = (await get(`/stats/revenue?${query}&granularity=week`)).body.data;
    expect(r.period).toEqual({
      from: '2026-10-01',
      to: '2026-10-31',
      days: 31,
    });
    expect(r.previous).toEqual({
      from: '2026-08-31',
      to: '2026-09-30',
      days: 31,
    });
    expect(r.totals).toEqual({
      gmv: { value: 3500000, previous: 3000000, deltaPercent: 16.7 },
      discounts: { value: 200000, previous: 0, deltaPercent: null },
      pointsUsed: { value: 100000, previous: 0, deltaPercent: null },
      refunds: { value: 600000, previous: 0, deltaPercent: null },
      commission: { value: 160000, previous: 240000, deltaPercent: -33.3 },
      platformDebits: { value: 0, previous: 0, deltaPercent: null },
      platformRevenue: { value: 160000, previous: 240000, deltaPercent: -33.3 },
      bookings: { value: 3, previous: 1, deltaPercent: 200 },
    });
    expect(r.granularity).toBe('week');
    expect(r.series).toEqual([
      {
        periodStart: '2026-10-01',
        days: 4,
        gmv: 0,
        commission: 0,
        bookings: 0,
      },
      {
        periodStart: '2026-10-05',
        days: 7,
        gmv: 3000000,
        commission: 160000,
        bookings: 2,
      },
      {
        periodStart: '2026-10-12',
        days: 7,
        gmv: 0,
        commission: 0,
        bookings: 0,
      },
      {
        periodStart: '2026-10-19',
        days: 7,
        gmv: 500000,
        commission: 0,
        bookings: 1,
      },
      {
        periodStart: '2026-10-26',
        days: 6,
        gmv: 0,
        commission: 0,
        bookings: 0,
      },
    ]);
    expect(r.byRegion).toEqual([
      {
        region: 'NORTH',
        hotels: 0,
        gmv: { value: 0, previous: 0, deltaPercent: null },
        commission: { value: 0, previous: 0, deltaPercent: null },
        bookings: { value: 0, previous: 0, deltaPercent: null },
      },
      {
        region: 'CENTRAL',
        hotels: 1,
        gmv: { value: 3000000, previous: 0, deltaPercent: null },
        commission: { value: 160000, previous: 0, deltaPercent: null },
        bookings: { value: 2, previous: 0, deltaPercent: null },
      },
      {
        region: 'SOUTH',
        hotels: 1,
        gmv: { value: 500000, previous: 3000000, deltaPercent: -83.3 },
        commission: { value: 0, previous: 240000, deltaPercent: -100 },
        bookings: { value: 1, previous: 1, deltaPercent: 0 },
      },
      {
        region: 'OTHER',
        hotels: 0,
        gmv: { value: 0, previous: 0, deltaPercent: null },
        commission: { value: 0, previous: 0, deltaPercent: null },
        bookings: { value: 0, previous: 0, deltaPercent: null },
      },
    ]);
    // Default period and granularity: the last 30 days, by day.
    const recent = (await get('/stats/revenue')).body.data;
    expect([
      recent.period.days,
      recent.granularity,
      recent.series.length,
    ]).toEqual([30, 'day', 30]);
  });

  it('lists the hotels past the draft stage, filtered and sorted', async () => {
    const rows = (await get(`/stats/revenue/hotels?${query}`)).body;
    expect(rows.meta).toEqual({
      page: 1,
      pageSize: 10,
      total: 2,
      totalPages: 1,
    });
    expect(rows.data).toEqual([
      {
        hotel: {
          id: ids.annhien,
          name: 'An Nhiên Riverside',
          city: 'Đà Nẵng',
          region: 'CENTRAL',
        },
        partner: { id: expect.any(String), name: 'Partner Co' },
        bookings: 2,
        gmv: 3000000,
        commission: 160000,
        refunds: 600000,
        cancellationRate: 50,
      },
      {
        hotel: {
          id: ids.saigon,
          name: 'Sài Gòn Central',
          city: 'TP. Hồ Chí Minh',
          region: 'SOUTH',
        },
        partner: { id: expect.any(String), name: 'Partner Co' },
        bookings: 1,
        gmv: 500000,
        commission: 0,
        refunds: 0,
        cancellationRate: 0,
      },
    ]);
    const ids_ = (res: { body: { data: { hotel: { id: string } }[] } }) =>
      res.body.data.map((r) => r.hotel.id);
    expect(
      ids_(await get(`/stats/revenue/hotels?${query}&region=SOUTH`)),
    ).toEqual([ids.saigon]);
    expect(
      ids_(await get(`/stats/revenue/hotels?${query}&search=nhien`)),
    ).toEqual([ids.annhien]);
    expect(
      ids_(await get(`/stats/revenue/hotels?${query}&sort=name-asc`)),
    ).toEqual([ids.annhien, ids.saigon]);
    expect(
      ids_(
        await get(
          `/stats/revenue/hotels?${query}&sort=gmv-desc&pageSize=1&page=2`,
        ),
      ),
    ).toEqual([ids.saigon]);
  });

  it('shows one hotel with its wallet and withdrawals', async () => {
    const h = (await get(`/hotels/${ids.annhien}/revenue?${query}`)).body.data;
    expect(h).toMatchObject({
      hotel: { id: ids.annhien, region: 'CENTRAL', status: 'ACTIVE' },
      partner: { name: 'Partner Co', status: 'PENDING', commissionRate: 8 },
      bookings: { value: 2, previous: 0 },
      gmv: { value: 3000000, previous: 0 },
      commission: { value: 160000, previous: 0 },
      refunds: { value: 600000, previous: 0 },
      cancellationRate: { value: 50, previous: null, deltaPoints: null },
      wallet: { available: 840000, pending: 400000, reserved: 0 },
      payouts: {
        paidCount: 1,
        paidAmount: 1000000,
        pendingCount: 0,
        pendingAmount: 0,
      },
    });
    const ledger = (
      await get(`/hotels/${ids.annhien}/wallet/transactions?type=PAYOUT`)
    ).body.data;
    expect(ledger).toMatchObject([{ type: 'PAYOUT', amount: -1000000 }]);
    // A draft is still found by id; an unknown hotel is not.
    await get(`/hotels/${ids.draft}/revenue?${query}`);
    for (const path of [
      '/hotels/00000000-0000-4000-8000-000000000000/revenue',
      '/hotels/nope/wallet/transactions',
    ]) {
      const res = await t
        .api()
        .get(`/api/v1/platform${path}`)
        .set(auth(manager.token))
        .expect(404);
      expect(res.body.code).toBe('HOTEL_NOT_FOUND');
    }
  });

  it('lists the commission of each stay ending in the period, charged or expected', async () => {
    const res = (await get(`/commissions?${query}`)).body;
    expect(res.data).toEqual([
      {
        booking: { id: ids.c, code: 'SR-C' },
        hotel: { id: ids.saigon, name: 'Sài Gòn Central' },
        checkOutDate: '2026-10-25',
        total: 500000,
        rate: 8,
        amount: 40000,
        status: 'EXPECTED',
        chargedAt: null,
      },
      {
        booking: { id: ids.a, code: 'SR-A' },
        hotel: { id: ids.annhien, name: 'An Nhiên Riverside' },
        checkOutDate: '2026-10-08',
        total: 2000000,
        rate: 8,
        amount: 160000,
        status: 'CHARGED',
        chargedAt: '2026-10-08T05:00:00.000Z',
      },
    ]);
    expect(
      (await get(`/commissions?${query}&status=CHARGED`)).body.data,
    ).toHaveLength(1);
    expect(
      (await get(`/commissions?${query}&search=sr-c`)).body.data,
    ).toMatchObject([{ booking: { code: 'SR-C' } }]);
    expect(
      (await get(`/commissions?${query}&hotelId=${ids.annhien}`)).body.meta
        .total,
    ).toBe(1);
  });

  it('follows the SePay money through the ledger and reconciles the wallets with the bank', async () => {
    const c = (await get(`/cashflow?${query}`)).body.data;
    expect(c).toMatchObject({
      received: { sepay: 3000000, transfers: 2, wallet: 500000 },
      // B's 400,000 kept as the cancellation fee is still pending (not settled in this fixture).
      split: {
        refunded: 600000,
        commission: 160000,
        hotelSettled: 1840000,
        hotelPending: 400000,
        difference: 0,
      },
      unmatched: { count: 1, amount: 150000 },
      payoutsPaid: { count: 1, amount: 1000000 },
      // 6,000,000 received through SePay − 1,000,000 paid out = every wallet: 1,240,000 + 3,260,000 + 100,000 + 400,000.
      reconciliation: {
        bankExpected: 5000000,
        walletTotal: 5000000,
        difference: 0,
      },
    });

    // A movement missing from the ledger shows up as a difference.
    await t.prisma.walletTransaction.deleteMany({
      where: { type: 'SETTLEMENT', amount: { gt: 0 } },
    });
    const broken = (await get(`/cashflow?${query}`)).body.data;
    expect(broken.split.difference).toBe(1840000);
  });

  it('exports each report as a workbook', async () => {
    const download = async (report: string) => {
      const res = await t
        .api()
        .get(`/api/v1/platform/stats/export?${query}&report=${report}`)
        .set(auth(manager.token))
        .buffer(true)
        .parse((response, done) => {
          const chunks: Buffer[] = [];
          response.on('data', (chunk: Buffer) => chunks.push(chunk));
          response.on('end', () => done(null, Buffer.concat(chunks)));
        })
        .expect(200);
      expect(res.headers['content-disposition']).toBe(
        `attachment; filename="StayReco_${report}_2026-10-01_2026-10-31.xlsx"`,
      );
      const book = new ExcelJS.Workbook();
      await book.xlsx.load(res.body as ArrayBuffer);
      return book;
    };

    const revenue = await download('revenue');
    expect(revenue.worksheets.map((s) => s.name)).toEqual([
      'Tổng quan',
      'Theo thời gian',
      'Theo vùng',
      'Theo khách sạn',
    ]);
    expect(revenue.getWorksheet('Tổng quan')!.getRow(2).values).toEqual([
      undefined,
      'GMV (khách đã trả)',
      3500000,
      3000000,
      16.7,
    ]);
    expect(revenue.getWorksheet('Theo khách sạn')!.rowCount).toBe(3);

    const commissions = await download('commissions');
    const sheet = commissions.getWorksheet('Hoa hồng')!;
    expect(sheet.getRow(2).getCell(1).value).toBe('SR-C');
    expect(sheet.getRow(5).getCell(6).value).toBe(160000);

    const cashflow = await download('cashflow');
    expect(cashflow.getWorksheet('Dòng tiền')!.getRow(9).values).toEqual([
      undefined,
      'Chênh lệch (phải bằng 0)',
      0,
    ]);
    expect(
      cashflow.getWorksheet('Chuyển khoản lệch')!.getRow(2).getCell(5).value,
    ).toBe(150000);
  });

  it('keeps the figures to platform managers and checks the period', async () => {
    const partner = await t.signIn('HOTEL_PARTNER', 'other@hotel.test');
    for (const path of [
      '/stats/revenue',
      '/stats/revenue/hotels',
      '/commissions',
      '/cashflow',
    ]) {
      await t
        .api()
        .get(`/api/v1/platform${path}`)
        .set(auth(partner.token))
        .expect(403);
    }
    for (const bad of [
      'from=2026-10-01',
      'from=2026-10-31&to=2026-10-01',
      'from=2025-01-01&to=2026-10-31',
    ]) {
      await t
        .api()
        .get(`/api/v1/platform/cashflow?${bad}`)
        .set(auth(manager.token))
        .expect(400);
    }
    await t
      .api()
      .get(`/api/v1/platform/stats/export?${query}&report=nope`)
      .set(auth(manager.token))
      .expect(400);
  });
});
