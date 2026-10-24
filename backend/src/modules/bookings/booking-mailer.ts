import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { daysBetween } from '@stayreco/shared';
import {
  toCalendarDate,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import type { Env } from '../../config/env';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { fromTime } from '../hotels/hotel.mapper';
import { MailService } from '../mail/mail.service';
import { DEFAULT_CHECK_IN_TIME } from '../stays/offer';
import { loadBookingHistory } from './booking-history';

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
  customer: { select: { userAccount: { select: { email: true } } } },
  roomType: {
    select: {
      name: true,
      hotel: {
        select: {
          name: true,
          checkInTime: true,
          hotelPartner: {
            select: { userAccount: { select: { email: true } } },
          },
          // The staff who handle refunds (slide 08), only while their account is active.
          hotelStaffs: {
            where: {
              permissions: { has: 'REFUND' },
              userAccount: { status: 'ACTIVE' },
            },
            select: { userAccount: { select: { email: true } } },
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
 * Booking emails in Vietnamese (decision P10, extended 2026-10-24): to the customer on payment, cancellation and the
 * refund decision, and to the hotel (owner, staff with REFUND) when a refund needs them. Called after the change is
 * committed; never throws, so a mail problem cannot undo a booking change already saved.
 */
@Injectable()
export class BookingMailer {
  private readonly logger = new Logger('BookingMailer');

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  bookingConfirmed(bookingId: string) {
    return this.safely(bookingId, async (b) => {
      const policy = b.freeCancelUntil
        ? `Hủy miễn phí trước ${moment(b.freeCancelUntil)}; sau đó phí hủy ${Number(b.cancelFeePercent)}% số tiền đã trả.`
        : `Đơn này không có thời gian hủy miễn phí; phí hủy ${Number(b.cancelFeePercent)}% số tiền đã trả.`;
      await this.toCustomer(b, `Xác nhận đặt phòng ${code(b)}`, [
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
    return this.safely(bookingId, async (b) => {
      const { cancelRequest } = await loadBookingHistory(
        this.prisma,
        bookingId,
      );
      await this.toCustomer(b, `Đơn ${code(b)} đã được hủy`, [
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
    return this.safely(bookingId, async (b) => {
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

      await this.toCustomer(b, `Đã nhận yêu cầu hủy đơn ${code(b)}`, [
        `Chúng tôi đã nhận yêu cầu hủy đơn ${code(b)}.`,
        `Số tiền dự kiến hoàn: ${money(cancelRequest.refund)} (phí hủy ${money(cancelRequest.fee)}).`,
        '',
        'Khách sạn sẽ xem xét yêu cầu; phòng vẫn được giữ cho bạn cho tới khi có quyết định.',
        ...autoApproval,
        '',
        `Xem đơn: ${this.customerLink(b)}`,
      ]);
      await this.toHotel(b, `Yêu cầu hoàn tiền mới: ${code(b)}`, [
        `Khách vừa hủy đơn ${code(b)} và có tiền cần hoàn.`,
        '',
        ...stay(b),
        `Khách: ${b.guestName}`,
        `Lý do: ${cancelRequest.reason}`,
        `Số tiền hoàn: ${money(cancelRequest.refund)} (phí hủy ${money(cancelRequest.fee)})`,
        ...autoApproval,
        '',
        `Xử lý yêu cầu: ${this.partnerLink()}`,
      ]);
    });
  }

  refundForwarded(bookingId: string, note: string) {
    return this.safely(bookingId, async (b) => {
      await this.toOwner(
        b,
        `Yêu cầu hoàn tiền ${code(b)} đã được nhân viên chuyển tới`,
        [
          `Nhân viên đã kiểm tra yêu cầu hoàn tiền của đơn ${code(b)} và chuyển tới bạn để quyết định.`,
          `Ghi chú: ${note}`,
          '',
          `Xử lý yêu cầu: ${this.partnerLink()}`,
        ],
      );
    });
  }

  /** `automatic`: approved by the system at the check-in time; the owner is told too. */
  refundApproved(bookingId: string, automatic = false) {
    return this.safely(bookingId, async (b) => {
      const { cancelRequest } = await loadBookingHistory(
        this.prisma,
        bookingId,
      );
      const refund = money(cancelRequest?.refund ?? 0);
      await this.toCustomer(b, `Hoàn tiền đơn ${code(b)} đã được duyệt`, [
        `Yêu cầu hủy đơn ${code(b)} đã được duyệt. Đơn đã được hủy.`,
        `${refund} đã được cộng vào ví StayReco của bạn.`,
        '',
        `Xem đơn: ${this.customerLink(b)}`,
      ]);
      if (automatic) {
        await this.toOwner(b, `Đã tự động duyệt hoàn tiền đơn ${code(b)}`, [
          `Yêu cầu hoàn tiền của đơn ${code(b)} chưa được quyết định khi tới giờ nhận phòng, nên hệ thống đã tự động duyệt.`,
          `Số tiền hoàn: ${refund}. Đơn đã được hủy và phòng đã được mở bán lại.`,
        ]);
      }
    });
  }

  refundRejected(bookingId: string, reason: string) {
    return this.safely(bookingId, async (b) => {
      await this.toCustomer(b, `Yêu cầu hoàn tiền đơn ${code(b)} bị từ chối`, [
        `Khách sạn đã từ chối yêu cầu hủy và hoàn tiền của đơn ${code(b)}.`,
        `Lý do: ${reason}`,
        '',
        'Đơn đặt phòng vẫn được giữ nguyên. Nếu có thắc mắc, vui lòng liên hệ khách sạn.',
        `Xem đơn: ${this.customerLink(b)}`,
      ]);
    });
  }

  private async safely(
    bookingId: string,
    send: (booking: Details) => Promise<void>,
  ) {
    try {
      const booking = await this.prisma.booking.findUnique({
        where: { bookingId },
        select: detailsSelect,
      });
      if (booking) await send(booking);
    } catch (err) {
      this.logger.error(
        `Booking email for ${bookingId} failed: ${String(err)}`,
      );
    }
  }

  private toCustomer(b: Details, subject: string, lines: string[]) {
    return this.mail.send({
      to: b.customer.userAccount.email,
      subject,
      text: [`Xin chào ${b.guestName},`, '', ...lines].join('\n'),
    });
  }

  private toOwner(b: Details, subject: string, lines: string[]) {
    return this.mail.send({
      to: b.roomType.hotel.hotelPartner.userAccount.email,
      subject,
      text: [`Khách sạn ${b.roomType.hotel.name}`, '', ...lines].join('\n'),
    });
  }

  /** The owner and the active staff with REFUND, one email each. */
  private async toHotel(b: Details, subject: string, lines: string[]) {
    const emails = new Set([
      b.roomType.hotel.hotelPartner.userAccount.email,
      ...b.roomType.hotel.hotelStaffs.map((s) => s.userAccount.email),
    ]);
    for (const to of emails) {
      await this.mail.send({
        to,
        subject,
        text: [`Khách sạn ${b.roomType.hotel.name}`, '', ...lines].join('\n'),
      });
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

/** The hotel check-in time on the check-in date, in Vietnam time (14:00 when not set). */
function checkInMoment(b: Details) {
  return vietnamDateTime(
    toCalendarDate(b.checkInDate),
    fromTime(b.roomType.hotel.checkInTime) ?? DEFAULT_CHECK_IN_TIME,
  );
}
