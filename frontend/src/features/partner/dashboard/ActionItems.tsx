"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import {
  ACTION_ITEM_TYPES,
  SETUP_STEPS,
  type ActionItem,
  type ActionItemSeverity,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useActionItems } from "../api/partner-queries";
import { ErrorPanel, PartnerPanel } from "../components";
import { formatDate, formatDateTime } from "../lib/labels";

const VISIBLE_ITEMS = 5;

const severityStyles: Record<ActionItemSeverity, { icon: LucideIcon; className: string }> = {
  CRITICAL: { icon: CircleAlert, className: "bg-danger-soft text-danger" },
  WARNING: { icon: TriangleAlert, className: "bg-warning-soft text-warning" },
  INFO: { icon: Info, className: "bg-info-soft text-info" },
};

const setupStepLabels: Record<(typeof SETUP_STEPS)[number], string> = {
  AMENITIES: "tiện ích",
  POLICIES: "chính sách",
  IMAGES: "hình ảnh",
  ROOM_CONFIG: "cấu hình phòng",
  ROOMS: "loại phòng & phòng",
};

const knownTypes = new Set<string>(ACTION_ITEM_TYPES);

/** The backend sends codes and parameters; the wording and the target screen belong to the FE (§4.1). */
function present(item: ActionItem): { title: string; detail?: string; href: string } {
  switch (item.type) {
    case "VERIFICATION_NEEDS_REVISION":
      return {
        title: "Hồ sơ xác minh cần bổ sung",
        detail: "Nền tảng yêu cầu chỉnh sửa hoặc đã từ chối hồ sơ gần nhất.",
        href: "/partner/verification",
      };
    case "OVERDUE_CHECKOUTS":
      return {
        title: `${item.count} booking quá giờ trả phòng`,
        detail: "Khách vẫn đang lưu trú sau giờ trả phòng.",
        href: "/partner/bookings",
      };
    case "REFUND_REQUESTS_PENDING":
      return {
        title: `${item.count} yêu cầu hoàn tiền chờ duyệt`,
        detail: `Yêu cầu cũ nhất lúc ${formatDateTime(item.params.oldestAt)}`,
        href: "/partner/bookings?tab=refunds",
      };
    case "CHANGE_REQUESTS_PENDING":
      return {
        title: `${item.count} yêu cầu đổi booking chờ xử lý`,
        detail: `Yêu cầu cũ nhất lúc ${formatDateTime(item.params.oldestAt)}`,
        href: "/partner/bookings",
      };
    case "SETUP_INCOMPLETE":
      return {
        title: "Hoàn tất thông tin khách sạn",
        detail: `Còn thiếu: ${item.params.missing.map((step) => setupStepLabels[step]).join(", ")}`,
        href: "/partner/hotel",
      };
    case "ROOMS_LOCKED_LONG":
      return {
        title: `${item.count} phòng bị khoá hơn ${item.params.days} ngày`,
        detail: "Mở khoá nếu phòng đã sửa xong để bán lại.",
        href: "/partner/rooms",
      };
    case "NO_AVAILABILITY_DATES":
      return {
        title: `${item.count} ngày hết phòng do đóng bán`,
        detail: item.params.dates.slice(0, 3).map(formatDate).join(", ") + (item.params.dates.length > 3 ? "…" : ""),
        href: "/partner/availability",
      };
    case "STAFF_INVITES_PENDING":
      return {
        title: `${item.count} lời mời nhân viên chưa được nhận`,
        detail: "Đã gửi hơn 3 ngày; nhắc nhân viên hoặc gửi lại lời mời.",
        href: "/partner/staff",
      };
    case "VERIFICATION_PENDING":
      return {
        title: "Hồ sơ xác minh đang chờ thẩm định",
        detail: `Gửi lúc ${formatDateTime(item.params.submittedAt)}`,
        href: "/partner/verification",
      };
    case "HIGH_DEMAND_DATES":
      return {
        title: `${item.count} ngày tới công suất từ ${item.params.threshold}%`,
        detail: `Sớm nhất ${formatDate(item.params.firstDate)}: cân nhắc tăng giá.`,
        href: "/partner/pricing",
      };
  }
}

export function ActionItems({ hotelId }: { hotelId: string }) {
  const query = useActionItems(hotelId);
  const [showAll, setShowAll] = useState(false);

  // Types added by later phases are not an error: they are skipped (and logged) until the FE knows them.
  const items = useMemo(
    () =>
      (query.data?.items ?? []).filter((item) => {
        if (knownTypes.has(item.type)) return true;
        console.warn("Unknown action item type", item.type);
        return false;
      }),
    [query.data],
  );

  if (query.error) return <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />;

  const visible = showAll ? items : items.slice(0, VISIBLE_ITEMS);

  return (
    <PartnerPanel className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-bold text-primary">Việc cần làm</h2>
        {items.length > 0 && <span className="text-xs font-semibold text-muted-foreground">{items.length} việc</span>}
      </div>
      {query.isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : items.length === 0 ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
          <CircleCheck size={18} className="text-success" />
          Không có việc nào cần xử lý.
        </p>
      ) : (
        <>
          <ul className="divide-y">
            {visible.map((item) => {
              const { title, detail, href } = present(item);
              const { icon: Icon, className } = severityStyles[item.severity];
              return (
                <li key={item.type}>
                  <Link href={href} className="flex items-center gap-3 px-5 py-3 hover:bg-muted">
                    <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", className)}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm text-primary">{title}</strong>
                      {detail && <span className="block truncate text-xs text-muted-foreground">{detail}</span>}
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
          {items.length > VISIBLE_ITEMS && (
            <div className="border-t px-5 py-2">
              <Button variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)}>
                {showAll ? "Thu gọn" : `Xem tất cả (${items.length})`}
              </Button>
            </div>
          )}
        </>
      )}
    </PartnerPanel>
  );
}
