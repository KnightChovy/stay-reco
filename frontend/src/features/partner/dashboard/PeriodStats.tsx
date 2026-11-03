"use client";

import { useState } from "react";
import {
  defaultGranularity,
  STATS_GRANULARITIES,
  STATS_LIMITS,
  statsBucketCount,
  statsRangeQuerySchema,
  type HotelStatsOverview,
  type Metric,
  type RateMetric,
  type StatsGranularity,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsRangeParams } from "@/services/partner.service";
import { useStatsOverview, useStatsSeries } from "../api/partner-queries";
import { ErrorPanel, PartnerPanel } from "../components";
import { addDays, todayInVietnam } from "../lib/dates";
import { formatDate, formatMoney } from "../lib/labels";
import { Delta, formatNumber, formatPercent } from "./format";
import { barMetrics, StatsChart, type BarMetric } from "./StatsChart";

type Preset = "today" | "7d" | "30d" | "month" | "custom";

const presetLabels: Record<Preset, string> = {
  today: "Hôm nay",
  "7d": "7 ngày",
  "30d": "30 ngày",
  month: "Tháng này",
  custom: "Tuỳ chọn",
};

const granularityLabels: Record<StatsGranularity, string> = {
  day: "Ngày",
  week: "Tuần",
  month: "Tháng",
};

function presetRange(
  preset: Exclude<Preset, "custom">,
  today: string,
): Required<StatsRangeParams> {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: addDays(today, -6), to: today };
    case "30d":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
  }
}

/** Checked before sending, so an invalid range is a message next to the inputs instead of a VALIDATION_ERROR. */
function customRangeError(from: string, to: string) {
  if (!from || !to) return "Chọn ngày bắt đầu và ngày kết thúc.";
  if (to < from) return "Ngày kết thúc phải sau ngày bắt đầu.";
  if (!statsRangeQuerySchema.safeParse({ from, to }).success) {
    return `Chọn khoảng tối đa ${STATS_LIMITS.rangeMaxDays} ngày.`;
  }
  return undefined;
}

const fitsSeries = (
  range: Required<StatsRangeParams>,
  granularity: StatsGranularity,
) =>
  statsBucketCount(range.from, range.to, granularity) <=
  STATS_LIMITS.seriesMaxBuckets[granularity];

/** ③ KPIs of the period against the previous one, ④ the chart, and the wallet. Owner only. */
export function PeriodStats({ hotelId }: { hotelId: string }) {
  const today = todayInVietnam();
  const [preset, setPreset] = useState<Preset>("month");
  const [custom, setCustom] = useState<StatsRangeParams>({
    from: presetRange("month", today).from,
    to: today,
  });
  const [granularity, setGranularity] = useState<StatsGranularity>();
  const [chartMetric, setChartMetric] = useState<BarMetric>("roomRevenue");

  const rangeError =
    preset === "custom"
      ? customRangeError(custom.from ?? "", custom.to ?? "")
      : undefined;
  const range =
    preset === "custom"
      ? rangeError
        ? undefined
        : (custom as Required<StatsRangeParams>)
      : presetRange(preset, today);
  // A granularity picked for a shorter period falls back to the default when it no longer fits.
  const effectiveGranularity = range
    ? granularity && fitsSeries(range, granularity)
      ? granularity
      : defaultGranularity(range.from, range.to)
    : undefined;

  const overview = useStatsOverview(hotelId, range);
  const series = useStatsSeries(
    hotelId,
    range && { ...range, granularity: effectiveGranularity },
  );

  return (
    <section aria-labelledby="period-heading" className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 id="period-heading" className="font-bold text-primary">
            Hiệu quả kinh doanh
          </h2>
          {overview.data && (
            <p className="text-xs text-muted-foreground">
              {formatDate(overview.data.period.from)} –{" "}
              {formatDate(overview.data.period.to)}, so với{" "}
              {formatDate(overview.data.previous.from)} –{" "}
              {formatDate(overview.data.previous.to)}
            </p>
          )}
        </div>
        <div
          role="group"
          aria-label="Chọn kỳ thống kê"
          className="flex flex-wrap gap-1.5"
        >
          {(Object.keys(presetLabels) as Preset[]).map((value) => (
            <Button
              className={"cursor-pointer"}
              key={value}
              size="sm"
              variant={preset === value ? "default" : "outline"}
              aria-pressed={preset === value}
              onClick={() => setPreset(value)}
            >
              {presetLabels[value]}
            </Button>
          ))}
        </div>
      </div>

      {preset === "custom" && (
        <PartnerPanel className="flex flex-wrap items-end gap-3 p-4">
          <label className="grid gap-1.5 text-xs font-semibold ">
            Từ ngày
            <Input
              type="date"
              value={custom.from ?? ""}
              onChange={(event) =>
                setCustom((value) => ({ ...value, from: event.target.value }))
              }
            />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold">
            Đến ngày
            <Input
              type="date"
              value={custom.to ?? ""}
              onChange={(event) =>
                setCustom((value) => ({ ...value, to: event.target.value }))
              }
            />
          </label>
          {rangeError && (
            <p role="alert" className="pb-2 text-xs text-danger">
              {rangeError}
            </p>
          )}
        </PartnerPanel>
      )}

      {overview.error ? (
        <ErrorPanel
          error={overview.error}
          onRetry={() => void overview.refetch()}
        />
      ) : !overview.data ? (
        rangeError ? null : (
          <KpiSkeleton />
        )
      ) : (
        <Kpis overview={overview.data} />
      )}

      {range && (
        <PartnerPanel className="p-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h3 className="mr-auto font-bold text-primary">
              Doanh thu & công suất
            </h3>
            <div
              role="group"
              aria-label="Chỉ số dạng cột"
              className="flex flex-wrap gap-1.5"
            >
              {(Object.keys(barMetrics) as BarMetric[]).map((value) => (
                <Button
                  className={"cursor-pointer"}
                  key={value}
                  size="sm"
                  variant={chartMetric === value ? "outline" : "ghost"}
                  aria-pressed={chartMetric === value}
                  onClick={() => setChartMetric(value)}
                >
                  {barMetrics[value].label}
                </Button>
              ))}
            </div>
            <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
            <div role="group" aria-label="Gộp theo" className="flex gap-1.5">
              {STATS_GRANULARITIES.map((value) => (
                <Button
                  className={"cursor-pointer"}
                  key={value}
                  size="sm"
                  variant={
                    effectiveGranularity === value ? "secondary" : "ghost"
                  }
                  aria-pressed={effectiveGranularity === value}
                  disabled={!fitsSeries(range, value)}
                  onClick={() => setGranularity(value)}
                >
                  {granularityLabels[value]}
                </Button>
              ))}
            </div>
          </div>
          {series.error ? (
            <div className="mt-4">
              <ErrorPanel
                error={series.error}
                onRetry={() => void series.refetch()}
              />
            </div>
          ) : !series.data ? (
            <Skeleton className="mt-4 h-72 w-full" />
          ) : (
            <StatsChart series={series.data} metric={chartMetric} />
          )}
        </PartnerPanel>
      )}
    </section>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <Skeleton key={index} className="h-28 w-full rounded-xl" />
      ))}
    </div>
  );
}

