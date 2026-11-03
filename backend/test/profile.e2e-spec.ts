import { createTestApp, FILES } from './helpers';

describe('My profile (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const patchProfile = (token: string, body: object) =>
    t.api().patch('/api/v1/me/profile').set(auth(token)).send(body);

  const uploadAvatar = (token: string, file: Buffer = FILES.png) =>
    t
      .api()
      .post('/api/v1/me/avatar')
      .set(auth(token))
      .attach('file', file, 'me.png');

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  describe('PATCH /me/profile', () => {
    it('lets a customer fill in and clear the profile, returned by /auth/me too', async () => {
      const { token } = await t.signIn('CUSTOMER', 'an@guest.test');

      const res = await patchProfile(token, {
        fullName: '  Nguyễn An ',
        phone: '+84912345678',
        dateOfBirth: '1995-04-30',
        gender: 'FEMALE',
        nationality: 'Việt Nam',
      }).expect(200);
      expect(res.body.data).toMatchObject({
        fullName: 'Nguyễn An',
        phone: '+84912345678',
        profile: {
          dateOfBirth: '1995-04-30',
          gender: 'FEMALE',
          nationality: 'Việt Nam',
        },
      });

      await patchProfile(token, { phone: null, gender: null }).expect(200);
      const me = await t
        .api()
        .get('/api/v1/auth/me')
        .set(auth(token))
        .expect(200);
      expect(me.body.data).toMatchObject({
        fullName: 'Nguyễn An',
        phone: null,
        profile: {
          dateOfBirth: '1995-04-30',
          gender: null,
          nationality: 'Việt Nam',
        },
      });
    });

    it('renames the partner and keeps its contact phone in step with the account phone', async () => {
      const { id, token } = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');

      const res = await patchProfile(token, {
        companyName: 'Sea View Co',
        phone: '0987654321',
      }).expect(200);
      expect(res.body.data).toMatchObject({
        phone: '0987654321',
        profile: { partnerName: 'Sea View Co', status: 'PENDING' },
      });
      await expect(
        t.prisma.hotelPartner.findUniqueOrThrow({
          where: { hotelPartnerId: id },
          select: { contactPhone: true },
        }),
      ).resolves.toEqual({ contactPhone: '0987654321' });

      const audit = await t.prisma.auditLog.findFirstOrThrow({
        where: { action: 'PROFILE_UPDATED', hotelPartnerId: id },
      });
      expect(JSON.parse(audit.newValue!)).toEqual({
        fields: ['phone', 'companyName'],
      });
    });

    it('refuses fields of another role and a partner clearing its phone', async () => {
      const customer = await t.signIn('CUSTOMER', 'an@guest.test');
      const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');

      const wrongRole = await patchProfile(customer.token, {
        companyName: 'Mine',
      }).expect(400);
      expect(wrongRole.body).toMatchObject({
        code: 'VALIDATION_ERROR',
        details: [{ field: 'companyName' }],
      });

      const noPhone = await patchProfile(partner.token, {
        phone: null,
      }).expect(400);
      expect(noPhone.body.details).toEqual([
        { field: 'phone', message: 'a partner account needs a phone number' },
      ]);
    });

    it('validates the body: empty, unknown fields, bad phone and impossible birth dates', async () => {
      const { token } = await t.signIn('CUSTOMER', 'an@guest.test');

      for (const body of [
        {},
        { email: 'new@guest.test' },
        { fullName: '   ' },
        { phone: '12ab' },
        { dateOfBirth: '1899-12-31' },
        { dateOfBirth: '9999-01-01' },
        { dateOfBirth: '2001-02-30' },
        { gender: 'UNKNOWN' },
        { nationality: 'x'.repeat(101) },
      ]) {
        const res = await patchProfile(token, body);
        expect([res.status, res.body.code, body]).toEqual([
          400,
          'VALIDATION_ERROR',
          body,
        ]);
      }
    });

    it('needs a signed-in account', async () => {
      await t
        .api()
        .patch('/api/v1/me/profile')
        .send({ fullName: 'X' })
        .expect(401);
    });
  });

  describe('avatar', () => {
    it('uploads, replaces (deleting the old file) and removes the avatar', async () => {
      const { id, token } = await t.signIn('CUSTOMER', 'an@guest.test');
      const folder = `stayreco/avatars/${id}`;

      const first = await uploadAvatar(token).expect(200);
      const firstUrl = first.body.data.avatarUrl as string;
      expect(firstUrl).toContain(`${folder}/`);
      expect(t.storage.uploads).toEqual([{ folder, private: false }]);

      const second = await uploadAvatar(token, FILES.jpg).expect(200);
      expect(second.body.data.avatarUrl).not.toBe(firstUrl);
      expect(t.storage.deleted).toEqual([t.storage.imageKeyFromUrl(firstUrl)]);

      await t.api().delete('/api/v1/me/avatar').set(auth(token)).expect(204);
      const me = await t
        .api()
        .get('/api/v1/auth/me')
        .set(auth(token))
        .expect(200);
      expect(me.body.data.avatarUrl).toBeNull();
      expect(t.storage.deleted).toHaveLength(2);

      // Nothing left to remove: still 204, nothing deleted.
      await t.api().delete('/api/v1/me/avatar').set(auth(token)).expect(204);
      expect(t.storage.deleted).toHaveLength(2);
    });

    it('keeps an avatar URL that was not uploaded through StayReco', async () => {
      const { id, token } = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
      await t.prisma.userAccount.update({
        where: { userAccountId: id },
        data: { avatarUrl: 'https://example.com/seed.png' },
      });

      await uploadAvatar(token).expect(200);
      expect(t.storage.deleted).toEqual([]);
    });

    it('rejects a file that is not an image', async () => {
      const { token } = await t.signIn('CUSTOMER', 'an@guest.test');
      const res = await uploadAvatar(token, FILES.pdf).expect(400);
      expect(res.body.code).toBe('UPLOAD_INVALID_FILE');
      expect(t.storage.uploads).toEqual([]);
    });
  });
});
