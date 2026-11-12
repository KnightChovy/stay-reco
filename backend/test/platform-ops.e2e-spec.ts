import { FILES, createTestApp } from './helpers';

/**
 * The platform manager's operations (docs/api/manager.md: dashboard, hotels, compliance cases), October 2026 against
 * September 2026:
 * - An Nhiên (partner A, approved, joined 2/10): first verification approved 3/10, 3 rooms, two bookings paid in
 *   October (one cancelled since), reviews 4 and 5 (and a hidden 1); a content report waits on one of them.
 * - Biển Xanh (partner B, approved, joined 10/9, Nha Trang): approved 15/9, 1 room, one booking paid in October and one in
 *   September, review 3, a withdrawal of 500,000 waiting since 1/10.
 * - Sài Gòn Central (partner A): verification pending since 25/10.
 * - A draft of partner C (pending, joined 20/10), never listed.
 * - Customers: one joined 5/10, one 5/9.
 */
describe('Platform operations (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let seq = 0;
  let manager: { id: string; token: string };
  const ids: Record<string, string> = {};

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const at = (iso: string) => new Date(iso);
  const query = 'from=2026-10-01&to=2026-10-31';

  const partner = async (
    email: string,
    name: string,
    status: 'APPROVED' | 'PENDING',
    joined: string,
  ) => {
    const p = await t.signIn('HOTEL_PARTNER', email);
    await t.prisma.hotelPartner.update({
      where: { hotelPartnerId: p.id },
      data: { partnerName: name, status, createdAt: at(joined) },
    });
    return p;
  };

  const hotel = async (
    owner: { token: string },
    name: string,
    city: string,
    status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'DRAFT',
    rooms = 0,
  ) => {
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(owner.token))
      .send({ name, address: '1 Lê Lợi', city, email: 'contact@hotel.test' })
      .expect(201);
    const hotelId = res.body.data.id as string;
    await t.prisma.hotel.update({ where: { hotelId }, data: { status } });
    const roomType = await t.prisma.roomType.create({
      data: { hotelId, name: 'Deluxe', maxOccupancy: 2, baseAreaSqm: 30 },
    });
    for (let i = 0; i < rooms; i++) {
      await t.prisma.room.create({
        data: { roomTypeId: roomType.roomTypeId, roomNumber: `${100 + i}` },
      });
    }
    return { hotelId, roomTypeId: roomType.roomTypeId };
  };

  const verification = (
    hotelId: string,
    status: 'APPROVED' | 'PENDING',
    when: string,
  ) =>
    t.prisma.hotelVerificationRequest.create({
      data: {
        hotelId,
        requestType: 'INITIAL',
        status,
        createdAt: at(when),
        reviewedAt: status === 'APPROVED' ? at(when) : null,
      },
    });

  /** A booking; paid (with an invoice) when `paidAt` is given, otherwise only there to carry a review. */
  const book = async (
    hotelId: string,
    customerId: string,
    o: { total: number; status: 'COMPLETED' | 'CANCELLED'; paidAt?: string },
  ) =>
    t.prisma.booking.create({
      data: {
        customerId,
        hotelId,
        checkInDate: at('2026-10-10T00:00:00Z'),
        checkOutDate: at('2026-10-11T00:00:00Z'),
        totalAmount: o.total,
        status: o.status,
        guestName: 'Khách',
        contactPhone: '0905123456',
        cancelFeePercent: 100,
        commissionRate: 8,
        ...(o.paidAt === undefined
          ? {}
          : {
              invoice: {
                create: {
                  invoiceNumber: `SR-OPS-${++seq}`,
                  subtotal: o.total,
                  taxAmount: 0,
                  discountAmount: 0,
                  totalAmount: o.total,
                  paymentMethod: 'SEPAY',
                  paymentStatus: 'PAID',
                  paidAt: at(o.paidAt),
                },
              },
            }),
      },
    });

  const review = async (
    hotelId: string,
    customerId: string,
    rating: number,
    isVisible = true,
  ) => {
    const b = await book(hotelId, customerId, {
      total: 1,
      status: 'COMPLETED',
    });
    return t.prisma.review.create({
      data: {
        customerId,
        hotelId,
        bookingId: b.bookingId,
        overallRating: rating,
        content: 'Tốt',
        isVisible,
      },
    });
  };

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    manager = await t.signIn('PLATFORM_MANAGER', 'manager@stayreco.test');
    const c1 = await t.signIn('CUSTOMER', 'c1@mail.test');
    const c2 = await t.signIn('CUSTOMER', 'c2@mail.test');
    await t.prisma.userAccount.update({
      where: { userAccountId: c1.id },
      data: { createdAt: at('2026-10-05T03:00:00Z') },
    });
    await t.prisma.userAccount.update({
      where: { userAccountId: c2.id },
      data: { createdAt: at('2026-09-05T03:00:00Z') },
    });

    const a = await partner(
      'a@hotel.test',
      'Công ty An Nhiên',
      'APPROVED',
      '2026-10-02T03:00:00Z',
    );
    const b = await partner(
      'b@hotel.test',
      'Biển Xanh JSC',
      'APPROVED',
      '2026-09-10T03:00:00Z',
    );
    const c = await partner(
      'c@hotel.test',
      'Gamma',
      'PENDING',
      '2026-10-20T03:00:00Z',
    );
    Object.assign(ids, { partnerA: a.id, partnerB: b.id });

    const h1 = await hotel(a, 'An Nhiên Riverside', 'Đà Nẵng', 'ACTIVE', 3);
    const h2 = await hotel(b, 'Biển Xanh', 'Nha Trang', 'ACTIVE', 1);
    const h3 = await hotel(
      a,
      'Sài Gòn Central',
      'TP. Hồ Chí Minh',
      'PENDING_VERIFICATION',
    );
    await hotel(c, 'Nháp', 'Hà Nội', 'DRAFT');
    Object.assign(ids, { h1: h1.hotelId, h2: h2.hotelId, h3: h3.hotelId });
    await verification(h1.hotelId, 'APPROVED', '2026-10-03T03:00:00Z');
    await verification(h2.hotelId, 'APPROVED', '2026-09-15T03:00:00Z');
    await verification(h3.hotelId, 'PENDING', '2026-10-25T03:00:00Z');

    await book(h1.hotelId, c1.id, {
      total: 2000000,
      status: 'COMPLETED',
      paidAt: '2026-10-06T03:00:00Z',
    });
    await book(h1.hotelId, c1.id, {
      total: 1000000,
      status: 'CANCELLED',
      paidAt: '2026-10-07T03:00:00Z',
    });
    await book(h2.hotelId, c2.id, {
      total: 1000000,
      status: 'COMPLETED',
      paidAt: '2026-10-08T03:00:00Z',
    });
    await book(h2.hotelId, c2.id, {
      total: 2000000,
      status: 'COMPLETED',
      paidAt: '2026-09-08T03:00:00Z',
    });

    const r1 = await review(h1.hotelId, c1.id, 4);
    await review(h1.hotelId, c1.id, 5);
    await review(h1.hotelId, c1.id, 1, false);
    await review(h2.hotelId, c2.id, 3);
    await t.prisma.contentReport.create({
      data: {
        reporterId: c2.id,
        reviewId: r1.reviewId,
        reason: 'OFFENSIVE',
        createdAt: at('2026-10-26T03:00:00Z'),
      },
    });

    const wallet = await t.prisma.wallet.create({
      data: {
        ownerType: 'HOTEL',
        hotelId: h2.hotelId,
        balanceReserved: 500000,
      },
    });
    const payout = await t.prisma.walletTransaction.create({
      data: {
        walletId: wallet.walletId,
        type: 'PAYOUT',
        amount: -500000,
        balanceAfter: 0,
        idempotencyKey: 'payout:ops',
        createdAt: at('2026-10-01T03:00:00Z'),
      },
    });
    await t.prisma.auditLog.create({
      data: {
        action: 'PAYOUT_REQUESTED',
        entityType: 'wallet_transaction',
        entityId: payout.walletTransactionId,
        createdAt: at('2026-10-01T03:00:00Z'),
      },
    });
  });

  afterAll(() => t.app.close());

  const api = (token = manager.token) => ({
    get: (path: string) => t.api().get(`/api/v1${path}`).set(auth(token)),
    post: (path: string, body?: object) =>
      t.api().post(`/api/v1${path}`).set(auth(token)).send(body),
    patch: (path: string, body: object) =>
      t.api().patch(`/api/v1${path}`).set(auth(token)).send(body),
  });

  /** Uploads one evidence file and opens a case about An Nhiên. */
  const openCase = async (severity = 'CRITICAL') => {
    const upload = await t
      .api()
      .post('/api/v1/policy-violations/evidence')
      .set(auth(manager.token))
      .attach('file', FILES.pdf, 'anh-chup.pdf')
      .expect(201);
    const res = await api()
      .post('/policy-violations', {
        partnerId: ids.partnerA,
        hotelId: ids.h1,
        type: 'FAKE_LISTING',
        severity,
        description: 'Ảnh phòng không đúng thực tế',
        evidence: [upload.body.data.fileId],
      })
      .expect(201);
    return res.body.data as {
      id: string;
      evidence: { index: number; fileName: string }[];
    };
  };

  it('fills the manager dashboard and its action queue', async () => {
    const opened = await openCase();
    await api()
      .post(`/policy-violations/${opened.id}/suspension-request`, {
        reason: 'Vi phạm nhiều lần',
      })
      .expect(201);

    const o = (await api().get(`/platform/stats/overview?${query}`).expect(200))
      .body.data;
    expect(o).toMatchObject({
      period: { from: '2026-10-01', to: '2026-10-31', days: 31 },
      partners: {
        active: 2,
        new: { value: 2, previous: 1, deltaPercent: 100 },
      },
      hotels: { active: 2, new: { value: 1, previous: 1, deltaPercent: 0 } },
      customers: { total: 2, new: { value: 1, previous: 1, deltaPercent: 0 } },
      bookings: { value: 3, previous: 1, deltaPercent: 200 },
      gmv: { value: 4000000, previous: 2000000, deltaPercent: 100 },
      commission: { value: 0, previous: 0, deltaPercent: null },
      queue: {
        verifications: {
          pending: 1,
          oldestSubmittedAt: '2026-10-25T03:00:00.000Z',
        },
        payouts: {
          pending: 1,
          amount: 500000,
          overdue: 1,
          oldestRequestedAt: '2026-10-01T03:00:00.000Z',
        },
        contentReports: {
          open: 1,
          oldestCreatedAt: '2026-10-26T03:00:00.000Z',
        },
        complianceCases: { open: 1, critical: 1 },
        suspensionRequests: { pending: 1 },
      },
    });
  });

  it('lists the hotels past the draft stage with their activity and satisfaction', async () => {
    await openCase('HIGH');
    const res = (await api().get(`/platform/hotels?${query}`).expect(200)).body;
    expect(res.meta.total).toBe(3);
    const row = (id: string) =>
      (res.data as { id: string }[]).find((h) => h.id === id);
    expect(row(ids.h1)).toEqual({
      id: ids.h1,
      name: 'An Nhiên Riverside',
      city: 'Đà Nẵng',
      region: 'CENTRAL',
      status: 'ACTIVE',
      partner: {
        id: ids.partnerA,
        name: 'Công ty An Nhiên',
        status: 'APPROVED',
      },
      rooms: 3,
      verifiedAt: '2026-10-03T03:00:00.000Z',
      bookings: 2,
      cancellationRate: 50,
      gmv: 3000000,
      rating: { average: 4.5, count: 2 },
      openCases: 1,
    });
    expect(row(ids.h3)).toMatchObject({
      status: 'PENDING_VERIFICATION',
      rooms: 0,
      verifiedAt: null,
      bookings: 0,
      cancellationRate: null,
      rating: { average: null, count: 0 },
      openCases: 0,
    });

    const names = async (q: string) =>
      (
        (await api().get(`/platform/hotels?${query}&${q}`).expect(200)).body
          .data as { name: string }[]
      ).map((h) => h.name);
    // Default: most bookings first, then by name.
    expect(await names('')).toEqual([
      'An Nhiên Riverside',
      'Biển Xanh',
      'Sài Gòn Central',
    ]);
    expect(await names('sort=rating-asc')).toEqual([
      'Biển Xanh',
      'An Nhiên Riverside',
      'Sài Gòn Central',
    ]);
    expect(await names('sort=cancellationRate-desc')).toEqual([
      'An Nhiên Riverside',
      'Biển Xanh',
      'Sài Gòn Central',
    ]);
    expect(await names('status=PENDING_VERIFICATION')).toEqual([
      'Sài Gòn Central',
    ]);
    expect(await names('region=SOUTH')).toEqual(['Sài Gòn Central']);
    expect(await names('search=bien xanh')).toEqual(['Biển Xanh']);
    expect(await names('partnerStatus=APPROVED&status=ACTIVE')).toEqual([
      'An Nhiên Riverside',
      'Biển Xanh',
    ]);
  });

  it('opens a case with evidence, moves it along and keeps its timeline', async () => {
    const opened = await openCase('HIGH');
    expect(opened).toMatchObject({
      partner: { id: ids.partnerA, name: 'Công ty An Nhiên' },
      hotel: { id: ids.h1, name: 'An Nhiên Riverside' },
      type: 'FAKE_LISTING',
      severity: 'HIGH',
      status: 'OPEN',
      openedBy: { id: manager.id, fullName: 'manager' },
      evidence: [{ index: 0, fileName: expect.stringMatching(/\.pdf$/) }],
      suspensionRequest: null,
    });
    const link = (
      await api().get(`/policy-violations/${opened.id}/evidence/0`).expect(200)
    ).body.data;
    expect(link.url).toMatch(
      new RegExp(`^https://signed\\.test/stayreco/compliance/${manager.id}/`),
    );
    await api().get(`/policy-violations/${opened.id}/evidence/1`).expect(404);

    await api()
      .patch(`/policy-violations/${opened.id}`, {
        status: 'INVESTIGATING',
        note: 'Đã liên hệ đối tác',
      })
      .expect(200);
    // Not back to OPEN, and nothing without a note.
    await api()
      .patch(`/policy-violations/${opened.id}`, { status: 'OPEN', note: 'x' })
      .expect(409);
    await api()
      .patch(`/policy-violations/${opened.id}`, { severity: 'LOW' })
      .expect(400);
    const closed = (
      await api()
        .patch(`/policy-violations/${opened.id}`, {
          status: 'RESOLVED',
          severity: 'MEDIUM',
          note: 'Đã sửa ảnh',
        })
        .expect(200)
    ).body.data;
    expect(closed).toMatchObject({ status: 'RESOLVED', severity: 'MEDIUM' });
    expect(closed.resolvedAt).not.toBeNull();
    const timeline = closed.timeline as {
      action: string;
      note: string | null;
    }[];
    expect(timeline.map((e) => [e.action, e.note])).toEqual([
      ['VIOLATION_OPENED', null],
      ['VIOLATION_UPDATED', 'Đã liên hệ đối tác'],
      ['VIOLATION_UPDATED', 'Đã sửa ảnh'],
    ]);
    const conflict = await api()
      .patch(`/policy-violations/${opened.id}`, { note: 'thêm' })
      .expect(409);
    expect(conflict.body.code).toBe('VIOLATION_STATUS_CONFLICT');
    await api()
      .post(`/policy-violations/${opened.id}/suspension-request`, {
        reason: 'x',
      })
      .expect(409);

    // Closed cases leave the default list; asking for them shows them.
    expect(
      (await api().get('/policy-violations').expect(200)).body.meta.total,
    ).toBe(0);
    expect(
      (await api().get('/policy-violations?status=RESOLVED').expect(200)).body
        .data,
    ).toHaveLength(1);
  });

  it('refuses evidence of someone else, a hotel of another partner, an unknown partner', async () => {
    const other = await t.signIn('PLATFORM_MANAGER', 'other@stayreco.test');
    const upload = await t
      .api()
      .post('/api/v1/policy-violations/evidence')
      .set(auth(other.token))
      .attach('file', FILES.pdf, 'x.pdf')
      .expect(201);
    const body = {
      partnerId: ids.partnerA,
      type: 'OTHER',
      severity: 'LOW',
      description: 'x',
    };
    const foreign = await api()
      .post('/policy-violations', {
        ...body,
        evidence: [upload.body.data.fileId],
      })
      .expect(400);
    expect(foreign.body.details).toEqual([
      { field: 'evidence.0', message: expect.any(String) },
    ]);
    await api()
      .post('/policy-violations', {
        ...body,
        evidence: ['stayreco/compliance/../x.pdf'],
      })
      .expect(400);
    expect(
      (
        await api()
          .post('/policy-violations', { ...body, hotelId: ids.h2 })
          .expect(404)
      ).body.code,
    ).toBe('HOTEL_NOT_FOUND');
    expect(
      (
        await api()
          .post('/policy-violations', {
            ...body,
            partnerId: '00000000-0000-4000-8000-000000000000',
          })
          .expect(404)
      ).body.code,
    ).toBe('PARTNER_NOT_FOUND');
    await api()
      .get('/policy-violations/00000000-0000-4000-8000-000000000000')
      .expect(404);
  });

  it('lets a manager ask once per partner for a suspension, never suspend', async () => {
    const first = await openCase('HIGH');
    const second = await openCase('LOW');
    const results = await Promise.all([
      api().post(`/policy-violations/${first.id}/suspension-request`, {
        reason: 'Gian lận',
      }),
      api().post(`/policy-violations/${second.id}/suspension-request`, {
        reason: 'Gian lận',
      }),
    ]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409)!.body.code).toBe(
      'SUSPENSION_REQUEST_PENDING',
    );
    const done = results.find((r) => r.status === 201)!.body.data;
    expect(done.suspensionRequest).toMatchObject({
      status: 'PENDING',
      reason: 'Gian lận',
      requestedBy: { id: manager.id },
      decidedBy: null,
    });
    // Asking does not suspend anyone: that is the admin's decision (BR-15).
    const a = await t.prisma.hotelPartner.findUniqueOrThrow({
      where: { hotelPartnerId: ids.partnerA },
    });
    expect(a.status).toBe('APPROVED');

    // The list: the most severe first.
    const list = (await api().get('/policy-violations').expect(200)).body
      .data as { severity: string }[];
    expect(list.map((c) => c.severity)).toEqual(['HIGH', 'LOW']);

    await t.prisma.hotelPartner.update({
      where: { hotelPartnerId: ids.partnerB },
      data: { status: 'SUSPENDED' },
    });
    const caseB = (
      await api()
        .post('/policy-violations', {
          partnerId: ids.partnerB,
          type: 'OTHER',
          severity: 'LOW',
          description: 'x',
        })
        .expect(201)
    ).body.data;
    const suspended = await api()
      .post(`/policy-violations/${caseB.id}/suspension-request`, {
        reason: 'x',
      })
      .expect(409);
    expect(suspended.body.code).toBe('PARTNER_SUSPENDED');
  });

  it('keeps all of it to platform managers', async () => {
    const partnerToken = (await t.signIn('HOTEL_PARTNER', 'z@hotel.test'))
      .token;
    for (const path of [
      '/platform/stats/overview',
      '/platform/hotels',
      '/policy-violations',
    ]) {
      await api(partnerToken).get(path).expect(403);
    }
    await api(partnerToken).post('/policy-violations', {}).expect(403);
  });
});
