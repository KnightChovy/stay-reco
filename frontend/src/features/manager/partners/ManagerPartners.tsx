"use client";

import { useState } from "react";
import { BadgeCheck, Building2, RotateCcw, Search, Star, X } from "lucide-react";
import {
  LISTED_HOTEL_STATUSES,
  PARTNER_STATUSES,
  PLATFORM_HOTEL_SORTS,
  REGIONS,
  type PlatformHotelRow,
  type Region,
} from "@stayreco/shared";
import { ActionMenu } from "@/components/common/ActionBar";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { PlatformHotelParams } from "@/services/manager.service";
import { usePlatformHotels } from "../api/manager-queries";
import { ErrorPanel, ManagerPanel, ManagerTitle, StatusBadge } from "../components";
import { periodPresetLabels, presetRange, type PeriodPreset } from "../lib/dates";
import { formatMoney, hotelStatusLabels, partnerStatusLabels, regionLabels } from "../lib/labels";
import { ReverificationDialog } from "./ReverificationDialog";

const PAGE_SIZE = 10;

type HotelSort = (typeof PLATFORM_HOTEL_SORTS)[number];
type ListedStatus = (typeof LISTED_HOTEL_STATUSES)[number];
type ListedPartnerStatus = (typeof PARTNER_STATUSES)[number];

const sortLabels: Record<HotelSort, string> = {
  "bookings-desc": "Nhiều booking nhất",
  "gmv-desc": "GMV cao nhất",
  "cancellationRate-desc": "Tỉ lệ huỷ cao nhất",
  "rating-asc": "Đánh giá thấp nhất",
  "name-asc": "Tên A–Z",
};

const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const countFormat = new Intl.NumberFormat("vi-VN");

