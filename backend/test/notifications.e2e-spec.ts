import { createTestApp } from './helpers';

describe('In-app notifications (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  /** Writes `count` notifications for the account, one minute apart, the newest last. */
  const seed = async (userAccountId: string, count: number, read = false) => {
    const start = Date.now() - count * 60_000;
    for (let i = 0; i < count; i++) {
      await t.prisma.notification.create({
        data: {
          userAccountId,
          type: 'BOOKING',
          title: `Thông báo ${i + 1}`,
          message: `Nội dung ${i + 1}`,
          link: `/account/bookings/${i + 1}`,
          isRead: read,
          createdAt: new Date(start + i * 60_000),
        },
      });
    }
  };

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('lists my notifications newest first, with the unread filter and paging', async () => {
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const other = await t.signIn('CUSTOMER', 'other@mail.test');
    await seed(me.id, 3);
    await seed(me.id, 1, true);
    await seed(other.id, 2);

    const page = await t
      .api()
      .get('/api/v1/me/notifications?pageSize=2')
      .set(auth(me.token))
      .expect(200);
    expect(page.body.meta).toMatchObject({ page: 1, pageSize: 2, total: 4 });
    expect(page.body.data[0]).toMatchObject({
      type: 'BOOKING',
      title: 'Thông báo 1',
      isRead: true,
      link: '/account/bookings/1',
    });

    const unread = await t
      .api()
      .get('/api/v1/me/notifications?unread=true')
      .set(auth(me.token))
      .expect(200);
    expect(
      (unread.body.data as { title: string }[]).map((n) => n.title),
    ).toEqual(['Thông báo 3', 'Thông báo 2', 'Thông báo 1']);

    const count = await t
      .api()
      .get('/api/v1/me/notifications/unread-count')
      .set(auth(me.token))
      .expect(200);
    expect(count.body.data).toEqual({ count: 3 });
  });

  it('marks one or all as read, only for the recipient', async () => {
    const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
    const other = await t.signIn('HOTEL_PARTNER', 'other@hotel.test');
    await seed(partner.id, 3);
    const [first] = await t.prisma.notification.findMany({
      where: { userAccountId: partner.id },
      orderBy: { createdAt: 'asc' },
    });
    const read = (token: string, id: string) =>
      t.api().post(`/api/v1/me/notifications/${id}/read`).set(auth(token));

    const res = await read(partner.token, first.notificationId).expect(200);
    expect(res.body.data).toMatchObject({
      id: first.notificationId,
      isRead: true,
    });
    // Again: no error.
    await read(partner.token, first.notificationId).expect(200);
    const hidden = await read(other.token, first.notificationId).expect(404);
    expect(hidden.body.code).toBe('NOTIFICATION_NOT_FOUND');
    await read(partner.token, 'not-a-uuid').expect(404);

    const all = await t
      .api()
      .post('/api/v1/me/notifications/read-all')
      .set(auth(partner.token))
      .expect(200);
    expect(all.body.data).toEqual({ updated: 2 });
    const count = await t
      .api()
      .get('/api/v1/me/notifications/unread-count')
      .set(auth(partner.token))
      .expect(200);
    expect(count.body.data).toEqual({ count: 0 });

    await t.api().get('/api/v1/me/notifications').expect(401);
  });
});
