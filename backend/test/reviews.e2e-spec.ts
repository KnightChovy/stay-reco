import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Post-stay reviews (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;
  let criteria: { id: string; name: string; weight: number }[];

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);

  /** An ACTIVE hotel with one room type (1,000,000 a night) and rooms 101-102. */
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
    const hotelId = created.body.data.id as string;
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
    const roomTypeId = typeRes.body.data.id as string;
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

  /** A paid booking of one room for 2 nights starting today. */
  const paidBooking = async (token: string, roomTypeId: string) => {
    const res = await t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        roomTypeId,
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
    return booking;
  };

  /**
   * A stay that is over: checked in through the front desk, then out. Reviews only open on `COMPLETED`, so every
   * test that writes one goes through this.
   */
  const completedStay = async (
    guestToken: string,
    staffToken: string,
    roomTypeId: string,
  ) => {
    const booking = await paidBooking(guestToken, roomTypeId);
    await t
      .api()
      .post(`/api/v1/bookings/${booking.id}/check-in`)
      .set(auth(staffToken))
      .send({})
      .expect(200);
    await t
      .api()
      .post(`/api/v1/bookings/${booking.id}/check-out`)
      .set(auth(staffToken))
      .send({})
      .expect(200);
    return booking;
  };

  /** Scores every criterion the same, which makes the overall rating that same number. */
  const allScores = (score: number) =>
    criteria.map((c) => ({ criterionId: c.id, score }));

  const writeReview = (token: string, bookingId: string, body: object) =>
    t
      .api()
      .post(`/api/v1/bookings/${bookingId}/reviews`)
      .set(auth(token))
      .send(body);

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
    // The three seeded criteria this suite scores; their weights add up to 1.
    await t.prisma.ratingCriterion.createMany({
      data: [
        { name: 'Vệ sinh', weight: 0.5 },
        { name: 'Vị trí', weight: 0.3 },
        { name: 'Phục vụ', weight: 0.2 },
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

  describe('GET /rating-criteria', () => {
    it('lists the criteria heaviest first, with their weights, without a token', async () => {
      const res = await t.api().get('/api/v1/rating-criteria').expect(200);
      const names = (res.body.data as { name: string }[]).map((c) => c.name);
      expect(names).toEqual(['Vệ sinh', 'Vị trí', 'Phục vụ']);
      expect(res.body.data[0]).toMatchObject({ name: 'Vệ sinh', weight: 0.5 });
    });
  });

  describe('POST /bookings/:id/reviews', () => {
    it('writes the review of a completed stay and computes the weighted overall rating', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);

      const res = await writeReview(guest.token, booking.id, {
        title: 'Phòng sạch',
        content: 'Vị trí ngay bờ sông, đi bộ ra chợ đêm 5 phút.',
        // 5 × .5 + 4 × .3 + 3 × .2 = 4.3
        subRatings: [
          { criterionId: criteria[0].id, score: 5 },
          { criterionId: criteria[1].id, score: 4 },
          { criterionId: criteria[2].id, score: 3 },
        ],
      }).expect(201);

      expect(res.body.data).toMatchObject({
        bookingId: booking.id,
        hotelId: h.hotelId,
        overallRating: 4.3,
        title: 'Phòng sạch',
        isVisible: true,
        stayedAt: day(2),
      });
      // The full name is never public: "guest@mail.test" signs in as "guest".
      expect(res.body.data.authorName).toBe('guest');
      expect(res.body.data.subRatings).toHaveLength(3);
    });

    it('also writes the scores into the user-item matrix the recommender reads', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);

      await writeReview(guest.token, booking.id, {
        content: 'Ổn, sẽ quay lại lần sau.',
        subRatings: allScores(4),
      }).expect(201);

      const rows = await t.prisma.userItemRating.findMany({
        where: { hotelId: h.hotelId },
      });
      expect(rows).toHaveLength(3);
      expect(rows.every((r) => r.score.toNumber() === 4)).toBe(true);
    });

    it('refuses a stay that is not completed', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await paidBooking(guest.token, h.roomTypeId);

      const res = await writeReview(guest.token, booking.id, {
        content: 'Chưa ở mà đã đánh giá.',
        subRatings: allScores(5),
      }).expect(409);
      expect(res.body.error.code).toBe('REVIEW_NOT_ALLOWED');
    });

    it('allows one review per stay', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);
      const body = { content: 'Rất tốt, sạch sẽ.', subRatings: allScores(5) };

      await writeReview(guest.token, booking.id, body).expect(201);
      const res = await writeReview(guest.token, booking.id, body).expect(409);
      expect(res.body.error.code).toBe('REVIEW_ALREADY_EXISTS');
    });

    it('refuses a partial set of criteria, so a guest cannot weight their own rating', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);

      const partial = await writeReview(guest.token, booking.id, {
        content: 'Chỉ chấm một tiêu chí thôi.',
        subRatings: [{ criterionId: criteria[0].id, score: 5 }],
      }).expect(409);
      expect(partial.body.error.code).toBe('REVIEW_NOT_ALLOWED');

      const unknown = await writeReview(guest.token, booking.id, {
        content: 'Chấm một tiêu chí không tồn tại.',
        subRatings: [
          ...allScores(5).slice(1),
          {
            criterionId: '00000000-0000-4000-8000-000000000000',
            score: 5,
          },
        ],
      }).expect(404);
      expect(unknown.body.error.code).toBe('RATING_CRITERION_NOT_FOUND');
    });

    it("refuses someone else's booking without saying whether it exists", async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'stranger@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);

      const res = await writeReview(stranger.token, booking.id, {
        content: 'Đánh giá chuyến đi của người khác.',
        subRatings: allScores(5),
      }).expect(404);
      expect(res.body.error.code).toBe('BOOKING_NOT_FOUND');
    });

    it('refuses a stay whose review window has closed', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);
      // REVIEW_WINDOW_DAYS is 30 by default; a check-out a year ago is well past it.
      await t.prisma.$executeRaw`
        UPDATE booking SET check_out_date = check_out_date - 365
        WHERE booking_id = ${booking.id}::uuid`;

      const res = await writeReview(guest.token, booking.id, {
        content: 'Đánh giá sau khi hết hạn.',
        subRatings: allScores(5),
      }).expect(409);
      expect(res.body.error.code).toBe('REVIEW_WINDOW_CLOSED');
    });
  });

  describe('GET /bookings/:id/review-eligibility', () => {
    it('tells the FE when the button may be shown, and why not', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const unpaid = await paidBooking(guest.token, h.roomTypeId);

      const notYet = await t
        .api()
        .get(`/api/v1/bookings/${unpaid.id}/review-eligibility`)
        .set(auth(guest.token))
        .expect(200);
      expect(notYet.body.data).toMatchObject({
        canReview: false,
        reason: 'REVIEW_NOT_ALLOWED',
        reviewId: null,
        closesAt: null,
      });

      const booking = await completedStay(guest.token, h.token, h.roomTypeId);
      const open = await t
        .api()
        .get(`/api/v1/bookings/${booking.id}/review-eligibility`)
        .set(auth(guest.token))
        .expect(200);
      expect(open.body.data).toMatchObject({ canReview: true, reason: null });
      expect(open.body.data.closesAt).not.toBeNull();

      const written = await writeReview(guest.token, booking.id, {
        content: 'Đã viết đánh giá rồi.',
        subRatings: allScores(5),
      }).expect(201);
      const after = await t
        .api()
        .get(`/api/v1/bookings/${booking.id}/review-eligibility`)
        .set(auth(guest.token))
        .expect(200);
      expect(after.body.data).toMatchObject({
        canReview: false,
        reason: 'REVIEW_ALREADY_EXISTS',
        reviewId: written.body.data.id,
      });
    });
  });

  describe('PATCH /reviews/:id', () => {
    it('lets the author edit, and recomputes the rating from the new scores', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);
      const review = await writeReview(guest.token, booking.id, {
        content: 'Đánh giá ban đầu của tôi.',
        subRatings: allScores(5),
      }).expect(201);

      const res = await t
        .api()
        .patch(`/api/v1/reviews/${review.body.data.id}`)
        .set(auth(guest.token))
        .send({
          content: 'Nghĩ lại thì phòng hơi ồn.',
          subRatings: allScores(3),
        })
        .expect(200);

      expect(res.body.data).toMatchObject({
        content: 'Nghĩ lại thì phòng hơi ồn.',
        overallRating: 3,
      });
      // The user-item matrix follows the edit: one row per criterion, not one per edit.
      const rows = await t.prisma.userItemRating.findMany({
        where: { hotelId: h.hotelId },
      });
      expect(rows).toHaveLength(3);
      expect(rows.every((r) => r.score.toNumber() === 3)).toBe(true);
    });

    it("refuses to edit someone else's review", async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const stranger = await t.signIn('CUSTOMER', 'stranger@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);
      const review = await writeReview(guest.token, booking.id, {
        content: 'Đánh giá của riêng tôi.',
        subRatings: allScores(5),
      }).expect(201);

      const res = await t
        .api()
        .patch(`/api/v1/reviews/${review.body.data.id}`)
        .set(auth(stranger.token))
        .send({ content: 'Sửa đánh giá của người khác.' })
        .expect(404);
      expect(res.body.error.code).toBe('REVIEW_NOT_FOUND');
    });
  });

  describe('PATCH /reviews/:id/visibility', () => {
    it('lets the hotel hide a review, which leaves the public list but not the author', async () => {
      const h = await hotel();
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);
      const review = await writeReview(guest.token, booking.id, {
        content: 'Đánh giá sẽ bị ẩn.',
        subRatings: allScores(2),
      }).expect(201);

      await t
        .api()
        .patch(`/api/v1/reviews/${review.body.data.id}/visibility`)
        .set(auth(h.token))
        .send({ isVisible: false })
        .expect(200);

      const publicList = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews`)
        .expect(200);
      expect(publicList.body.data).toHaveLength(0);

      const summary = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/rating-summary`)
        .expect(200);
      expect(summary.body.data).toMatchObject({ average: 0, count: 0 });

      const mine = await t
        .api()
        .get('/api/v1/me/reviews')
        .set(auth(guest.token))
        .expect(200);
      expect(mine.body.data).toHaveLength(1);
      expect(mine.body.data[0].isVisible).toBe(false);
    });

    it('refuses a review of another hotel', async () => {
      const h = await hotel();
      const other = await hotel('other@hotel.test');
      const guest = await t.signIn('CUSTOMER', 'guest@mail.test');
      const booking = await completedStay(guest.token, h.token, h.roomTypeId);
      const review = await writeReview(guest.token, booking.id, {
        content: 'Đánh giá của khách sạn này.',
        subRatings: allScores(5),
      }).expect(201);

      const res = await t
        .api()
        .patch(`/api/v1/reviews/${review.body.data.id}/visibility`)
        .set(auth(other.token))
        .send({ isVisible: false })
        .expect(404);
      expect(res.body.error.code).toBe('REVIEW_NOT_FOUND');
    });
  });

  describe('GET /hotels/:hotelId/reviews and rating-summary', () => {
    it('reads without a token, sorts, filters by minimum rating and sums up the ratings', async () => {
      const h = await hotel();
      const low = await t.signIn('CUSTOMER', 'low@mail.test');
      const high = await t.signIn('CUSTOMER', 'high@mail.test');
      const lowStay = await completedStay(low.token, h.token, h.roomTypeId);
      const highStay = await completedStay(high.token, h.token, h.roomTypeId);

      await writeReview(low.token, lowStay.id, {
        content: 'Phòng ồn, không như ảnh.',
        subRatings: allScores(2),
      }).expect(201);
      await writeReview(high.token, highStay.id, {
        content: 'Rất đáng tiền, sẽ quay lại.',
        subRatings: allScores(5),
      }).expect(201);

      const all = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews?sort=rating-desc`)
        .expect(200);
      const ratings = (all.body.data as { overallRating: number }[]).map(
        (r) => r.overallRating,
      );
      expect(ratings).toEqual([5, 2]);

      const filtered = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/reviews?minRating=4`)
        .expect(200);
      expect(filtered.body.data).toHaveLength(1);
      expect(filtered.body.meta.total).toBe(1);

      const summary = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/rating-summary`)
        .expect(200);
      expect(summary.body.data).toMatchObject({ average: 3.5, count: 2 });
      expect(summary.body.data.distribution).toEqual([
        { star: 1, count: 0 },
        { star: 2, count: 1 },
        { star: 3, count: 0 },
        { star: 4, count: 0 },
        { star: 5, count: 1 },
      ]);
      // Every criterion was scored 2 and 5, so each averages 3.5.
      const perCriterion = summary.body.data.criteria as { average: number }[];
      expect(perCriterion.every((c) => c.average === 3.5)).toBe(true);
    });

    it('answers an empty summary for a hotel with no review', async () => {
      const h = await hotel();
      const res = await t
        .api()
        .get(`/api/v1/hotels/${h.hotelId}/rating-summary`)
        .expect(200);
      expect(res.body.data).toMatchObject({ average: 0, count: 0 });
      expect(res.body.data.criteria).toHaveLength(3);
    });
  });
});