export default function ManagerPartners() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ListedStatus | "">("");
  const [partnerStatus, setPartnerStatus] = useState<ListedPartnerStatus | "">("");
  const [region, setRegion] = useState<Region | "">("");
  const [sort, setSort] = useState<HotelSort>("bookings-desc");
  const [preset, setPreset] = useState<PeriodPreset>("30d");
  const [page, setPage] = useState(1);
  const [reverifying, setReverifying] = useState<PlatformHotelRow>();
  const debouncedSearch = useDebounce(search.trim());

  const params: PlatformHotelParams = {
    ...presetRange(preset),
    page,
    pageSize: PAGE_SIZE,
    sort,
    search: debouncedSearch || undefined,
    status: status ? [status] : undefined,
    partnerStatus: partnerStatus ? [partnerStatus] : undefined,
    region: region || undefined,
  };
  const query = usePlatformHotels(params);
  const meta = query.data?.meta;
  const filtered = !!(debouncedSearch || status || partnerStatus || region);

  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPartnerStatus("");
    setRegion("");
    setPage(1);
  }

  const columns: CommonTableColumn<PlatformHotelRow>[] = [
    {
      id: "hotel",
      header: "Khách sạn",
      cell: (hotel) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 size={16} />
          </span>
          <div className="min-w-0">
            <strong className="block text-primary">{hotel.name}</strong>
            <span className="text-xs text-muted-foreground">
              {hotel.city} · {regionLabels[hotel.region]} · {hotel.rooms} phòng
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "partner",
      header: "Đối tác",
      cell: (hotel) => (
        <div>
          <span className="block">{hotel.partner.name}</span>
          {hotel.partner.status !== "APPROVED" && (
            <StatusBadge tone={partnerStatusLabels[hotel.partner.status].tone} className="mt-1">
              {partnerStatusLabels[hotel.partner.status].label}
            </StatusBadge>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (hotel) => (
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge tone={hotelStatusLabels[hotel.status].tone}>{hotelStatusLabels[hotel.status].label}</StatusBadge>
          {hotel.openCases > 0 && <StatusBadge tone="danger">{hotel.openCases} vi phạm</StatusBadge>}
        </div>
      ),
    },
    {
      id: "bookings",
      header: "Booking",
      align: "right",
      cell: (hotel) => <span className="tabular-nums">{countFormat.format(hotel.bookings)}</span>,
    },
    {
      id: "gmv",
      header: "GMV",
      align: "right",
      cell: (hotel) => <span className="tabular-nums">{formatMoney(hotel.gmv)}</span>,
    },
    {
      id: "cancellation",
      header: "Tỉ lệ huỷ",
      align: "right",
      cell: (hotel) =>
        hotel.cancellationRate == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span className={cn("tabular-nums", hotel.cancellationRate >= 20 && "font-semibold text-danger")}>
            {percentFormat.format(hotel.cancellationRate)}%
          </span>
        ),
    },
    {
      id: "rating",
      header: "Đánh giá",
      align: "right",
      cell: (hotel) =>
        hotel.rating.average == null ? (
          <span className="text-muted-foreground">Chưa có</span>
        ) : (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
            {percentFormat.format(hotel.rating.average)}
            <span className="text-xs text-muted-foreground">({hotel.rating.count})</span>
          </span>
        ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (hotel) => (
        <ActionMenu
          variant="icon"
          label={`Thao tác với ${hotel.name}`}
          items={[
            {
              label: "Xem hồ sơ xác minh",
              icon: BadgeCheck,
              href: `/manager/verifications?search=${encodeURIComponent(hotel.name)}`,
            },
            {
              label: "Yêu cầu tái xác minh",
              icon: RotateCcw,
              description:
                hotel.status === "ACTIVE"
                  ? "Đối tác gửi lại hồ sơ, khách sạn vẫn bán phòng."
                  : "Chỉ áp dụng cho khách sạn đang bán.",
              disabled: hotel.status !== "ACTIVE",
              onSelect: () => setReverifying(hotel),
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Đối tác khách sạn"
        description="Mọi khách sạn đã qua bước nháp, mỗi khách sạn một dòng: tình trạng, hiệu quả kinh doanh trong kỳ, đánh giá và hồ sơ vi phạm đang mở."
      />

      <ManagerPanel className="overflow-hidden p-0">
        <div className="grid gap-3 border-b px-5 py-4 md:grid-cols-2 xl:grid-cols-[1fr_repeat(3,minmax(0,11rem))]">
          <label className="relative block md:col-span-2 xl:col-span-1 xl:self-end">
            <span className="sr-only">Tìm theo tên khách sạn hoặc đối tác</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => update(setSearch)(event.target.value)}
              placeholder="Tìm theo tên khách sạn hoặc đối tác"
              className="h-10 pl-9"
              maxLength={100}
            />
          </label>
          <FilterSelect
            label="Trạng thái khách sạn"
            value={status}
            onChange={(value) => update(setStatus)(value as ListedStatus | "")}
            options={LISTED_HOTEL_STATUSES.map((value) => [value, hotelStatusLabels[value].label])}
          />
          <FilterSelect
            label="Trạng thái đối tác"
            value={partnerStatus}
            onChange={(value) => update(setPartnerStatus)(value as ListedPartnerStatus | "")}
            options={PARTNER_STATUSES.map((value) => [value, partnerStatusLabels[value].label])}
          />
          <FilterSelect
            label="Vùng"
            value={region}
            onChange={(value) => update(setRegion)(value as Region | "")}
            options={REGIONS.map((value) => [value, regionLabels[value]])}
          />
        </div>

        <div className="flex flex-col gap-3 border-b px-5 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground" aria-live="polite">
              {meta ? (
                <>
                  <strong className="text-foreground">{meta.total}</strong> khách sạn
                </>
              ) : (
                "Đang tải..."
              )}
            </span>
            {filtered && (
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X />
                Xoá bộ lọc
              </Button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div role="group" aria-label="Kỳ tính booking và GMV" className="flex flex-wrap gap-1.5">
              {(Object.keys(periodPresetLabels) as PeriodPreset[]).map((value) => (
                <Button
                  key={value}
                  size="sm"
                  variant={preset === value ? "default" : "outline"}
                  aria-pressed={preset === value}
                  onClick={() => update(setPreset)(value)}
                >
                  {periodPresetLabels[value]}
                </Button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              Sắp xếp
              <NativeSelect
                value={sort}
                onChange={(event) => update(setSort)(event.target.value as HotelSort)}
                className="min-w-48"
              >
                {PLATFORM_HOTEL_SORTS.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {sortLabels[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          </div>
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
              getRowId={(hotel) => hotel.id}
              isLoading={query.isLoading}
              emptyMessage={filtered ? "Không có khách sạn nào khớp bộ lọc." : "Chưa có khách sạn nào qua bước nháp."}
              className="rounded-none border-0"
              tableClassName="min-w-[1040px]"
            />
          </div>
        )}
        {meta && meta.total > 0 && (
          <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
        )}
      </ManagerPanel>

      <ReverificationDialog hotel={reverifying} onClose={() => setReverifying(undefined)} />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-foreground">
      <span>{label}</span>
      <NativeSelect value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full">
        <NativeSelectOption value="">Tất cả</NativeSelectOption>
        {options.map(([optionValue, optionLabel]) => (
          <NativeSelectOption key={optionValue} value={optionValue}>
            {optionLabel}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </label>
  );
}
