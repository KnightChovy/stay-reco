"use client";

import type { Metric, PartnerPortfolio, RateMetric } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { StatsRangeParams } from "@/services/partner.service";
import { usePortfolioStats } from "../api/partner-queries";
import { ErrorPanel, PartnerPanel, StatusBadge, usePartnerHotel } from "../components";
import { formatMoney, hotelStatusLabels } from "../lib/labels";
import { Delta, formatNumber, formatPercent } from "./format";

export function PortfolioStats({ range }: { range: Required<StatsRangeParams> }) {
  const { hotels, hotel: current, selectHotel } = usePartnerHotel();
  const ownedCount = hotels.filter((item) => item.myRole === "OWNER").length;
  const portfolio = usePortfolioStats(range, ownedCount >= 2);

  if (ownedCount < 2) return null;

  return (
    <PartnerPanel className="p-5">
      <h3 className="font-bold text-primary">So sánh các khách sạn</h3>
      <p className="text-xs text-muted-foreground">Cùng kỳ thống kê, so với kỳ trước.</p>
      {portfolio.error ? (
        <div className="mt-3">
          <ErrorPanel error={portfolio.error} onRetry={() => void portfolio.refetch()} />
        </div>
      ) : !portfolio.data ? (
        <Skeleton className="mt-3 h-48 w-full" />
      ) : (
        <PortfolioTable data={portfolio.data} currentId={current?.id} onSelect={selectHotel} />
      )}
    </PartnerPanel>
  );
}

function PortfolioTable({
  data,
  currentId,
  onSelect,
}: {
  data: PartnerPortfolio;
  currentId: string | undefined;
  onSelect: (hotelId: string) => void;
}) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            <th scope="col" className="py-2 pr-3 font-semibold">Khách sạn</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Doanh thu phòng</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Thực nhận</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Công suất</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Đánh giá</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Cần xử lý</th>
            <th scope="col" className="py-2 pl-3">
              <span className="sr-only">Thao tác</span>
            </th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {data.hotels.map((row) => {
            const status = hotelStatusLabels[row.hotel.status];
            const isCurrent = row.hotel.id === currentId;
            return (
              <tr key={row.hotel.id} className="border-b last:border-0">
                <th scope="row" className="py-2 pr-3 text-left font-normal">
                  <span className="block font-semibold text-foreground">{row.hotel.name}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {row.hotel.city}
                    <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                  </span>
                </th>
                <MetricCell metric={row.roomRevenue} format={formatMoney} />
                <MetricCell metric={row.netEarnings} format={formatMoney} />
                <MetricCell metric={row.occupancyRate} format={formatPercent} />
                <td className="px-3 py-2 text-right">{row.avgRating == null ? "—" : `${formatNumber(row.avgRating)} ★`}</td>
                <td className="px-3 py-2 text-right">
                  <ActionCount critical={row.actionItems.critical} warning={row.actionItems.warning} />
                </td>
                <td className="py-2 pl-3 text-right">
                  {isCurrent ? (
                    <span className="text-xs text-muted-foreground">Đang xem</span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => onSelect(row.hotel.id)}>
                      Xem
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="tabular-nums">
          <tr className="border-t font-bold text-primary">
            <th scope="row" className="py-2 pr-3 text-left">Tất cả khách sạn</th>
            <MetricCell metric={data.totals.roomRevenue} format={formatMoney} />
            <MetricCell metric={data.totals.netEarnings} format={formatMoney} />
            <MetricCell metric={data.totals.occupancyRate} format={formatPercent} />
            <td colSpan={3} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MetricCell({ metric, format }: { metric: Metric | RateMetric; format: (value: number | null) => string }) {
  return (
    <td className="px-3 py-2 text-right">
      <span className="block">{format(metric.value)}</span>
      <Delta metric={metric} />
    </td>
  );
}

function ActionCount({ critical, warning }: { critical: number; warning: number }) {
  if (critical === 0 && warning === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex gap-2 text-xs font-semibold">
      {critical > 0 && <span className="text-danger">{critical} khẩn</span>}
      {warning > 0 && <span className="text-warning">{warning} cảnh báo</span>}
    </span>
  );
}
