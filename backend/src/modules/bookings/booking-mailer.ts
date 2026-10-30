import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { daysBetween } from '@stayreco/shared';
import {
  toCalendarDate,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import type { Env } from '../../config/env';
import type { NotificationType, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { fromTime } from '../hotels/hotel.mapper';
import { type MailMessage, MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DEFAULT_CHECK_IN_TIME } from '../stays/offer';
import { type GuestChanges, loadBookingHistory } from './booking-history';

const detailsSelect = {
  bookingId: true,
  checkInDate: true,
  checkOutDate: true,
  numRooms: true,
  numGuests: true,
  totalAmount: true,
  guestName: true,
  freeCancelUntil: true,
  cancelFeePercent: true,
  invoice: { select: { invoiceNumber: true } },
  // Role rows share the account id, so these are the notification recipients too.
  customerId: true,
  customer: {
    select: { userAccount: { select: { email: true, fullName: true } } },
  },
  roomType: {
    select: {
      name: true,
      hotel: {
        select: {
          name: true,
          checkInTime: true,
          hotelPartnerId: true,
          hotelPartner: {
            select: { userAccount: { select: { email: true } } },
          },
          // The staff who handle refunds (slide 08) or bookings (change requests), only while their account is active.
          hotelStaffs: {
            where: {
              permissions: { hasSome: ['REFUND', 'BOOKING'] },
              userAccount: { status: 'ACTIVE' },
            },
            select: {
              hotelStaffId: true,
              permissions: true,
              userAccount: { select: { email: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

type Details = Prisma.BookingGetPayload<{ select: typeof detailsSelect }>;

/** 2000000 → "2.000.000 ₫". */
const money = (amount: number | Prisma.Decimal) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(amount))} ₫`;

/** "2026-11-20" → "20/11/2026". */
const day = (date: string) => date.split('-').reverse().join('/');

/** An instant shown in Vietnam time, "14:00 17/11/2026". */
const moment = (at: Date) => {
  const local = new Date(at.getTime() + 7 * 3_600_000).toISOString();
  return `${local.slice(11, 16)} ${day(local.slice(0, 10))}`;
};

/**
 * Booking emails in Vietnamese (decision P10, extended 2026-10-24 and in phase 3): to the customer on payment,
 * cancellation, the refund decision and the change-request decision, and to the hotel (owner, staff with REFUND or
 * BOOKING) when a refund or a change request needs them. Every email also writes an in-app notification for the same
 * person (O12). Called after the change is committed; sends in the background and never throws, so a mail problem
 * cannot slow down or undo a booking change.
 */
@Injectable()
export class BookingMailer {
  private readonly logger = new Logger('BookingMailer');
  private readonly pending = new Set<Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
    private readonly config: ConfigService<Env, true>,
  ) {
    // Emails still being sent at shutdown read the database: let them finish first.
    prisma.onBeforeDisconnect(() => this.idle());
  }

  bookingConfirmed(bookingId: string) {
    return this.safely(bookingId, async (b, out) => {
      const policy = b.freeCancelUntil
        ? `Hủy miễn phí trước ${moment(b.freeCancelUntil)}; sau đó phí hủy ${Number(b.cancelFeePercent)}% số tiền đã trả.`
        : `Đơn này không có thời gian hủy miễn phí; phí hủy ${Number(b.cancelFeePercent)}% số tiền đã trả.`;
      await this.toCustomer(out, b, `Xác nhận đặt phòng ${code(b)}`, [
        `Đơn đặt phòng ${code(b)} đã được thanh toán và xác nhận.`,
        '',
        ...stay(b),
        `Đã thanh toán: ${money(b.totalAmount)}`,
        policy,
        '',
        `Xem đơn và voucher nhận phòng: ${this.customerLink(b)}`,
        '',
        'Cảm ơn bạn đã đặt phòng qua StayReco.',
      ]);
    });
  }

  /** Nothing to refund: the booking is already cancelled. */
  cancelledAtOnce(bookingId: string) {
    return this.safely(bookingId, async (b, out) => {
      const { cancelRequest } = await loadBookingHistory(
        this.prisma,
        bookingId,
      );
      await this.toCustomer(out, b, `Đơn ${code(b)} đã được hủy`, [
        `Đơn đặt phòng ${code(b)} đã được hủy theo yêu cầu của bạn.`,
        `Lý do: ${cancelRequest?.reason ?? ''}`,
        '',
        'Theo chính sách hủy đã chốt khi đặt phòng, đơn này không có tiền hoàn lại.',
        '',
        `Xem đơn: ${this.customerLink(b)}`,
      ]);
    });
  }

  /** Money to refund: the customer is told it is waiting, the hotel that it has to decide. */
  refundRequested(bookingId: string) {
    return this.safely(bookingId, async (b, out) => {
      const { cancelRequest } = await loadBookingHistory(
        this.prisma,
        bookingId,
      );
      if (!cancelRequest) return;
      const checkInAt = checkInMoment(b);
      // Only requests made before the check-in time are approved automatically (P11).
      const autoApproval =
        cancelRequest.at < checkInAt
          ? [
              `Nếu khách sạn chưa quyết định trước ${moment(checkInAt)} (giờ nhận phòng), yêu cầu sẽ được duyệt tự động.`,
            ]
          : [];

      await this.toCustomer(
        out,
        b,
        `Đã nhận yêu cầu hủy đơn ${code(b)}`,
        [
          `Chúng tôi đã nhận yêu cầu hủy đơn ${code(b)}.`,
          `Số tiền dự kiến hoàn: ${money(cancelRequest.refund)} (phí hủy ${money(cancelRequest.fee)}).`,
          '',
          'Khách sạn sẽ xem xét yêu cầu; phòng vẫn được giữ cho bạn cho tới khi có quyết định.',
          ...autoApproval,
          '',
          `Xem đơn: ${this.customerLink(b)}`,
        ],
        'PAYMENT',
      );
      await this.toHotel(
        out,
        b,
        'REFUND',
        `Yêu cầu hoàn tiền mới: ${code(b)}`,
        [
          `Khách vừa hủy đơn ${code(b)} và có tiền cần hoàn.`,
          '',
          ...stay(b),
          `Khách: ${b.guestName}`,
          `Lý do: ${cancelRequest.reason}`,
          `Số tiền hoàn: ${money(cancelRequest.refund)} (phí hủy ${money(cancelRequest.fee)})`,
          ...autoApproval,
          '',
          `Xử lý yêu cầu: ${this.partnerLink()}`,
        ],
        'PAYMENT',
      );
    });
  }

  refundForwarded(bookingId: string, note: string) {
    return this.safely(bookingId, async (b, out) => {
      await this.toOwner(
        out,
        b,
        `Yêu cầu hoàn tiền ${code(b)} đã được nhân viên chuyển tới`,
        [
          `Nhân viên đã kiểm tra yêu cầu hoàn tiền của đơn ${code(b)} và chuyển tới bạn để quyết định.`,
          `Ghi chú: ${note}`,
          '',
          `Xử lý yêu cầu: ${this.partnerLink()}`,
        ],
        'PAYMENT',
      );
    });
  }

  /** `automatic`: approved by the system at the check-in time; the owner is told too. */
  refundApproved(bookingId: string, automatic = false) {
    return this.safely(bookingId, async (b, out) => {
      const { cancelRequest } = await loadBookingHistory(
        this.prisma,
        bookingId,
      );
      const refund = money(cancelRequest?.refund ?? 0);
      await this.toCustomer(
        out,
        b,
        `Hoàn tiền đơn ${code(b)} đã được duyệt`,
        [
          `Yêu cầu hủy đơn ${code(b)} đã được duyệt. Đơn đã được hủy.`,
          `${refund} đã được cộng vào ví StayReco của bạn.`,
          '',
          `Xem đơn: ${this.customerLink(b)}`,
        ],
        'PAYMENT',
      );
      if (automatic) {
        await this.toOwner(
          out,
          b,
          `Đã tự động duyệt hoàn tiền đơn ${code(b)}`,
          [
            `Yêu cầu hoàn tiền của đơn ${code(b)} chưa được quyết định khi tới giờ nhận phòng, nên hệ thống đã tự động duyệt.`,
            `Số tiền hoàn: ${refund}. Đơn đã được hủy và phòng đã được mở bán lại.`,
          ],
          'PAYMENT',
        );
      }
    });
  }

  refundRejected(bookingId: string, reason: string) {
    return this.safely(bookingId, async (b, out) => {
      await this.toCustomer(
        out,
        b,
        `Yêu cầu hoàn tiền đơn ${code(b)} bị từ chối`,
        [
          `Khách sạn đã từ chối yêu cầu hủy và hoàn tiền của đơn ${code(b)}.`,
          `Lý do: ${reason}`,
          '',
          'Đơn đặt phòng vẫn được giữ nguyên. Nếu có thắc mắc, vui lòng liên hệ khách sạn.',
          `Xem đơn: ${this.customerLink(b)}`,
        ],
        'PAYMENT',
      );
    });
  }

  /** A change request for the hotel (owner, staff with BOOKING) to decide (UC43). */
  changeRequested(bookingId: string, changes: GuestChanges) {
    return this.safely(bookingId, async (b, out) => {
      await this.toHotel(
        out,
        b,
        'BOOKING',
        `Yêu cầu đổi thông tin đơn ${code(b)}`,
        [
          `Khách yêu cầu đổi thông tin của đơn ${code(b)}:`,
          ...changeLines(changes),
          '',
          ...stay(b),
          '',
          `Xử lý yêu cầu: ${this.partnerLink()}`,
        ],
      );
    });
  }

  changeAccepted(bookingId: string, changes: GuestChanges) {
    return this.safely(bookingId, async (b, out) => {
      await this.toCustomer(out, b, `Đơn ${code(b)} đã được cập nhật`, [
        `Khách sạn đã chấp nhận yêu cầu đổi thông tin của đơn ${code(b)}:`,
        ...changeLines(changes),
        '',
        `Xem đơn: ${this.customerLink(b)}`,
      ]);
    });
  }

  changeRejected(bookingId: string, reason: string) {
    return this.safely(bookingId, async (b, out) => {
      await this.toCustomer(
        out,
        b,
        `Yêu cầu đổi thông tin đơn ${code(b)} bị từ chối`,
        [
          `Khách sạn đã từ chối yêu cầu đổi thông tin của đơn ${code(b)}.`,
          `Lý do: ${reason}`,
          '',
          'Đơn đặt phòng vẫn giữ thông tin cũ.',
          `Xem đơn: ${this.customerLink(b)}`,
        ],
      );
    });
  }

  /** Resolves once the emails already started are sent (tests wait on it instead of guessing a delay). */
  async idle() {
    while (this.pending.size) await Promise.all([...this.pending]);
  }

  /**
   * Sends in the background: the request (and SePay's webhook, which must answer within 30 s) never waits for SMTP.
   */
  private safely(
    bookingId: string,
    send: (booking: Details, out: MailMessage[]) => Promise<void>,
  ): void {
    const task: Promise<void> = this.deliver(bookingId, send).finally(() =>
      this.pending.delete(task),
    );
    this.pending.add(task);
  }

  /**
   * The notifications are written while `send` runs; the emails it queued in `out` go after, so a slow SMTP server
   * never delays a notification.
   */
  private async deliver(
    bookingId: string,
    send: (booking: Details, out: MailMessage[]) => Promise<void>,
  ) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { bookingId },
        select: detailsSelect,
      });
      if (!booking) return;
      const out: MailMessage[] = [];
      await send(booking, out);
      for (const message of out) await this.mail.send(message);
    } catch (err) {
      this.logger.error(
        `Booking email for ${bookingId} failed: ${String(err)}`,
      );
    }
  }

  private async toCustomer(
    out: MailMessage[],
    b: Details,
    subject: string,
    lines: string[],
    type: NotificationType = 'BOOKING',
  ) {
    await this.notify(b.customerId, type, subject, lines, customerPath(b));
    out.push({
      to: b.customer.userAccount.email,
      subject,
      // The email goes to the account that booked, who may have booked for another guest.
      text: [`Xin chào ${b.customer.userAccount.fullName},`, '', ...lines].join(
        '\n',
      ),
    });
  }

  private async toOwner(
    out: MailMessage[],
    b: Details,
    subject: string,
    lines: string[],
    type: NotificationType = 'BOOKING',
  ) {
    const owner = b.roomType.hotel;
    await this.notify(owner.hotelPartnerId, type, subject, lines, PARTNER_PATH);
    out.push({
      to: owner.hotelPartner.userAccount.email,
      subject,
      text: [`Khách sạn ${owner.name}`, '', ...lines].join('\n'),
    });
  }

  /** The owner and the active staff with `permission`: one notification and one email each. */
  private async toHotel(
    out: MailMessage[],
    b: Details,
    permission: 'REFUND' | 'BOOKING',
    subject: string,
    lines: string[],
    type: NotificationType = 'BOOKING',
  ) {
    await this.toOwner(out, b, subject, lines, type);
    const owner = b.roomType.hotel.hotelPartner.userAccount.email;
    for (const s of b.roomType.hotel.hotelStaffs) {
      if (!s.permissions.includes(permission)) continue;
      await this.notify(s.hotelStaffId, type, subject, lines, staffPath(b));
      // A staff account sharing the owner's address gets the email once.
      if (s.userAccount.email === owner) continue;
      out.push({
        to: s.userAccount.email,
        subject,
        text: [`Khách sạn ${b.roomType.hotel.name}`, '', ...lines].join('\n'),
      });
    }
  }

  /**
   * The in-app notification next to an email (O12): the subject as title, the first paragraph as message. Never
   * blocks the email: a failed insert is logged.
   */
  private async notify(
    userAccountId: string,
    type: NotificationType,
    title: string,
    lines: string[],
    link: string,
  ) {
    const end = lines.indexOf('');
    const message = (end < 0 ? lines : lines.slice(0, end)).join(' ');
    try {
      await this.notifications.create({
        userAccountId,
        type,
        title,
        message,
        link,
      });
    } catch (err) {
      this.logger.error(
        `Notification for ${userAccountId} failed: ${String(err)}`,
      );
    }
  }

  private customerLink(b: Details) {
    return `${this.webApp()}/account/bookings/${b.bookingId}`;
  }

  private partnerLink() {
    return `${this.webApp()}/partner/bookings`;
  }

  private webApp() {
    return this.config.get('WEB_APP_URL', { infer: true }).replace(/\/$/, '');
  }
}

const code = (b: Details) => b.invoice!.invoiceNumber;

/** App paths the notifications open (O12). */
const customerPath = (b: Details) => `/account/bookings/${b.bookingId}`;
const staffPath = (b: Details) => `/staff/bookings/${b.bookingId}`;
const PARTNER_PATH = '/partner/bookings';

function stay(b: Details) {
  const checkIn = toCalendarDate(b.checkInDate);
  const checkOut = toCalendarDate(b.checkOutDate);
  return [
    `Khách sạn: ${b.roomType.hotel.name}`,
    `Loại phòng: ${b.roomType.name} × ${b.numRooms} phòng`,
    `Nhận phòng: ${day(checkIn)} – Trả phòng: ${day(checkOut)} (${daysBetween(checkIn, checkOut)} đêm)`,
    `Số khách: ${b.numGuests ?? b.numRooms}`,
  ];
}

/** One line per changed guest detail; a cleared value shows as "(bỏ trống)". */
function changeLines(changes: GuestChanges) {
  const labels: Record<keyof GuestChanges, string> = {
    guestName: 'Tên khách',
    contactPhone: 'Số điện thoại',
    arrivalTime: 'Giờ đến dự kiến',
    specialRequests: 'Yêu cầu đặc biệt',
  };
  return (Object.keys(labels) as (keyof GuestChanges)[])
    .filter((field) => field in changes)
    .map((field) => `- ${labels[field]}: ${changes[field] ?? '(bỏ trống)'}`);
}

/** The hotel check-in time on the check-in date, in Vietnam time (14:00 when not set). */
function checkInMoment(b: Details) {
  return vietnamDateTime(
    toCalendarDate(b.checkInDate),
    fromTime(b.roomType.hotel.checkInTime) ?? DEFAULT_CHECK_IN_TIME,
  );
}
