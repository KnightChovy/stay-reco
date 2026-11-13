import type {
  AccountStatus,
  AuditSeverity,
  AuditLogEntry,
  PartnerStatus,
  PaymentMethod,
  Role,
  SuspensionRequest,
} from "@stayreco/shared";
import type { StatusTone } from "@/features/partner/lib/labels";

export { formatDateTime, formatMoney, paymentStatusLabels } from "@/features/partner/lib/labels";

type Labelled = { label: string; tone: StatusTone };

export const roleLabels: Record<Role, string> = {
  CUSTOMER: "Khách hàng",
  HOTEL_PARTNER: "Đối tác khách sạn",
  HOTEL_STAFF: "Nhân viên khách sạn",
  PLATFORM_MANAGER: "Quản lý nền tảng",
  ADMIN: "Quản trị viên",
};

export const roleDescriptions: Record<Role, string> = {
  CUSTOMER: "Quản lý hồ sơ, đặt phòng, thanh toán, ví và đánh giá của chính mình.",
  HOTEL_PARTNER: "Quản lý các khách sạn thuộc sở hữu: phòng, giá, đặt phòng, nhân viên và quyền nhân viên; các nghiệp vụ cần chủ khách sạn quyết định.",
  HOTEL_STAFF: "Làm việc trong khách sạn được phân công. Các thao tác đặt phòng, lễ tân, chăm sóc khách, hoàn tiền và marketing phụ thuộc nhóm quyền được chủ khách sạn cấp.",
  PLATFORM_MANAGER: "Thẩm định khách sạn, xử lý tuân thủ và yêu cầu chi tiền, theo dõi báo cáo toàn nền tảng; gửi đề nghị tạm ngưng đối tác để admin quyết định.",
  ADMIN: "Quản lý tài khoản, mời quản lý nền tảng, quyết định tạm ngưng và khôi phục đối tác, đặt hoa hồng; xem nhật ký, giao dịch và cấu hình thanh toán. Không tự động có quyền vận hành khách sạn.",
};

export const accountStatusLabels: Record<AccountStatus, Labelled> = {
  PENDING_VERIFICATION: { label: "Chờ xác thực email", tone: "warning" },
  ACTIVE: { label: "Đang hoạt động", tone: "success" },
  INVITED: { label: "Đã mời", tone: "info" },
  SUSPENDED: { label: "Bị khóa", tone: "danger" },
  DEACTIVATED: { label: "Khách sạn đã tắt", tone: "muted" },
  DELETED: { label: "Đã xóa", tone: "muted" },
};

