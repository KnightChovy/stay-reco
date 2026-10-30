import { format, formatDistanceToNowStrict } from "date-fns";
import { vi } from "date-fns/locale";
import type { DocumentType, VerificationRequestType, VerificationStatus } from "@stayreco/shared";

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
