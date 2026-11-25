"use client";

import type { BookingSource, HotelStatsBreakdown } from "@stayreco/shared";
import { Skeleton } from "@/components/ui/skeleton";
import { paymentMethodLabels } from "@/features/booking/lib/booking-labels";
import type { StatsRangeParams } from "@/services/partner.service";
import { useStatsBreakdown } from "../api/partner-queries";
import { ErrorPanel, PartnerPanel } from "../components";
import { bookingStatusLabels, formatMoney } from "../lib/labels";
import { formatNumber, formatPercent } from "./format";

const sourceLabels: Record<BookingSource, string> = {
  AI_RECOMMENDATION: "Gợi ý AI",
  PROMOTION: "Khuyến mãi",
  DIRECT: "Trực tiếp",
};

type ShareRow = { key: string; label: string; bookings: number; sharePercent: number | null };

export function StatsBreakdown({ hotelId, range }: { hotelId: string; range: Required<StatsRangeParams> }) {
  const breakdown = useStatsBreakdown(hotelId, range);

  if (breakdown.error) {
    return <ErrorPanel error={breakdown.error} onRetry={() => void breakdown.refetch()} />;
  }
  if (!breakdown.data) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-xl lg:col-span-3" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const data = breakdown.data;
  return (
    <div className="space-y-4">
      <RoomTypeTable data={data} />
      <div className="grid gap-4 lg:grid-cols-3">
        <ShareList
          title="Nguồn booking"
          total={data.totals.bookingsCreated}
          rows={data.bySource.map((row) => ({ key: row.source, label: sourceLabels[row.source], ...row }))}
        />
        <ShareList
          title="Trạng thái hiện tại"
          total={data.totals.bookingsCreated}
          rows={data.byStatus.map((row) => ({ key: row.status, label: bookingStatusLabels[row.status].label, ...row }))}
        />
        <ShareList
          title="Phương thức thanh toán"
          total={data.totals.bookingsCreated}
          rows={data.byPaymentMethod.map((row) => ({ key: row.method, label: paymentMethodLabels[row.method], ...row }))}
        />
      </div>
    </div>
  );
}

function RoomTypeTable({ data }: { data: HotelStatsBreakdown }) {
  const { totals } = data;
  return (
    <PartnerPanel className="p-5">
      <h3 className="font-bold text-primary">Hiệu quả theo loại phòng</h3>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th scope="col" className="py-2 pr-3 font-semibold">Loại phòng</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Số phòng</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Đêm đã bán</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Công suất</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Doanh thu phòng</th>
              <th scope="col" className="py-2 pl-3 text-right font-semibold">ADR</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {data.byRoomType.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-6 text-center text-muted-foreground">
                  Khách sạn chưa có loại phòng.
                </td>
              </tr>
            ) : (
              data.byRoomType.map((row) => (
                <tr key={row.roomTypeId} className="border-b last:border-0">
                  <th scope="row" className="py-2 pr-3 text-left font-semibold text-foreground">{row.name}</th>
                  <td className="px-3 py-2 text-right">{formatNumber(row.rooms)}</td>
                  <td className="px-3 py-2 text-right">
                    {formatNumber(row.roomNightsSold)}/{formatNumber(row.roomNightsAvailable)}
                  </td>
                  <td className="px-3 py-2 text-right">{formatPercent(row.occupancyRate)}</td>
                  <td className="px-3 py-2 text-right">{formatMoney(row.roomRevenue)}</td>
                  <td className="py-2 pl-3 text-right">{row.adr == null ? "—" : formatMoney(row.adr)}</td>
                </tr>
              ))
            )}
          </tbody>
          {data.byRoomType.length > 0 && (
            <tfoot className="tabular-nums">
              <tr className="border-t font-bold text-primary">
                <th scope="row" className="py-2 pr-3 text-left">Toàn khách sạn</th>
                <td className="px-3 py-2 text-right">{formatNumber(totals.rooms)}</td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(totals.roomNightsSold)}/{formatNumber(totals.roomNightsAvailable)}
                </td>
                <td className="px-3 py-2 text-right">{formatPercent(totals.occupancyRate)}</td>
                <td className="px-3 py-2 text-right">{formatMoney(totals.roomRevenue)}</td>
                <td className="py-2 pl-3 text-right">{totals.adr == null ? "—" : formatMoney(totals.adr)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </PartnerPanel>
  );
}

function ShareList({ title, total, rows }: { title: string; total: number; rows: ShareRow[] }) {
  return (
    <PartnerPanel className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-bold text-primary">{title}</h3>
        <span className="text-xs text-muted-foreground">{formatNumber(total)} booking</span>
      </div>
      {total === 0 || rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">Chưa có booking trong kỳ.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map((row) => (
            <li key={row.key} className="space-y-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground">{row.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatNumber(row.bookings)} · {formatPercent(row.sharePercent)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                <div className="h-full rounded-full bg-primary" style={{ width: `${row.sharePercent ?? 0}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </PartnerPanel>
  );
}
