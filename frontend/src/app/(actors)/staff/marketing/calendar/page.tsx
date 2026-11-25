"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, Link2, RefreshCw, XCircle } from "lucide-react";
import type { ContentSchedule, ScheduleStatus } from "@stayreco/shared";
import Pagination from "@/components/common/pagination/Pagination";
import { ActionMenu } from "@/components/common/ActionBar";
import { EmptyState } from "@/components/common/StateViews";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/features/stays/lib/format";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { useCancelSchedule, useSchedules, useSocialAccounts } from "@/features/staff/api/marketing-queries";
import { getMarketingErrorMessage, isMissingMarketingPermission } from "@/features/staff/lib/marketing-errors";
import { platformLabels } from "@/features/staff/lib/marketing-labels";
import {
  ConfirmDialog,
  MarketingErrorPanel,
  MarketingHeader,
  PlatformPill,
  ScheduleStatusPill,
} from "@/features/staff/marketing/MarketingParts";

const PAGE_SIZE = 20;

const TABS: Array<{ id: string; label: string; status?: ScheduleStatus[]; sort?: "published-desc" }> = [
  { id: "upcoming", label: "Chờ đăng", status: ["SCHEDULED", "PUBLISHING"] },
  { id: "published", label: "Đã đăng", status: ["PUBLISHED"], sort: "published-desc" },
  { id: "failed", label: "Đăng lỗi", status: ["FAILED"] },
  { id: "all", label: "Tất cả" },
];

const dayFormat = new Intl.DateTimeFormat("vi-VN", {
  weekday: "long",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});
const timeFormat = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" });

/** The instant a row belongs to on the calendar: when it went out, else when it is due. */
function instantOf(schedule: ContentSchedule) {
  return schedule.publishedAt ?? schedule.scheduledAt;
}

function groupByDay(schedules: ContentSchedule[]) {
  const groups = new Map<string, ContentSchedule[]>();
  for (const schedule of schedules) {
    const at = instantOf(schedule);
    const key = at
      ? dayFormat.format(new Date(at))
      : schedule.status === "SCHEDULED" || schedule.status === "PUBLISHING"
        ? "Đăng ở lượt chạy kế tiếp"
        : "Đăng ngay (không hẹn giờ)";
    groups.set(key, [...(groups.get(key) ?? []), schedule]);
  }
  return [...groups.entries()];
}

function ScheduleItem({ schedule }: { schedule: ContentSchedule }) {
  const cancel = useCancelSchedule();
  const [confirm, setConfirm] = useState(false);
  const at = instantOf(schedule);
  const failed = schedule.status === "FAILED";
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-4 shadow-2xs",
        failed ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="w-14 shrink-0 text-sm font-bold tabular-nums text-foreground">{at ? timeFormat.format(new Date(at)) : "—"}</div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformPill platform={schedule.platform} />
          <ScheduleStatusPill status={schedule.status} />
          <span className="truncate font-mono text-xs text-muted-foreground">{schedule.accountName}</span>
        </div>
        <Link
          href={`/staff/marketing/content/${schedule.contentId}`}
          className="block text-sm font-semibold text-foreground hover:text-primary"
        >
          {schedule.title || "(Chưa có tiêu đề)"}
        </Link>
        <p className="line-clamp-2 text-xs text-muted-foreground">{schedule.body}</p>
        {schedule.failureReason && (
          <p className="rounded bg-destructive/10 px-2 py-1.5 text-xs font-medium text-destructive" role="alert">
            Đăng lỗi, lý do: {schedule.failureReason}
          </p>
        )}
        {cancel.error && <p className="text-xs text-destructive">{getMarketingErrorMessage(cancel.error)}</p>}
        {schedule.status === "PUBLISHED" && (
          <Link
            href={`/staff/marketing/analytics?schedule=${schedule.id}`}
            className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-1.5 whitespace-nowrap")}
          >
            <BarChart3 className="size-4" aria-hidden /> Xem hiệu quả
          </Link>
        )}
      </div>
      {schedule.status === "SCHEDULED" && (
        <>
          <ActionMenu
            variant="icon"
            label="Thao tác với lịch đăng"
            items={[
              {
                label: "Huỷ lịch",
                description: "Bài sẽ không được đăng lên trang này nữa.",
                icon: XCircle,
                destructive: true,
                onSelect: () => setConfirm(true),
              },
            ]}
          />
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="Huỷ lịch đăng này?"
            description={`Bài "${schedule.title || "chưa có tiêu đề"}" sẽ không được đăng lên ${platformLabels[schedule.platform]}. Bạn có thể lên lịch lại sau.`}
            confirmLabel="Huỷ lịch"
            pending={cancel.isPending}
            onConfirm={() => cancel.mutate(schedule.id, { onSettled: () => setConfirm(false) })}
          />
        </>
      )}
    </li>
  );
}

