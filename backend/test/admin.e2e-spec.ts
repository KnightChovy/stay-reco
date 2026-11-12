import { AccountMailer } from '../src/modules/admin/account-mailer';
import { PASSWORD, createTestApp } from './helpers';

/** System administration (docs/api/admin.md): accounts, suspensions, commission rate, logs, dashboard. */
describe('Administration (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let admin: { id: string; token: string };
  let manager: { id: string; token: string };

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const api = (token = admin.token) => ({
    get: (path: string) => t.api().get(`/api/v1${path}`).set(auth(token)),
    post: (path: string, body?: object) =>
      t.api().post(`/api/v1${path}`).set(auth(token)).send(body),
    patch: (path: string, body: object) =>
      t.api().patch(`/api/v1${path}`).set(auth(token)).send(body),
  });
  const login = (email: string, password = PASSWORD) =>
    t.api().post('/api/v1/auth/login').send({ email, password });

  /** A partner with one hotel, approved. */
  const partner = async (email = 'owner@hotel.test') => {
    const p = await t.signIn('HOTEL_PARTNER', email);
    await t.prisma.hotelPartner.update({
      where: { hotelPartnerId: p.id },
      data: { status: 'APPROVED', partnerName: 'Công ty An Nhiên' },
    });
    const hotel = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(p.token))
      .send({
        name: 'An Nhiên Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@hotel.test',
      })
      .expect(201);
    return { ...p, hotelId: hotel.body.data.id as string };
  };

  /** A manager's case about the partner, with a suspension request; resolves to the request id. */
  const requestSuspension = async (partnerId: string) => {
    const opened = await api(manager.token)
      .post('/policy-violations', {
        partnerId,
        type: 'FRAUD',
        severity: 'CRITICAL',
        description: 'Gian lận',
      })
      .expect(201);
    const res = await api(manager.token)
      .post(`/policy-violations/${opened.body.data.id}/suspension-request`, {
        reason: 'Gian lận nhiều lần',
      })
      .expect(201);
    return res.body.data.suspensionRequest.id as string;
  };

  const settle = () => t.app.get(AccountMailer).idle();

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    admin = await t.signIn('ADMIN', 'admin@stayreco.test');
    manager = await t.signIn('PLATFORM_MANAGER', 'manager@stayreco.test');
  });

  afterAll(() => t.app.close());

  describe('accounts', () => {
    it('finds accounts and shows one with its role and timeline', async () => {
      const owner = await partner();
      await t.signInStaff(owner.hotelId, 'staff@hotel.test', ['BOOKING']);
      await t.signIn('CUSTOMER', 'khach@mail.test');

      const all = (await api().get('/admin/users?pageSize=20').expect(200))
        .body;
      expect(all.meta.total).toBe(5);
      // `%` and `_` are plain characters, not wildcards matching every account.
      for (const search of ['%', '_']) {
        const res = await api()
          .get(`/admin/users?search=${encodeURIComponent(search)}`)
          .expect(200);
        expect(res.body.meta.total).toBe(0);
      }
      const byEmail = (
        await api().get('/admin/users?search=STAFF@').expect(200)
      ).body.data;
      expect(byEmail).toMatchObject([
        {
          email: 'staff@hotel.test',
          role: 'HOTEL_STAFF',
          status: 'ACTIVE',
          organization: 'An Nhiên Riverside',
        },
      ]);
      const partners = (
        await api()
          .get('/admin/users?role=HOTEL_PARTNER&role=CUSTOMER&sort=name-asc')
          .expect(200)
      ).body.data as { email: string }[];
      expect(partners.map((u) => u.email)).toEqual([
        'khach@mail.test',
        'owner@hotel.test',
      ]);

      const detail = (await api().get(`/admin/users/${owner.id}`).expect(200))
        .body.data;
      expect(detail).toMatchObject({
        id: owner.id,
        role: 'HOTEL_PARTNER',
        organization: 'Công ty An Nhiên',
        activeSessions: 1,
        partner: {
          status: 'APPROVED',
          commissionRate: 8,
          hotels: [
            { id: owner.hotelId, name: 'An Nhiên Riverside', status: 'DRAFT' },
          ],
        },
        staff: null,
        suspensionRequests: [],
      });
      expect(detail.lastSignInAt).not.toBeNull();
      expect(
        (detail.timeline as { action: string }[]).map((e) => e.action),
      ).toContain('LOGIN_SUCCESS');
      await api()
        .get('/admin/users/00000000-0000-4000-8000-000000000000')
        .expect(404);
    });

    it('locks an account at once and unlocks it, never an admin', async () => {
      const customer = await t.signIn('CUSTOMER', 'khach@mail.test');
      await api(customer.token).get('/me/notifications').expect(200);

      const locked = (
        await api()
          .post(`/admin/users/${customer.id}/suspend`, {
            reason: 'Gian lận thanh toán',
          })
          .expect(200)
      ).body.data;
      expect(locked).toMatchObject({ status: 'SUSPENDED', activeSessions: 0 });
      // The token in hand stops working and signing in is refused.
      await api(customer.token).get('/me/notifications').expect(401);
      expect((await login('khach@mail.test').expect(403)).body.code).toBe(
        'AUTH_ACCOUNT_SUSPENDED',
      );
      expect(
        (
          await api()
            .post(`/admin/users/${customer.id}/suspend`, { reason: 'x' })
            .expect(409)
        ).body.code,
      ).toBe('ACCOUNT_STATUS_CONFLICT');
      await api()
        .post(`/admin/users/${customer.id}/suspend`, { reason: ' ' })
        .expect(400);

      await api()
        .post(`/admin/users/${customer.id}/activate`, { reason: 'Đã xác minh' })
        .expect(200);
      await login('khach@mail.test').expect(200);
      await api()
        .post(`/admin/users/${customer.id}/activate`, { reason: 'x' })
        .expect(409);

      await settle();
      expect(t.outbox.map((m) => [m.to, m.subject])).toEqual([
        ['khach@mail.test', 'Tài khoản StayReco của bạn đã bị khoá'],
        ['khach@mail.test', 'Tài khoản StayReco của bạn đã được mở lại'],
      ]);
      const events = await t.prisma.auditLog.findMany({
        where: {
          entityId: customer.id,
          action: { in: ['ACCOUNT_SUSPENDED', 'ACCOUNT_ACTIVATED'] },
        },
        orderBy: { createdAt: 'asc' },
      });
      expect(events.map((e) => [e.action, e.adminId])).toEqual([
        ['ACCOUNT_SUSPENDED', admin.id],
        ['ACCOUNT_ACTIVATED', admin.id],
      ]);

      const other = await t.signIn('ADMIN', 'admin2@stayreco.test');
      await api()
        .post(`/admin/users/${other.id}/suspend`, { reason: 'x' })
        .expect(403);
      await api()
        .post(`/admin/users/${admin.id}/suspend`, { reason: 'x' })
        .expect(403);
    });

    it('brings an invited person back to INVITED', async () => {
      const invited = await t.prisma.userAccount.create({
        data: {
          email: 'moi@stayreco.test',
          fullName: 'Mới',
          role: 'PLATFORM_MANAGER',
          status: 'INVITED',
          platformManager: { create: {} },
        },
      });
      await api()
        .post(`/admin/users/${invited.userAccountId}/suspend`, {
          reason: 'Mời nhầm',
        })
        .expect(200);
      const back = (
        await api()
          .post(`/admin/users/${invited.userAccountId}/activate`, {
            reason: 'Mời lại',
          })
          .expect(200)
      ).body.data;
      expect(back.status).toBe('INVITED');
    });
  });

  describe('partners', () => {
    it("sets a partner's commission rate between 8 and 15 %", async () => {
      const owner = await partner();
      const res = (
        await api()
          .patch(`/admin/partners/${owner.id}/commission-rate`, { rate: 10.5 })
          .expect(200)
      ).body.data;
      expect(res.partner.commissionRate).toBe(10.5);
      for (const rate of [7.99, 15.01, 9.123]) {
        await api()
          .patch(`/admin/partners/${owner.id}/commission-rate`, { rate })
          .expect(400);
      }
      await api()
        .patch(
          '/admin/partners/00000000-0000-4000-8000-000000000000/commission-rate',
          { rate: 9 },
        )
        .expect(404);
      const event = await t.prisma.auditLog.findFirstOrThrow({
        where: { action: 'COMMISSION_RATE_CHANGED' },
      });
      expect(JSON.parse(event.newValue!)).toEqual({ from: 8, to: 10.5 });
    });
  });

  describe('suspension requests', () => {
    it('suspends a partner on approval, tells everyone, and reinstates it', async () => {
      const owner = await partner();
      const requestId = await requestSuspension(owner.id);

      const pending = (
        await api().get('/admin/suspension-requests').expect(200)
      ).body.data;
      expect(pending).toMatchObject([
        {
          id: requestId,
          status: 'PENDING',
          partner: { id: owner.id, status: 'APPROVED' },
          case: { type: 'FRAUD', severity: 'CRITICAL' },
          reason: 'Gian lận nhiều lần',
          requestedBy: { id: manager.id },
        },
      ]);

      const approved = (
        await api()
          .post(`/admin/suspension-requests/${requestId}/approve`, {
            reason: 'Đủ bằng chứng',
          })
          .expect(200)
      ).body.data;
      expect(approved).toMatchObject({
        status: 'APPROVED',
        partner: { status: 'SUSPENDED' },
        decidedBy: { id: admin.id, fullName: 'admin' },
        decisionReason: 'Đủ bằng chứng',
      });
      // The partner can still sign in and read, but not change anything (effects already built).
      const res = await t
        .api()
        .post('/api/v1/hotels')
        .set(auth(owner.token))
        .send({ name: 'Mới', address: 'x', city: 'Huế', email: 'a@b.test' })
        .expect(403);
      expect(res.body.code).toBe('PARTNER_SUSPENDED');

      expect(
        (
          await api()
            .post(`/admin/suspension-requests/${requestId}/approve`, {
              reason: 'x',
            })
            .expect(409)
        ).body.code,
      ).toBe('SUSPENSION_STATUS_CONFLICT');
      expect(
        (await api().get('/admin/suspension-requests').expect(200)).body.data,
      ).toEqual([]);

      await settle();
      expect(t.outbox.map((m) => [m.to, m.subject])).toEqual([
        ['owner@hotel.test', 'Đối tác của bạn bị đình chỉ trên StayReco'],
        ['manager@stayreco.test', 'Đề nghị đình chỉ đã duyệt'],
      ]);
      const note = await t.prisma.notification.findFirstOrThrow({
        where: { userAccountId: manager.id },
      });
      expect(note.link).toBe('/manager/compliance');

      const reinstated = (
        await api()
          .post(`/admin/partners/${owner.id}/reinstate`, {
            reason: 'Đã khắc phục',
          })
          .expect(200)
      ).body.data;
      expect(reinstated.partner.status).toBe('APPROVED');
      expect(
        (
          await api()
            .post(`/admin/partners/${owner.id}/reinstate`, { reason: 'x' })
            .expect(409)
        ).body.code,
      ).toBe('PARTNER_STATUS_CONFLICT');
      const detail = (await api().get(`/admin/users/${owner.id}`).expect(200))
        .body.data;
      expect(detail.suspensionRequests).toMatchObject([
        { id: requestId, status: 'APPROVED' },
      ]);
    });

    it('rejects a request, which leaves the partner alone, and decides once', async () => {
      const owner = await partner();
      const first = await requestSuspension(owner.id);
      const rejected = (
        await api()
          .post(`/admin/suspension-requests/${first}/reject`, {
            reason: 'Chưa đủ',
          })
          .expect(200)
      ).body.data;
      expect(rejected).toMatchObject({
        status: 'REJECTED',
        partner: { status: 'APPROVED' },
      });
      expect(
        (
          await api()
            .get('/admin/suspension-requests?status=REJECTED')
            .expect(200)
        ).body.meta.total,
      ).toBe(1);

      // A new request can be sent once the first is decided; two admins at once decide it once.
      const second = await requestSuspension(owner.id);
      const results = await Promise.all([
        api().post(`/admin/suspension-requests/${second}/approve`, {
          reason: 'a',
        }),
        api().post(`/admin/suspension-requests/${second}/reject`, {
          reason: 'b',
        }),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      await api()
        .post(
          '/admin/suspension-requests/00000000-0000-4000-8000-000000000000/approve',
          { reason: 'x' },
        )
        .expect(404);
    });
  });

  describe('system logs and dashboard', () => {
    it('reads the log with derived severity, masked numbers and filters', async () => {
      await login('admin@stayreco.test', 'wrong-password-1').expect(401);
      await t.prisma.auditLog.create({
        data: {
          action: 'PAYOUT_ACCOUNT_VIEWED',
          platformManagerId: manager.id,
          newValue: JSON.stringify({
            beneficiary: { accountNumber: '0123456789' },
          }),
        },
      });
      const warnings = (
        await api().get('/admin/audit-logs?severity=WARNING').expect(200)
      ).body.data as {
        action: string;
        severity: string;
        actor: { id: string; fullName: string; role: string } | null;
        details: unknown;
      }[];
      expect(warnings.map((e) => e.action).sort()).toEqual([
        'LOGIN_FAILED',
        'PAYOUT_ACCOUNT_VIEWED',
      ]);
      expect(warnings.every((e) => e.severity === 'WARNING')).toBe(true);
      const viewed = warnings.find(
        (e) => e.action === 'PAYOUT_ACCOUNT_VIEWED',
      )!;
      expect(viewed.actor).toEqual({
        id: manager.id,
        fullName: 'manager',
        role: 'PLATFORM_MANAGER',
      });
      expect(viewed.details).toEqual({
        beneficiary: { accountNumber: '****6789' },
      });

      const managerOnly = (
        await api().get(`/admin/audit-logs?role=PLATFORM_MANAGER`).expect(200)
      ).body.data as {
        actor: { role: string };
      }[];
      expect(managerOnly.length).toBeGreaterThan(0);
      expect(
        managerOnly.every((e) => e.actor.role === 'PLATFORM_MANAGER'),
      ).toBe(true);
      const mine = (
        await api()
          .get(`/admin/audit-logs?actorId=${admin.id}&action=LOGIN_SUCCESS`)
          .expect(200)
      ).body.data;
      expect(mine).toHaveLength(1);
      await api()
        .get('/admin/audit-logs?from=2026-01-01&to=2026-06-01')
        .expect(400);
      await api().get('/admin/audit-logs?from=2026-01-01').expect(400);
    });

    it('fills the admin dashboard', async () => {
      const owner = await partner();
      await requestSuspension(owner.id);
      await t.signIn('CUSTOMER', 'khach@mail.test');
      await t.prisma.userAccount.updateMany({
        data: { createdAt: new Date('2026-10-10T03:00:00Z') },
      });
      await t.prisma.auditLog.create({
        data: {
          action: 'SEPAY_TRANSFER_UNMATCHED',
          newValue: JSON.stringify({ sepayId: 1, amount: 100 }),
          createdAt: new Date('2026-10-15T03:00:00Z'),
        },
      });
      await login('khach@mail.test', 'wrong-password-1').expect(401);

      const o = (
        await api()
          .get('/admin/stats?from=2026-10-01&to=2026-10-31')
          .expect(200)
      ).body.data;
      const role = (r: string) =>
        (o.accounts as { role: string }[]).find((a) => a.role === r);
      expect(o.accounts).toHaveLength(5);
      expect(role('HOTEL_PARTNER')).toMatchObject({
        total: 1,
        active: 1,
        suspended: 0,
        new: { value: 1, previous: 0 },
      });
      expect(role('CUSTOMER')).toMatchObject({ total: 1, new: { value: 1 } });
      expect(role('HOTEL_STAFF')).toMatchObject({
        total: 0,
        new: { value: 0, previous: 0, deltaPercent: null },
      });
      expect(o.suspensionRequests.pending).toBe(1);
      expect(o.payments).toEqual({
        unmatchedTransfers: 1,
        lateTransfers: 0,
        refundsPending: 0,
      });
      expect(
        (o.securityEvents as { action: string }[]).map((e) => e.action),
      ).toEqual(
        expect.arrayContaining([
          'LOGIN_FAILED',
          'SUSPENSION_REQUESTED',
          'SEPAY_TRANSFER_UNMATCHED',
        ]),
      );
    });

    it('keeps it all to admins', async () => {
      for (const token of [manager.token]) {
        for (const path of [
          '/admin/stats',
          '/admin/users',
          '/admin/audit-logs',
          '/admin/suspension-requests',
        ]) {
          await api(token).get(path).expect(403);
        }
      }
    });
  });
});
