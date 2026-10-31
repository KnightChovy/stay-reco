"use client";

import { useState } from "react";
import { Building2, Eye, Search } from "lucide-react";
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
  const [tab, setTab] = useState<QueueTab>("pending");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<VerificationSort>("submitted-asc");
  const [page, setPage] = useState(1);
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

        <div className="grid gap-3 border-b px-5 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-semibold text-foreground lg:col-span-2">
            <span>Tìm kiếm</span>
            <span className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={search}
                onChange={(event) => update(setSearch)(event.target.value)}
                placeholder="Tên khách sạn"
                className="pl-8"
                maxLength={100}
              />
            </span>
          </label>
          {tab === "all" ? (
            <label className="grid gap-1.5 text-xs font-semibold text-foreground">
              <span>Trạng thái</span>
              <NativeSelect
                value={status}
                onChange={(event) => update(setStatus)(event.target.value)}
                className="w-full"
              >
                <NativeSelectOption value="">Tất cả</NativeSelectOption>
                {Object.values(VerificationStatus).map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {verificationStatusLabels[value].label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </label>
          ) : (
            <div className="hidden lg:block" />
          )}
          <label className="grid gap-1.5 text-xs font-semibold text-foreground">
            <span>Sắp xếp</span>
            <NativeSelect
              value={sort}
              onChange={(event) => update(setSort)(event.target.value as VerificationSort)}
              className="w-full"
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
