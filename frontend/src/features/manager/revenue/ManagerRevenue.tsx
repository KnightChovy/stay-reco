"use client";

import { useState } from "react";
import { Eye, Search, X } from "lucide-react";
import {
  HOTEL_REVENUE_SORTS,
  REGIONS,
  type HotelRevenueRow,
  type Metric,
  type PlatformRevenue,
  type Region,
} from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { useHotelRevenueList, usePlatformRevenue } from "../api/manager-queries";
import { ErrorPanel, ExportReportButton, ManagerPanel, ManagerTitle, MetricDelta } from "../components";
import { formatShortDate, periodPresetLabels, presetRange, type PeriodPreset } from "../lib/dates";
import { formatMoney, regionLabels } from "../lib/labels";
import { HotelRevenueDialog } from "./HotelRevenueDialog";
import { RevenueChart, revenueMetrics, type RevenueMetric } from "./RevenueChart";

const PAGE_SIZE = 10;
const countFormat = new Intl.NumberFormat("vi-VN");
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

type HotelSort = (typeof HOTEL_REVENUE_SORTS)[number];

const sortLabels: Record<HotelSort, string> = {
  "gmv-desc": "GMV cao nhất",
  "commission-desc": "Hoa hồng cao nhất",
  "bookings-desc": "Nhiều booking nhất",
  "cancellationRate-desc": "Tỉ lệ huỷ cao nhất",
  "name-asc": "Tên A–Z",
};

function count(value: number | null) {
  return value == null ? "—" : countFormat.format(value);
}

export default function ManagerRevenue() {
  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const [chartMetric, setChartMetric] = useState<RevenueMetric>("gmv");
  const [openHotelId, setOpenHotelId] = useState<string>();
  const range = presetRange(preset);
  const revenue = usePlatformRevenue(range);
  const data = revenue.data;

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Doanh thu nền tảng"
        description="GMV, giảm giá, hoàn tiền và hoa hồng của toàn mạng lưới, theo thời gian, theo vùng và theo từng khách sạn."
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
            <ExportReportButton report="revenue" range={range} />
          </div>
        }
      />

      {revenue.error ? (
        <ErrorPanel error={revenue.error} onRetry={() => void revenue.refetch()} />
      ) : !data ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Kỳ {formatShortDate(data.period.from)} – {formatShortDate(data.period.to)}, so với{" "}
            {formatShortDate(data.previous.from)} – {formatShortDate(data.previous.to)}
          </p>
          <RevenueTotals totals={data.totals} />

          <ManagerPanel className="p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="mr-auto font-bold text-primary">Theo thời gian</h2>
              <div role="group" aria-label="Chỉ số biểu đồ" className="flex gap-1.5">
                {(Object.keys(revenueMetrics) as RevenueMetric[]).map((value) => (
                  <Button
                    key={value}
                    size="sm"
                    variant={chartMetric === value ? "secondary" : "ghost"}
                    aria-pressed={chartMetric === value}
                    onClick={() => setChartMetric(value)}
                  >
                    {revenueMetrics[value].label}
                  </Button>
                ))}
              </div>
            </div>
            <RevenueChart revenue={data} metric={chartMetric} />
          </ManagerPanel>

          <RegionTable byRegion={data.byRegion} />
        </>
      )}

      <HotelRevenueTable range={range} onOpen={setOpenHotelId} />

      <HotelRevenueDialog
        hotelId={openHotelId}
        range={range}
        onOpenChange={(open) => !open && setOpenHotelId(undefined)}
      />
    </div>
  );
}

function RevenueTotals({ totals }: { totals: PlatformRevenue["totals"] }) {
  const cards: { label: string; metric: Metric; money?: boolean; good?: "up" | "down"; hint: string }[] = [
    { label: "GMV", metric: totals.gmv, money: true, hint: "Khách trả cho booking thanh toán trong kỳ" },
    { label: "Booking", metric: totals.bookings, hint: "Booking thanh toán trong kỳ" },
    { label: "Giảm giá", metric: totals.discounts, money: true, good: "down", hint: "Khuyến mãi và voucher" },
    { label: "Điểm thưởng", metric: totals.pointsUsed, money: true, good: "down", hint: "Giá trị điểm khách đã dùng" },
    { label: "Hoàn tiền", metric: totals.refunds, money: true, good: "down", hint: "Duyệt hoàn trong kỳ" },
    { label: "Hoa hồng", metric: totals.commission, money: true, hint: "Thu khi trả phòng hoặc không đến" },
    { label: "Chi từ ví nền tảng", metric: totals.platformDebits, money: true, good: "down", hint: "Chi phí nền tảng trong kỳ" },
    { label: "Doanh thu nền tảng", metric: totals.platformRevenue, money: true, hint: "Hoa hồng trừ chi từ ví nền tảng" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => {
        const format = (value: number | null) => (card.money ? formatMoney(value) : count(value));
        return (
          <ManagerPanel key={card.label} className={cn("p-4", card.label === "Doanh thu nền tảng" && "ring-1 ring-primary/30")}>
            <p className="text-xs font-semibold text-muted-foreground">{card.label}</p>
            <strong title={format(card.metric.value)} className="mt-1 block truncate text-xl font-bold tabular-nums text-primary">
              {format(card.metric.value)}
            </strong>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
              <MetricDelta value={card.metric.deltaPercent} good={card.good} />
              {card.metric.previous != null && <span>Kỳ trước {format(card.metric.previous)}</span>}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          </ManagerPanel>
        );
      })}
    </div>
  );
}

