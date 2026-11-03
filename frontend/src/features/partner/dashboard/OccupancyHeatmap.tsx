"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useOccupancyForecast } from "../api/partner-queries";
import { ErrorPanel, PartnerPanel } from "../components";
import { formatDate } from "../lib/labels";
import { weekdayOf } from "../lib/dates";
import { formatPercent } from "./format";

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

/** Fixed thresholds of §4.5: < 50 %, 50–79 %, 80–89 %, ≥ 90 %. */
const levels = [
  { min: 90, label: "≥ 90%", className: "bg-primary text-primary-foreground" },
  { min: 80, label: "80–89%", className: "bg-primary/65 text-primary-foreground" },
  { min: 50, label: "50–79%", className: "bg-primary/35 text-primary" },
  { min: 0, label: "< 50%", className: "bg-primary/12 text-primary" },
];

function levelClass(rate: number | null) {
  if (rate == null) return "bg-muted text-muted-foreground";
  return levels.find((level) => rate >= level.min)!.className;
}

/** ⑤ Rooms on the books for the next 30 days, as a calendar starting on Monday. */
export function OccupancyHeatmap({ hotelId }: { hotelId: string }) {
  const query = useOccupancyForecast(hotelId);

  return (
    <PartnerPanel className="p-5">
      <h2 className="font-bold text-primary">Công suất 30 ngày tới</h2>
      <p className="mt-1 text-xs text-muted-foreground">Phòng đã đặt trên số phòng có thể bán mỗi đêm.</p>
      {query.isLoading ? (
        <Skeleton className="mt-4 h-56 w-full" />
      ) : query.error || !query.data ? (
        <div className="mt-4">
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-muted-foreground">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <ol className="mt-1 grid grid-cols-7 gap-1">
            {/* Blank cells so the first day lands under its weekday (0 = Sunday → last column). */}
            {Array.from({ length: (weekdayOf(query.data.from) + 6) % 7 }, (_, index) => (
              <li key={`blank-${index}`} aria-hidden />
            ))}
            {query.data.days.map((day) => {
              const detail =
                `${formatDate(day.date)}: ${formatPercent(day.occupancyRate)} · ${day.booked} đã đặt · ` +
                `${day.held} giữ chỗ · ${day.blocked} đóng bán · ${day.free} trống / ${day.roomsTotal} phòng`;
              return (
                <li
                  key={day.date}
                  title={detail}
                  aria-label={detail}
                  className={cn(
                    "flex h-11 flex-col items-center justify-center rounded-md text-[11px] leading-tight",
                    levelClass(day.occupancyRate),
                  )}
                >
                  <span className="font-bold">{Number(day.date.slice(8))}</span>
                  <span className="hidden tabular-nums sm:block">
                    {day.occupancyRate == null ? "—" : Math.round(day.occupancyRate)}
                  </span>
                </li>
              );
            })}
          </ol>
          <ul className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            {[...levels].reverse().map((level) => (
              <li key={level.label} className="flex items-center gap-1.5">
                <span className={cn("size-3 rounded-sm border border-primary/20", level.className)} />
                {level.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </PartnerPanel>
  );
}
