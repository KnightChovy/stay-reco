import { PASSWORD, createTestApp } from './helpers';

describe('Hotel staff (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

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
        email: 'contact@riverside.test',
      })
      .expect(201);
    return { ...partner, hotelId: res.body.data.id as string };
  };

  /** An invitation that was never accepted: no password, status INVITED. */
  const invitedStaff = (hotelId: string, email: string) =>
    t.prisma.userAccount.create({
      data: {
        email,
        fullName: 'Zed Invited',
        role: 'HOTEL_STAFF',
        status: 'INVITED',
        hotelStaff: { create: { hotelId, position: 'Housekeeping' } },
      },
    });

  const post = (path: string, token: string) =>
    t.api().post(`/api/v1${path}`).set(auth(token));

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  it('lists the hotel staff, pending invitations included, for the owner only', async () => {
    const owner = await partnerWithHotel('a@hotel.test');
    const other = await partnerWithHotel('b@hotel.test');
    const staff = await t.signInStaff(owner.hotelId, 'anna@hotel.test', [
      'FRONT_DESK',
    ]);
    const invited = await invitedStaff(owner.hotelId, 'zed@hotel.test');
    await t.signInStaff(other.hotelId, 'bob@hotel.test');

    const res = await t
      .api()
      .get(`/api/v1/hotels/${owner.hotelId}/staff`)
      .set(auth(owner.token))
      .expect(200);
    expect(res.body.data).toEqual([
      {
        id: staff.id,
        fullName: 'Staff',
        email: 'anna@hotel.test',
        position: 'Receptionist',
        status: 'ACTIVE',
        permissions: ['FRONT_DESK'],
      },
      expect.objectContaining({ id: invited.userAccountId, status: 'INVITED' }),
    ]);

    await t
      .api()
      .get(`/api/v1/hotels/${owner.hotelId}/staff`)
      .set(auth(staff.token))
      .expect(403);
    const hidden = await t
      .api()
      .get(`/api/v1/hotels/${owner.hotelId}/staff`)
      .set(auth(other.token))
      .expect(404);
    expect(hidden.body.code).toBe('HOTEL_NOT_FOUND');
  });

  it('replaces permission groups and audits the change', async () => {
    const owner = await partnerWithHotel();
    const staff = await t.signInStaff(owner.hotelId, 'anna@hotel.test', [
      'FRONT_DESK',
    ]);
    const url = `/api/v1/hotel-staff/${staff.id}/permissions`;

    const res = await t
      .api()
      .patch(url)
      .set(auth(owner.token))
      .send({ permissions: ['BOOKING', 'REFUND'] })
      .expect(200);
    expect(res.body.data.permissions).toEqual(['BOOKING', 'REFUND']);
    const cleared = await t
      .api()
      .patch(url)
      .set(auth(owner.token))
      .send({ permissions: [] })
      .expect(200);
    expect(cleared.body.data.permissions).toEqual([]);

    for (const permissions of [['BOOKING', 'BOOKING'], ['ACCOUNTING']]) {
      await t
        .api()
        .patch(url)
        .set(auth(owner.token))
        .send({ permissions })
        .expect(400);
    }
    const logs = await t.prisma.auditLog.count({
      where: { hotelPartnerId: owner.id, action: 'STAFF_PERMISSIONS_CHANGED' },
    });
    expect(logs).toBe(2);
  });

  it('deactivation signs the staff member out at once and blocks login until reactivated', async () => {
    const owner = await partnerWithHotel();
    const staff = await t.signInStaff(owner.hotelId, 'anna@hotel.test');
    const me = (token: string) =>
      t.api().get('/api/v1/auth/me').set(auth(token));
    const login = () =>
      t
        .api()
        .post('/api/v1/auth/login')
        .send({ email: 'anna@hotel.test', password: PASSWORD });
    // Mobile-style login: the refresh token comes back in the body.
    const { refreshToken } = (await login().expect(200)).body.data as {
      refreshToken: string;
    };

    const res = await post(
      `/hotel-staff/${staff.id}/deactivate`,
      owner.token,
    ).expect(200);
    expect(res.body.data.status).toBe('DEACTIVATED');
    await me(staff.token).expect(401);
    // What a signed-in client does next: the refresh is refused too.
    const refresh = await t
      .api()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken })
      .expect(401);
    expect(refresh.body.code).toBe('AUTH_REFRESH_TOKEN_INVALID');
    const refused = await login().expect(403);
    expect(refused.body.code).toBe('AUTH_ACCOUNT_DEACTIVATED');

    const again = await post(
      `/hotel-staff/${staff.id}/deactivate`,
      owner.token,
    ).expect(409);
    expect(again.body.code).toBe('STAFF_STATUS_CONFLICT');

    const back = await post(
      `/hotel-staff/${staff.id}/activate`,
      owner.token,
    ).expect(200);
    expect(back.body.data.status).toBe('ACTIVE');
    // Old sessions stay revoked; a fresh login works.
    await me(staff.token).expect(401);
    await login().expect(200);

    const actions = await t.prisma.auditLog.findMany({
      where: { hotelPartnerId: owner.id, action: { startsWith: 'STAFF_' } },
      orderBy: { createdAt: 'asc' },
      select: { action: true },
    });
    expect(actions.map((a) => a.action)).toEqual([
      'STAFF_DEACTIVATED',
      'STAFF_ACTIVATED',
    ]);
  });

  it('never lifts an admin suspension nor deactivates a pending invitation', async () => {
    const owner = await partnerWithHotel();
    const suspended = await t.signInStaff(owner.hotelId, 'sam@hotel.test');
    await t.prisma.userAccount.update({
      where: { userAccountId: suspended.id },
      data: { status: 'SUSPENDED' },
    });
    const invited = await invitedStaff(owner.hotelId, 'zed@hotel.test');

    for (const action of ['activate', 'deactivate']) {
      const res = await post(
        `/hotel-staff/${suspended.id}/${action}`,
        owner.token,
      ).expect(409);
      expect(res.body.code).toBe('STAFF_STATUS_CONFLICT');
    }
    await post(
      `/hotel-staff/${invited.userAccountId}/deactivate`,
      owner.token,
    ).expect(409);

    const statuses = await t.prisma.userAccount.findMany({
      where: { userAccountId: { in: [suspended.id, invited.userAccountId] } },
      select: { status: true },
      orderBy: { email: 'asc' },
    });
    expect(statuses.map((s) => s.status)).toEqual(['SUSPENDED', 'INVITED']);
  });

  it('hides staff from other partners and keeps staff from managing colleagues', async () => {
    const owner = await partnerWithHotel('a@hotel.test');
    const other = await partnerWithHotel('b@hotel.test');
    const anna = await t.signInStaff(owner.hotelId, 'anna@hotel.test', [
      'BOOKING',
      'FRONT_DESK',
      'CUSTOMER_CARE',
      'REFUND',
      'MARKETING',
    ]);
    const ben = await t.signInStaff(owner.hotelId, 'ben@hotel.test');

    for (const id of [ben.id, 'not-a-uuid']) {
      const res = await post(
        `/hotel-staff/${id}/deactivate`,
        other.token,
      ).expect(404);
      expect(res.body.code).toBe('STAFF_NOT_FOUND');
    }
    // Even with every permission group, staff do not manage other staff.
    const forbidden = await post(
      `/hotel-staff/${ben.id}/deactivate`,
      anna.token,
    ).expect(403);
    expect(forbidden.body.code).toBe('FORBIDDEN');
    await t
      .api()
      .patch(`/api/v1/hotel-staff/${ben.id}/permissions`)
      .set(auth(anna.token))
      .send({ permissions: ['REFUND'] })
      .expect(403);
  });

  it('cancels a pending invitation: the link stops working and the email is free again', async () => {
    const owner = await partnerWithHotel('a@hotel.test');
    const other = await partnerWithHotel('b@hotel.test');
    const invite = (token: string, hotelId: string) =>
      t.api().post('/api/v1/auth/invitations/staff').set(auth(token)).send({
        email: 'typo@hotel.test',
        fullName: 'Typo',
        hotelId,
        position: 'Receptionist',
      });

    const invited = (await invite(owner.token, owner.hotelId).expect(201)).body
      .data as { id: string };
    const mail = t.outbox.find((m) => m.to === 'typo@hotel.test');
    const link = decodeURIComponent(mail!.text.match(/token=([^\s]+)/)![1]);
    // While the account exists, another hotel cannot invite the same email.
    await invite(other.token, other.hotelId).expect(409);

    await t
      .api()
      .delete(`/api/v1/hotel-staff/${invited.id}`)
      .set(auth(owner.token))
      .expect(204);
    expect(
      await t.prisma.userAccount.count({ where: { email: 'typo@hotel.test' } }),
    ).toBe(0);
    const accepted = await t
      .api()
      .post('/api/v1/auth/invitations/accept')
      .send({ token: link, password: PASSWORD })
      .expect(400);
    expect(accepted.body.code).toBe('AUTH_TOKEN_INVALID');
    await invite(other.token, other.hotelId).expect(201);

    const logs = await t.prisma.auditLog.count({
      where: { hotelPartnerId: owner.id, action: 'STAFF_INVITATION_CANCELLED' },
    });
    expect(logs).toBe(1);
  });

  it('cancels only pending invitations, and only for the owner', async () => {
    const owner = await partnerWithHotel('a@hotel.test');
    const other = await partnerWithHotel('b@hotel.test');
    const active = await t.signInStaff(owner.hotelId, 'anna@hotel.test');
    const invited = await invitedStaff(owner.hotelId, 'zed@hotel.test');
    const cancel = (id: string, token: string) =>
      t.api().delete(`/api/v1/hotel-staff/${id}`).set(auth(token));

    const used = await cancel(active.id, owner.token).expect(409);
    expect(used.body.code).toBe('STAFF_STATUS_CONFLICT');
    const hidden = await cancel(invited.userAccountId, other.token).expect(404);
    expect(hidden.body.code).toBe('STAFF_NOT_FOUND');
    await cancel(invited.userAccountId, active.token).expect(403);
    await cancel('not-a-uuid', owner.token).expect(404);

    expect(
      await t.prisma.userAccount.count({
        where: { userAccountId: { in: [active.id, invited.userAccountId] } },
      }),
    ).toBe(2);
  });

  it('answers a double cancel with 404 for the late request', async () => {
    const owner = await partnerWithHotel();
    const invited = await invitedStaff(owner.hotelId, 'zed@hotel.test');
    const cancel = () =>
      t
        .api()
        .delete(`/api/v1/hotel-staff/${invited.userAccountId}`)
        .set(auth(owner.token));

    const results = await Promise.all([cancel(), cancel()]);
    expect(results.map((r) => r.status).sort()).toEqual([204, 404]);
    expect(results.find((r) => r.status === 404)!.body.code).toBe(
      'STAFF_NOT_FOUND',
    );
    // Sequentially as well.
    await cancel().expect(404);
  });

  it('a suspended partner cannot change its staff', async () => {
    const owner = await partnerWithHotel();
    const staff = await t.signInStaff(owner.hotelId, 'anna@hotel.test');
    await t.prisma.hotelPartner.update({
      where: { hotelPartnerId: owner.id },
      data: { status: 'SUSPENDED' },
    });

    await t
      .api()
      .get(`/api/v1/hotels/${owner.hotelId}/staff`)
      .set(auth(owner.token))
      .expect(200);
    const res = await post(
      `/hotel-staff/${staff.id}/deactivate`,
      owner.token,
    ).expect(403);
    expect(res.body.code).toBe('PARTNER_SUSPENDED');
  });
});
