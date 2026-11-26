"use client";

import { useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { managerKeys, usePlatformOverview } from "../api/manager-queries";
import { ErrorPanel, ManagerTitle } from "../components";
import { formatShortDate, periodPresetLabels, presetRange, type PeriodPreset } from "../lib/dates";
import { formatDateTime } from "../lib/labels";
import { ActionQueue } from "./components/ActionQueue";
import { OverviewKpis } from "./components/OverviewKpis";

export default function ManagerDashboard() {
  const queryClient = useQueryClient();
  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const overview = usePlatformOverview(presetRange(preset));
  const refreshing = useIsFetching({ queryKey: managerKeys.all }) > 0;
  const data = overview.data;

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Trung tâm điều hành StayReco"
        description="Việc đang chờ nền tảng xử lý và hiệu quả kinh doanh của toàn mạng lưới khách sạn."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label="Chọn kỳ thống kê" className="flex flex-wrap gap-1.5">
              {(Object.keys(periodPresetLabels) as PeriodPreset[]).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={preset === value ? "default" : "outline"}
                  aria-pressed={preset === value}
                  onClick={() => setPreset(value)}
                >
                  {periodPresetLabels[value]}
                </Button>
              ))}
            </div>
            <Button
              size="icon-lg"
              variant="outline"
              aria-label="Làm mới dữ liệu"
              onClick={() => void queryClient.invalidateQueries({ queryKey: managerKeys.all })}
              disabled={refreshing}
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
            </Button>
          </div>
        }
      />

      {overview.error ? (
        <ErrorPanel error={overview.error} onRetry={() => void overview.refetch()} />
      ) : !data ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-36 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 2xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <ActionQueue queue={data.queue} />
          <OverviewKpis overview={data} />
          <p className="text-xs text-muted-foreground">
            Kỳ {formatShortDate(data.period.from)} – {formatShortDate(data.period.to)}, so với{" "}
            {formatShortDate(data.previous.from)} – {formatShortDate(data.previous.to)} · Cập nhật lúc{" "}
            {formatDateTime(data.generatedAt)}
          </p>
        </>
      )}
    </div>
  );
}