export default function StaffMarketingCalendarPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [tab, setTab] = useState("upcoming");
  const [page, setPage] = useState(1);
  const current = TABS.find((item) => item.id === tab);
  const schedulesQuery = useSchedules(
    hotelId,
    { page, pageSize: PAGE_SIZE, status: current?.status, sort: current?.sort },
    { poll: true },
  );
  const accountsQuery = useSocialAccounts(hotelId);
  const schedules = schedulesQuery.data?.schedules ?? [];
  const meta = schedulesQuery.data?.meta;
  const forbidden = isMissingMarketingPermission(schedulesQuery.error);

  return (
    <div className="space-y-5">
      <MarketingHeader
        title="Lịch đăng & kênh"
        icon={<CalendarDays className="size-7 shrink-0 text-primary" aria-hidden />}
        crumbs={[{ label: "Lịch đăng" }]}
        description="Các bài đã lên lịch đăng lên trang Facebook / Instagram của khách sạn. Hệ thống tự đăng mỗi phút; bài lỗi ghi rõ lý do từ nền tảng và không tự thử lại."
        actions={
          !forbidden && (
            <Button
              variant="outline"
              className="h-10 gap-1.5"
              onClick={() => {
                void schedulesQuery.refetch();
                void accountsQuery.refetch();
              }}
              disabled={schedulesQuery.isFetching}
            >
              <RefreshCw className={cn("size-3.5", schedulesQuery.isFetching && "animate-spin")} /> Làm mới
            </Button>
          )
        }
      />

      {forbidden ? (
        <MarketingErrorPanel error={schedulesQuery.error} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-3">
          <section className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Lọc lịch đăng">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    onClick={() => {
                      setTab(item.id);
                      setPage(1);
                    }}
                    className={cn(
                      "h-10 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition",
                      tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              {meta && <span className="ml-auto shrink-0 text-xs text-muted-foreground">{meta.total} bài</span>}
            </div>

            {hotelLoading || schedulesQuery.isLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} className="h-24 rounded-xl" />
                ))}
              </div>
            ) : schedulesQuery.error ? (
              <MarketingErrorPanel error={schedulesQuery.error} onRetry={() => void schedulesQuery.refetch()} />
            ) : schedules.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Chưa có bài nào ở mục này"
                description={
                  <>
                    Mở một bài đã được duyệt trong{" "}
                    <Link href="/staff/marketing/content" className="font-semibold text-primary underline">
                      Thư viện nội dung
                    </Link>{" "}
                    để lên lịch đăng.
                  </>
                }
              />
            ) : (
              <div className={cn("space-y-5", schedulesQuery.isPlaceholderData && "opacity-60")}>
                {groupByDay(schedules).map(([day, items]) => (
                  <div key={day} className="space-y-2">
                    <h2 className="text-xs font-bold capitalize text-muted-foreground">{day}</h2>
                    <ul className="space-y-2">
                      {items.map((schedule) => (
                        <ScheduleItem key={schedule.id} schedule={schedule} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {meta && meta.totalPages > 1 && (
              <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
            )}
          </section>

          <aside className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-2xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <Link2 className="size-4 text-primary" aria-hidden /> Kênh đã kết nối
            </h2>
            {accountsQuery.isLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : accountsQuery.error ? (
              <p className="text-xs text-destructive">{getMarketingErrorMessage(accountsQuery.error)}</p>
            ) : (accountsQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có trang nào được kết nối.</p>
            ) : (
              <ul className="space-y-2">
                {accountsQuery.data!.map((account) => (
                  <li key={account.id} className="space-y-1 rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <PlatformPill platform={account.platform} />
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          account.usable ? "text-emerald-700" : "text-destructive",
                        )}
                      >
                        {account.usable ? "Đang hoạt động" : "Token hết hạn"}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-foreground">{account.accountName}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.expiresAt ? `Hết hạn ${formatDateTime(account.expiresAt)}` : "Không có hạn token"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Chỉ chủ khách sạn mới kết nối hoặc ngắt kết nối trang. TikTok chỉ nhận video nên chưa hỗ trợ đăng bài.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
