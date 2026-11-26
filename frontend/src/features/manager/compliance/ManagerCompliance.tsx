"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Plus, X } from "lucide-react";
import { VIOLATION_SEVERITIES, type PolicyViolationSummary, type ViolationListQuery } from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useViolations } from "../api/manager-queries";
import { ErrorPanel, ManagerPanel, ManagerTitle, StatusBadge } from "../components";
import {
  formatDateTime,
  formatWaiting,
  suspensionStatusLabels,
  violationSeverityLabels,
  violationStatusLabels,
  violationTypeLabels,
  type ViolationSeverity,
} from "../lib/labels";
import { CreateViolationDialog } from "./CreateViolationDialog";
import { ViolationDetailDialog } from "./ViolationDetailDialog";

const PAGE_SIZE = 10;

type CaseTab = "open" | "closed";

export default function ManagerCompliance() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const partnerId = searchParams.get("partnerId") ?? undefined;
  const partnerName = searchParams.get("partnerName") ?? undefined;
  const [tab, setTab] = useState<CaseTab>("open");
  const [severity, setSeverity] = useState<ViolationSeverity | "">("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string>();
  const [creating, setCreating] = useState(false);

  const params: Partial<ViolationListQuery> = {
    page,
    pageSize: PAGE_SIZE,
    status: tab === "open" ? ["OPEN", "INVESTIGATING"] : ["RESOLVED", "DISMISSED"],
    severity: severity ? [severity] : undefined,
    partnerId,
  };
  const query = useViolations(params);
  const meta = query.data?.meta;

  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  function clearPartner() {
    setPage(1);
    router.replace(pathname, { scroll: false });
  }

  const columns: CommonTableColumn<PolicyViolationSummary>[] = [
    {
      id: "severity",
      header: "Mức độ",
      cell: (row) => (
        <StatusBadge tone={violationSeverityLabels[row.severity].tone}>{violationSeverityLabels[row.severity].label}</StatusBadge>
      ),
    },
    {
      id: "case",
      header: "Vi phạm",
      cell: (row) => (
        <div className="min-w-0">
          <strong className="block text-primary">{violationTypeLabels[row.type]}</strong>
          <span className="line-clamp-1 text-xs text-muted-foreground">{row.description}</span>
        </div>
      ),
    },
    {
      id: "partner",
      header: "Đối tác / khách sạn",
      cell: (row) => (
        <div>
          <span className="block">{row.partner.name}</span>
          <span className="text-xs text-muted-foreground">{row.hotel?.name ?? "Cả đối tác"}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Trạng thái",
      cell: (row) => (
        <div className="flex flex-col items-start gap-1">
          <StatusBadge tone={violationStatusLabels[row.status].tone}>{violationStatusLabels[row.status].label}</StatusBadge>
          {row.suspensionRequest && (
            <StatusBadge tone={suspensionStatusLabels[row.suspensionRequest.status].tone}>
              {suspensionStatusLabels[row.suspensionRequest.status].label}
            </StatusBadge>
          )}
        </div>
      ),
    },
    {
      id: "opened",
      header: tab === "open" ? "Mở lúc" : "Đóng lúc",
      cell: (row) => (
        <div>
          <span className="block">{formatDateTime(tab === "open" ? row.createdAt : row.resolvedAt)}</span>
          <span className="text-xs text-muted-foreground">
            {tab === "open" ? `Đã mở ${formatWaiting(row.createdAt)}` : (row.openedBy?.fullName ?? "")}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (row) => (
        <Button variant={tab === "open" ? "default" : "outline"} size="sm" onClick={() => setOpenId(row.id)}>
          <Eye />
          {tab === "open" ? "Xử lý" : "Xem"}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Tuân thủ & chất lượng"
        description="Hồ sơ vi phạm chính sách của đối tác: bằng chứng, quá trình điều tra và đề nghị tạm ngưng gửi admin. Nghiêm trọng nhất lên đầu, rồi đến hồ sơ cũ nhất."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus />
            Mở hồ sơ vi phạm
          </Button>
        }
      />

      <ManagerPanel className="overflow-hidden p-0">
        <div className="border-b px-5 pt-4">
          <Tabs value={tab} onValueChange={(value) => update(setTab)(value as CaseTab)}>
            <TabsList variant="line">
              <TabsTrigger value="open">Đang xử lý</TabsTrigger>
              <TabsTrigger value="closed">Đã đóng</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
          <span className="text-sm text-muted-foreground" aria-live="polite">
            {meta ? (
              <>
                <strong className="text-foreground">{meta.total}</strong> hồ sơ
              </>
            ) : (
              "Đang tải..."
            )}
          </span>
          {partnerId && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-xs font-semibold">
              Đối tác: {partnerName ?? "đã chọn"}
              <Button variant="ghost" size="icon" className="size-6" aria-label="Bỏ lọc đối tác" onClick={clearPartner}>
                <X />
              </Button>
            </span>
          )}
          <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            Mức độ
            <NativeSelect
              value={severity}
              onChange={(event) => update(setSeverity)(event.target.value as ViolationSeverity | "")}
              className="min-w-40"
            >
              <NativeSelectOption value="">Tất cả</NativeSelectOption>
              {VIOLATION_SEVERITIES.map((value) => (
                <NativeSelectOption key={value} value={value}>
                  {violationSeverityLabels[value].label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        </div>

        {query.error ? (
          <div className="p-5">
            <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <TableCommon
              data={query.data?.violations ?? []}
              columns={columns}
              getRowId={(row) => row.id}
              isLoading={query.isLoading}
              emptyMessage={tab === "open" ? "Không có hồ sơ vi phạm nào đang xử lý." : "Chưa có hồ sơ nào được đóng."}
              className="rounded-none border-0"
              tableClassName="min-w-[900px]"
            />
          </div>
        )}
        {meta && meta.total > 0 && (
          <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={setPage} />
        )}
      </ManagerPanel>

      <ViolationDetailDialog violationId={openId} onOpenChange={(open) => !open && setOpenId(undefined)} />
      <CreateViolationDialog open={creating} onOpenChange={setCreating} onCreated={(violation) => setOpenId(violation.id)} />
    </div>
  );
}
