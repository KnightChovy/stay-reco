"use client";

import { ChartNoAxesColumn } from "lucide-react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import type { HotelStatsSeries, StatsSeriesPoint } from "@stayreco/shared";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatDate, formatMoney } from "../lib/labels";
import { formatCompact, formatNumber, formatPercent, formatShortDate } from "./format";

export type BarMetric = "roomRevenue" | "netEarnings" | "bookingsCreated";

export const barMetrics: Record<BarMetric, { label: string; format: (value: number) => string }> = {
  roomRevenue: { label: "Doanh thu phòng", format: formatMoney },
  netEarnings: { label: "Thực nhận", format: formatMoney },
  bookingsCreated: { label: "Booking mới", format: formatNumber },
};

function bucketLabel(point: StatsSeriesPoint, granularity: HotelStatsSeries["granularity"], long = false) {
  if (granularity === "month") return `${long ? "Tháng " : ""}${point.periodStart.slice(5, 7)}/${point.periodStart.slice(0, 4)}`;
  if (granularity === "week") return long ? `Tuần từ ${formatDate(point.periodStart)} (${point.days} ngày)` : formatShortDate(point.periodStart);
  return long ? formatDate(point.periodStart) : formatShortDate(point.periodStart);
}

/** ④ One bar metric (room revenue by default) and the occupancy line, over continuous buckets sent by the API. */
export function StatsChart({ series, metric }: { series: HotelStatsSeries; metric: BarMetric }) {
  // An all-zero period would draw a flat line on a meaningless 0–4 axis.
  if (series.points.every((point) => !point[metric] && !point.occupancyRate)) {
    return (
      <div className="mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-lg bg-muted/50 text-center">
        <ChartNoAxesColumn size={22} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Chưa có {barMetrics[metric].label.toLowerCase()} hay phòng bán được trong kỳ này.
        </p>
      </div>
    );
  }

  const config = {
    [metric]: { label: barMetrics[metric].label, color: "var(--chart-1)" },
    occupancyRate: { label: "Công suất", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mt-4 aspect-auto h-72 w-full">
      <ComposedChart data={series.points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="periodStart"
          tickLine={false}
          axisLine={false}
          minTickGap={16}
          tickFormatter={(_, index) => bucketLabel(series.points[index], series.granularity)}
        />
        <YAxis
          yAxisId="bar"
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) => formatCompact(value)}
        />
        <YAxis
          yAxisId="rate"
          orientation="right"
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(value: number) => `${value}%`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as StatsSeriesPoint | undefined;
                return point ? bucketLabel(point, series.granularity, true) : null;
              }}
              formatter={(value, name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                    {name === "occupancyRate" ? "Công suất" : barMetrics[metric].label}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {name === "occupancyRate"
                      ? formatPercent(value as number | null)
                      : barMetrics[metric].format(value as number)}
                  </span>
                </div>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar yAxisId="bar" dataKey={metric} fill={`var(--color-${metric})`} radius={[4, 4, 0, 0]} maxBarSize={36} />
        <Line
          yAxisId="rate"
          dataKey="occupancyRate"
          type="monotone"
          stroke="var(--color-occupancyRate)"
          strokeWidth={2}
          dot={series.points.length <= 31}
          connectNulls
        />
      </ComposedChart>
    </ChartContainer>
  );
}
