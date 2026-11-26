"use client";

import { useState } from "react";
import { Building2, Eye, Search, X } from "lucide-react";
import { PAYOUT_PROCESSING_DAYS, type ManagerPayout, type PayoutStatus } from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import type { PayoutQueueParams } from "@/services/manager.service";
import { usePayoutQueue, usePendingPayoutCount } from "../api/manager-queries";
import { ErrorPanel, ManagerPanel, ManagerTitle, StatusBadge } from "../components";
import { formatDateTime, formatMoney, formatWaiting, payoutStatusLabels } from "../lib/labels";
import { PayoutDetailDialog } from "./PayoutDetailDialog";

const PAGE_SIZE = 10;

type QueueTab = "pending" | "decided";

const decidedStatuses: PayoutStatus[] = ["PAID", "REJECTED", "CANCELLED"];

export default function ManagerPayouts() {
  const [tab, setTab] = useState<QueueTab>("pending");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PayoutStatus | "">("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string>();
  const debouncedSearch = useDebounce(search.trim());
  const pending = usePendingPayoutCount();

  const params: PayoutQueueParams = {
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: tab === "pending" ? ["PENDING"] : status ? [status] : decidedStatuses,
  };
  const query = usePayoutQueue(params);
  const meta = query.data?.meta;
  const filtered = !!(debouncedSearch || (tab === "decided" && status));

  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  const columns: CommonTableColumn<ManagerPayout>[] = [
    {
      id: "hotel",
      header: "Khách sạn",
      cell: (payout) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 size={16} />
          </span>
          <div className="min-w-0">
            <strong className="block text-primary">{payout.hotel.name}</strong>
            <span className="text-xs text-muted-foreground">{payout.partner.name}</span>
          </div>
        </div>
      ),
    },
    {
      id: "amount",
      header: "Số tiền",
      align: "right",
      cell: (payout) => <strong className="tabular-nums">{formatMoney(payout.amount)}</strong>,
    },
    {
      id: "account",
      header: "Tài khoản nhận",
      cell: (payout) => (
        <div>
          <span className="block">{payout.beneficiary.bankName}</span>
          <span className="font-mono text-xs text-muted-foreground">{payout.beneficiary.accountNumber}</span>
        </div>
      ),
    },
    {
      id: "requested",
      header: tab === "pending" ? "Yêu cầu lúc" : "Xử lý lúc",
      cell: (payout) =>
        tab === "pending" ? (
          <div>
            <span className="block">{formatDateTime(payout.requestedAt)}</span>
            <span className={payout.overdue ? "text-xs font-semibold text-danger" : "text-xs text-muted-foreground"}>
              {payout.overdue ? `Quá hạn từ ${formatDateTime(payout.dueBy)}` : `Đã chờ ${formatWaiting(payout.requestedAt)}`}
            </span>
          </div>
        ) : (
          <div>
            <span className="block">{formatDateTime(payout.decidedAt)}</span>
            <span className="text-xs text-muted-foreground">{payout.decidedBy?.fullName ?? "Đối tác"}</span>
          </div>
        ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (payout) => (
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge tone={payoutStatusLabels[payout.status].tone}>{payoutStatusLabels[payout.status].label}</StatusBadge>
          {payout.overdue && <StatusBadge tone="danger">Quá hạn</StatusBadge>}
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (payout) => (
        <Button
          variant={payout.status === "PENDING" ? "default" : "outline"}
          size="sm"
          onClick={() => setOpenId(payout.id)}
        >
          <Eye />
          {payout.status === "PENDING" ? "Xử lý" : "Xem"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Rút tiền đối tác"
        description={`Chuyển tiền cho yêu cầu rút của đối tác trong ${PAYOUT_PROCESSING_DAYS} ngày làm việc. Chuyển khoản trong ứng dụng ngân hàng rồi ghi lại mã giao dịch; đối tác nhận thông báo và email cho mỗi quyết định.`}
      />

      <ManagerPanel className="overflow-hidden p-0">
        <div className="border-b px-5 pt-4">
          <Tabs value={tab} onValueChange={(value) => update(setTab)(value as QueueTab)}>
            <TabsList variant="line">
              <TabsTrigger value="pending">
                Chờ chuyển tiền
                {pending.count > 0 && (
                  <span className="ml-1 rounded-full bg-warning-soft px-1.5 text-[11px] font-bold text-warning">
                    {pending.count}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="decided">Đã xử lý</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-end">
          <label className="relative block flex-1">
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
          {tab === "decided" && (
            <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:w-52">
              <span>Trạng thái</span>
              <NativeSelect
                value={status}
                onChange={(event) => update(setStatus)(event.target.value as PayoutStatus | "")}
                className="h-10 w-full"
              >
                <NativeSelectOption value="">Tất cả</NativeSelectOption>
                {decidedStatuses.map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {payoutStatusLabels[value].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
        </div>

        <div className="flex items-center gap-3 border-b px-5 py-3 text-sm">
          <span className="text-muted-foreground" aria-live="polite">
            {meta ? (
              <>
                <strong className="text-foreground">{meta.total}</strong> yêu cầu
                {tab === "pending" && " · cũ nhất trước"}
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

        {query.error ? (
          <div className="p-5">
            <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableCommon
              data={query.data?.payouts ?? []}
              columns={columns}
              getRowId={(payout) => payout.id}
              isLoading={query.isLoading}
              emptyMessage={
                filtered
                  ? "Không có yêu cầu nào khớp bộ lọc."
                  : tab === "pending"
                    ? "Không có yêu cầu rút tiền nào đang chờ."
                    : "Chưa xử lý yêu cầu rút tiền nào."
              }
              className="rounded-none border-0"
              tableClassName="min-w-[860px]"
            />
          </div>
        )}
        {meta && meta.total > 0 && (
          <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
        )}
      </ManagerPanel>

      <PayoutDetailDialog payoutId={openId} onOpenChange={(open) => !open && setOpenId(undefined)} />
    </div>
  );
}
