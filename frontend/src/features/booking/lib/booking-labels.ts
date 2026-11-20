import type { AddOnPayment, AddOnTiming, PaymentMethod } from "@stayreco/shared";

/** Events of `Booking.timeline` (docs/api/customer.md, docs/api/add-ons.md). Unknown events fall back to their code. */
export const bookingEventLabels: Record<string, string> = {
  CREATED: "Tạo booking",
  PAID: "Thanh toán thành công",
  EXPIRED: "Hết hạn giữ chỗ",
  CANCEL_REQUESTED: "Khách yêu cầu huỷ",
  REFUND_FORWARDED: "Nhân viên chuyển yêu cầu hoàn tiền",
  REFUND_APPROVED: "Duyệt hoàn tiền",
  REFUND_REJECTED: "Từ chối hoàn tiền",
  CANCELLED: "Đã huỷ",
  CHECKED_IN: "Nhận phòng",
  COMPLETED: "Trả phòng",
  NO_SHOW: "Khách không đến",
  CHANGE_REQUESTED: "Khách yêu cầu đổi thông tin",
  CHANGE_ACCEPTED: "Chấp nhận đổi thông tin",
  CHANGE_REJECTED: "Từ chối đổi thông tin",
  ADD_ON_ADDED: "Thêm dịch vụ",
  ADD_ON_REMOVED: "Bỏ dịch vụ",
};

export function bookingEventLabel(event: string) {
  return bookingEventLabels[event] ?? event;
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  SEPAY: "Chuyển khoản SePay · VietQR",
  WALLET: "Ví StayReco",
  VNPAY: "VNPay",
  CASH: "Tiền mặt",
  MIXED: "Kết hợp",
};

/** `timing` is a catalogue label only: it does not limit when an add-on can be booked (docs/api/add-ons.md). */
export const addOnTimingLabels: Record<AddOnTiming, { label: string; description: string }> = {
  BEFORE_STAY: { label: "Trước khi đến", description: "Ví dụ: đón sân bay, trang trí phòng" },
  DURING_STAY: { label: "Trong kỳ lưu trú", description: "Ví dụ: ăn sáng, spa, giặt ủi" },
  AFTER_STAY: { label: "Khi trả phòng", description: "Ví dụ: tiễn sân bay, minibar" },
};

export const addOnPaymentLabels: Record<AddOnPayment, string> = {
  PREPAID: "Đã trả cùng tiền phòng",
  FRONT_DESK: "Thu tại quầy khi trả phòng",
};
