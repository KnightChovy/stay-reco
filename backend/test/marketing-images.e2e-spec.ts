import { createTestApp, FILES } from './helpers';

/**
 * The picture that goes out with a post (M18).
 *
 * Staff upload a file; the API hosts it and hands Meta a URL, because Meta fetches the image itself. What matters
 * here is the window: a picture may be changed exactly as long as the words may, and not a moment longer.
 */
describe('A picture on marketing content (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;
  const dataOf = <T>(res: { body: unknown }) => (res.body as { data: T }).data;

  /** An ACTIVE hotel with one room type. */
  const hotel = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const created = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'An Nhiên Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: `contact-${email}`,
        checkInTime: '14:00',
      })
      .expect(201);
    const hotelId = idOf(created);
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    await t
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
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId };
  };

  /** A draft the AI just wrote. */
  const draft = async (token: string, hotelId: string) => {
    const res = await t
      .api()
      .post(`/api/v1/hotels/${hotelId}/marketing-content/generate`)
      .set(auth(token))
      .send({ contentType: 'POST', brief: 'Cuối tuần còn phòng' })
      .expect(201);
    return idOf(res);
  };

  /** The storage key behind a `https://cdn.test/<key>.png` url, which is what the fake hands back. */
  const keyOf = (url: string) =>
    url.replace(/^https:\/\/cdn\.test\//, '').replace(/\.png$/, '');

  const upload = (token: string, contentId: string, file = FILES.png) =>
    t
      .api()
      .post(`/api/v1/marketing-content/${contentId}/image`)
      .set(auth(token))
      .attach('file', file, 'post.png');

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
    t.ai.answer = {
      title: 'Cuối tuần bên sông Hàn',
      body: 'Mình còn vài phòng hướng biển cho cuối tuần này, bạn ghé nhé.',
    };
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('lets a staff member upload rather than find a URL somewhere', async () => {
    const h = await hotel();
    const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
      'MARKETING',
    ]);
    const id = await draft(staff.token, h.hotelId);

    const res = await upload(staff.token, id).expect(201);

    expect(dataOf<{ mediaUrl: string }>(res).mediaUrl).toMatch(
      /^https:\/\/cdn\.test\//,
    );
    // Its own folder, so marketing pictures are not mixed in with room photos.
    expect(t.storage.uploads).toEqual([
      { folder: 'marketing', private: false },
    ]);
  });

  it('replaces the picture and deletes the file it replaced', async () => {
    const h = await hotel();
    const id = await draft(h.token, h.hotelId);
    const first = dataOf<{ mediaUrl: string }>(
      await upload(h.token, id),
    ).mediaUrl;

    const second = dataOf<{ mediaUrl: string }>(
      await upload(h.token, id, FILES.jpg).expect(201),
    ).mediaUrl;

    expect(second).not.toBe(first);
    // The old file is not left behind in storage, paid for and pointed at by nothing.
    expect(t.storage.deleted).toEqual([keyOf(first)]);
  });

  it('takes the picture off and deletes the file', async () => {
    const h = await hotel();
    const id = await draft(h.token, h.hotelId);
    const url = dataOf<{ mediaUrl: string }>(
      await upload(h.token, id),
    ).mediaUrl;

    const res = await t
      .api()
      .delete(`/api/v1/marketing-content/${id}/image`)
      .set(auth(h.token))
      .expect(200);

    expect(dataOf<{ mediaUrl: string | null }>(res).mediaUrl).toBeNull();
    expect(t.storage.deleted).toEqual([keyOf(url)]);
  });

  it('refuses a file that is not an image', async () => {
    const h = await hotel();
    const id = await draft(h.token, h.hotelId);

    const res = await upload(h.token, id, FILES.text).expect(400);

    expect(res.body.code).toBe('UPLOAD_INVALID_FILE');
    expect(t.storage.uploads).toHaveLength(0);
  });

  it('will not change the picture once the owner has approved it', async () => {
    const h = await hotel();
    const id = await draft(h.token, h.hotelId);
    await upload(h.token, id);
    t.storage.clear();
    for (const step of ['submit', 'approve']) {
      await t
        .api()
        .post(`/api/v1/marketing-content/${id}/${step}`)
        .set(auth(h.token))
        .expect(200);
    }

    // What the owner approved is what goes out, and that includes which photograph is attached.
    const res = await upload(h.token, id).expect(409);
    expect(res.body.code).toBe('CONTENT_STATUS_CONFLICT');
    expect(t.storage.uploads).toHaveLength(0);
  });

  it('lets a writer swap the picture after a rejection', async () => {
    const h = await hotel();
    const staff = await t.signInStaff(h.hotelId, 'staff@hotel.test', [
      'MARKETING',
    ]);
    const id = await draft(staff.token, h.hotelId);
    await upload(staff.token, id);
    await t
      .api()
      .post(`/api/v1/marketing-content/${id}/submit`)
      .set(auth(staff.token))
      .expect(200);
    await t
      .api()
      .post(`/api/v1/marketing-content/${id}/reject`)
      .set(auth(h.token))
      .send({ reason: 'Ảnh tối quá, đổi ảnh khác nhé' })
      .expect(200);

    // A rejection sends it back to the writer: the whole point is that they can fix what was wrong with it.
    await upload(staff.token, id, FILES.webp).expect(201);
  });

  it('takes the file with it when the draft is deleted', async () => {
    const h = await hotel();
    const id = await draft(h.token, h.hotelId);
    const url = dataOf<{ mediaUrl: string }>(
      await upload(h.token, id),
    ).mediaUrl;

    await t
      .api()
      .delete(`/api/v1/marketing-content/${id}`)
      .set(auth(h.token))
      .expect(204);

    expect(t.storage.deleted).toEqual([keyOf(url)]);
  });

  it("refuses another hotel's content as if it did not exist", async () => {
    const mine = await hotel();
    const other = await hotel('owner2@hotel.test');
    const id = await draft(other.token, other.hotelId);

    const res = await upload(mine.token, id).expect(404);
    expect(res.body.code).toBe('CONTENT_NOT_FOUND');
  });

  it('leaves a pasted URL alone, because the file is not ours to delete', async () => {
    const h = await hotel();
    const id = await draft(h.token, h.hotelId);
    await t
      .api()
      .patch(`/api/v1/marketing-content/${id}`)
      .set(auth(h.token))
      .send({ mediaUrl: 'https://example.test/someone-elses.jpg' })
      .expect(200);

    await upload(h.token, id).expect(201);

    // Deleting a URL we never uploaded would be deleting someone else's file on a guess.
    expect(t.storage.deleted).toHaveLength(0);
  });
});
