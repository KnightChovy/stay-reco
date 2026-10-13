"use client";

import { useState } from "react";
import TableCommon, {
  type CommonTableColumn,
} from "@/components/common/table/TableCommon";
import AppFilter, {
  type FilterDefinition,
  type FilterValues,
} from "@/components/common/filter/AppFilter";
import { TablePagination } from "@/components/common/table/TablePagination";
import { ManagerPanel } from "./ManagerPanel";
import type { ManagerDashboardSignal } from "@/lib/manager-data";

export type ManagerSignalTableProps = {
  signals: ManagerDashboardSignal[];
  columns: string[];
  pageSize?: number;
};

function getSeverityClasses(severity: string): string {
  if (severity === "Cần xử lý") return "bg-danger-soft text-danger";
  if (severity === "Cảnh báo") return "bg-warning-soft text-warning";
  return "bg-success-soft text-success";
}

export function ManagerSignalTable({
  signals,
  columns,
  pageSize = 4,
}: ManagerSignalTableProps) {
  const [page, setPage] = useState(1);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const selectedType =
    typeof filterValues.type === "string" ? filterValues.type : "";

  const filteredSignals = signals.filter(
    (signal) => !selectedType || signal[1] === selectedType,
  );

  const signalFilters: FilterDefinition[] = [
    {
      key: "type",
      label: "loại tín hiệu",
      type: "select",
      allLabel: "Tất cả tín hiệu",
      options: [...new Set(signals.map((signal) => signal[1]))].map(
        (type) => ({ label: type, value: type }),
      ),
    },
  ];

  const visibleSignals = filteredSignals.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const tableColumns: CommonTableColumn<ManagerDashboardSignal>[] = [
    {
      id: "time",
      header: columns[0],
      cell: (row) => (
        <span className="font-mono text-xs">{row[0]}</span>
      ),
      className: "px-5 py-4",
      headerClassName: "px-5 py-3",
    },
    {
      id: "type",
      header: columns[1],
      cell: (row) => (
        <span className="font-medium text-primary">{row[1]}</span>
      ),
      className: "px-5 py-4",
      headerClassName: "px-5 py-3",
    },
    {
      id: "subject",
      header: columns[2],
      cell: (row) => row[2],
      className: "px-5 py-4",
      headerClassName: "px-5 py-3",
    },
    {
      id: "description",
      header: columns[3],
      cell: (row) => (
        <span className="text-muted-foreground">{row[3]}</span>
      ),
      className: "px-5 py-4",
      headerClassName: "px-5 py-3",
    },
    {
      id: "severity",
      header: columns[4],
      cell: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-semibold ${getSeverityClasses(row[4])}`}
        >
          ● {row[4]}
        </span>
      ),
      className: "px-5 py-4",
      headerClassName: "px-5 py-3",
    },
    {
      id: "owner",
      header: columns[5],
      cell: (row) => row[5],
      className: "px-5 py-4",
      headerClassName: "px-5 py-3",
    },
  ];

  return (
    <ManagerPanel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
        <div>
          <h2 className="font-bold text-primary">
            Tín hiệu vận hành trực tiếp
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Các sự kiện có ảnh hưởng tới đối tác và khách lưu trú
          </p>
        </div>
        <AppFilter
          showSearch={false}
          filters={signalFilters}
          onFiltersChange={(values) => {
            setFilterValues(values);
            setPage(1);
          }}
          className="rounded-none border-0 bg-transparent p-0 shadow-none"
        />
      </div>
      <div className="overflow-x-auto">
        <TableCommon
          data={visibleSignals}
          columns={tableColumns}
          getRowId={(row) => `${row[0]}-${row[2]}`}
          emptyMessage="Không có tín hiệu nào."
          className="rounded-none border-0 shadow-none"
          tableClassName="w-full min-w-[760px] text-left text-sm"
        />
      </div>
      <TablePagination
        page={page}
        pageSize={pageSize}
        total={filteredSignals.length}
        onPageChange={setPage}
      />
    </ManagerPanel>
  );
}
