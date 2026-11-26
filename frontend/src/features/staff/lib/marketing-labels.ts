import type { ContentIdea, ContentStatus, ContentType, ScheduleStatus, SocialPlatform } from "@stayreco/shared";
import type { StatusTone } from "./labels";

type Labelled = { label: string; tone: StatusTone };

export const contentStatusLabels: Record<ContentStatus, Labelled> = {
  DRAFT: { label: "Bản nháp", tone: "muted" },
  // There is no approval step any more; these two and REJECTED only remain on pieces from before it was removed.
  PENDING_APPROVAL: { label: "Bản nháp", tone: "muted" },
  APPROVED: { label: "Sẵn sàng đăng", tone: "success" },
  SCHEDULED: { label: "Đã lên lịch", tone: "info" },
  PUBLISHED: { label: "Đã đăng", tone: "success" },
  REJECTED: { label: "Bản nháp", tone: "muted" },
};

export const contentTypeLabels: Record<ContentType, string> = {
  POST: "Bài đăng",
  CAPTION: "Chú thích ảnh",
  PROMOTION: "Quảng bá ưu đãi",
  BLOG: "Bài blog",
};

export const scheduleStatusLabels: Record<ScheduleStatus, Labelled> = {
  SCHEDULED: { label: "Chờ đăng", tone: "info" },
  PUBLISHING: { label: "Đang đăng", tone: "warning" },
  PUBLISHED: { label: "Đã đăng", tone: "success" },
  FAILED: { label: "Đăng lỗi", tone: "danger" },
  CANCELLED: { label: "Đã huỷ", tone: "muted" },
};

export const platformLabels: Record<SocialPlatform, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
};

export const platformClasses: Record<SocialPlatform, string> = {
  FACEBOOK: "bg-blue-50 text-blue-700 border-blue-200",
  INSTAGRAM: "bg-pink-50 text-pink-700 border-pink-200",
  TIKTOK: "bg-foreground text-background border-foreground",
};

export const ideaKindLabels: Record<ContentIdea["kind"], { label: string; tone: StatusTone }> = {
  FREE_ROOMS: { label: "Phòng còn trống", tone: "warning" },
  PROMOTION: { label: "Khuyến mãi đang chạy", tone: "info" },
  GREAT_REVIEW: { label: "Đánh giá tốt", tone: "success" },
};

/** Statuses whose words and picture may still be changed: anything not yet out (docs/api/marketing.md). */
export const EDITABLE_STATUSES: ContentStatus[] = ["DRAFT", "PENDING_APPROVAL", "REJECTED", "APPROVED", "SCHEDULED"];
/** Statuses that may be put on the calendar: every one, with no approval step (M9). */
export const SCHEDULABLE_STATUSES: ContentStatus[] = [
  "DRAFT",
  "PENDING_APPROVAL",
  "REJECTED",
  "APPROVED",
  "SCHEDULED",
  "PUBLISHED",
];
/** Statuses that may be deleted: not yet put on a page. */
export const DELETABLE_STATUSES: ContentStatus[] = ["DRAFT", "PENDING_APPROVAL", "REJECTED", "APPROVED"];

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 4 });

export function formatUsd(amount: number) {
  return usd.format(amount);
}

const compact = new Intl.NumberFormat("vi-VN");

export function formatCount(value: number) {
  return compact.format(value);
}
