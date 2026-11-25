"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Eye, Search, X } from "lucide-react";
import {
  VERIFICATION_SORTS,
  VerificationStatus,
  type VerificationRequestSummary,
} from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDebounce } from "@/hooks/use-debounce";
import type { VerificationQueueParams } from "@/services/manager.service";
import { usePendingVerificationCount, useVerificationQueue } from "../api/manager-queries";
import { ErrorPanel, ManagerPanel, ManagerTitle, StatusBadge } from "../components";
import {
  formatDateTime,
  formatWaiting,
  verificationStatusLabels,
  verificationTypeLabels,
} from "../lib/labels";
import { VerificationDetailDialog } from "./VerificationDetailDialog";

const PAGE_SIZE = 10;

type VerificationSort = (typeof VERIFICATION_SORTS)[number];

const sortLabels: Record<VerificationSort, string> = {
  "submitted-asc": "Gửi sớm nhất (theo SLA)",
  "submitted-desc": "Gửi gần nhất",
};

type QueueTab = "pending" | "all";

export default function ManagerVerifications() {
  // `?search=` comes from the header search box: a hotel looked up by name is shown with all its requests, and a
  // new header search replaces the box's text.
  const searchParam = useSearchParams().get("search") ?? "";
  const [tab, setTab] = useState<QueueTab>(searchParam ? "all" : "pending");
  const [search, setSearch] = useState(searchParam);
  const [shownSearchParam, setShownSearchParam] = useState(searchParam);
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<VerificationSort>("submitted-asc");
  const [page, setPage] = useState(1);
  if (shownSearchParam !== searchParam) {
    setShownSearchParam(searchParam);
    setSearch(searchParam);
    setPage(1);
    if (searchParam) setTab("all");
  }
  const [openId, setOpenId] = useState<string>();
  const debouncedSearch = useDebounce(search.trim());
  const pending = usePendingVerificationCount();

  const params: VerificationQueueParams = {
    page,
    pageSize: PAGE_SIZE,
    sort,
    search: debouncedSearch || undefined,
    status: tab === "pending" ? "PENDING" : status ? (status as VerificationStatus) : undefined,
  };
  const queueQuery = useVerificationQueue(params);
  const meta = queueQuery.data?.meta;

  // Every filter change starts again from the first page.
  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  const columns: CommonTableColumn<VerificationRequestSummary>[] = [
    {
      id: "hotel",
      header: "Khách sạn",
      cell: (request) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 size={16} />
          </span>
          <strong className="text-primary">{request.hotelName}</strong>
        </div>
      ),
    },
    { id: "type", header: "Loại hồ sơ", cell: (request) => verificationTypeLabels[request.requestType] },
    {
      id: "status",
      header: "Trạng thái",
      cell: (request) => (
        <StatusBadge tone={verificationStatusLabels[request.status].tone}>
          {verificationStatusLabels[request.status].label}
        </StatusBadge>
      ),
    },
    {
      id: "submitted",
      header: "Gửi lúc",
      cell: (request) => (
        <div>
          <span className="block">{formatDateTime(request.submittedAt)}</span>
          <span className="text-xs text-muted-foreground">
            {request.status === "PENDING"
              ? `Đã chờ ${formatWaiting(request.submittedAt)}`
              : `Xử lý ${formatDateTime(request.reviewedAt)}`}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (request) => (
        <Button
          variant={request.status === "PENDING" ? "default" : "outline"}
          size="sm"
          onClick={() => setOpenId(request.id)}
        >
          <Eye />
          {request.status === "PENDING" ? "Thẩm định" : "Xem"}
        </Button>
      ),
    },
  ];

  const filtered = !!(debouncedSearch || (tab === "all" && status));

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Xác minh đối tác"
        description="Kiểm duyệt hồ sơ pháp lý, thông tin thụ hưởng và tiêu chuẩn cơ sở trước khi kích hoạt khách sạn. Mọi quyết định đều được gửi email cho đối tác."
      />

      <ManagerPanel className="overflow-hidden p-0">
        <div className="border-b px-5 pt-4">
          <Tabs value={tab} onValueChange={(value) => update(setTab)(value as QueueTab)}>
            <TabsList variant="line">
              <TabsTrigger value="pending">
                Chờ thẩm định
                {pending.count > 0 && (
                  <span className="ml-1 rounded-full bg-warning-soft px-1.5 text-[11px] font-bold text-warning">
                    {pending.count}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="all">Tất cả hồ sơ</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* The search is the main control, so it gets the widest slot; sorting sits with the result count below. */}
        <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-end">
          <label className="relative block flex-1">
            <span className="sr-only">Tìm hồ sơ theo tên khách sạn</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(event) => update(setSearch)(event.target.value)}
              placeholder="Tìm theo tên khách sạn"
              className="h-10 pl-9"
              maxLength={100}
            />
          </label>
          {tab === "all" && (
            <label className="grid gap-1.5 text-xs font-semibold text-foreground sm:w-52">
              <span>Trạng thái</span>
              <NativeSelect
                value={status}
                onChange={(event) => update(setStatus)(event.target.value)}
                className="h-10 w-full"
              >
                <NativeSelectOption value="">Tất cả</NativeSelectOption>
                {Object.values(VerificationStatus).map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {verificationStatusLabels[value].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          )}
        </div>

        <div className="flex flex-col gap-2 border-b px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground" aria-live="polite">
              {meta ? (
                <>
                  <strong className="text-foreground">{meta.total}</strong> hồ sơ
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
          <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            Sắp xếp
            <NativeSelect
              value={sort}
              onChange={(event) => update(setSort)(event.target.value as VerificationSort)}
              className="min-w-56"
            >
              {VERIFICATION_SORTS.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {sortLabels[value]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>

        {queueQuery.error ? (
          <div className="p-5">
            <ErrorPanel error={queueQuery.error} onRetry={() => void queueQuery.refetch()} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableCommon
              data={queueQuery.data?.requests ?? []}
              columns={columns}
              getRowId={(request) => request.id}
              isLoading={queueQuery.isLoading}
              emptyMessage={
                filtered
                  ? "Không có hồ sơ nào khớp bộ lọc."
                  : tab === "pending"
                    ? "Không có hồ sơ nào đang chờ thẩm định."
                    : "Chưa có hồ sơ xác minh nào."
              }
              className="rounded-none border-0"
              tableClassName="min-w-[760px]"
            />
          </div>
        )}
        {meta && meta.total > 0 && (
          <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
        )}
      </ManagerPanel>

      <VerificationDetailDialog requestId={openId} onOpenChange={(open) => !open && setOpenId(undefined)} />
    </div>
  );
}
