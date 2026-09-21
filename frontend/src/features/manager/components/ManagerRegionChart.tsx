"use client";

import { Button } from "@/components/ui/button";
import { ManagerPanel } from "./ManagerPanel";

export type ManagerRegionChartProps = {
  chartHeights: number[];
  regions: Array<[region: string, value: string, change: string]>;
};

export function ManagerRegionChart({
  chartHeights,
  regions,
}: ManagerRegionChartProps) {
  return (
    <ManagerPanel className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-primary">
            GMV nền tảng theo khu vực
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Hiệu suất 30 ngày gần nhất · cập nhật theo thời gian thực
          </p>
        </div>
        <Button variant="outline" size="sm">
          Tất cả khu vực
        </Button>
      </div>
      <div className="mt-8 flex h-60 items-end gap-4 border-b border-l px-4">
        {chartHeights.map((height, index) => (
          <div
            key={index}
            className="group relative flex-1 rounded-t bg-primary/15"
            style={{ height: `${height}%` }}
          >
            <div
              className="absolute inset-x-0 bottom-0 rounded-t bg-primary"
              style={{ height: `${Math.max(30, height - 18)}%` }}
            />
            <span className="absolute -top-6 hidden whitespace-nowrap text-[10px] font-semibold text-primary group-hover:block">
              {height * 12},4 tr
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {regions.map(([region, value, change]) => (
          <div key={region} className="rounded-xl bg-muted p-3">
            <p className="text-xs text-muted-foreground">{region}</p>
            <strong className="mt-1 block text-primary">{value}</strong>
            <span
              className={`text-[11px] ${change.startsWith("−") ? "text-brand-accent" : "text-success"}`}
            >
              {change}
            </span>
          </div>
        ))}
      </div>
    </ManagerPanel>
  );
}