export const partnerStatusLabels: Record<PartnerStatus, Labelled> = {
  PENDING: { label: "Chờ duyệt", tone: "warning" },
  APPROVED: { label: "Đã duyệt", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
  SUSPENDED: { label: "Bị tạm ngưng", tone: "danger" },
};

export const suspensionStatusLabels: Record<SuspensionRequest["status"], Labelled> = {
  PENDING: { label: "Chờ quyết định", tone: "warning" },
  APPROVED: { label: "Đã chấp thuận", tone: "danger" },
  REJECTED: { label: "Đã từ chối", tone: "muted" },
};

export const severityLabels: Record<AuditSeverity, Labelled> = {
  INFO: { label: "Thông tin", tone: "muted" },
  WARNING: { label: "Cảnh báo", tone: "warning" },
  CRITICAL: { label: "Nghiêm trọng", tone: "danger" },
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  VNPAY: "VNPay",
  SEPAY: "Chuyển khoản SePay",
  WALLET: "Ví StayReco",
  CASH: "Tiền mặt",
  MIXED: "Kết hợp",
};

export const walletLabels = { HOTEL: "Ví khách sạn", CUSTOMER: "Ví khách hàng", PLATFORM: "Ví nền tảng" } as const;

export const paymentCheckLabels = {
  ACCOUNT_CONFIGURED: "Tài khoản nhận tiền đã cấu hình",
  WEBHOOK_KEY_SET: "Khóa webhook đã đặt",
  WEBHOOK_RECEIVED: "Đã nhận webhook trong 7 ngày qua",
} as const;

/** A select holds one value or "" (all); the API takes repeated filters as a list. */
export function oneOf<T extends string>(value: string) {
  return value ? [value as T] : undefined;
}

/** `from` / `to` go together or not at all (docs/api/admin.md); a half-filled period is not sent. */
export function periodParams(from: string, to: string) {
  return from && to ? { from, to } : {};
}

/** Audit actions in Vietnamese; an action not listed is shown as its code (new backend actions still read). */
const auditActionLabels: Record<string, string> = {
  LOGIN_SUCCESS: "Đăng nhập thành công",
  LOGIN_FAILED: "Đăng nhập thất bại",
  LOGOUT: "Đăng xuất",
  LOGOUT_ALL: "Đăng xuất mọi thiết bị",
  SESSION_REVOKED: "Đăng xuất một thiết bị",
  REFRESH_TOKEN_REUSE: "Dùng lại refresh token (nghi bị lộ)",
  ACCOUNT_REGISTERED: "Đăng ký tài khoản",
  ACCOUNT_INVITED: "Mời tài khoản",
  INVITATION_ACCEPTED: "Chấp nhận lời mời",
  EMAIL_VERIFIED: "Xác thực email",
  ACCOUNT_LOCKED: "Tài khoản bị khóa tạm do sai mật khẩu",
  ACCOUNT_SUSPENDED: "Khóa tài khoản",
  ACCOUNT_ACTIVATED: "Mở khóa tài khoản",
  PASSWORD_CHANGED: "Đổi mật khẩu",
  PASSWORD_RESET: "Đặt lại mật khẩu",
  PROFILE_UPDATED: "Cập nhật hồ sơ",
  BOOKING_CONFIRMED: "Xác nhận thanh toán đơn",
  BOOKING_EXPIRED: "Đơn hết hạn giữ chỗ",
  BOOKING_DISCOUNT_APPLIED: "Áp dụng giảm giá",
  BOOKING_CANCEL_REQUESTED: "Khách yêu cầu hủy",
  BOOKING_CHANGE_REQUESTED: "Khách yêu cầu đổi thông tin",
  BOOKING_CHANGE_ACCEPTED: "Chấp nhận đổi thông tin",
  BOOKING_CHANGE_REJECTED: "Từ chối đổi thông tin",
  BOOKING_CHECKED_IN: "Nhận phòng",
  BOOKING_CHECKED_OUT: "Trả phòng",
  BOOKING_NO_SHOW: "Khách không đến",
  REFUND_FORWARDED: "Chuyển yêu cầu hoàn tiền",
  REFUND_APPROVED: "Duyệt hoàn tiền",
  REFUND_AUTO_APPROVED: "Tự động duyệt hoàn tiền",
  REFUND_REJECTED: "Từ chối hoàn tiền",
  SEPAY_TRANSFER_UNMATCHED: "Chuyển khoản SePay không khớp",
  SEPAY_TRANSFER_LATE: "Chuyển khoản SePay đến muộn",
  PAYOUT_REQUESTED: "Yêu cầu rút tiền",
  PAYOUT_PAID: "Đã chi tiền rút",
  PAYOUT_REJECTED: "Từ chối rút tiền",
  PAYOUT_CANCELLED: "Hủy yêu cầu rút tiền",
  PAYOUT_ACCOUNT_VIEWED: "Xem số tài khoản nhận tiền",
  COMMISSION_RATE_CHANGED: "Đổi tỉ lệ hoa hồng",
  PARTNER_REINSTATED: "Khôi phục đối tác",
  SUSPENSION_REQUESTED: "Đề nghị tạm ngưng đối tác",
  SUSPENSION_APPROVED: "Chấp thuận tạm ngưng đối tác",
  SUSPENSION_REJECTED: "Từ chối tạm ngưng đối tác",
  VIOLATION_OPENED: "Mở hồ sơ vi phạm",
  VIOLATION_UPDATED: "Cập nhật hồ sơ vi phạm",
  VERIFICATION_SUBMITTED: "Gửi hồ sơ xác minh",
  VERIFICATION_APPROVED: "Duyệt hồ sơ xác minh",
  VERIFICATION_REJECTED: "Từ chối hồ sơ xác minh",
  VERIFICATION_CHANGES_REQUESTED: "Yêu cầu bổ sung hồ sơ",
  VERIFICATION_REVERIFICATION_REQUESTED: "Yêu cầu tái xác minh",
  STAFF_ACTIVATED: "Bật tài khoản nhân viên",
  STAFF_DEACTIVATED: "Tắt tài khoản nhân viên",
  STAFF_PERMISSIONS_CHANGED: "Đổi quyền nhân viên",
  STAFF_INVITATION_CANCELLED: "Hủy lời mời nhân viên",
  ROOM_LOCKED: "Khóa phòng",
  ROOM_UNLOCKED: "Mở khóa phòng",
  REVIEW_CREATED: "Viết đánh giá",
  REVIEW_UPDATED: "Sửa đánh giá",
  REVIEW_IMAGE_ADDED: "Thêm ảnh đánh giá",
  REVIEW_IMAGE_REMOVED: "Xóa ảnh đánh giá",
  REVIEW_REPORTED: "Báo cáo đánh giá",
  REVIEW_REPORT_DECIDED: "Xử lý báo cáo đánh giá",
  REVIEW_VISIBILITY_CHANGED: "Ẩn / hiện đánh giá",
  PROMOTION_CREATED: "Tạo khuyến mãi",
  PROMOTION_UPDATED: "Sửa khuyến mãi",
  VOUCHERS_ISSUED: "Phát hành voucher",
  LOYALTY_POINTS_EARNED: "Cộng điểm thưởng",
  LOYALTY_POINTS_SPENT: "Dùng điểm thưởng",
  LOYALTY_POINTS_REFUNDED: "Hoàn điểm thưởng",
};

export const actionLabel = (action: string) => auditActionLabels[action] ?? action;

export const loginFailureLabels: Record<string, string> = {
  EMAIL_NOT_FOUND: "Email đăng nhập không tồn tại trong hệ thống.",
  INCORRECT_PASSWORD: "Mật khẩu không khớp với tài khoản đăng nhập.",
  PASSWORD_NOT_SET: "Tài khoản chưa thiết lập mật khẩu đăng nhập.",
  ACCOUNT_TEMPORARILY_LOCKED: "Tài khoản đang bị khóa tạm thời do đăng nhập sai nhiều lần.",
  FAILED_LOGIN_LIMIT_REACHED: "Đã đạt giới hạn 5 lần đăng nhập sai; khóa tài khoản trong 15 phút.",
  ACCOUNT_SUSPENDED: "Tài khoản đã bị quản trị viên đình chỉ.",
  ACCOUNT_DEACTIVATED: "Khách sạn đã ngừng kích hoạt tài khoản nhân viên.",
  EMAIL_NOT_VERIFIED: "Email chưa được xác thực; cần hoàn tất xác thực trước khi đăng nhập.",
  ACCOUNT_NOT_ACTIVE: "Trạng thái tài khoản không cho phép đăng nhập.",
};

export function auditDescription(entry: Pick<AuditLogEntry, "action" | "details">): string | null {
  const reason = entry.details?.reason;
  if (typeof reason === "string" && reason) return loginFailureLabels[reason] ?? reason;
  if (entry.action === "LOGIN_FAILED") return "Bản ghi cũ chưa lưu nguyên nhân đăng nhập thất bại.";
  return null;
}

export const walletTxnTypeLabels: Record<string, string> = {
  BOOKING_PAYMENT: "Thanh toán đơn",
  COMMISSION: "Hoa hồng",
  PAYOUT: "Rút tiền",
  REFUND: "Hoàn tiền",
  TOPUP: "Nạp tiền",
  ADJUSTMENT: "Điều chỉnh",
  SETTLEMENT: "Quyết toán",
};

/** Keys of an event's recorded data (`details`); a key not listed is shown as it is. */
export const detailKeyLabels: Record<string, string> = {
  email: "Email",
  reason: "Lý do",
  userAgent: "Trình duyệt / thiết bị",
  lockedUntil: "Khóa đến",
  failedLoginCount: "Số lần đăng nhập sai",
  note: "Ghi chú",
  amount: "Số tiền",
  transactionId: "Mã giao dịch",
  bankReference: "Mã tham chiếu ngân hàng",
  commission: "Hoa hồng",
  refundAmount: "Số tiền hoàn",
  fee: "Phí",
  lateFee: "Phí trả muộn",
  releasedNights: "Đêm trả lại để bán",
  changes: "Thay đổi",
  arrivalTime: "Giờ đến",
  specialRequests: "Yêu cầu đặc biệt",
  guestName: "Tên khách",
  contactPhone: "Số điện thoại",
  fields: "Trường đã đổi",
  from: "Từ",
  to: "Thành",
  rate: "Tỉ lệ",
  status: "Trạng thái",
  code: "Mã",
  role: "Vai trò",
  roomNumber: "Số phòng",
  permissions: "Quyền",
  points: "Điểm",
};
