import { format, formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import type {
  CommissionStatus,
  DocumentType,
  HotelStatus,
  PartnerStatus,
  Region,
  PayoutStatus,
  VerificationRequestType,
  SuspensionRequestStatus,
  VerificationStatus,
  ViolationType,
  WalletTxnType,
  VIOLATION_SEVERITIES,
  VIOLATION_STATUSES,
} from "@stayreco/shared";

export type ViolationSeverity = (typeof VIOLATION_SEVERITIES)[number];
export type ViolationStatus = (typeof VIOLATION_STATUSES)[number];

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

export const payoutStatusLabels: Record<PayoutStatus, Labelled> = {
  PENDING: { label: "Chờ chuyển tiền", tone: "warning" },
  PAID: { label: "Đã chuyển", tone: "success" },
  REJECTED: { label: "Đã từ chối", tone: "danger" },
  CANCELLED: { label: "Đối tác đã huỷ", tone: "muted" },
};

export const partnerStatusLabels: Record<PartnerStatus, Labelled> = {
  PENDING: { label: "Chờ duyệt", tone: "warning" },
  APPROVED: { label: "Đang hoạt động", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
  SUSPENDED: { label: "Tạm ngưng", tone: "danger" },
};

export const hotelStatusLabels: Record<HotelStatus, Labelled> = {
  DRAFT: { label: "Bản nháp", tone: "muted" },
  PENDING_VERIFICATION: { label: "Chờ xác minh", tone: "warning" },
  ACTIVE: { label: "Đang bán", tone: "success" },
  SUSPENDED: { label: "Tạm ngưng", tone: "danger" },
  INACTIVE: { label: "Ngừng hoạt động", tone: "muted" },
};

export const regionLabels: Record<Region, string> = {
  NORTH: "Miền Bắc",
  CENTRAL: "Miền Trung",
  SOUTH: "Miền Nam",
  OTHER: "Khác",
};

export const violationTypeLabels: Record<ViolationType, string> = {
  FRAUD: "Gian lận",
  FAKE_LISTING: "Thông tin cơ sở sai sự thật",
  GUEST_SAFETY: "An toàn khách lưu trú",
  LICENSE_EXPIRED: "Giấy phép hết hiệu lực",
  PAYMENT_ABUSE: "Lạm dụng thanh toán",
  REVIEW_MANIPULATION: "Thao túng đánh giá",
  OTHER: "Khác",
};

export const violationSeverityLabels: Record<ViolationSeverity, Labelled> = {
  LOW: { label: "Thấp", tone: "muted" },
  MEDIUM: { label: "Trung bình", tone: "info" },
  HIGH: { label: "Cao", tone: "warning" },
  CRITICAL: { label: "Nghiêm trọng", tone: "danger" },
};

export const violationStatusLabels: Record<ViolationStatus, Labelled> = {
  OPEN: { label: "Mới mở", tone: "warning" },
  INVESTIGATING: { label: "Đang điều tra", tone: "info" },
  RESOLVED: { label: "Đã xử lý", tone: "success" },
  DISMISSED: { label: "Đã bác bỏ", tone: "muted" },
};

export const suspensionStatusLabels: Record<SuspensionRequestStatus, Labelled> = {
  PENDING: { label: "Chờ admin quyết định", tone: "warning" },
  APPROVED: { label: "Admin đã tạm ngưng", tone: "danger" },
  REJECTED: { label: "Admin đã từ chối", tone: "muted" },
};

export const commissionStatusLabels: Record<CommissionStatus, Labelled> = {
  CHARGED: { label: "Đã thu", tone: "success" },
  EXPECTED: { label: "Dự kiến", tone: "info" },
};

export const walletTxnTypeLabels: Record<WalletTxnType, string> = {
  BOOKING_PAYMENT: "Thanh toán đặt phòng",
  COMMISSION: "Hoa hồng nền tảng",
  REFUND: "Hoàn tiền huỷ phòng",
  SETTLEMENT: "Chuyển sang khả dụng",
  PAYOUT: "Rút tiền",
  ADJUSTMENT: "Điều chỉnh",
  TOPUP: "Nạp tiền",
};

const moneyFormat = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });

export function formatMoney(amount: number | null | undefined) {
  return amount == null ? "—" : moneyFormat.format(amount);
}

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

/** Keys of `VerificationRequest.legal` / `.property`, in the order of the partner's wizard (submitVerificationSchema). */
export const legalFieldLabels: Record<string, string> = {
  legalName: "Tên pháp nhân",
  taxCode: "Mã số thuế",
  businessType: "Loại hình doanh nghiệp",
  representativeName: "Người đại diện theo pháp luật",
  representativeTitle: "Chức danh",
  representativeIdNumber: "Số CCCD / hộ chiếu",
  contactPhone: "Điện thoại liên hệ",
  notificationEmail: "Email nhận kết quả",
};

export const propertyFieldLabels: Record<string, string> = {
  tradeName: "Tên thương mại",
  propertyType: "Loại hình lưu trú",
  starRating: "Hạng sao",
  physicalRooms: "Số phòng vật lý",
  propertyManager: "Người quản lý cơ sở",
  licensedAddress: "Địa chỉ theo giấy phép",
  landmark: "Mốc nhận diện",
  frontDeskHours: "Giờ lễ tân",
  surveyNotes: "Hướng dẫn khảo sát",
};

/** ISO string → "dd/MM/yyyy HH:mm" in the viewer's time zone (Asia/Ho_Chi_Minh for the target users). */
export function formatDateTime(iso: string | null | undefined) {
  return iso ? format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: vi }) : "—";
}

/** How long a request has been waiting, from `submittedAt` (the FE computes the SLA, docs/api/manager.md). */
export function formatWaiting(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { locale: vi });
}
