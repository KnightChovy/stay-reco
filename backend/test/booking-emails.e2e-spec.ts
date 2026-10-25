import { BookingMailer } from '../src/modules/bookings/booking-mailer';
import { RefundDecisionsService } from '../src/modules/bookings/refund-decisions.service';
import { PaymentConfirmationService } from '../src/modules/payments/payment-confirmation.service';
import { createTestApp } from './helpers';

describe('Booking emails (e2e)', () => {
  let t: Awaited<ReturnType<typeof createTestApp>>;
  let king: string;

  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });
  const day = (days: number) =>
    new Date(Date.now() + 7 * 3_600_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
  const vn = (date: string) => date.split('-').reverse().join('/');

  /** An ACTIVE hotel (check-in 14:00) with one room type (1,000,000 a night, 2 rooms). */
  const hotel = async (policy?: {
    freeCancellationDays: number | null;
    feePercent: number;
  }) => {
    const partner = await t.signIn('HOTEL_PARTNER', 'owner@hotel.test');
    const res = await t
      .api()
      .post('/api/v1/hotels')
      .set(auth(partner.token))
      .send({
        name: 'Riverside',
        address: '1 Bạch Đằng',
        city: 'Đà Nẵng',
        email: 'contact@hotel.test',
        checkInTime: '14:00',
      })
      .expect(201);
    const hotelId = res.body.data.id as string;
    await t
      .api()
      .put(`/api/v1/hotels/${hotelId}/room-config`)
      .set(auth(partner.token))
      .send({ totalRooms: 20, basePrice: 1000000 })
      .expect(200);
    if (policy) {
      await t
        .api()
        .patch(`/api/v1/hotels/${hotelId}/cancellation-policy`)
        .set(auth(partner.token))
        .send(policy)
        .expect(200);
    }
    const rt = await t
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
    const roomTypeId = rt.body.data.id as string;
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

  const paidBooking = async (token: string, roomTypeId: string) => {
    const res = await t
      .api()
      .post('/api/v1/bookings')
      .set(auth(token))
      .send({
        roomTypeId,
        checkIn: day(30),
        checkOut: day(32),
        guests: 2,
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
    await sent();
    return booking;
  };

  const cancel = async (token: string, id: string) => {
    const res = await t
      .api()
      .post(`/api/v1/bookings/${id}/cancel`)
      .set(auth(token))
      .send({ reason: 'Đổi kế hoạch' })
      .expect(200);
    await sent();
    return res;
  };
  /** Emails go out in the background; wait for them before reading the outbox. */
  const sent = () => t.app.get(BookingMailer).idle();
  const mails = () => t.outbox.map((m) => [m.to, m.subject]);

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
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('confirms the booking to the customer once it is paid', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    t.outbox.length = 0;
    const booking = await paidBooking(me.token, h.roomTypeId);

    expect(mails()).toEqual([
      ['guest@mail.test', `Xác nhận đặt phòng ${booking.code}`],
    ]);
    const text = t.outbox[0].text;
    expect(text).toContain('Xin chào Nguyễn Văn A,');
    expect(text).toContain('Khách sạn: Riverside');
    expect(text).toContain('Loại phòng: Deluxe × 1 phòng');
    expect(text).toContain(
      `Nhận phòng: ${vn(day(30))} – Trả phòng: ${vn(day(32))} (2 đêm)`,
    );
    expect(text).toContain('Đã thanh toán: 2.000.000 ₫');
    expect(text).toContain(`Hủy miễn phí trước 14:00 ${vn(day(29))}`);
    expect(text).toContain(
      `http://localhost:3001/account/bookings/${booking.id}`,
    );
  });

  it('tells the customer a booking was cancelled with nothing to refund', async () => {
    const h = await hotel({ freeCancellationDays: null, feePercent: 100 });
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await paidBooking(me.token, h.roomTypeId);
    expect(t.outbox[0].text).toContain(
      'Đơn này không có thời gian hủy miễn phí; phí hủy 100% số tiền đã trả.',
    );
    t.outbox.length = 0;

    await cancel(me.token, booking.id);
    expect(mails()).toEqual([
      ['guest@mail.test', `Đơn ${booking.code} đã được hủy`],
    ]);
    expect(t.outbox[0].text).toContain('Lý do: Đổi kế hoạch');
    expect(t.outbox[0].text).toContain('không có tiền hoàn lại');
  });

  it('tells the customer, the owner and active REFUND staff about a refund request', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    await t.signInStaff(h.hotelId, 'refund@hotel.test', ['REFUND']);
    await t.signInStaff(h.hotelId, 'booking@hotel.test', ['BOOKING']);
    const away = await t.signInStaff(h.hotelId, 'away@hotel.test', ['REFUND']);
    await t.prisma.userAccount.update({
      where: { userAccountId: away.id },
      data: { status: 'DEACTIVATED' },
    });
    const booking = await paidBooking(me.token, h.roomTypeId);
    t.outbox.length = 0;

    await cancel(me.token, booking.id);
    expect(mails()).toEqual([
      ['guest@mail.test', `Đã nhận yêu cầu hủy đơn ${booking.code}`],
      ['owner@hotel.test', `Yêu cầu hoàn tiền mới: ${booking.code}`],
      ['refund@hotel.test', `Yêu cầu hoàn tiền mới: ${booking.code}`],
    ]);
    const [customer, owner] = t.outbox;
    expect(customer.text).toContain(
      'Số tiền dự kiến hoàn: 2.000.000 ₫ (phí hủy 0 ₫).',
    );
    expect(customer.text).toContain(
      `Nếu khách sạn chưa quyết định trước 14:00 ${vn(day(30))} (giờ nhận phòng), yêu cầu sẽ được duyệt tự động.`,
    );
    expect(owner.text).toContain('Khách: Nguyễn Văn A');
    expect(owner.text).toContain('Lý do: Đổi kế hoạch');
    expect(owner.text).toContain('http://localhost:3001/partner/bookings');
  });

  it('emails each refund step: forwarded, approved, rejected', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const staff = await t.signInStaff(h.hotelId, 'refund@hotel.test', [
      'REFUND',
    ]);
    const approved = await paidBooking(me.token, h.roomTypeId);
    const rejected = await paidBooking(me.token, h.roomTypeId);
    await cancel(me.token, approved.id);
    await cancel(me.token, rejected.id);
    t.outbox.length = 0;

    await t
      .api()
      .post(`/api/v1/bookings/${approved.id}/forward-refund`)
      .set(auth(staff.token))
      .send({ note: 'Đúng hạn hủy miễn phí' })
      .expect(200);
    await sent();
    await t
      .api()
      .post(`/api/v1/bookings/${approved.id}/approve-refund`)
      .set(auth(h.token))
      .expect(200);
    await sent();
    await t
      .api()
      .post(`/api/v1/bookings/${rejected.id}/reject-refund`)
      .set(auth(h.token))
      .send({ reason: 'Yêu cầu trùng' })
      .expect(200);
    await sent();

    expect(mails()).toEqual([
      [
        'owner@hotel.test',
        `Yêu cầu hoàn tiền ${approved.code} đã được nhân viên chuyển tới`,
      ],
      ['guest@mail.test', `Hoàn tiền đơn ${approved.code} đã được duyệt`],
      ['guest@mail.test', `Yêu cầu hoàn tiền đơn ${rejected.code} bị từ chối`],
    ]);
    const [forwarded, approval, rejection] = t.outbox;
    expect(forwarded.text).toContain('Ghi chú: Đúng hạn hủy miễn phí');
    expect(approval.text).toContain(
      '2.000.000 ₫ đã được cộng vào ví StayReco của bạn.',
    );
    expect(rejection.text).toContain('Lý do: Yêu cầu trùng');
  });

  it('tells the customer and the owner about an automatic approval', async () => {
    const h = await hotel();
    const me = await t.signIn('CUSTOMER', 'guest@mail.test');
    const booking = await paidBooking(me.token, h.roomTypeId);
    await cancel(me.token, booking.id);
    t.outbox.length = 0;

    await t.app
      .get(RefundDecisionsService)
      .approveDue(new Date(`${day(30)}T14:01:00+07:00`));
    await sent();
    expect(mails()).toEqual([
      ['guest@mail.test', `Hoàn tiền đơn ${booking.code} đã được duyệt`],
      ['owner@hotel.test', `Đã tự động duyệt hoàn tiền đơn ${booking.code}`],
    ]);
  });
});
