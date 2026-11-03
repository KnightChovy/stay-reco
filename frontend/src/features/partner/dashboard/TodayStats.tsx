"use client";

import Link from "next/link";
import { BedDouble, DoorClosed, DoorOpen, UsersRound, type LucideIcon } from "lucide-react";
import { RoomStatus } from "@stayreco/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { useTodayStats } from "../api/partner-queries";
import { ErrorPanel, LoadingPanel, PartnerPanel, StatusBadge } from "../components";
import { formatDate, paymentStatusLabels, roomStatusLabels } from "../lib/labels";
import { formatNumber, formatPercent, formatTime } from "./format";

function Stat({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint: string }) {
  return (
    <div className="px-5 py-4">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <Icon size={14} className="text-primary" />
        {label}
      </p>
      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <strong className="text-xl tabular-nums text-primary">{value}</strong>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </p>
    </div>
  );
}

/** ② Today at the hotel: arrivals, departures, guests in house, tonight's occupancy and the rooms by status. */
export function TodaySummary({ hotelId }: { hotelId: string }) {
  const query = useTodayStats(hotelId);

  if (query.isLoading) return <LoadingPanel rows={2} />;
  if (query.error || !query.data) return <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />;
  const today = query.data;
  // Statuses without rooms are left out; the total already says how many rooms there are.
  const roomStatuses = Object.values(RoomStatus).filter((status) => today.rooms[status] > 0);

  return (
    <section aria-labelledby="today-heading" className="space-y-3">
      <h2 id="today-heading" className="font-bold text-primary">
        Hôm nay · {formatDate(today.date)}
      </h2>
      <PartnerPanel className="gap-0 overflow-hidden p-0">
        {/* gap-px over the border colour draws the dividers of the 2×2 (mobile) or 1×4 grid. */}
        <div className="grid grid-cols-2 gap-px border-b bg-border xl:grid-cols-4 [&>*]:bg-card">
          <Stat
            icon={DoorOpen}
            label="Khách đến"
            value={formatNumber(today.arrivals.expected)}
            hint={`${formatNumber(today.arrivals.checkedIn)} đã check-in`}
          />
          <Stat
            icon={DoorClosed}
            label="Khách đi"
            value={formatNumber(today.departures.expected)}
            hint={`${formatNumber(today.departures.checkedOut)} đã check-out`}
          />
          <Stat
            icon={UsersRound}
            label="Đang lưu trú"
            value={formatNumber(today.inHouse.bookings)}
            hint={`${formatNumber(today.inHouse.guests)} khách`}
          />
          <Stat
            icon={BedDouble}
            label="Công suất đêm nay"
            value={formatPercent(today.tonight.occupancyRate)}
            hint={`${formatNumber(today.tonight.roomsSold)}/${formatNumber(today.tonight.roomsAvailable)} phòng đã bán`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm">
          <span className="font-semibold text-primary">
            {today.rooms.total > 0 ? `${formatNumber(today.rooms.total)} phòng:` : "Chưa có phòng nào."}
          </span>
          {roomStatuses.map((status) => (
            <StatusBadge key={status} tone={roomStatusLabels[status].tone}>
              {formatNumber(today.rooms[status])} {roomStatusLabels[status].label.toLowerCase()}
            </StatusBadge>
          ))}
          {today.holds.active > 0 && (
            <span className="text-xs text-muted-foreground sm:ml-auto">
              {formatNumber(today.holds.active)} booking đang giữ chỗ chờ thanh toán · hết hạn sớm nhất{" "}
              {formatTime(today.holds.nextExpiresAt)}
            </span>
          )}
        </div>
      </PartnerPanel>
    </section>
  );
}

/** Today's arrivals still to check in; the full list is the bookings screen. */
export function UpcomingArrivals({ hotelId }: { hotelId: string }) {
  // Same query as TodaySummary: React Query sends one request for both.
  const query = useTodayStats(hotelId);
  const arrivals = query.data?.upcomingArrivals ?? [];

  return (
    <PartnerPanel className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="font-bold text-primary">Khách đến hôm nay</h2>
        <Link href="/partner/bookings" className="text-xs font-semibold text-primary hover:underline">
          Xem tất cả
        </Link>
      </div>
      {query.isLoading ? (
        <div className="space-y-2 p-5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : query.error ? (
        <div className="p-5">
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : arrivals.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted-foreground">Không còn khách nào chờ nhận phòng hôm nay.</p>
      ) : (
        <ul className="divide-y">
          {arrivals.map((arrival) => (
            <li key={arrival.bookingId} className="flex gap-3 px-5 py-3">
              <span className="w-12 shrink-0 text-sm font-bold tabular-nums text-primary">
                {arrival.arrivalTime ?? "—"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="truncate text-sm text-primary">{arrival.guestName}</strong>
                  <span className="text-xs text-muted-foreground">{arrival.code}</span>
                  {arrival.paymentStatus === "REFUND_PENDING" && (
                    <StatusBadge tone={paymentStatusLabels.REFUND_PENDING.tone}>
                      {paymentStatusLabels.REFUND_PENDING.label}
                    </StatusBadge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {arrival.roomTypeName} · {arrival.nights} đêm · {arrival.rooms} phòng
                  {arrival.numGuests != null && ` · ${arrival.numGuests} khách`}
                  {arrival.roomNumbers.length > 0 && ` · Phòng ${arrival.roomNumbers.join(", ")}`}
                </p>
                {arrival.specialRequests && (
                  <p className="mt-0.5 truncate text-xs italic text-muted-foreground">“{arrival.specialRequests}”</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </PartnerPanel>
  );
}
