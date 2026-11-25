import { ConfigService } from '@nestjs/config';
import { FieldCipher } from '../src/common/crypto/field-cipher';
import { PayoutMailer } from '../src/modules/payouts/payout-mailer';
import { createTestApp } from './helpers';

type Payout = {
  id: string;
  status: string;
  amount: number;
  beneficiary: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  };
  requestedAt: string;
  dueBy: string;
  overdue: boolean;
  decidedAt: string | null;
  bankReference: string | null;
  reason: string | null;
  partner?: { id: string; name: string; status: string };
  decidedBy?: { id: string; fullName: string } | null;
};

const idsOf = (res: { body: { data: unknown } }) =>
  (res.body.data as Payout[]).map((p) => p.id);

describe('Withdrawals (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let cipher: FieldCipher;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const partnerWithHotel = async (
    email = 'owner@hotel.test',
    name = 'Riverside',
  ) => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name,
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@hotel.test',
      })
      .expect(201);
    return { ...partner, hotelId: res.body.data.id as string };
  };

  /** An approved verification request with a beneficiary account, as the wizard and a manager leave it. */
  const approveBeneficiary = async (
    hotelId: string,
    accountNumber = '0123456789',
  ) => {
    const request = await t.prisma.hotelVerificationRequest.create({
      data: {
        hotelId,
        requestType: 'INITIAL',
        status: 'APPROVED',
        reviewedAt: new Date('2026-10-20T08:00:00Z'),
        hotelProperties: {
          create: [
            {
              hotelId,
              propertyKey: 'beneficiary.bankName',
              propertyValue: 'Vietcombank',
            },
            {
              hotelId,
              propertyKey: 'beneficiary.accountNumber',
              propertyValue: cipher.encrypt(accountNumber),
            },
            {
              hotelId,
              propertyKey: 'beneficiary.accountHolder',
              propertyValue: 'CONG TY AN NHIEN',
            },
          ],
        },
      },
    });
    return request.verificationRequestId;
  };

  /** The hotel wallet with money the owner can already withdraw. */
  const fund = (hotelId: string, available: number, pending = 0) =>
    t.prisma.wallet.create({
      data: {
        ownerType: 'HOTEL',
        hotelId,
        balanceAvailable: available,
        balancePending: pending,
      },
    });

  const balances = async (hotelId: string) => {
    const w = await t.prisma.wallet.findUniqueOrThrow({ where: { hotelId } });
    return {
      available: w.balanceAvailable.toNumber(),
      pending: w.balancePending.toNumber(),
      reserved: w.balanceReserved.toNumber(),
    };
  };

  /** Sum of every wallet's available + pending + reserved: what the platform's bank account must hold (§5.3). */
  const walletTotal = async () => {
    const [row] = await t.prisma.$queryRaw<{ total: string }[]>`
      SELECT coalesce(sum(balance_available + balance_pending + balance_reserved), 0)::text AS total FROM wallet`;
    return Number(row.total);
  };

  const ask = (token: string, hotelId: string, amount: unknown) =>
    t
      .api()
      .post(`/api/v1/hotels/${hotelId}/payouts`)
      .set(auth(token))
      .send({ amount });

  const ready = async (available = 5000000) => {
    const owner = await partnerWithHotel();
    await approveBeneficiary(owner.hotelId);
    await fund(owner.hotelId, available);
    return owner;
  };

  beforeAll(async () => {
    t = await createTestApp();
    cipher = new FieldCipher(
      t.app.get(ConfigService).get<string>('BENEFICIARY_ENCRYPTION_KEY')!,
    );
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  describe('partner side', () => {
    it('reserves the amount, records a PAYOUT movement and keeps the account number out of the log', async () => {
      const owner = await ready();
      const before = await walletTotal();

      const res = await ask(owner.token, owner.hotelId, 3000000).expect(201);
      const payout = res.body.data as Payout;
      expect(payout).toMatchObject({
        hotel: { id: owner.hotelId, name: 'Riverside' },
        amount: 3000000,
        status: 'PENDING',
        beneficiary: {
          bankName: 'Vietcombank',
          accountNumber: '****6789',
          accountHolder: 'CONG TY AN NHIEN',
        },
        overdue: false,
        decidedAt: null,
        bankReference: null,
        reason: null,
      });
      expect(payout).not.toHaveProperty('partner');
      expect(new Date(payout.dueBy) > new Date(payout.requestedAt)).toBe(true);

      expect(await balances(owner.hotelId)).toEqual({
        available: 2000000,
        pending: 0,
        reserved: 3000000,
      });
      // Money waiting to be paid out is still in the bank: the reconciliation total does not move.
      expect(await walletTotal()).toBe(before);

      const ledger = await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/wallet/transactions`)
        .set(auth(owner.token))
        .expect(200);
      expect(ledger.body.data[0]).toMatchObject({
        id: payout.id,
        type: 'PAYOUT',
        amount: -3000000,
        balanceAfter: 2000000,
        description: 'Withdrawal to Vietcombank ****6789',
      });

      const list = await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/payouts`)
        .set(auth(owner.token))
        .expect(200);
      expect(list.body.data).toEqual([payout]);

      const events = await t.prisma.auditLog.findMany({
        where: { entityId: payout.id },
      });
      expect(events.map((e) => e.action)).toEqual(['PAYOUT_REQUESTED']);
      expect(events[0].hotelPartnerId).toBe(owner.id);
      expect(events[0].newValue).not.toContain('0123456789');
    });

    it('refuses amounts that are not whole dong above 0, or more than the available balance', async () => {
      const owner = await ready();
      for (const amount of [0, -1, 1.5, '100']) {
        const res = await ask(owner.token, owner.hotelId, amount).expect(400);
        expect(res.body.code).toBe('VALIDATION_ERROR');
      }
      const res = await ask(owner.token, owner.hotelId, 5000001).expect(409);
      expect(res.body).toMatchObject({
        code: 'PAYOUT_EXCEEDS_BALANCE',
        details: [{ field: 'amount', message: '5000000' }],
      });
      expect(await balances(owner.hotelId)).toEqual({
        available: 5000000,
        pending: 0,
        reserved: 0,
      });
    });

    it('counts only the available balance, not money still pending', async () => {
      const owner = await partnerWithHotel();
      await approveBeneficiary(owner.hotelId);
      await fund(owner.hotelId, 1000000, 9000000);
      await ask(owner.token, owner.hotelId, 1000001).expect(409);
      await ask(owner.token, owner.hotelId, 1000000).expect(201);
    });

    it('needs an approved beneficiary account', async () => {
      const owner = await partnerWithHotel();
      await fund(owner.hotelId, 5000000);
      // A request still waiting for review does not count.
      await t.prisma.hotelVerificationRequest.create({
        data: {
          hotelId: owner.hotelId,
          requestType: 'INITIAL',
          status: 'PENDING',
          hotelProperties: {
            create: {
              hotelId: owner.hotelId,
              propertyKey: 'beneficiary.accountNumber',
              propertyValue: cipher.encrypt('111'),
            },
          },
        },
      });
      const res = await ask(owner.token, owner.hotelId, 1000000).expect(409);
      expect(res.body.code).toBe('BENEFICIARY_MISSING');
    });

    it('pays to the account of the latest approved request', async () => {
      const owner = await ready();
      const newer = await approveBeneficiary(owner.hotelId, '9999990000');
      await t.prisma.hotelVerificationRequest.update({
        where: { verificationRequestId: newer },
        data: { reviewedAt: new Date('2026-11-01T08:00:00Z') },
      });
      const res = await ask(owner.token, owner.hotelId, 1000000).expect(201);
      expect(res.body.data.beneficiary.accountNumber).toBe('****0000');
    });

    it('allows one pending withdrawal per hotel, also when two arrive together', async () => {
      const owner = await ready();
      const results = await Promise.all([
        ask(owner.token, owner.hotelId, 1000000),
        ask(owner.token, owner.hotelId, 2000000),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
      expect(results.find((r) => r.status === 409)!.body.code).toBe(
        'PAYOUT_PENDING',
      );
      const created = results.find((r) => r.status === 201)!.body
        .data as Payout;
      expect(await balances(owner.hotelId)).toEqual({
        available: 5000000 - created.amount,
        pending: 0,
        reserved: created.amount,
      });
      const res = await ask(owner.token, owner.hotelId, 1000).expect(409);
      expect(res.body.code).toBe('PAYOUT_PENDING');
    });

    it('lets the owner cancel a pending withdrawal and ask again', async () => {
      const owner = await ready();
      const before = await walletTotal();
      const payout = (
        await ask(owner.token, owner.hotelId, 3000000).expect(201)
      ).body.data as Payout;

      const res = await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/payouts/${payout.id}/cancel`)
        .set(auth(owner.token))
        .expect(200);
      expect(res.body.data).toMatchObject({
        status: 'CANCELLED',
        bankReference: null,
        reason: null,
      });
      expect(res.body.data.decidedAt).not.toBeNull();
      expect(await balances(owner.hotelId)).toEqual({
        available: 5000000,
        pending: 0,
        reserved: 0,
      });
      expect(await walletTotal()).toBe(before);

      const ledger = await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/wallet/transactions`)
        .set(auth(owner.token))
        .expect(200);
      expect(ledger.body.data[0]).toMatchObject({
        type: 'ADJUSTMENT',
        amount: 3000000,
        balanceAfter: 5000000,
      });

      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/payouts/${payout.id}/cancel`)
        .set(auth(owner.token))
        .expect(409)
        .expect((r) => expect(r.body.code).toBe('PAYOUT_STATUS_CONFLICT'));
      await ask(owner.token, owner.hotelId, 5000000).expect(201);
    });

    it('keeps withdrawals to the owner of the hotel', async () => {
      const owner = await ready();
      const payout = (
        await ask(owner.token, owner.hotelId, 1000000).expect(201)
      ).body.data as Payout;
      const other = await partnerWithHotel('other@hotel.test', 'Other');
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'BOOKING',
        'REFUND',
      ]);

      await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/payouts`)
        .set(auth(other.token))
        .expect(404);
      await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/payouts`)
        .set(auth(staff.token))
        .expect(403);
      await ask(staff.token, owner.hotelId, 1000).expect(403);
      // Another hotel's withdrawal, through the other partner's own hotel.
      await t
        .api()
        .post(`/api/v1/hotels/${other.hotelId}/payouts/${payout.id}/cancel`)
        .set(auth(other.token))
        .expect(404)
        .expect((r) => expect(r.body.code).toBe('PAYOUT_NOT_FOUND'));
      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/payouts/not-a-uuid/cancel`)
        .set(auth(owner.token))
        .expect(404);
    });

    it('stops a suspended partner from asking but not from cancelling', async () => {
      const owner = await ready();
      const payout = (
        await ask(owner.token, owner.hotelId, 1000000).expect(201)
      ).body.data as Payout;
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: owner.id },
        data: { status: 'SUSPENDED' },
      });

      const res = await ask(owner.token, owner.hotelId, 1000).expect(403);
      expect(res.body.code).toBe('PARTNER_SUSPENDED');
      await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/payouts`)
        .set(auth(owner.token))
        .expect(200);
      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/payouts/${payout.id}/cancel`)
        .set(auth(owner.token))
        .expect(200);
    });
  });

  describe('platform manager side', () => {
    it('pays a withdrawal: the reserved amount leaves the wallet and the partner is told', async () => {
      const owner = await ready();
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const payout = (
        await ask(owner.token, owner.hotelId, 3000000).expect(201)
      ).body.data as Payout;
      const before = await walletTotal();

      const queue = await t
        .api()
        .get('/api/v1/payouts')
        .set(auth(manager.token))
        .expect(200);
      expect(queue.body.data).toHaveLength(1);
      expect(queue.body.data[0]).toMatchObject({
        id: payout.id,
        beneficiary: { accountNumber: '****6789' },
        partner: { id: owner.id, name: 'Partner Co', status: 'PENDING' },
        decidedBy: null,
      });

      const detail = await t
        .api()
        .get(`/api/v1/payouts/${payout.id}`)
        .set(auth(manager.token))
        .expect(200);
      expect(detail.body.data.beneficiary.accountNumber).toBe('0123456789');
      const viewed = await t.prisma.auditLog.findMany({
        where: { entityId: payout.id, action: 'PAYOUT_ACCOUNT_VIEWED' },
      });
      expect(viewed.map((e) => e.platformManagerId)).toEqual([manager.id]);

      const res = await t
        .api()
        .post(`/api/v1/payouts/${payout.id}/paid`)
        .set(auth(manager.token))
        .send({ bankReference: ' FT2631600123 ' })
        .expect(200);
      expect(res.body.data).toMatchObject({
        status: 'PAID',
        bankReference: 'FT2631600123',
        beneficiary: { accountNumber: '****6789' },
        decidedBy: { id: manager.id, fullName: 'manager' },
      });
      expect(await balances(owner.hotelId)).toEqual({
        available: 2000000,
        pending: 0,
        reserved: 0,
      });
      // The money has left the platform's bank account.
      expect(await walletTotal()).toBe(before - 3000000);

      await t.app.get(PayoutMailer).idle();
      expect(t.outbox.map((m) => [m.to, m.subject])).toEqual([
        ['owner@hotel.test', 'Đã chuyển khoản 3.000.000 ₫ cho Riverside'],
      ]);
      expect(t.outbox[0].text).toContain('FT2631600123');
      const notes = await t.prisma.notification.findMany({
        where: { userAccountId: owner.id },
      });
      expect(notes).toMatchObject([
        { type: 'PAYMENT', link: '/partner/revenue' },
      ]);

      // Decided once: the second click, and the partner's cancel, are refused.
      await t
        .api()
        .post(`/api/v1/payouts/${payout.id}/paid`)
        .set(auth(manager.token))
        .send({ bankReference: 'FT2' })
        .expect(409);
      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/payouts/${payout.id}/cancel`)
        .set(auth(owner.token))
        .expect(409);
      expect(await balances(owner.hotelId)).toEqual({
        available: 2000000,
        pending: 0,
        reserved: 0,
      });
    });

    it('rejects a withdrawal with a reason and gives the amount back', async () => {
      const owner = await ready();
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const payout = (
        await ask(owner.token, owner.hotelId, 3000000).expect(201)
      ).body.data as Payout;

      await t
        .api()
        .post(`/api/v1/payouts/${payout.id}/reject`)
        .set(auth(manager.token))
        .send({ reason: '  ' })
        .expect(400);
      const res = await t
        .api()
        .post(`/api/v1/payouts/${payout.id}/reject`)
        .set(auth(manager.token))
        .send({ reason: 'Tài khoản thụ hưởng đang bị khoá' })
        .expect(200);
      expect(res.body.data).toMatchObject({
        status: 'REJECTED',
        reason: 'Tài khoản thụ hưởng đang bị khoá',
      });
      expect(await balances(owner.hotelId)).toEqual({
        available: 5000000,
        pending: 0,
        reserved: 0,
      });
      const adjustment = await t.prisma.walletTransaction.findFirstOrThrow({
        where: { type: 'ADJUSTMENT' },
      });
      expect(adjustment.platformManagerId).toBe(manager.id);

      await t.app.get(PayoutMailer).idle();
      expect(t.outbox.map((m) => m.subject)).toEqual([
        'Yêu cầu rút tiền của Riverside bị từ chối',
      ]);
      expect(t.outbox[0].text).toContain('Tài khoản thụ hưởng đang bị khoá');

      const mine = await t
        .api()
        .get(`/api/v1/hotels/${owner.hotelId}/payouts`)
        .set(auth(owner.token))
        .expect(200);
      expect(mine.body.data[0]).toMatchObject({
        status: 'REJECTED',
        reason: 'Tài khoản thụ hưởng đang bị khoá',
      });
    });

    it('leaves the net received of the dashboard alone: a withdrawal only moves money already earned', async () => {
      const owner = await ready();
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const net = async () =>
        (
          await t
            .api()
            .get(`/api/v1/hotels/${owner.hotelId}/stats/overview`)
            .set(auth(owner.token))
            .expect(200)
        ).body.data.cash.netEarnings.value as number;
      const before = await net();

      const rejected = (
        await ask(owner.token, owner.hotelId, 3000000).expect(201)
      ).body.data as Payout;
      await t
        .api()
        .post(`/api/v1/payouts/${rejected.id}/reject`)
        .set(auth(manager.token))
        .send({ reason: 'Sai thông tin' })
        .expect(200);
      const cancelled = (
        await ask(owner.token, owner.hotelId, 1000000).expect(201)
      ).body.data as Payout;
      await t
        .api()
        .post(`/api/v1/hotels/${owner.hotelId}/payouts/${cancelled.id}/cancel`)
        .set(auth(owner.token))
        .expect(200);
      const paid = (await ask(owner.token, owner.hotelId, 2000000).expect(201))
        .body.data as Payout;
      await t
        .api()
        .post(`/api/v1/payouts/${paid.id}/paid`)
        .set(auth(manager.token))
        .send({ bankReference: 'FT9' })
        .expect(200);

      expect(await net()).toBe(before);
    });

    it('decides once when the manager and the partner act together', async () => {
      const owner = await ready();
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const payout = (
        await ask(owner.token, owner.hotelId, 3000000).expect(201)
      ).body.data as Payout;

      const results = await Promise.all([
        t
          .api()
          .post(`/api/v1/payouts/${payout.id}/paid`)
          .set(auth(manager.token))
          .send({ bankReference: 'FT1' }),
        t
          .api()
          .post(`/api/v1/hotels/${owner.hotelId}/payouts/${payout.id}/cancel`)
          .set(auth(owner.token)),
      ]);
      expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
      const b = await balances(owner.hotelId);
      expect(b.reserved).toBe(0);
      expect(b.available).toBe(results[0].status === 200 ? 2000000 : 5000000);
    });

    it('lists the queue oldest first, filters it and flags overdue withdrawals', async () => {
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const a = await ready();
      const b = await partnerWithHotel('b@hotel.test', 'Mỹ Khê');
      await approveBeneficiary(b.hotelId);
      await fund(b.hotelId, 5000000);
      const first = (await ask(a.token, a.hotelId, 1000000).expect(201)).body
        .data as Payout;
      const second = (await ask(b.token, b.hotelId, 2000000).expect(201)).body
        .data as Payout;
      // Asked on Monday 5 January 2026, 10:00 in Vietnam: due Wednesday 7 January, long past.
      await t.prisma.walletTransaction.update({
        where: { walletTransactionId: first.id },
        data: { createdAt: new Date('2026-01-05T03:00:00Z') },
      });

      const queue = await t
        .api()
        .get('/api/v1/payouts')
        .set(auth(manager.token))
        .expect(200);
      expect(idsOf(queue)).toEqual([first.id, second.id]);
      expect(queue.body.data[0]).toMatchObject({
        dueBy: '2026-01-07T03:00:00.000Z',
        overdue: true,
      });
      expect(queue.body.data[1].overdue).toBe(false);

      const search = await t
        .api()
        .get(`/api/v1/payouts?search=${encodeURIComponent('khê')}`)
        .set(auth(manager.token))
        .expect(200);
      expect(idsOf(search)).toEqual([second.id]);
      const byHotel = await t
        .api()
        .get(`/api/v1/payouts?hotelId=${a.hotelId}`)
        .set(auth(manager.token))
        .expect(200);
      expect(idsOf(byHotel)).toEqual([first.id]);

      await t
        .api()
        .post(`/api/v1/payouts/${first.id}/paid`)
        .set(auth(manager.token))
        .send({ bankReference: 'FT1' })
        .expect(200);
      const pending = await t
        .api()
        .get('/api/v1/payouts')
        .set(auth(manager.token))
        .expect(200);
      expect(pending.body.meta.total).toBe(1);
      const paid = await t
        .api()
        .get('/api/v1/payouts?status=PAID&status=REJECTED')
        .set(auth(manager.token))
        .expect(200);
      expect(paid.body.data).toMatchObject([
        { id: first.id, status: 'PAID', overdue: false },
      ]);
    });

    it('keeps the queue to platform managers', async () => {
      const owner = await ready();
      const payout = (
        await ask(owner.token, owner.hotelId, 1000000).expect(201)
      ).body.data as Payout;
      const customer = await t.signIn('CUSTOMER', 'guest@test.vn');
      for (const token of [owner.token, customer.token]) {
        await t.api().get('/api/v1/payouts').set(auth(token)).expect(403);
        await t
          .api()
          .get(`/api/v1/payouts/${payout.id}`)
          .set(auth(token))
          .expect(403);
        await t
          .api()
          .post(`/api/v1/payouts/${payout.id}/paid`)
          .set(auth(token))
          .send({ bankReference: 'X' })
          .expect(403);
      }
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      await t
        .api()
        .get('/api/v1/payouts/00000000-0000-4000-8000-000000000000')
        .set(auth(manager.token))
        .expect(404);
    });
  });
});