function KpiCard({
  label,
  metric,
  format,
  good,
  hint,
}: {
  label: string;
  metric: Metric | RateMetric;
  format: (value: number | null) => string;
  good?: "up" | "down";
  hint?: string;
}) {
  return (
    <PartnerPanel className="p-4 transition duration-200 hover:z-10 hover:scale-[1.03] hover:shadow-md motion-reduce:transition-none motion-reduce:hover:scale-100">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <strong
        title={format(metric.value)}
        className="mt-1 block truncate text-lg tabular-nums text-primary sm:text-xl"
      >
        {format(metric.value)}
      </strong>
      {metric.previous != null && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <Delta metric={metric} good={good} />
          <span>Kỳ trước {format(metric.previous)}</span>
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </PartnerPanel>
  );
}

function Kpis({ overview }: { overview: HotelStatsOverview }) {
  const { performance, cash, reviews, wallet } = overview;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 cursor-pointer">
        <KpiCard
          label="Doanh thu phòng"
          metric={performance.roomRevenue}
          format={formatMoney}
          hint="Theo ngày lưu trú"
        />
        <KpiCard
          label="Thực nhận"
          metric={cash.netEarnings}
          format={formatMoney}
          hint="Tiền vào ví, sau hoa hồng và hoàn tiền"
        />
        <KpiCard
          label="Công suất"
          metric={performance.occupancyRate}
          format={formatPercent}
          hint={`${formatNumber(performance.roomNightsSold.value)}/${formatNumber(performance.roomNightsAvailable.value)} đêm phòng`}
        />
        <KpiCard
          label="ADR (giá TB/đêm)"
          metric={performance.adr}
          format={formatMoney}
        />
        <KpiCard
          label="RevPAR"
          metric={performance.revpar}
          format={formatMoney}
          hint="Doanh thu trên mỗi phòng có thể bán"
        />
        <KpiCard
          label="Booking mới"
          metric={performance.bookingsCreated}
          format={formatNumber}
        />
        <KpiCard
          label="Huỷ phòng"
          metric={performance.cancellations}
          format={formatNumber}
          good="down"
          hint={`Tỉ lệ huỷ ${formatPercent(performance.cancellationRate.value)}`}
        />
        <KpiCard
          label="Đánh giá"
          metric={reviews.avgRating}
          format={(value) => (value == null ? "—" : `${formatNumber(value)} ★`)}
          hint={`${formatNumber(reviews.reviewCount.value)} đánh giá`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <PartnerPanel className="grid gap-x-6 gap-y-3 p-5 sm:grid-cols-2">
          <SmallMetric
            label="Thời gian lưu trú TB"
            metric={performance.avgLengthOfStay}
            format={(v) => (v == null ? "—" : `${formatNumber(v)} đêm`)}
          />
          <SmallMetric
            label="Đặt trước TB"
            metric={performance.avgLeadTimeDays}
            format={(v) => (v == null ? "—" : `${formatNumber(v)} ngày`)}
          />
          <SmallMetric
            label="Hoàn tiền"
            metric={cash.refunds}
            format={formatMoney}
            good="down"
          />
          <SmallMetric
            label="Hoa hồng nền tảng"
            metric={cash.commission}
            format={formatMoney}
            good="down"
          />
        </PartnerPanel>
        <PartnerPanel className="p-5">
          <h3 className="text-sm font-bold text-primary">Ví khách sạn</h3>
          {wallet ? (
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Khả dụng</dt>
                <dd className="font-bold tabular-nums text-primary">
                  {formatMoney(wallet.available)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Đang chờ</dt>
                <dd className="tabular-nums">{formatMoney(wallet.pending)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Tạm giữ</dt>
                <dd className="tabular-nums">{formatMoney(wallet.reserved)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Khách sạn chưa có ví.
            </p>
          )}
        </PartnerPanel>
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  metric,
  format,
  good,
}: {
  label: string;
  metric: Metric;
  format: (value: number | null) => string;
  good?: "up" | "down";
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-2">
        <strong className="text-sm tabular-nums text-primary">
          {format(metric.value)}
        </strong>
        <Delta metric={metric} good={good} />
      </span>
    </div>
  );
}
