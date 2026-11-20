import type { Booking, BookingStatus, BookingSummary, PaymentStatus } from "@stayreco/shared";
import { formatDateTime } from "@/features/stays/lib/format";
import { daysBetween, todayInVietnam } from "./stay-calendar";

/**
 * One source for how a booking's state reads to a customer: labels, the colour of its status pill, which actions it
 * allows and how its free-cancellation deadline stands. Every /account and booking screen uses these.
 */

export const FALLBACK_HOTEL_IMAGE =
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80";

export const bookingStatusLabels: Record<BookingStatus, string> = {
  PENDING: "Chờ thanh toán",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đang lưu trú",
  COMPLETED: "Đã hoàn tất",
  CANCELLED: "Đã huỷ",
  EXPIRED: "Hết hạn giữ chỗ",
  NO_SHOW: "Không đến nhận phòng",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  UNPAID: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  REFUND_PENDING: "Chờ hoàn tiền",
  PARTIALLY_REFUNDED: "Đã hoàn một phần",
  REFUNDED: "Đã hoàn tiền",
  FAILED: "Thanh toán thất bại",
};

/** success: all good · warning: something waits on someone · danger: it did not happen · neutral: over · info: in progress. */
export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

type StatusFields = Pick<BookingSummary, "status" | "paymentStatus">;

/** The payment wins when it is the thing that needs attention (a refund waiting, a failed payment). */
export function bookingTone({ status, paymentStatus }: StatusFields): StatusTone {
  if (paymentStatus === "FAILED") return "danger";
  if (paymentStatus === "REFUND_PENDING") return "warning";
  switch (status) {
    case "PENDING":
      return "warning";
    case "CONFIRMED":
      return "success";
    case "CHECKED_IN":
      return "info";
    case "COMPLETED":
    case "EXPIRED":
      return "neutral";
    case "CANCELLED":
    case "NO_SHOW":
      return "danger";
  }
}

/** "Đã xác nhận · Đã thanh toán"; the payment half is left out when it says nothing new. */
export function bookingStatusText({ status, paymentStatus }: StatusFields) {
  const stay = bookingStatusLabels[status];
  const quietPayment =
    (status === "PENDING" && paymentStatus === "UNPAID") || (status === "EXPIRED" && paymentStatus === "FAILED");
  return quietPayment ? stay : `${stay} · ${paymentStatusLabels[paymentStatus]}`;
}

export type BookingActions = {
  canPay: boolean;
  canVoucher: boolean;
  canCancel: boolean;
  canChange: boolean;
};

/** What the customer may do with a booking now; the backend still decides, these only choose which buttons to show. */
export function bookingActions(booking: StatusFields & { changeRequest?: Booking["changeRequest"] }): BookingActions {
  const paidAndConfirmed = booking.status === "CONFIRMED" && booking.paymentStatus === "PAID";
  return {
    canPay: booking.status === "PENDING",
    canVoucher: booking.status === "CONFIRMED" || booking.status === "CHECKED_IN",
    canCancel: paidAndConfirmed,
    canChange: paidAndConfirmed && booking.changeRequest?.status !== "PENDING",
  };
}

/** Whether cancelling is still free, said in words a customer can act on. `now` comes from the caller (render purity). */
export function freeCancelState(cancellation: Booking["cancellation"], now: number) {
  if (!cancellation.freeUntil) {
    return { open: false, label: `Không huỷ miễn phí · phí ${cancellation.feePercent}% tiền phòng` };
  }
  const until = Date.parse(cancellation.freeUntil);
  if (until <= now) {
    return { open: false, label: `Đã quá hạn huỷ miễn phí · phí ${cancellation.feePercent}% tiền phòng` };
  }
  const days = daysBetween(todayInVietnam(), new Date(until).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }));
  const left = days <= 0 ? "hôm nay" : `còn ${days} ngày`;
  return { open: true, label: `Miễn phí huỷ đến ${formatDateTime(cancellation.freeUntil)} (${left})` };
}

/** "Còn 3 ngày nhận phòng", "Đang lưu trú, trả phòng ngày mai"… for a booking card; null when there is nothing ahead. */
export function stayRelativeLabel(booking: StatusFields & { checkIn: string; checkOut: string }, today = todayInVietnam()) {
  if (booking.status === "CHECKED_IN") {
    const left = daysBetween(today, booking.checkOut);
    return left <= 0 ? "Trả phòng hôm nay" : left === 1 ? "Trả phòng ngày mai" : `Trả phòng sau ${left} ngày`;
  }
  if (booking.status !== "CONFIRMED" && booking.status !== "PENDING") return null;
  const days = daysBetween(today, booking.checkIn);
  if (days < 0) return null;
  if (days === 0) return "Nhận phòng hôm nay";
  if (days === 1) return "Nhận phòng ngày mai";
  return `Còn ${days} ngày nhận phòng`;
}