function RegionTable({ byRegion }: { byRegion: PlatformRevenue["byRegion"] }) {
  return (
    <ManagerPanel className="overflow-hidden p-0">
      <h2 className="px-5 pt-5 font-bold text-primary">Theo vùng</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-y text-left text-xs text-muted-foreground">
              <th scope="col" className="px-5 py-2 font-semibold">Vùng</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Khách sạn đang bán</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">Booking</th>
              <th scope="col" className="px-3 py-2 text-right font-semibold">GMV</th>
              <th scope="col" className="px-5 py-2 text-right font-semibold">Hoa hồng</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {byRegion.map((row) => (
              <tr key={row.region} className="border-b last:border-0">
                <th scope="row" className="px-5 py-2.5 text-left font-semibold text-foreground">
                  {regionLabels[row.region]}
                </th>
                <td className="px-3 py-2.5 text-right">{countFormat.format(row.hotels)}</td>
                <MetricCell metric={row.bookings} format={count} />
                <MetricCell metric={row.gmv} format={formatMoney} />
                <MetricCell metric={row.commission} format={formatMoney} last />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ManagerPanel>
  );
}

function MetricCell({
  metric,
  format,
  last,
}: {
  metric: Metric;
  format: (value: number | null) => string;
  last?: boolean;
}) {
  return (
    <td className={cn("py-2.5 text-right", last ? "px-5" : "px-3")}>
      <span className="block">{format(metric.value)}</span>
      <MetricDelta value={metric.deltaPercent} />
    </td>
  );
}

function HotelRevenueTable({ range, onOpen }: { range: { from: string; to: string }; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState<Region | "">("");
  const [sort, setSort] = useState<HotelSort>("gmv-desc");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const query = useHotelRevenueList({
    ...range,
    page,
    pageSize: PAGE_SIZE,
    sort,
    search: debouncedSearch || undefined,
    region: region || undefined,
  });
  const meta = query.data?.meta;
  const filtered = !!(debouncedSearch || region);

  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const columns: CommonTableColumn<HotelRevenueRow>[] = [
    {
      id: "hotel",
      header: "Khách sạn",
      cell: (row) => (
        <div className="min-w-0">
          <strong className="block text-primary">{row.hotel.name}</strong>
          <span className="text-xs text-muted-foreground">
            {row.hotel.city} · {regionLabels[row.hotel.region]} · {row.partner.name}
          </span>
        </div>
      ),
    },
    { id: "bookings", header: "Booking", align: "right", cell: (row) => count(row.bookings) },
    { id: "gmv", header: "GMV", align: "right", cell: (row) => formatMoney(row.gmv) },
    { id: "commission", header: "Hoa hồng", align: "right", cell: (row) => formatMoney(row.commission) },
    { id: "refunds", header: "Hoàn tiền", align: "right", cell: (row) => formatMoney(row.refunds) },
    {
      id: "cancellation",
      header: "Tỉ lệ huỷ",
      align: "right",
      cell: (row) =>
        row.cancellationRate == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className={cn(row.cancellationRate >= 20 && "font-semibold text-danger")}>
            {percentFormat.format(row.cancellationRate)}%
          </span>
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (row) => (
        <Button variant="outline" size="sm" onClick={() => onOpen(row.hotel.id)}>
          <Eye />
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <ManagerPanel className="overflow-hidden p-0">
      <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-end">
        <h2 className="font-bold text-primary lg:mr-auto lg:self-center">Theo khách sạn</h2>
        <label className="relative block lg:w-72">
          <span className="sr-only">Tìm theo tên khách sạn hoặc đối tác</span>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(event) => update(setSearch)(event.target.value)}
            placeholder="Tìm khách sạn hoặc đối tác"
            className="h-10 pl-9"
            maxLength={100}
          />
        </label>
        <NativeSelect
          aria-label="Lọc theo vùng"
          value={region}
          onChange={(event) => update(setRegion)(event.target.value as Region | "")}
          className="h-10 lg:w-40"
        >
          <NativeSelectOption value="">Mọi vùng</NativeSelectOption>
          {REGIONS.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {regionLabels[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="Sắp xếp"
          value={sort}
          onChange={(event) => update(setSort)(event.target.value as HotelSort)}
          className="h-10 lg:w-48"
        >
          {HOTEL_REVENUE_SORTS.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {sortLabels[value]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {filtered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setRegion("");
              setPage(1);
            }}
          >
            <X />
            Xoá bộ lọc
          </Button>
        )}
      </div>
      {query.error ? (
        <div className="p-5">
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <TableCommon
            data={query.data?.hotels ?? []}
            columns={columns}
            getRowId={(row) => row.hotel.id}
            isLoading={query.isLoading}
            emptyMessage={filtered ? "Không có khách sạn nào khớp bộ lọc." : "Chưa có khách sạn nào."}
            className="rounded-none border-0"
            tableClassName="min-w-[900px]"
          />
        </div>
      )}
      {meta && meta.total > 0 && (
        <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
      )}
    </ManagerPanel>
  );
}
