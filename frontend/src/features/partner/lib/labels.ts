import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  AccountStatus,
  DocumentType,
  HotelStatus,
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
