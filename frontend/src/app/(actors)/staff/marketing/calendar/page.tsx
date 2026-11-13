"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, Link2, Loader2, RefreshCw, XCircle } from "lucide-react";
import type { ContentSchedule, ScheduleStatus } from "@stayreco/shared";
import Pagination from "@/components/common/pagination/Pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/features/stays/lib/format";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { useCancelSchedule, useSchedules, useSocialAccounts } from "@/features/staff/api/marketing-queries";
import { getMarketingErrorMessage, isMissingMarketingPermission } from "@/features/staff/lib/marketing-errors";
import {
  MarketingErrorPanel,
  MarketingHeader,
  PlatformPill,
  ScheduleStatusPill,
} from "@/features/staff/marketing/MarketingParts";

const PAGE_SIZE = 20;

const TABS: Array<{ id: string; label: string; status?: ScheduleStatus[] }> = [
  { id: "upcoming", label: "Chờ đăng", status: ["SCHEDULED"] },
  { id: "published", label: "Đã đăng", status: ["PUBLISHED"] },
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
      : schedule.status === "SCHEDULED"
        ? "Đăng ở lượt chạy kế tiếp"
        : "Đăng ngay (không hẹn giờ)";
    groups.set(key, [...(groups.get(key) ?? []), schedule]);
  }
  return [...groups.entries()];
}

function ScheduleItem({ schedule }: { schedule: ContentSchedule }) {
  const cancel = useCancelSchedule();
  const at = instantOf(schedule);
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-start">
      <div className="w-16 shrink-0 text-sm font-bold text-slate-900">{at ? timeFormat.format(new Date(at)) : "—"}</div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <PlatformPill platform={schedule.platform} />
          <ScheduleStatusPill status={schedule.status} />
          <span className="font-mono text-[11px] text-slate-400">{schedule.accountName}</span>
        </div>
        <Link
          href={`/staff/marketing/content/${schedule.contentId}`}
          className="block text-sm font-semibold text-slate-900 hover:text-[#934a33]"
        >
          {schedule.title || "(Chưa có tiêu đề)"}
        </Link>
        <p className="line-clamp-2 text-xs text-slate-500">{schedule.body}</p>
        {schedule.failureReason && (
          <p className="rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">Lý do: {schedule.failureReason}</p>
        )}
        {cancel.error && <p className="text-[11px] text-red-600">{getMarketingErrorMessage(cancel.error)}</p>}
      </div>
      <div className="flex shrink-0 gap-2">
        {schedule.status === "SCHEDULED" && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs text-red-600"
            disabled={cancel.isPending}
            onClick={() => cancel.mutate(schedule.id)}
          >
            {cancel.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />} Huỷ lịch
          </Button>
        )}
        {schedule.status === "PUBLISHED" && (
          <Link href={`/staff/marketing/analytics?schedule=${schedule.id}`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <BarChart3 className="size-3.5" /> Hiệu quả
            </Button>
          </Link>
        )}
      </div>
    </li>
  );
}

export default function StaffMarketingCalendarPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [tab, setTab] = useState("upcoming");
  const [page, setPage] = useState(1);
  const status = TABS.find((item) => item.id === tab)?.status;
  const schedulesQuery = useSchedules(hotelId, { page, pageSize: PAGE_SIZE, status }, { poll: true });
  const accountsQuery = useSocialAccounts(hotelId);
  const schedules = schedulesQuery.data?.schedules ?? [];
  const meta = schedulesQuery.data?.meta;
  const forbidden = isMissingMarketingPermission(schedulesQuery.error);

  return (
    <div className="space-y-5">
      <MarketingHeader
        title="Lịch đăng & kênh"
        icon={<CalendarDays className="size-7 text-[#934a33]" />}
        crumbs={[{ label: "Lịch đăng" }]}
        description="Các bài đã lên lịch đăng lên trang Facebook / Instagram của khách sạn. Hệ thống tự đăng mỗi phút; bài lỗi ghi rõ lý do từ nền tảng và không tự thử lại."
        actions={
          !forbidden && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs"
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
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Lọc lịch đăng">
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
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    tab === item.id ? "bg-[#934a33] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {item.label}
                </button>
              ))}
              {meta && <span className="ml-auto text-xs text-slate-500">{meta.total} bài</span>}
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
              <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <CalendarDays className="mx-auto size-8 text-slate-300" />
                <p className="mt-2 text-sm font-semibold text-slate-700">Chưa có bài nào ở mục này</p>
                <p className="mt-1 text-xs text-slate-500">
                  Mở một bài đã được duyệt trong{" "}
                  <Link href="/staff/marketing/content" className="font-semibold text-[#934a33] underline">
                    Thư viện nội dung
                  </Link>{" "}
                  để lên lịch đăng.
                </p>
              </div>
            ) : (
              <div className={cn("space-y-5", schedulesQuery.isPlaceholderData && "opacity-60")}>
                {groupByDay(schedules).map(([day, items]) => (
                  <div key={day} className="space-y-2">
                    <h2 className="text-xs font-bold uppercase text-slate-500">{day}</h2>
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

          <aside className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Link2 className="size-4 text-[#934a33]" /> Kênh đã kết nối
            </h2>
            {accountsQuery.isLoading ? (
              <Skeleton className="h-16 rounded-lg" />
            ) : accountsQuery.error ? (
              <p className="text-xs text-red-600">{getMarketingErrorMessage(accountsQuery.error)}</p>
            ) : (accountsQuery.data ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">Chưa có trang nào được kết nối.</p>
            ) : (
              <ul className="space-y-2">
                {accountsQuery.data!.map((account) => (
                  <li key={account.id} className="space-y-1 rounded-lg border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <PlatformPill platform={account.platform} />
                      <span
                        className={cn(
                          "text-[11px] font-semibold",
                          account.usable ? "text-emerald-700" : "text-red-600",
                        )}
                      >
                        {account.usable ? "Đang hoạt động" : "Token hết hạn"}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-slate-700">{account.accountName}</p>
                    <p className="text-[11px] text-slate-400">
                      {account.expiresAt ? `Hết hạn ${formatDateTime(account.expiresAt)}` : "Không có hạn token"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-slate-500">
              Chỉ chủ khách sạn mới kết nối hoặc ngắt kết nối trang. TikTok chỉ nhận video nên chưa hỗ trợ đăng bài.
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
