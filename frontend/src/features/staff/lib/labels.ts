import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { BookingStatus, HotelStatus, PaymentStatus, RoomStatus } from "@stayreco/shared";

export type StatusTone = "success" | "warning" | "danger" | "info" | "muted";

export const toneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  muted: "bg-slate-100 text-slate-600 border-slate-200",
};

type Labelled = { label: string; tone: StatusTone };

export const hotelStatusLabels: Record<HotelStatus, Labelled> = {
  DRAFT: { label: "Bản nháp", tone: "muted" },
  PENDING_VERIFICATION: { label: "Chờ thẩm định", tone: "warning" },
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  SUSPENDED: { label: "Tạm ngưng", tone: "danger" },
  INACTIVE: { label: "Ngừng hoạt động", tone: "muted" },
};

export const roomStatusLabels: Record<RoomStatus, Labelled> = {
  AVAILABLE: { label: "Sẵn sàng", tone: "success" },
  OCCUPIED: { label: "Có khách", tone: "info" },
  CLEANING: { label: "Đang dọn", tone: "warning" },
  MAINTENANCE: { label: "Đang khoá", tone: "danger" },
};

export const bookingStatusLabels: Record<BookingStatus, Labelled> = {
  PENDING: { label: "Chờ thanh toán", tone: "warning" },
  CONFIRMED: { label: "Đã xác nhận", tone: "info" },
  CHECKED_IN: { label: "Đang lưu trú", tone: "success" },
  COMPLETED: { label: "Đã trả phòng", tone: "muted" },
  CANCELLED: { label: "Đã huỷ", tone: "danger" },
  NO_SHOW: { label: "Khách không đến", tone: "danger" },
  EXPIRED: { label: "Hết hạn giữ phòng", tone: "muted" },
};

export const paymentStatusLabels: Record<PaymentStatus, Labelled> = {
  UNPAID: { label: "Chưa thanh toán", tone: "warning" },
  PAID: { label: "Đã thanh toán", tone: "success" },
  REFUND_PENDING: { label: "Chờ hoàn tiền", tone: "info" },
  PARTIALLY_REFUNDED: { label: "Đã hoàn một phần", tone: "info" },
  REFUNDED: { label: "Đã hoàn tiền", tone: "muted" },
  FAILED: { label: "Thanh toán thất bại", tone: "danger" },
};

const moneyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 2,
});

export function formatMoney(amount: number | null | undefined) {
  return amount == null ? "—" : moneyFormat.format(amount);
}

/** `YYYY-MM-DD` → "dd/MM/yyyy" for a calendar date (no time-zone shift). */
export function formatCalendarDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

/** ISO instant → "dd/MM/yyyy HH:mm" in the viewer's time zone. */
export function formatDateTime(iso: string | null | undefined) {
  return iso ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: vi }) : "—";
}

export function weekdayLabel(date: string) {
  return format(new Date(`${date}T00:00:00`), "EEEE", { locale: vi });
}
