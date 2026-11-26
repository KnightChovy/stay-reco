"use client";

import { useState } from "react";
import { Eye, ImageIcon, MessageSquareText } from "lucide-react";
import type { ContentReport } from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContentReports } from "../api/manager-queries";
import { ErrorPanel, ManagerPanel, StatusBadge } from "../components";
import {
  formatDateTime,
  formatWaiting,
  reporterRoleLabels,
  reportReasonLabels,
  violationStatusLabels,
} from "../lib/labels";
import { ReportDetailDialog } from "./ReportDetailDialog";

const PAGE_SIZE = 10;

type ReportTab = "open" | "closed";

export function ContentReports() {
  const [tab, setTab] = useState<ReportTab>("open");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ContentReport>();
  const query = useContentReports({
    page,
    pageSize: PAGE_SIZE,
    status: tab === "open" ? ["OPEN", "INVESTIGATING"] : ["RESOLVED", "DISMISSED"],
  });
  const reports = query.data?.reports ?? [];
  const meta = query.data?.meta;
  const current = selected ? (reports.find((report) => report.id === selected.id) ?? selected) : undefined;

  const columns: CommonTableColumn<ContentReport>[] = [
    {
      id: "target",
      header: "Nội dung",
      cell: (report) => (
        <span className="inline-flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            {report.imageUrl ? <ImageIcon size={15} aria-hidden /> : <MessageSquareText size={15} aria-hidden />}
          </span>
          <span>
            <strong className="block text-primary">{report.imageUrl ? "Ảnh đánh giá" : "Đánh giá"}</strong>
            <span className="text-xs text-muted-foreground">{report.hotelName}</span>
          </span>
        </span>
      ),
    },
    {
      id: "reason",
      header: "Lý do",
      cell: (report) => (
        <div className="max-w-64">
          <span className="block">{reportReasonLabels[report.reason]}</span>
          {report.note && <span className="line-clamp-1 text-xs text-muted-foreground">{report.note}</span>}
        </div>
      ),
    },
    {
      id: "reporter",
      header: "Người báo cáo",
      cell: (report) => (
        <div>
          <span className="block">{report.reporterName}</span>
          <span className="text-xs text-muted-foreground">
            {reporterRoleLabels[report.reporterRole] ?? report.reporterRole}
          </span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (report) => (
        <StatusBadge tone={violationStatusLabels[report.status].tone}>{violationStatusLabels[report.status].label}</StatusBadge>
      ),
    },
    {
      id: "created",
      header: tab === "open" ? "Gửi lúc" : "Xử lý lúc",
      cell: (report) => (
        <div>
          <span className="block">{formatDateTime(tab === "open" ? report.createdAt : report.resolvedAt)}</span>
          {tab === "open" && (
            <span className="text-xs text-muted-foreground">Đã chờ {formatWaiting(report.createdAt)}</span>
          )}
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (report) => (
        <Button variant={tab === "open" ? "default" : "outline"} size="sm" onClick={() => setSelected(report)}>
          <Eye />
          {tab === "open" ? "Xử lý" : "Xem"}
        </Button>
      ),
    },
  ];

  return (
    <ManagerPanel className="overflow-hidden p-0">
      <div className="border-b px-5 pt-4">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            setTab(value as ReportTab);
            setPage(1);
          }}
        >
          <TabsList variant="line">
            <TabsTrigger value="open">Cần xử lý</TabsTrigger>
            <TabsTrigger value="closed">Đã xử lý</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <p className="border-b px-5 py-3 text-sm text-muted-foreground" aria-live="polite">
        {meta ? (
          <>
            <strong className="text-foreground">{meta.total}</strong> báo cáo
            {tab === "open" && " · cũ nhất trước"}
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
            data={reports}
            columns={columns}
            getRowId={(report) => report.id}
            isLoading={query.isLoading}
            emptyMessage={tab === "open" ? "Không có báo cáo nào cần xử lý." : "Chưa xử lý báo cáo nào."}
            className="rounded-none border-0"
            tableClassName="min-w-[860px]"
          />
        </div>
      )}
      {meta && meta.total > 0 && (
        <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
      )}

      <ReportDetailDialog report={current} onClose={() => setSelected(undefined)} />
    </ManagerPanel>
  );
}
