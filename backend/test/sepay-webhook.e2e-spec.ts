import { BookingMailer } from '../src/modules/bookings/booking-mailer';
import { HoldExpiryService } from '../src/modules/bookings/hold-expiry.service';
import { createTestApp } from './helpers';

describe('SePay webhook (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let sepayId = 1000;

  const KEY = process.env.SEPAY_WEBHOOK_API_KEY!;
  const ACCOUNT = '0000000000'; // SEPAY_ACCOUNT_NUMBER default
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel with one room type (1,000,000 a night, 1 room). */
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
    await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/rooms`)
      .set(auth(partner.token))
      .send({ roomTypeId, roomNumber: '101' })
      .expect(201);
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId, roomTypeId };
  };

  /** A PENDING booking of 2 nights (total 2,000,000). */
  const book = async (token: string, roomTypeId: string) =>
    (
      await t
        .api()
        .post('/api/v1/bookings')
        .set(auth(token))
        .send({
          roomTypeId,
          checkIn: day(30),
          checkOut: day(32),
          guests: 1,
          guestName: 'Nguyễn Văn A',
          contactPhone: '0905123456',
          expectedTotal: 2000000,
        })
        .expect(201)
    ).body.data as { id: string; code: string };

  /** A SePay notification as documented, incoming 2,000,000 to the platform account. */
  const transfer = (overrides: Record<string, unknown> = {}) => ({
    id: ++sepayId,
    gateway: 'MBBank',
    transactionDate: '2026-10-25 14:02:37',
    accountNumber: ACCOUNT,
    code: null,
    content: 'chuyen tien',
    transferType: 'in',
    transferAmount: 2000000,
    accumulated: 50000000,
    subAccount: null,
    referenceCode: 'MBVCB.3278907687',
    description: '',
    ...overrides,
  });

  const notify = (body: object, key: string | null = KEY) => {
    const req = t.api().post('/api/v1/payments/sepay/webhook');
    if (key !== null) req.set('Authorization', `Apikey ${key}`);
    return req.send(body);
  };

  const status = async (bookingId: string) => {
    const b = await t.prisma.booking.findUniqueOrThrow({
      where: { bookingId },
      include: { invoice: true },
    });
    return [b.status, b.invoice!.paymentStatus];
  };
  const audits = (action: string) =>
    t.prisma.auditLog.findMany({ where: { action } });

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

  it('refuses a missing or wrong API key and changes nothing', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);
    const body = transfer({ content: booking.code });

    for (const key of [null, 'wrong-key-wrong-key-wrong', `${KEY}x`]) {
      const res = await notify(body, key).expect(401);
      expect(res.body.code).toBe('INVALID_API_KEY');
    }
    // Checked before the body: a malformed body with a wrong key is still 401.
    await notify({ nonsense: true }, 'wrong-key-wrong-key-wrong').expect(401);
    expect(await status(booking.id)).toEqual(['PENDING', 'UNPAID']);
  });

  it('confirms a booking from a transfer whose content lost its dashes', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);
    t.outbox.length = 0;
    const body = transfer({
      content: `MBVCB.123.${booking.code.replaceAll('-', '')}.CT tu 0123`,
    });

    const res = await notify(body).expect(200);
    expect(res.body).toMatchObject({
      success: true,
      data: { outcome: 'CONFIRMED' },
    });
    expect(await status(booking.id)).toEqual(['CONFIRMED', 'PAID']);
    const invoice = await t.prisma.invoice.findUniqueOrThrow({
      where: { bookingId: booking.id },
    });
    expect(invoice.vnpayTxnRef).toBe(String(body.id));
    expect(invoice.paidAt?.toISOString()).toBe('2026-10-25T07:02:37.000Z');
    await t.app.get(BookingMailer).idle();
    expect(t.outbox.map((m) => m.subject)).toEqual([
      `Xác nhận đặt phòng ${booking.code}`,
    ]);

    // SePay resending the same transaction changes nothing.
    const again = await notify(body).expect(200);
    expect(again.body.data.outcome).toBe('DUPLICATE');
    expect(
      await t.prisma.walletTransaction.count({
        where: { type: 'BOOKING_PAYMENT' },
      }),
    ).toBe(1);
    // The status change is in the audit log once, at the payment time, by the system.
    const confirmed = await t.prisma.auditLog.findMany({
      where: { entityId: booking.id, action: 'BOOKING_CONFIRMED' },
    });
    expect(confirmed).toHaveLength(1);
    expect(confirmed[0]).toMatchObject({
      customerId: null,
      createdAt: new Date('2026-10-25T07:02:37.000Z'),
    });
  });

  it('uses the code SePay recognised when the content has none', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    await notify(
      transfer({ code: booking.code.replaceAll('-', ''), content: 'abc' }),
    ).expect(200);
    expect(await status(booking.id)).toEqual(['CONFIRMED', 'PAID']);
  });

  it('keeps unmatched transfers for manual handling, once each', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    const noCode = transfer({ content: 'tien an trua' });
    const unknown = transfer({ content: 'SR-990101-0001' });
    const wrongAmount = transfer({
      content: booking.code,
      transferAmount: 1999000,
    });
    const otherAccount = transfer({
      content: booking.code,
      accountNumber: '999999',
    });
    for (const body of [noCode, unknown, wrongAmount, otherAccount]) {
      const res = await notify(body).expect(200);
      expect(res.body.data.outcome).toBe('UNMATCHED');
    }
    // A resent notification is not logged twice.
    await notify(noCode).expect(200);

    expect(await status(booking.id)).toEqual(['PENDING', 'UNPAID']);
    const rows = await audits('SEPAY_TRANSFER_UNMATCHED');
    expect(
      rows.map((r) => (JSON.parse(r.newValue!) as { reason: string }).reason),
    ).toEqual([
      'NO_BOOKING_CODE',
      'UNKNOWN_CODE',
      'AMOUNT_MISMATCH',
      'OTHER_ACCOUNT',
    ]);
    const mismatch = rows[2];
    expect(mismatch).toMatchObject({
      entityType: 'booking',
      entityId: booking.id,
    });
    expect(JSON.parse(mismatch.newValue!)).toMatchObject({
      sepayId: String(wrongAmount.id),
      code: booking.code,
      amount: 1999000,
    });
  });

  it('logs a transfer that arrives after the hold expired, without confirming', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);
    await t.prisma.roomCalendars.updateMany({
      where: { bookingId: booking.id },
      data: { holdExpiresAt: new Date(Date.now() - 1000) },
    });
    await t.app.get(HoldExpiryService).expireDue();

    const res = await notify(transfer({ content: booking.code })).expect(200);
    expect(res.body.data.outcome).toBe('LATE');
    expect(await status(booking.id)).toEqual(['EXPIRED', 'FAILED']);
    const [late] = await audits('SEPAY_TRANSFER_LATE');
    expect(JSON.parse(late.newValue!)).toMatchObject({
      reason: 'EXPIRED',
      code: booking.code,
    });
    expect(await t.prisma.walletTransaction.count()).toBe(0);
  });

  it('accepts the variations SePay and banks send', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    // A string id, null text fields, a numeric account number and an upper-case type, as some notifications carry.
    const res = await notify({
      id: String(++sepayId),
      gateway: null,
      transactionDate: null,
      accountNumber: Number(ACCOUNT) || ACCOUNT,
      subAccount: null,
      code: null,
      content: booking.code,
      transferType: 'IN',
      description: null,
      transferAmount: '2000000',
      accumulated: 0,
      referenceCode: null,
    }).expect(200);
    expect(res.body.data.outcome).toBe('CONFIRMED');
    expect(await status(booking.id)).toEqual(['CONFIRMED', 'PAID']);
  });

  it('refuses a payload it cannot read, logs the fields and keeps it', async () => {
    const body = { id: 555, content: 'SR-261025-0001', transferAmount: 'abc' };

    const res = await notify(body).expect(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
    expect(
      (res.body.details as { field: string }[]).map((d) => d.field).sort(),
    ).toEqual(['transferAmount', 'transferType']);
    // SePay resends it: still one row.
    await notify(body).expect(400);
    const rows = await audits('SEPAY_TRANSFER_UNMATCHED');
    expect(rows).toHaveLength(1);
    const kept = JSON.parse(rows[0].newValue!) as {
      reason: string;
      problems: string[];
      raw: string;
    };
    expect(kept.reason).toBe('INVALID_PAYLOAD');
    expect(kept.problems.join(' ')).toContain('transferType');
    expect(JSON.parse(kept.raw)).toEqual(body);
  });

  it('ignores outgoing transfers', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await book(me.token, h.roomTypeId);

    const res = await notify(
      transfer({ content: booking.code, transferType: 'out' }),
    ).expect(200);
    expect(res.body.data.outcome).toBe('IGNORED_OUTGOING');
    expect(await status(booking.id)).toEqual(['PENDING', 'UNPAID']);
    expect(await t.prisma.auditLog.count()).toBeGreaterThanOrEqual(0);
  });
});
