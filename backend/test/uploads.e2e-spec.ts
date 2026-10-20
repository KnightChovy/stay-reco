import { createTestApp, FILES } from './helpers';

describe('Uploads (e2e)', () => {
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

  const uploadImage = (
    token: string,
    hotelId: string,
    file: Buffer = FILES.png,
    fields: Record<string, string> = {},
  ) => {
    const req = t
      .api()
      .post(`/api/v1/hotels/${hotelId}/images`)
      .set(auth(token))
      .attach('file', file, 'photo.png');
    for (const [key, value] of Object.entries(fields)) req.field(key, value);
    return req;
  };

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(() => t.reset());

  afterAll(() => t.app.close());

  describe('hotel images', () => {
    it('uploads images; the first one and any marked isCover become the cover', async () => {
      const { token, hotelId } = await partnerWithHotel();

      const first = await uploadImage(token, hotelId, FILES.jpg).expect(201);
      expect(first.body.data).toEqual({
        id: expect.any(String),
        url: expect.stringContaining(`stayreco/hotels/${hotelId}/`),
        caption: null,
        isCover: true,
        sortOrder: 0,
      });
      expect(t.storage.uploads).toEqual([
        { folder: `stayreco/hotels/${hotelId}`, private: false },
      ]);

      const second = await uploadImage(token, hotelId, FILES.webp, {
        caption: 'Lobby',
        isCover: 'true',
      }).expect(201);
      expect(second.body.data).toMatchObject({
        caption: 'Lobby',
        isCover: true,
        sortOrder: 1,
      });

      const hotel = await t
        .api()
        .get(`/api/v1/hotels/${hotelId}`)
        .set(auth(token))
        .expect(200);
      const images = hotel.body.data.images as { isCover: boolean }[];
      expect(images.map((i) => i.isCover)).toEqual([false, true]);

      const mine = await t
        .api()
        .get('/api/v1/me/hotels')
        .set(auth(token))
        .expect(200);
      expect(mine.body.data[0].coverImageUrl).toBe(second.body.data.url);
    });

    it('rejects files that are missing, not an image or too large', async () => {
      const { token, hotelId } = await partnerWithHotel();

      const fake = await uploadImage(token, hotelId, FILES.text).expect(400);
      expect(fake.body.code).toBe('UPLOAD_INVALID_FILE');

      const pdf = await uploadImage(token, hotelId, FILES.pdf).expect(400);
      expect(pdf.body.code).toBe('UPLOAD_INVALID_FILE');

      const missing = await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/images`)
        .set(auth(token))
        .field('caption', 'No file')
        .expect(400);
      expect(missing.body.code).toBe('UPLOAD_INVALID_FILE');

      const big = Buffer.concat([FILES.png, Buffer.alloc(10 * 1024 * 1024)]);
      const tooLarge = await uploadImage(token, hotelId, big).expect(400);
      expect(tooLarge.body.code).toBe('UPLOAD_INVALID_FILE');

      const badField = await uploadImage(token, hotelId, FILES.png, {
        isCover: 'maybe',
      }).expect(400);
      expect(badField.body.code).toBe('VALIDATION_ERROR');

      expect(t.storage.uploads).toEqual([]);
    });

    it('limits the number of images per hotel', async () => {
      const { token, hotelId } = await partnerWithHotel();
      await t.prisma.hotelImage.createMany({
        data: Array.from({ length: 30 }, (_, i) => ({
          hotelId,
          imageUrl: `https://cdn.test/${i}.png`,
          storageKey: `k${i}`,
          sortOrder: i,
        })),
      });

      const res = await uploadImage(token, hotelId).expect(409);
      expect(res.body.code).toBe('IMAGE_LIMIT_REACHED');
      expect(t.storage.uploads).toEqual([]);
    });

    it('moves the cover, edits captions and promotes the next image when the cover is deleted', async () => {
      const { token, hotelId } = await partnerWithHotel();
      const a = (await uploadImage(token, hotelId).expect(201)).body.data;
      const b = (await uploadImage(token, hotelId).expect(201)).body.data;

      const moved = await t
        .api()
        .patch(`/api/v1/hotel-images/${b.id}`)
        .set(auth(token))
        .send({ isCover: true, caption: 'Pool' })
        .expect(200);
      expect(moved.body.data).toMatchObject({ isCover: true, caption: 'Pool' });

      await t
        .api()
        .patch(`/api/v1/hotel-images/${b.id}`)
        .set(auth(token))
        .send({ isCover: false })
        .expect(400);

      await t
        .api()
        .delete(`/api/v1/hotel-images/${b.id}`)
        .set(auth(token))
        .expect(204);
      const left = await t.prisma.hotelImage.findMany({ where: { hotelId } });
      expect(left).toEqual([
        expect.objectContaining({ hotelImageId: a.id, isCover: true }),
      ]);
      expect(t.storage.deleted).toHaveLength(1);
    });

    it('only the owner manages images', async () => {
      const owner = await partnerWithHotel('a@hotel.test');
      const other = await t.signIn('HOTEL_PARTNER', 'b@hotel.test');
      const staff = await t.signInStaff(owner.hotelId, 'staff@hotel.test', [
        'MARKETING',
      ]);
      const image = (await uploadImage(owner.token, owner.hotelId).expect(201))
        .body.data;

      const forbidden = await uploadImage(staff.token, owner.hotelId).expect(
        403,
      );
      expect(forbidden.body.code).toBe('FORBIDDEN');
      const hidden = await uploadImage(other.token, owner.hotelId).expect(404);
      expect(hidden.body.code).toBe('HOTEL_NOT_FOUND');

      for (const id of [image.id, 'not-a-uuid']) {
        const res = await t
          .api()
          .delete(`/api/v1/hotel-images/${id}`)
          .set(auth(other.token))
          .expect(404);
        expect(res.body.code).toBe('IMAGE_NOT_FOUND');
      }
      await t
        .api()
        .patch(`/api/v1/hotel-images/${image.id}`)
        .set(auth(staff.token))
        .send({ caption: 'x' })
        .expect(403);
      expect(await t.prisma.hotelImage.count()).toBe(1);
    });
  });

  describe('verification documents', () => {
    it('stores PDF/JPG/PNG privately in the partner folder', async () => {
      const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');

      for (const file of [FILES.pdf, FILES.jpg, FILES.png]) {
        const res = await t
          .api()
          .post('/api/v1/uploads/verification-documents')
          .set(auth(partner.token))
          .attach('file', file, 'license.pdf')
          .expect(201);
        expect(res.body.data.fileId).toMatch(
          new RegExp(`^stayreco/verification/${partner.id}/`),
        );
      }
      expect(t.storage.uploads.every((u) => u.private)).toBe(true);

      const webp = await t
        .api()
        .post('/api/v1/uploads/verification-documents')
        .set(auth(partner.token))
        .attach('file', FILES.webp, 'license.webp')
        .expect(400);
      expect(webp.body.code).toBe('UPLOAD_INVALID_FILE');
    });

    it('only active partners can upload documents', async () => {
      const customer = await t.signIn('CUSTOMER', 'guest@mail.test');
      await t
        .api()
        .post('/api/v1/uploads/verification-documents')
        .set(auth(customer.token))
        .attach('file', FILES.pdf, 'license.pdf')
        .expect(403);

      const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
      await t.prisma.hotelPartner.update({
        where: { hotelPartnerId: partner.id },
        data: { status: 'SUSPENDED' },
      });
      const res = await t
        .api()
        .post('/api/v1/uploads/verification-documents')
        .set(auth(partner.token))
        .attach('file', FILES.pdf, 'license.pdf')
        .expect(403);
      expect(res.body.code).toBe('PARTNER_SUSPENDED');
      expect(t.storage.uploads).toEqual([]);
    });
  });
});
