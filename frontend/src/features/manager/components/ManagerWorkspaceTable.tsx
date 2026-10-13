"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import TableCommon, {
  type CommonTableColumn,
} from "@/components/common/table/TableCommon";
import AppFilter, {
  type FilterDefinition,
  type FilterValues,
} from "@/components/common/filter/AppFilter";
import { TablePagination } from "@/components/common/table/TablePagination";
import { ManagerPanel } from "./ManagerPanel";
import type { ManagerWorkspaceRow } from "@/lib/manager-data";

export type ManagerWorkspaceTableProps = {
  rows: ManagerWorkspaceRow[];
  tableHead: string[];
  onAction: (name: string) => void;
};

function getStateClasses(state: string): string {
  if (state.includes("Cần") || state === "Cảnh báo")
    return "bg-warning-soft text-warning";
  if (
    state.includes("Chờ") ||
    state === "Kiểm tra" ||
    state === "Theo dõi"
  )
    return "bg-brand-accent-soft text-brand-accent";
  return "bg-success-soft text-success";
}

export function ManagerWorkspaceTable({
  rows,
  tableHead,
  onAction,
}: ManagerWorkspaceTableProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const pageSize = 4;

  const selectedState =
    typeof filterValues.state === "string" ? filterValues.state : "";
  const normalizedQuery = searchQuery.toLocaleLowerCase();

  const filteredRows = rows.filter(([name, detail, state]) => {
    const matchesQuery = `${name} ${detail}`
      .toLocaleLowerCase()
      .includes(normalizedQuery);
    return matchesQuery && (!selectedState || state === selectedState);
  });

  const workspaceFilters: FilterDefinition[] = [
    {
      key: "state",
      label: "trạng thái",
      type: "select",
      allLabel: "Tất cả trạng thái",
      options: [...new Set(rows.map(([, , state]) => state))].map(
        (state) => ({
          label: state,
          value: state,
        }),
      ),
    },
  ];

  const visibleRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const tableColumns: CommonTableColumn<ManagerWorkspaceRow>[] = [
    {
      id: "name",
      header: tableHead[0],
      cell: (row) => (
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
            <Building2 size={16} />
          </span>
          <strong className="text-primary">{row[0]}</strong>
        </div>
      ),
      className: "px-5 py-5",
      headerClassName: "px-5 py-3",
    },
    {
      id: "detail",
      header: tableHead[1],
      cell: (row) => (
        <span className="text-muted-foreground">{row[1]}</span>
      ),
      className: "px-5 py-5",
      headerClassName: "px-5 py-3",
    },
    {
      id: "state",
      header: tableHead[2],
      cell: (row) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStateClasses(row[2])}`}
        >
          ● {row[2]}
        </span>
      ),
      className: "px-5 py-5",
      headerClassName: "px-5 py-3",
    },
    {
      id: "sla",
      header: tableHead[3],
      cell: (_row, rowIndex) => (
        <span className="text-xs">
          {rowIndex === 0 && page === 1 ? "Còn 01:42" : "Trong SLA"}
        </span>
      ),
      className: "px-5 py-5",
      headerClassName: "px-5 py-3",
    },
    {
      id: "action",
      header: tableHead[4],
      cell: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onAction(row[0])}
          className="font-semibold text-primary"
        >
          Mở chi tiết
        </Button>
      ),
      className: "px-5 py-5",
      headerClassName: "px-5 py-3",
    },
  ];

  return (
    <ManagerPanel className="overflow-hidden">
      <AppFilter
        filters={workspaceFilters}
        searchPlaceholder="Tìm đối tác, mã hồ sơ hoặc giao dịch..."
        onSearchChange={(value) => {
          setSearchQuery(value);
          setPage(1);
        }}
        onFiltersChange={(values) => {
          setFilterValues(values);
          setPage(1);
        }}
        className="rounded-none border-0 border-b p-5 shadow-none"
      />
      <div className="overflow-x-auto">
        <TableCommon
          data={visibleRows}
          columns={tableColumns}
          getRowId={(row) => row[0]}
          emptyMessage="Không tìm thấy bản ghi nào."
          className="rounded-none border-0 shadow-none"
          tableClassName="w-full min-w-[760px] text-left text-sm"
        />
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={filteredRows.length}
        onPageChange={setPage}
      />
    </ManagerPanel>
  );
}
