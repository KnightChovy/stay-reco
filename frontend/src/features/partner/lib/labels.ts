import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  AccountStatus,
  BookingStatus,
  DayOfWeek,
  DocumentType,
  HotelStatus,
  PaymentStatus,
  PriceAdjustmentType,
  RoomStatus,
  StaffPermission,
  VerificationRequestType,
  VerificationStatus,
} from "@stayreco/shared";

/** Badge classes built from the semantic status tokens in globals.css. */
export type StatusTone = "success" | "warning" | "danger" | "info" | "muted";

export const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
  muted: "bg-muted text-muted-foreground",
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

export const staffStatusLabels: Partial<Record<AccountStatus, Labelled>> = {
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  INVITED: { label: "Chờ nhận lời mời", tone: "warning" },
  DEACTIVATED: { label: "Đã vô hiệu hoá", tone: "muted" },
  SUSPENDED: { label: "Bị quản trị tạm ngưng", tone: "danger" },
};

export const staffPermissionLabels: Record<StaffPermission, { label: string; description: string }> = {
  BOOKING: { label: "Đặt phòng", description: "Xem, xác nhận và cập nhật booking" },
  FRONT_DESK: { label: "Lễ tân", description: "Check-in, check-out, gán phòng" },
  CUSTOMER_CARE: { label: "Chăm sóc khách hàng", description: "Trả lời tin nhắn và yêu cầu của khách" },
  REFUND: { label: "Hoàn tiền", description: "Xử lý yêu cầu huỷ và hoàn tiền" },
  MARKETING: { label: "Marketing", description: "Nội dung, lịch đăng và chiến dịch" },
};

export const verificationStatusLabels: Record<VerificationStatus, Labelled> = {
  PENDING: { label: "Chờ thẩm định", tone: "warning" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
  NEEDS_REVISION: { label: "Cần bổ sung", tone: "info" },
};

export const verificationTypeLabels: Record<VerificationRequestType, string> = {
  INITIAL: "Xác minh lần đầu",
  UPDATE: "Cập nhật hồ sơ",
  RENEWAL: "Tái xác minh",
};

export const documentTypeLabels: Record<DocumentType, string> = {
  BUSINESS_LICENSE: "Giấy chứng nhận đăng ký kinh doanh",
  FIRE_SAFETY: "Giấy chứng nhận PCCC",
  SECURITY_CERTIFICATE: "Giấy chứng nhận đủ điều kiện ANTT",
  ID_CARD: "CCCD người đại diện",
  OTHER: "Quyết định công nhận hạng sao",
};

const moneyFormat = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 2 });

export function formatMoney(amount: number | null | undefined) {
  return amount == null ? "—" : moneyFormat.format(amount);
}

/** ISO string → "dd/MM/yyyy HH:mm" in the viewer's time zone (Asia/Ho_Chi_Minh for the target users). */
export function formatDateTime(iso: string | null | undefined) {
  return iso ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: vi }) : "—";
}

export const bookingStatusLabels: Record<BookingStatus, Labelled> = {
  PENDING: { label: "Chờ thanh toán", tone: "warning" },
  CONFIRMED: { label: "Đã xác nhận", tone: "success" },
  CHECKED_IN: { label: "Đang lưu trú", tone: "info" },
  COMPLETED: { label: "Hoàn tất", tone: "muted" },
  CANCELLED: { label: "Đã huỷ", tone: "danger" },
  NO_SHOW: { label: "Không đến", tone: "danger" },
  EXPIRED: { label: "Hết hạn giữ chỗ", tone: "muted" },
};

export const paymentStatusLabels: Record<PaymentStatus, Labelled> = {
  UNPAID: { label: "Chưa thanh toán", tone: "warning" },
  PAID: { label: "Đã thanh toán", tone: "success" },
  REFUND_PENDING: { label: "Chờ hoàn tiền", tone: "warning" },
  PARTIALLY_REFUNDED: { label: "Hoàn một phần", tone: "info" },
  REFUNDED: { label: "Đã hoàn tiền", tone: "muted" },
  FAILED: { label: "Thanh toán thất bại", tone: "danger" },
};

/** Events of `Booking.timeline` (docs/api/customer.md). */
export const bookingEventLabels: Record<string, string> = {
  CREATED: "Tạo booking",
  PAID: "Thanh toán thành công",
  EXPIRED: "Hết hạn giữ chỗ",
  CANCEL_REQUESTED: "Khách yêu cầu huỷ",
  REFUND_FORWARDED: "Nhân viên chuyển yêu cầu hoàn tiền",
  REFUND_APPROVED: "Duyệt hoàn tiền",
  REFUND_REJECTED: "Từ chối hoàn tiền",
  CANCELLED: "Đã huỷ",
};

export const pricingRuleTypeLabels: Record<"SEASON" | "EARLY_BIRD" | "LAST_MINUTE", { label: string; description: string }> = {
  SEASON: { label: "Theo mùa / dịp", description: "Áp dụng cho các đêm trong khoảng ngày (lễ, Tết, cao điểm)." },
  EARLY_BIRD: { label: "Đặt sớm", description: "Khách đặt trước ngày nhận phòng ít nhất N ngày." },
  LAST_MINUTE: { label: "Phút chót", description: "Khách đặt trong vòng N ngày trước ngày nhận phòng." },
};

export const adjustmentTypeLabels: Record<PriceAdjustmentType, string> = {
  SET_PRICE: "Đặt giá cố định",
  AMOUNT: "Cộng / trừ số tiền",
  PERCENT: "Cộng / trừ phần trăm",
};

export const dayOfWeekLabels: Record<DayOfWeek, string> = {
  MON: "Thứ 2",
  TUE: "Thứ 3",
  WED: "Thứ 4",
  THU: "Thứ 5",
  FRI: "Thứ 6",
  SAT: "Thứ 7",
  SUN: "Chủ nhật",
};

/** "YYYY-MM-DD" (a calendar date, no time zone) → "dd/MM/yyyy". */
export function formatDate(date: string | null | undefined) {
  if (!date) return "—";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
