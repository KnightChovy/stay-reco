import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp, FILES } from './helpers';

describe('Review photos and content reports (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let criteria: { id: string }[];

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const idOf = (res: { body: unknown }) =>
    (res.body as { data: { id: string } }).data.id;

  const hotel = async (email = 'owner@hotel.test') => {
    const partner = await t.signIn('HOTEL_PARTNER', email);
    const created = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'Riverside',
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
    const typeRes = await t
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
    const roomTypeId = idOf(typeRes);
    for (const roomNumber of ['101', '102']) {
      await t
        .api()
        .post(`/api/v1/hotels/${hotelId}/rooms`)
        .set(auth(partner.token))
        .send({ roomTypeId, roomNumber })
        .expect(201);
    }
    await t.prisma.hotel.update({
      where: { hotelId },
      data: { status: 'ACTIVE' },
    });
    return { ...partner, hotelId, roomTypeId };
  };

  /** A stay taken all the way to COMPLETED, then its rooms freed. */
  const completedStay = async (
    guestToken: string,
    h: { token: string; roomTypeId: string; hotelId: string },
  ) => {
    const res = await t
      .api()
      .post('/api/v1/bookings')
      .set(auth(guestToken))
      .send({
        roomTypeId: h.roomTypeId,
        checkIn: day(0),
        checkOut: day(2),
        rooms: 1,
        guests: 1,
        guestName: 'Nguyễn Văn A',
        contactPhone: '0905123456',
        expectedTotal: 2000000,
      })
      .expect(201);
    const booking = res.body.data as { id: string; code: string };
    await t.app.get(PaymentConfirmationService).confirm({
      code: booking.code,
      amount: 2000000,
      transactionId: `txn-${booking.code}`,
      paidAt: new Date(),
    });
    for (const action of ['check-in', 'check-out']) {
      await t
        .api()
        .post(`/api/v1/bookings/${booking.id}/${action}`)
        .set(auth(h.token))
        .send({})
        .expect(200);
    }
    const rooms = await t.prisma.room.findMany({
      where: { status: 'CLEANING', roomType: { hotelId: h.hotelId } },
      select: { roomId: true },
    });
    for (const { roomId } of rooms) {
      await t
        .api()
        .post(`/api/v1/rooms/${roomId}/clean`)
        .set(auth(h.token))
        .expect(200);
    }
    return booking;
  };

  /** A review of a completed stay, scoring every criterion the same. */
  const review = async (
    guestToken: string,
    h: { token: string; roomTypeId: string; hotelId: string },
    score = 4,
  ) => {
    const booking = await completedStay(guestToken, h);
    const res = await t
      .api()
      .post(`/api/v1/bookings/${booking.id}/reviews`)
      .set(auth(guestToken))
      .send({
        content: 'Phòng ổn, nhân viên thân thiện.',
        subRatings: criteria.map((c) => ({ criterionId: c.id, score })),
      })
      .expect(201);
    return idOf(res);
  };

  const addPhoto = (token: string, reviewId: string) =>
    t
      .api()
      .post(`/api/v1/reviews/${reviewId}/images`)
      .set(auth(token))
      .attach('file', FILES.png, 'photo.png');

  beforeAll(async () => {
    t = await createTestApp();
    await t.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE amenity, bed_type, rating_criterion RESTART IDENTITY CASCADE',
    );
    king = (
      await t.prisma.bedType.create({
        data: { name: 'Giường King', capacity: 2 },
      })
    ).bedTypeId;
    await t.prisma.ratingCriterion.createMany({
      data: [
        { name: 'Vệ sinh', weight: 0.5 },
        { name: 'Vị trí', weight: 0.5 },
      ],
    });
    const res = await t.api().get('/api/v1/rating-criteria').expect(200);
    criteria = res.body.data;
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('Adding photos', () => {
    it('attaches a photo to the review and answers the review with it', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);

      const res = await addPhoto(guest.token, reviewId).expect(201);
      expect(res.body.data.images).toHaveLength(1);
      expect(res.body.data.images[0]).toMatchObject({
        width: 1600,
        height: 1200,
      });
      expect(t.storage.uploads).toEqual([
        { folder: 'reviews', private: false },
      ]);
    });

    it('shows the photos on the hotel page, in the order they were added', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);
      await addPhoto(guest.token, reviewId).expect(201);
      await addPhoto(guest.token, reviewId).expect(201);

      const list = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews`)
        .expect(200);
      const urls = (
        list.body.data as { images: { url: string }[] }[]
      )[0].images.map((i) => i.url);
      expect(urls).toHaveLength(2);
      expect(urls[0]).not.toBe(urls[1]);
    });

    it('accepts a portrait photo from a phone', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);
      t.storage.nextSize = { width: 3024, height: 4032 };

      await addPhoto(guest.token, reviewId).expect(201);
    });

    it('refuses a panorama, and deletes the file it had already uploaded', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);
      t.storage.nextSize = { width: 4000, height: 1000 };

      const res = await addPhoto(guest.token, reviewId);
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('UPLOAD_INVALID_FILE');
      // Nothing is left paid for and unreferenced.
      expect(t.storage.deleted).toHaveLength(1);
      const stored = await t.prisma.reviewImage.count({ where: { reviewId } });
      expect(stored).toBe(0);
    });

    it('refuses the sixth photo', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);
      for (let i = 0; i < 5; i++)
        await addPhoto(guest.token, reviewId).expect(201);

      const res = await addPhoto(guest.token, reviewId);
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('5 photos');
    });

    it('refuses a file that is not an image whatever it is called', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);

      const res = await t
        .api()
        .post(`/api/v1/reviews/${reviewId}/images`)
        .set(auth(guest.token))
        .attach('file', FILES.text, 'photo.png');
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('UPLOAD_INVALID_FILE');
    });

    it("refuses someone else's review", async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'stranger@mail.test');
      const reviewId = await review(guest.token, h);

      const res = await addPhoto(stranger.token, reviewId);
      expect(res.status).toBe(404);
      expect(res.body.code).toBe('REVIEW_NOT_FOUND');
    });

    it('refuses once the review window has closed', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);
      const { bookingId } = await t.prisma.review.findUniqueOrThrow({
        where: { reviewId },
      });
      await t.prisma.$executeRaw`
        UPDATE booking SET check_out_date = check_out_date - 365
        WHERE booking_id = ${bookingId}::uuid`;

      const res = await addPhoto(guest.token, reviewId);
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('REVIEW_WINDOW_CLOSED');
    });
  });

  describe('Removing a photo', () => {
    it('removes the row and the file', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h);
      const added = await addPhoto(guest.token, reviewId).expect(201);
      const imageId = (added.body.data as { images: { id: string }[] })
        .images[0].id;

      const res = await t
        .api()
        .delete(`/api/v1/review-images/${imageId}`)
        .set(auth(guest.token))
        .expect(200);
      expect(res.body.data.images).toHaveLength(0);
      expect(t.storage.deleted).toHaveLength(1);
    });

    it("refuses someone else's photo", async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'stranger@mail.test');
      const reviewId = await review(guest.token, h);
      const added = await addPhoto(guest.token, reviewId).expect(201);
      const imageId = (added.body.data as { images: { id: string }[] })
        .images[0].id;

      const res = await t
        .api()
        .delete(`/api/v1/review-images/${imageId}`)
        .set(auth(stranger.token));
      expect(res.status).toBe(404);
    });
  });

  describe('Reporting', () => {
    it('lets the reviewed hotel flag a review it cannot hide', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const reviewId = await review(guest.token, h, 1);

      const res = await t
        .api()
        .post(`/api/v1/reviews/${reviewId}/reports`)
        .set(auth(h.token))
        .send({ reason: 'NOT_A_STAY', note: 'Khách này chưa từng ở.' })
        .expect(201);
      expect(res.body.data).toMatchObject({
        reviewId,
        reason: 'NOT_A_STAY',
        status: 'OPEN',
        reporterRole: 'HOTEL_PARTNER',
        hotelName: 'Riverside',
      });

      // Reporting does not hide anything on its own.
      const list = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews`)
        .expect(200);
      expect(list.body.data).toHaveLength(1);
    });

    it('lets any customer flag one photo rather than the whole review', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const passerby = await t.signIn('CUSTOMER', 'passerby@mail.test');
      const reviewId = await review(guest.token, h);
      const added = await addPhoto(guest.token, reviewId).expect(201);
      const imageId = (added.body.data as { images: { id: string }[] })
        .images[0].id;

      const res = await t
        .api()
        .post(`/api/v1/reviews/${reviewId}/reports`)
        .set(auth(passerby.token))
        .send({ reason: 'OFFENSIVE', reviewImageId: imageId })
        .expect(201);
      expect(res.body.data.reviewImageId).toBe(imageId);
    });

    it('refuses the same person flagging the same thing twice', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const passerby = await t.signIn('CUSTOMER', 'passerby@mail.test');
      const reviewId = await review(guest.token, h);
      const flag = () =>
        t
          .api()
          .post(`/api/v1/reviews/${reviewId}/reports`)
          .set(auth(passerby.token))
          .send({ reason: 'SPAM_OR_ADVERT' });

      await flag().expect(201);
      const again = await flag();
      expect(again.status).toBe(409);
      expect(again.body.code).toBe('REPORT_ALREADY_RAISED');
    });

    it('keeps the queue away from everyone but a platform manager', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      for (const token of [h.token, guest.token]) {
        const res = await t
          .api()
          .get('/api/v1/content-reports')
          .set(auth(token));
        expect(res.status).toBe(403);
      }
    });
  });

  describe('Deciding a report', () => {
    it('hides the review when the manager resolves it that way', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const reviewId = await review(guest.token, h, 1);
      const report = await t
        .api()
        .post(`/api/v1/reviews/${reviewId}/reports`)
        .set(auth(h.token))
        .send({ reason: 'NOT_A_STAY' })
        .expect(201);

      const queue = await t
        .api()
        .get('/api/v1/content-reports')
        .set(auth(manager.token))
        .expect(200);
      expect(queue.body.data).toHaveLength(1);

      const decided = await t
        .api()
        .post(`/api/v1/content-reports/${idOf(report)}/decide`)
        .set(auth(manager.token))
        .send({
          status: 'RESOLVED',
          hide: true,
          resolution: 'Không có lưu trú.',
        })
        .expect(200);
      expect(decided.body.data).toMatchObject({
        status: 'RESOLVED',
        resolution: 'Không có lưu trú.',
      });

      const list = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews`)
        .expect(200);
      expect(list.body.data).toHaveLength(0);

      // The author still sees their own hidden review.
      const mine = await t
        .api()
        .get('/api/v1/me/reviews')
        .set(auth(guest.token))
        .expect(200);
      expect(mine.body.data[0].isVisible).toBe(false);
    });

    it('removes only the flagged photo, leaving the review up', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const reviewId = await review(guest.token, h);
      const added = await addPhoto(guest.token, reviewId).expect(201);
      await addPhoto(guest.token, reviewId).expect(201);
      const imageId = (added.body.data as { images: { id: string }[] })
        .images[0].id;

      const report = await t
        .api()
        .post(`/api/v1/reviews/${reviewId}/reports`)
        .set(auth(h.token))
        .send({ reason: 'OFFENSIVE', reviewImageId: imageId })
        .expect(201);
      await t
        .api()
        .post(`/api/v1/content-reports/${idOf(report)}/decide`)
        .set(auth(manager.token))
        .send({ status: 'RESOLVED', hide: true })
        .expect(200);

      const list = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews`)
        .expect(200);
      expect(list.body.data).toHaveLength(1);
      expect(list.body.data[0].images).toHaveLength(1);
    });

    it('leaves everything alone when the report is dismissed', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const reviewId = await review(guest.token, h, 1);
      const report = await t
        .api()
        .post(`/api/v1/reviews/${reviewId}/reports`)
        .set(auth(h.token))
        .send({ reason: 'NOT_A_STAY' })
        .expect(201);

      await t
        .api()
        .post(`/api/v1/content-reports/${idOf(report)}/decide`)
        .set(auth(manager.token))
        .send({ status: 'DISMISSED', resolution: 'Đánh giá hợp lệ.' })
        .expect(200);

      const list = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews`)
        .expect(200);
      expect(list.body.data).toHaveLength(1);

      // And it drops out of the waiting queue.
      const queue = await t
        .api()
        .get('/api/v1/content-reports')
        .set(auth(manager.token))
        .expect(200);
      expect(queue.body.data).toHaveLength(0);
    });

    it('refuses to decide the same report twice', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const manager = await t.signIn(
        'PLATFORM_MANAGER',
        'manager@stayreco.test',
      );
      const reviewId = await review(guest.token, h);
      const report = await t
        .api()
        .post(`/api/v1/reviews/${reviewId}/reports`)
        .set(auth(h.token))
        .send({ reason: 'OTHER' })
        .expect(201);
      const decide = () =>
        t
          .api()
          .post(`/api/v1/content-reports/${idOf(report)}/decide`)
          .set(auth(manager.token))
          .send({ status: 'DISMISSED' });

      await decide().expect(200);
      const again = await decide();
      expect(again.status).toBe(409);
      expect(again.body.code).toBe('REPORT_STATUS_CONFLICT');
    });
  });
});
