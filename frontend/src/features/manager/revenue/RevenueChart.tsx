"use client";

import { ChartNoAxesColumn } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { PlatformRevenue } from "@stayreco/shared";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { formatShortDate } from "../lib/dates";
import { formatMoney } from "../lib/labels";

export type RevenueMetric = "gmv" | "commission" | "bookings";

const countFormat = new Intl.NumberFormat("vi-VN");
const compactFormat = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

export const revenueMetrics: Record<RevenueMetric, { label: string; format: (value: number) => string }> = {
  gmv: { label: "GMV", format: formatMoney },
  commission: { label: "Hoa hồng", format: formatMoney },
  bookings: { label: "Booking", format: (value) => countFormat.format(value) },
};

type Point = PlatformRevenue["series"][number];

function bucketLabel(point: Point, granularity: PlatformRevenue["granularity"], long = false) {
  const month = `${point.periodStart.slice(5, 7)}/${point.periodStart.slice(0, 4)}`;
  if (granularity === "month") return long ? `Tháng ${month}` : month;
  const day = formatShortDate(point.periodStart);
  if (granularity === "week") return long ? `Tuần từ ${day} (${point.days} ngày)` : day.slice(0, 5);
  return long ? day : day.slice(0, 5);
}

export function RevenueChart({ revenue, metric }: { revenue: PlatformRevenue; metric: RevenueMetric }) {
  const points = revenue.series;
  if (points.every((point) => !point[metric])) {
    return (
      <div className="mt-4 flex h-40 flex-col items-center justify-center gap-2 rounded-lg bg-muted/50 text-center">
        <ChartNoAxesColumn size={22} className="text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">Chưa có {revenueMetrics[metric].label.toLowerCase()} trong kỳ này.</p>
      </div>
    );
  }

  const config = { [metric]: { label: revenueMetrics[metric].label, color: "var(--chart-1)" } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="mt-4 aspect-auto h-72 w-full">
      <BarChart data={points} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="periodStart"
          tickLine={false}
          axisLine={false}
          minTickGap={16}
          tickFormatter={(_, index) => bucketLabel(points[index], revenue.granularity)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={52}
          tickFormatter={(value: number) => compactFormat.format(value)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as Point | undefined;
                return point ? bucketLabel(point, revenue.granularity, true) : null;
              }}
              formatter={(value, _name, item) => (
                <div className="flex w-full items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="size-2.5 rounded-xs" style={{ backgroundColor: item.color }} />
                    {revenueMetrics[metric].label}
                  </span>
                  <span className="font-medium tabular-nums text-foreground">
                    {revenueMetrics[metric].format(value as number)}
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey={metric} fill={`var(--color-${metric})`} radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartContainer>
  );
}
