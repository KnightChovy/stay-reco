"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { COMMISSION_STATUSES, type CommissionRow, type CommissionStatus } from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import { useCommissions } from "../api/manager-queries";
import { ErrorPanel, ExportReportButton, ManagerPanel, ManagerTitle, StatusBadge } from "../components";
import { addDays, formatShortDate, todayInVietnam } from "../lib/dates";
import { commissionStatusLabels, formatDateTime, formatMoney } from "../lib/labels";

const PAGE_SIZE = 20;
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

type Period = "past30" | "month" | "next30" | "past90";

const periodLabels: Record<Period, string> = {
  past30: "30 ngày qua",
  month: "Tháng này",
  next30: "30 ngày tới",
  past90: "90 ngày qua",
};

function periodRange(period: Period) {
  const today = todayInVietnam();
  switch (period) {
    case "past30":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today };
    case "next30":
      return { from: today, to: addDays(today, 29) };
    case "past90":
      return { from: addDays(today, -89), to: today };
  }
}

type StatusTab = "all" | CommissionStatus;

export default function ManagerTransactions() {
  const [period, setPeriod] = useState<Period>("past30");
  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim());
  const range = periodRange(period);
  const query = useCommissions({
    ...range,
    page,
    pageSize: PAGE_SIZE,
    status: tab === "all" ? undefined : [tab],
    search: debouncedSearch || undefined,
  });
  const meta = query.data?.meta;

  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const columns: CommonTableColumn<CommissionRow>[] = [
    {
      id: "booking",
      header: "Booking",
      cell: (row) => (
        <div>
          <span className="block font-mono font-semibold text-primary">{row.booking.code}</span>
          <span className="text-xs text-muted-foreground">{row.hotel.name}</span>
        </div>
      ),
    },
    { id: "checkout", header: "Trả phòng", cell: (row) => formatShortDate(row.checkOutDate) },
    { id: "total", header: "Khách trả", align: "right", cell: (row) => formatMoney(row.total) },
    { id: "rate", header: "Tỉ lệ", align: "right", cell: (row) => `${percentFormat.format(row.rate)}%` },
    {
      id: "amount",
      header: "Hoa hồng",
      align: "right",
      cell: (row) => <strong className="tabular-nums">{formatMoney(row.amount)}</strong>,
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (row) => (
        <div>
          <StatusBadge tone={commissionStatusLabels[row.status].tone}>{commissionStatusLabels[row.status].label}</StatusBadge>
          {row.chargedAt && <span className="mt-1 block text-xs text-muted-foreground">{formatDateTime(row.chargedAt)}</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Hoa hồng nền tảng"
        description="Hoa hồng từng booking theo ngày trả phòng: đã thu khi khách trả phòng hoặc không đến, dự kiến khi kỳ nghỉ đã xác nhận hoặc đang diễn ra. Tỉ lệ được chốt lúc khách đặt."
        action={<ExportReportButton report="commissions" range={range} />}
      />

      <ManagerPanel className="overflow-hidden p-0">
        <div className="border-b px-5 pt-4">
          <Tabs value={tab} onValueChange={(value) => update(setTab)(value as StatusTab)}>
            <TabsList variant="line">
              <TabsTrigger value="all">Tất cả</TabsTrigger>
              {COMMISSION_STATUSES.map((status) => (
                <TabsTrigger key={status} value={status}>
                  {commissionStatusLabels[status].label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3 border-b px-5 py-4 lg:flex-row lg:items-center">
          <label className="relative block lg:w-80">
            <span className="sr-only">Tìm theo mã booking</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => update(setSearch)(event.target.value)}
              placeholder="Tìm theo mã booking (SR-…)"
              className="h-10 pl-9"
              maxLength={50}
            />
          </label>
          {debouncedSearch && (
            <Button type="button" variant="ghost" size="sm" onClick={() => update(setSearch)("")}>
              <X />
              Xoá tìm kiếm
            </Button>
          )}
          <div role="group" aria-label="Kỳ theo ngày trả phòng" className="flex flex-wrap gap-1.5 lg:ml-auto">
            {(Object.keys(periodLabels) as Period[]).map((value) => (
              <Button
                key={value}
                size="sm"
                variant={period === value ? "default" : "outline"}
                aria-pressed={period === value}
                onClick={() => update(setPeriod)(value)}
              >
                {periodLabels[value]}
              </Button>
            ))}
          </div>
        </div>

        <p className="border-b px-5 py-3 text-sm text-muted-foreground" aria-live="polite">
          {meta ? (
            <>
              <strong className="text-foreground">{meta.total}</strong> booking · trả phòng từ {formatShortDate(range.from)}{" "}
              đến {formatShortDate(range.to)}
            </>
          ) : (
            "Đang tải..."
          )}
        </p>

        {query.error ? (
          <div className="p-5">
            <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableCommon
              data={query.data?.commissions ?? []}
              columns={columns}
              getRowId={(row) => row.booking.id}
              isLoading={query.isLoading}
              emptyMessage={debouncedSearch ? "Không có booking nào khớp mã đã nhập." : "Không có hoa hồng nào trong kỳ."}
              className="rounded-none border-0"
              tableClassName="min-w-[780px]"
            />
          </div>
        )}
        {meta && meta.total > 0 && (
          <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
        )}
      </ManagerPanel>
    </div>
  );
}
