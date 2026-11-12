import ExcelJS from 'exceljs';
import { createTestApp } from './helpers';

/**
 * Admin transactions and payment settings (docs/api/admin.md), October 2026:
 * - SR-A: SePay 2,000,000 confirmed with 2,000,000 (SePay id SP1).
 * - SR-B: SePay 1,000,000 but the confirmation reported 900,000: a mismatch (SP2).
 * - SR-C: paid 500,000 from the customer wallet, 200,000 refunded since.
 * - SR-D: not paid yet.
 * - Two SePay transfers kept for manual handling: one without a code (7/10), one late for SR-A (8/10).
 */
describe('Admin transactions and payment settings (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let admin: { id: string; token: string };
  const ids: Record<string, string> = {};

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const at = (iso: string) => new Date(iso);
  const query = 'from=2026-10-01&to=2026-10-31';
  const get = (path: string, token = admin.token) =>
    t.api().get(`/api/v1/admin${path}`).set(auth(token));

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    admin = await t.signIn('ADMIN', 'admin@stayreco.test');
    const owner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
    const customer = await t.signIn('CUSTOMER', 'khach@mail.test');
    const hotel = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(owner.token))
      .send({
        name: 'An Nhiên Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@hotel.test',
      })
      .expect(201);
    const hotelId = hotel.body.data.id as string;
    ids.hotel = hotelId;

    const book = async (
      code: string,
      o: {
        total: number;
        method: 'SEPAY' | 'WALLET';
        status: 'PAID' | 'UNPAID' | 'PARTIALLY_REFUNDED';
        createdAt: string;
        txn?: string;
        confirmed?: object;
      },
    ) => {
      const b = await t.prisma.booking.create({
        data: {
          customerId: customer.id,
          hotelId,
          checkInDate: at('2026-11-20T00:00:00Z'),
          checkOutDate: at('2026-11-21T00:00:00Z'),
          totalAmount: o.total,
          status: o.status === 'UNPAID' ? 'PENDING' : 'CONFIRMED',
          guestName: 'Khách',
          contactPhone: '0905123456',
          cancelFeePercent: 100,
          commissionRate: 8,
          invoice: {
            create: {
              invoiceNumber: code,
              subtotal: o.total,
              taxAmount: 0,
              discountAmount: 0,
              totalAmount: o.total,
              paymentMethod: o.method,
              paymentStatus: o.status,
              vnpayTxnRef: o.txn ?? null,
              paidAt: o.status === 'UNPAID' ? null : at(o.createdAt),
              createdAt: at(o.createdAt),
            },
          },
        },
        include: { invoice: true },
      });
      if (o.confirmed) {
        await t.prisma.auditLog.create({
          data: {
            action: 'BOOKING_CONFIRMED',
            entityType: 'booking',
            entityId: b.bookingId,
            newValue: JSON.stringify(o.confirmed),
            createdAt: at(o.createdAt),
          },
        });
      }
      ids[code] = b.invoice!.invoiceId;
      ids[`${code}:booking`] = b.bookingId;
      return b;
    };

    await book('SR-A', {
      total: 2000000,
      method: 'SEPAY',
      status: 'PAID',
      createdAt: '2026-10-05T03:00:00Z',
      txn: 'SP1',
      confirmed: { transactionId: 'SP1', amount: 2000000 },
    });
    await book('SR-B', {
      total: 1000000,
      method: 'SEPAY',
      status: 'PAID',
      createdAt: '2026-10-06T03:00:00Z',
      txn: 'SP2',
      confirmed: { transactionId: 'SP2', amount: 900000 },
    });
    const c = await book('SR-C', {
      total: 500000,
      method: 'WALLET',
      status: 'PARTIALLY_REFUNDED',
      createdAt: '2026-10-09T03:00:00Z',
      confirmed: { paidFrom: 'WALLET', amount: 500000 },
    });
    await book('SR-D', {
      total: 700000,
      method: 'SEPAY',
      status: 'UNPAID',
      createdAt: '2026-10-20T03:00:00Z',
    });

    const hotelWallet = await t.prisma.wallet.create({
      data: { ownerType: 'HOTEL', hotelId },
    });
    const customerWallet = await t.prisma.wallet.create({
      data: { ownerType: 'CUSTOMER', customerId: customer.id },
    });
    const move = (
      walletId: string,
      type: 'BOOKING_PAYMENT' | 'REFUND',
      amount: number,
      when: string,
      key: string,
    ) =>
      t.prisma.walletTransaction.create({
        data: {
          walletId,
          type,
          amount,
          balanceAfter: 0,
          bookingId: c.bookingId,
          idempotencyKey: key,
          createdAt: at(when),
        },
      });
    await move(
      customerWallet.walletId,
      'BOOKING_PAYMENT',
      -500000,
      '2026-10-09T03:00:00Z',
      'k1',
    );
    await move(
      hotelWallet.walletId,
      'BOOKING_PAYMENT',
      500000,
      '2026-10-09T03:00:00Z',
      'k2',
    );
    await move(
      hotelWallet.walletId,
      'REFUND',
      -200000,
      '2026-10-12T03:00:00Z',
      'k3',
    );
    await move(
      customerWallet.walletId,
      'REFUND',
      200000,
      '2026-10-12T03:00:00Z',
      'k4',
    );

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
    await t.prisma.auditLog.create({
      data: {
        action: 'SEPAY_TRANSFER_LATE',
        entityType: 'booking',
        entityId: ids['SR-A:booking'],
        newValue: JSON.stringify({
          sepayId: 78,
          reason: 'ALREADY_PAID',
          code: 'SR-A',
          amount: 2000000,
          content: 'SR-A',
        }),
        createdAt: at('2026-10-08T03:00:00Z'),
      },
    });
  });

  afterAll(() => t.app.close());

  const codes = (res: { body: { data: { booking: { code: string } }[] } }) =>
    res.body.data.map((r) => r.booking.code);

  it('lists the payments with what was confirmed and refunded, and flags mismatches', async () => {
    const res = await get(`/transactions?${query}`).expect(200);
    expect(res.body.meta.total).toBe(4);
    expect(codes(res)).toEqual(['SR-D', 'SR-C', 'SR-B', 'SR-A']);
    const row = (code: string) =>
      (res.body.data as { booking: { code: string } }[]).find(
        (r) => r.booking.code === code,
      );
    expect(row('SR-B')).toEqual({
      invoiceId: ids['SR-B'],
      booking: { id: ids['SR-B:booking'], code: 'SR-B' },
      hotel: { id: ids.hotel, name: 'An Nhiên Riverside' },
      method: 'SEPAY',
      status: 'PAID',
      expectedAmount: 1000000,
      confirmedAmount: 900000,
      refunded: 0,
      gatewayTransactionId: 'SP2',
      paidAt: '2026-10-06T03:00:00.000Z',
      createdAt: '2026-10-06T03:00:00.000Z',
      mismatch: true,
    });
    expect(row('SR-C')).toMatchObject({
      method: 'WALLET',
      confirmedAmount: 500000,
      refunded: 200000,
      mismatch: false,
    });
    expect(row('SR-D')).toMatchObject({
      status: 'UNPAID',
      confirmedAmount: null,
      paidAt: null,
      mismatch: false,
    });

    expect(
      codes(await get(`/transactions?${query}&mismatch=true`).expect(200)),
    ).toEqual(['SR-B']);
    expect(
      codes(await get(`/transactions?${query}&status=PAID`).expect(200)),
    ).toEqual(['SR-B', 'SR-A']);
    expect(
      codes(await get(`/transactions?${query}&method=WALLET`).expect(200)),
    ).toEqual(['SR-C']);
    expect(
      codes(await get(`/transactions?${query}&search=sp1`).expect(200)),
    ).toEqual(['SR-A']);
    expect(
      codes(await get(`/transactions?${query}&search=SR-D`).expect(200)),
    ).toEqual(['SR-D']);
    expect(
      (await get('/transactions?from=2026-09-01&to=2026-09-30').expect(200))
        .body.data,
    ).toEqual([]);
    await get('/transactions?from=2026-10-01').expect(400);
  });

  it('shows one transaction with the booking history and every wallet movement', async () => {
    const d = (await get(`/transactions/${ids['SR-C']}`).expect(200)).body.data;
    expect(d).toMatchObject({
      booking: { code: 'SR-C', status: 'CONFIRMED' },
      customer: { fullName: 'khach', email: 'khach@mail.test' },
      expectedAmount: 500000,
      refunded: 200000,
      events: [
        {
          action: 'BOOKING_CONFIRMED',
          details: { paidFrom: 'WALLET', amount: 500000 },
        },
      ],
    });
    // Oldest first; the two rows of a pair share their time, so only the order between pairs is fixed.
    const moves = (
      d.walletMovements as {
        wallet: string;
        type: string;
        amount: number;
        createdAt: string;
      }[]
    ).map(
      (m) => `${m.createdAt.slice(0, 10)} ${m.wallet} ${m.type} ${m.amount}`,
    );
    expect(moves.slice(0, 2).sort()).toEqual([
      '2026-10-09 CUSTOMER BOOKING_PAYMENT -500000',
      '2026-10-09 HOTEL BOOKING_PAYMENT 500000',
    ]);
    expect(moves.slice(2).sort()).toEqual([
      '2026-10-12 CUSTOMER REFUND 200000',
      '2026-10-12 HOTEL REFUND -200000',
    ]);
    await get('/transactions/00000000-0000-4000-8000-000000000000').expect(404);
    await get('/transactions/nope').expect(404);
  });

  it('lists the SePay transfers to refund by hand', async () => {
    const res = (await get(`/transactions/unmatched?${query}`).expect(200))
      .body;
    expect(res.data).toEqual([
      {
        id: expect.any(String),
        at: '2026-10-08T03:00:00.000Z',
        kind: 'LATE',
        reason: 'ALREADY_PAID',
        code: 'SR-A',
        bookingId: ids['SR-A:booking'],
        amount: 2000000,
        content: 'SR-A',
        sepayId: '78',
      },
      {
        id: expect.any(String),
        at: '2026-10-07T03:00:00.000Z',
        kind: 'UNMATCHED',
        reason: 'NO_CODE',
        code: null,
        bookingId: null,
        amount: 150000,
        content: 'chuyen tien',
        sepayId: '77',
      },
    ]);
  });

  it('exports the transactions of the query', async () => {
    const res = await get(`/transactions/export?${query}&status=PAID`)
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-disposition']).toBe(
      'attachment; filename="StayReco_giao-dich_2026-10-01_2026-10-31.xlsx"',
    );
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(res.body as ArrayBuffer);
    const sheet = book.getWorksheet('Giao dịch')!;
    expect(sheet.rowCount).toBe(3);
    expect([
      sheet.getRow(2).getCell(1).value,
      sheet.getRow(2).getCell(6).value,
      sheet.getRow(2).getCell(8).value,
    ]).toEqual(['SR-B', 900000, 'Có']);
  });

  it('shows the gateway settings read-only and checks them', async () => {
    // A simulated payment is not a SePay notification, however recent.
    await t.prisma.auditLog.create({
      data: {
        action: 'BOOKING_CONFIRMED',
        entityType: 'booking',
        entityId: ids['SR-D:booking'],
        newValue: JSON.stringify({ transactionId: 'sim-123', amount: 700000 }),
      },
    });
    const s = (await get('/payment-settings').expect(200)).body.data;
    expect(s).toMatchObject({
      provider: 'SEPAY',
      accountNumber: '****0000',
      webhookKeySet: true,
      // The latest SePay notification: the late transfer of 8/10, not the wallet payment of 9/10.
      lastWebhookAt: '2026-10-08T03:00:00.000Z',
      paymentHoldMinutes: 15,
    });
    expect(s.webhookUrl).toMatch(
      /^https?:\/\/.+\/api\/v1\/payments\/sepay\/webhook$/,
    );
    expect(s.accountNumber).not.toContain('000000');

    const checks = (
      await t
        .api()
        .post('/api/v1/admin/payment-settings/test')
        .set(auth(admin.token))
        .expect(200)
    ).body.data.checks;
    expect(checks).toEqual([
      {
        name: 'ACCOUNT_CONFIGURED',
        ok: false,
        message: 'SEPAY_ACCOUNT_NUMBER is still the demo account',
      },
      { name: 'WEBHOOK_KEY_SET', ok: true, message: null },
      {
        name: 'WEBHOOK_RECEIVED',
        ok: false,
        message: 'No SePay notification in the last 7 days',
      },
    ]);
  });

  it('keeps it all to admins', async () => {
    const manager = await t.signIn('PLATFORM_MANAGER', 'manager@stayreco.test');
    for (const path of [
      '/transactions',
      '/transactions/unmatched',
      '/payment-settings',
    ]) {
      await get(path, manager.token).expect(403);
    }
  });
});
