"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { Heart, LineChart, Send, Loader2, MessageCircle, RefreshCw, Share2 } from "lucide-react";
import type { ContentMetric, ContentSchedule } from "@stayreco/shared";
import Pagination from "@/components/common/pagination/Pagination";
import { EmptyState } from "@/components/common/StateViews";
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

// Views are left out: Facebook updates them hours late, so a fresh post shows 0 beside real likes and shares.
// The API still returns them (`views`).
// Each figure keeps one soft tint, on its icon and its tile only; the numbers stay in the text colour.
const FIGURES = [
  { key: "likes", label: "Lượt thích", icon: Heart, chip: "bg-rose-100 text-rose-600", tile: "bg-rose-50/70" },
  { key: "shares", label: "Chia sẻ", icon: Share2, chip: "bg-sky-100 text-sky-600", tile: "bg-sky-50/70" },
  { key: "comments", label: "Bình luận", icon: MessageCircle, chip: "bg-violet-100 text-violet-600", tile: "bg-violet-50/70" },
] as const;

type FigureKey = (typeof FIGURES)[number]["key"];

function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before === undefined || now === before) return null;
  const up = now > before;
  return (
    <span className={cn("text-xs font-semibold", up ? "text-emerald-600" : "text-destructive")}>
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
        "space-y-3 rounded-xl border bg-card p-4 shadow-2xs",
        highlighted ? "border-primary ring-2 ring-primary/20" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <PlatformPill platform={schedule.platform} />
            <span className="text-xs text-muted-foreground">Đăng {formatDateTime(schedule.publishedAt)}</span>
          </div>
          <Link
            href={`/staff/marketing/content/${schedule.contentId}`}
            className="block text-sm font-semibold text-foreground hover:text-primary"
          >
            {schedule.title || "(Chưa có tiêu đề)"}
          </Link>
        </div>
        <Button
          variant="outline"
          className="h-10 shrink-0 gap-1.5 whitespace-nowrap"
          disabled={refresh.isPending}
          onClick={() => refresh.mutate(schedule.id)}
        >
          {refresh.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Cập nhật số liệu
        </Button>
      </div>

      {loading ? (
        <Skeleton className="h-14 rounded-lg" />
      ) : latest ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {FIGURES.map(({ key, label, icon: Icon, chip, tile }) => (
              <div key={key} className={cn("rounded-lg px-3 py-2", tile)}>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={cn("grid size-5 place-items-center rounded-full", chip)}>
                    <Icon className="size-3" aria-hidden />
                  </span>
                  {label}
                </span>
                <span className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-foreground">{formatCount(latest[key])}</span>
                  <Delta now={latest[key]} before={previous?.[key]} />
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Cập nhật lúc {formatDateTime(latest.recordedAt)} · {readings!.length} lần đo
            {previous && ` · so với lần đo ${formatDateTime(previous.recordedAt)}`}
          </p>
        </>
      ) : (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Chưa có số liệu. Bấm “Cập nhật số liệu” để lấy số mới nhất từ {schedule.platform === "INSTAGRAM" ? "Instagram" : "Facebook"}.
        </p>
      )}
      {refresh.error && <p className="text-xs text-destructive">{getMarketingErrorMessage(refresh.error)}</p>}
    </li>
  );
}

function AnalyticsContent() {
  const highlight = useSearchParams().get("schedule");
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const [page, setPage] = useState(1);
  // Latest first, so a post that just went out (the "Xem hiệu quả" link) is on the first page.
  const schedulesQuery = useSchedules(hotelId, {
    page,
    pageSize: PAGE_SIZE,
    status: ["PUBLISHED"],
    sort: "published-desc",
  });
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
        icon={<LineChart className="size-7 shrink-0 text-primary" aria-hidden />}
        crumbs={[{ label: "Hiệu quả" }]}
        description="Số liệu của các bài đã đăng. Mỗi lần bấm cập nhật lưu thêm một lần đo, nên có thể so bài tăng tương tác theo thời gian."
      />

      {forbidden ? (
        <MarketingErrorPanel error={schedulesQuery.error} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary">
                  <Send className="size-3.5" aria-hidden />
                </span>
                Bài đã đăng
              </span>
              <span className="mt-1 block text-2xl font-bold text-foreground">{meta?.total ?? "…"}</span>
              <span className="text-xs text-muted-foreground">{measured} bài trang này có số liệu</span>
            </div>
            {FIGURES.map(({ key, label, icon: Icon, chip }) => (
              <div key={key} className="rounded-xl border border-border bg-card p-4 shadow-2xs">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
                  <span className={cn("grid size-7 place-items-center rounded-full", chip)}>
                    <Icon className="size-3.5" aria-hidden />
                  </span>
                  {label}
                </span>
                <span className="mt-1 block text-2xl font-bold text-foreground">{formatCount(totals[key])}</span>
              </div>
            ))}
          </div>

          {hotelLoading || schedulesQuery.isLoading ? (
            <div className="space-y-3">
              {[0, 1].map((key) => (
                <Skeleton key={key} className="h-36 rounded-xl" />
              ))}
            </div>
          ) : schedulesQuery.error ? (
            <MarketingErrorPanel error={schedulesQuery.error} onRetry={() => void schedulesQuery.refetch()} />
          ) : schedules.length === 0 ? (
            <EmptyState
              icon={LineChart}
              title="Chưa có bài nào được đăng"
              description={
                <>
                  Bài được lên lịch ở{" "}
                  <Link href="/staff/marketing/calendar" className="font-semibold text-primary underline">
                    Lịch đăng
                  </Link>{" "}
                  sẽ xuất hiện tại đây sau khi đăng thành công.
                </>
              }
            />
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
