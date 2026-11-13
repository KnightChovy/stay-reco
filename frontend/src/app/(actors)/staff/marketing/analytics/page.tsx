"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Eye, Heart, Info, LineChart, Loader2, MessageCircle, RefreshCw, Share2 } from "lucide-react";
import type { ContentMetric, ContentSchedule } from "@stayreco/shared";
import Pagination from "@/components/common/pagination/Pagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/features/stays/lib/format";
import * as marketingService from "@/services/marketing.service";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { marketingKeys, useRefreshMetrics, useSchedules } from "@/features/staff/api/marketing-queries";
import { formatCount } from "@/features/staff/lib/marketing-labels";
import { getMarketingErrorMessage, isMissingMarketingPermission } from "@/features/staff/lib/marketing-errors";
import { MarketingErrorPanel, MarketingHeader, PlatformPill } from "@/features/staff/marketing/MarketingParts";

const PAGE_SIZE = 10;

const FIGURES = [
  { key: "views", label: "Lượt xem", icon: Eye },
  { key: "likes", label: "Lượt thích", icon: Heart },
  { key: "shares", label: "Chia sẻ", icon: Share2 },
  { key: "comments", label: "Bình luận", icon: MessageCircle },
] as const;

type FigureKey = (typeof FIGURES)[number]["key"];

function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before === undefined || now === before) return null;
  const up = now > before;
  return (
    <span className={cn("text-[10px] font-semibold", up ? "text-emerald-600" : "text-red-600")}>
      {up ? "+" : ""}
      {formatCount(now - before)}
    </span>
  );
}

function PostRow({
  schedule,
  readings,
  loading,
  highlighted,
}: {
  schedule: ContentSchedule;
  readings: ContentMetric[] | undefined;
  loading: boolean;
  highlighted: boolean;
}) {
  const refresh = useRefreshMetrics();
  const ref = useRef<HTMLLIElement>(null);
  const [latest, previous] = readings ?? [];

  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: "center" });
  }, [highlighted]);

  return (
    <li
      ref={ref}
      className={cn(
        "space-y-3 rounded-xl border bg-white p-4 shadow-2xs",
        highlighted ? "border-[#934a33] ring-2 ring-[#934a33]/20" : "border-slate-200",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformPill platform={schedule.platform} />
            <span className="text-[11px] text-slate-400">Đăng {formatDateTime(schedule.publishedAt)}</span>
          </div>
          <Link
            href={`/staff/marketing/content/${schedule.contentId}`}
            className="block text-sm font-semibold text-slate-900 hover:text-[#934a33]"
          >
            {schedule.title || "(Chưa có tiêu đề)"}
          </Link>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate(schedule.id)}
        >
          {refresh.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Cập nhật số
          liệu
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-14 rounded-lg" />
      ) : latest ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {FIGURES.map(({ key, label, icon: Icon }) => (
              <div key={key} className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Icon className="size-3" /> {label}
                </span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-slate-900">{formatCount(latest[key])}</span>
                  <Delta now={latest[key]} before={previous?.[key]} />
                </span>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            Cập nhật lúc {formatDateTime(latest.recordedAt)} · {readings!.length} lần đo
            {previous && ` · so với lần đo ${formatDateTime(previous.recordedAt)}`}
          </p>
        </>
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Chưa có số liệu. Bấm “Cập nhật số liệu” để lấy số mới nhất từ {schedule.platform === "INSTAGRAM" ? "Instagram" : "Facebook"}.
        </p>
      )}
      {refresh.error && <p className="text-xs text-red-600">{getMarketingErrorMessage(refresh.error)}</p>}
    </li>
  );
}

function AnalyticsContent() {
  const highlight = useSearchParams().get("schedule");
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [page, setPage] = useState(1);
  const schedulesQuery = useSchedules(hotelId, { page, pageSize: PAGE_SIZE, status: ["PUBLISHED"] });
  const schedules = schedulesQuery.data?.schedules ?? [];
  const meta = schedulesQuery.data?.meta;
  const forbidden = isMissingMarketingPermission(schedulesQuery.error);

  const metrics = useQueries({
    queries: schedules.map((schedule) => ({
      queryKey: marketingKeys.metrics(schedule.id),
      queryFn: () => marketingService.getScheduleMetrics(schedule.id),
      retry: false,
    })),
  });

  // Totals over the latest reading of each post on this page.
  const totals = FIGURES.reduce(
    (sum, { key }) => ({
      ...sum,
      [key]: metrics.reduce((total, query) => total + (query.data?.[0]?.[key] ?? 0), 0),
    }),
    {} as Record<FigureKey, number>,
  );
  const measured = metrics.filter((query) => query.data && query.data.length > 0).length;

  return (
    <div className="space-y-5">
      <MarketingHeader
        title="Hiệu quả tiếp thị"
        icon={<LineChart className="size-7 text-[#934a33]" />}
        crumbs={[{ label: "Hiệu quả" }]}
        description="Số liệu của các bài đã đăng. Mỗi lần bấm cập nhật lưu thêm một lần đo, nên có thể so bài tăng tương tác theo thời gian."
      />

      {forbidden ? (
        <MarketingErrorPanel error={schedulesQuery.error} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
              <span className="text-[11px] font-semibold uppercase text-slate-500">Bài đã đăng</span>
              <span className="mt-1 block text-2xl font-bold text-slate-900">{meta?.total ?? "…"}</span>
              <span className="text-[11px] text-slate-400">{measured} bài trang này có số liệu</span>
            </div>
            {FIGURES.map(({ key, label, icon: Icon }) => (
              <div key={key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
                <span className="flex items-center gap-1 text-[11px] font-semibold uppercase text-slate-500">
                  <Icon className="size-3.5 text-[#934a33]" /> {label}
                </span>
                <span className="mt-1 block text-2xl font-bold text-slate-900">{formatCount(totals[key])}</span>
              </div>
            ))}
          </div>

          <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11px] text-slate-500">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Số bình luận thường là 0 vì Meta không còn cấp quyền đọc bình luận cho trang kết nối mới. Một số liệu bị nền
            tảng từ chối cũng được ghi là 0.
          </p>

          {hotelLoading || schedulesQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((key) => (
                <Skeleton key={key} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : schedulesQuery.error ? (
            <MarketingErrorPanel error={schedulesQuery.error} onRetry={() => void schedulesQuery.refetch()} />
          ) : schedules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <LineChart className="mx-auto size-8 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-700">Chưa có bài nào được đăng</p>
              <p className="mt-1 text-xs text-slate-500">
                Bài được lên lịch ở{" "}
                <Link href="/staff/marketing/calendar" className="font-semibold text-[#934a33] underline">
                  Lịch đăng
                </Link>{" "}
                sẽ xuất hiện tại đây sau khi đăng thành công.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {schedules.map((schedule, index) => (
                <PostRow
                  key={schedule.id}
                  schedule={schedule}
                  readings={metrics[index]?.data}
                  loading={metrics[index]?.isLoading ?? true}
                  highlighted={highlight === schedule.id}
                />
              ))}
            </ul>
          )}

          {meta && meta.totalPages > 1 && (
            <Pagination currentPage={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
          )}
        </>
      )}
    </div>
  );
}

export default function StaffMarketingAnalyticsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 rounded-xl" />}>
      <AnalyticsContent />
    </Suspense>
  );
}
