"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  TimerReset,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  ManagerNotice,
  ManagerPanel,
  ManagerTitle,
} from "@/features/manager/manager-primitives";
import AppFilter, {
  type FilterDefinition,
  type FilterValues,
} from "@/components/common/filter/AppFilter";
import { TablePagination } from "@/components/common/table/TablePagination";
import {
  managerAdditionalRows,
  managerDashboardChartHeights,
  managerDashboardMetrics,
  managerDashboardQueue,
  managerDashboardRegions,
  managerDashboardSignalColumns,
  managerDashboardSignals,
  managerQueueSummary,
  managerWorkspaceTableHeads,
  managerWorkspaces,
  type ManagerMode,
  type ManagerWorkspace,
} from "@/lib/manager-data";
import { OperationDialog } from "@/components/common/modal/OperationDialog";

type Notify = (message: string) => void;

export function ManagerScreen({ mode }: { mode: ManagerMode }) {
  const [notice, setNotice] = useState("");
  const [action, setAction] = useState("");
  const notify = (message: string) => {
    setAction(message);
  };
  return (
    <>
      {mode === "dashboard" ? (
        <Dashboard notify={notify} />
      ) : (
        <Workspace mode={mode} data={managerWorkspaces[mode]} notify={notify} />
      )}
      <ManagerActionDialog
        action={action}
        onClose={() => setAction("")}
        onComplete={() => {
          setNotice(`${action} đã được ghi nhận.`);
          setAction("");
        }}
      />
      {notice && (
        <ManagerNotice message={notice} onClose={() => setNotice("")} />
      )}
    </>
  );
}

function ManagerActionDialog({
  action,
  onClose,
  onComplete,
}: {
  action: string;
  onClose: () => void;
  onComplete: () => void;
}) {
  return (
    <OperationDialog
      action={action}
      scope="Platform Operations · StayReco"
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}

function Dashboard({ notify }: { notify: Notify }) {
  const [refreshing, setRefreshing] = useState(false);
  const [signalPage, setSignalPage] = useState(1);
  const [signalFilterValues, setSignalFilterValues] = useState<FilterValues>(
    {},
  );
  const signalPageSize = 4;
  const selectedSignalType =
    typeof signalFilterValues.type === "string" ? signalFilterValues.type : "";
  const filteredSignals = managerDashboardSignals.filter(
    (signal) => !selectedSignalType || signal[1] === selectedSignalType,
  );
  const signalFilters: FilterDefinition[] = [
    {
      key: "type",
      label: "loại tín hiệu",
      type: "select",
      allLabel: "Tất cả tín hiệu",
      options: [
        ...new Set(managerDashboardSignals.map((signal) => signal[1])),
      ].map((type) => ({ label: type, value: type })),
    },
  ];
  const visibleSignals = filteredSignals.slice(
    (signalPage - 1) * signalPageSize,
    signalPage * signalPageSize,
  );
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      notify("Làm mới bảng điều hành");
    }, 500);
  };
  return (
    <div className="space-y-6">
      <ManagerTitle
        title="Trung tâm điều hành đối tác StayReco"
        description="Giám sát sức khỏe mạng lưới khách sạn, SLA xác minh, chất lượng dịch vụ và dòng tiền toàn nền tảng Việt Nam."
        action={
          <>
            <Button
              variant="outline"
              onClick={() => notify("Xuất báo cáo điều hành")}
            >
              <Download />
              Xuất báo cáo
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Làm mới dữ liệu"
              onClick={refresh}
            >
              <RefreshCw className={refreshing ? "animate-spin" : ""} />
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-4 rounded-2xl bg-primary p-5 text-primary-foreground lg:flex-row lg:items-center">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-white/12">
            <ShieldCheck size={21} />
          </span>
          <div>
            <strong className="block">Hệ thống đang vận hành ổn định</strong>
            <span className="text-xs text-primary-foreground/70">
              99,97% uptime · Đối soát thanh toán hoạt động bình thường
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs">
            248 đối tác hoạt động
          </span>
          <span className="rounded-full bg-warning/80 px-3 py-1.5 text-xs">
            4 hồ sơ sắp vượt SLA
          </span>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {managerDashboardMetrics.map((metric) => (
          <Metric key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_.85fr]">
        <ManagerPanel className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-primary">
                GMV nền tảng theo khu vực
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Hiệu suất 30 ngày gần nhất · cập nhật theo thời gian thực
              </p>
            </div>
            <Button variant="outline" size="sm">
              Tất cả khu vực
            </Button>
          </div>
          <div className="mt-8 flex h-60 items-end gap-4 border-b border-l px-4">
            {managerDashboardChartHeights.map(
              (height, index) => (
                <div
                  key={index}
                  className="group relative flex-1 rounded-t bg-primary/15"
                  style={{ height: `${height}%` }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t bg-primary"
                    style={{ height: `${Math.max(30, height - 18)}%` }}
                  />
                  <span className="absolute -top-6 hidden whitespace-nowrap text-[10px] font-semibold text-primary group-hover:block">
                    {height * 12},4 tr
                  </span>
                </div>
              ),
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {managerDashboardRegions.map(([region, value, change]) => (
              <div key={region} className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">{region}</p>
                <strong className="mt-1 block text-primary">{value}</strong>
                <span
                  className={`text-[11px] ${change.startsWith("−") ? "text-brand-accent" : "text-success"}`}
                >
                  {change}
                </span>
              </div>
            ))}
          </div>
        </ManagerPanel>
        <ManagerPanel className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-primary">Hàng đợi ưu tiên</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Xử lý theo SLA gần nhất
              </p>
            </div>
            <span className="rounded-full bg-danger-soft px-2 py-1 text-[10px] font-bold text-danger">
              3 khẩn cấp
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {managerDashboardQueue.map(([title, detail, action], index) => (
              <div key={title} className="rounded-xl bg-muted p-4">
                <div className="flex gap-3">
                  <span
                    className={`mt-1 size-2.5 shrink-0 rounded-full ${index === 0 ? "bg-warning" : index === 1 ? "bg-danger" : "bg-primary"}`}
                  />
                  <div>
                    <strong className="text-sm text-primary">{title}</strong>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {detail}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => notify(`${action}: ${title}`)}
                      className="mt-3 text-xs font-semibold text-primary"
                    >
                      {action} <ArrowUpRight size={13} className="inline" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ManagerPanel>
      </section>

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
              setSignalFilterValues(values);
              setSignalPage(1);
            }}
            className="rounded-none border-0 bg-transparent p-0 shadow-none"
          />
        </div>
        <div className="overflow-x-auto">
          <Table className="w-full min-w-[760px] text-left text-sm">
            <TableHeader className="bg-muted text-xs text-muted-foreground">
              <TableRow>
                {managerDashboardSignalColumns.map((item) => (
                  <TableHead key={item} className="px-5 py-3">
                    {item}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleSignals.map((row) => (
                <TableRow key={`${row[0]}-${row[2]}`} className="border-t">
                  <TableCell className="px-5 py-4 font-mono text-xs">
                    {row[0]}
                  </TableCell>
                  <TableCell className="px-5 py-4 font-medium text-primary">
                    {row[1]}
                  </TableCell>
                  <TableCell className="px-5 py-4">{row[2]}</TableCell>
                  <TableCell className="px-5 py-4 text-muted-foreground">
                    {row[3]}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${row[4] === "Cần xử lý" ? "bg-danger-soft text-danger" : row[4] === "Cảnh báo" ? "bg-warning-soft text-warning" : "bg-success-soft text-success"}`}
                    >
                      ● {row[4]}
                    </span>
                  </TableCell>
                  <TableCell className="px-5 py-4">{row[5]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TablePagination
          page={signalPage}
          pageSize={signalPageSize}
          total={filteredSignals.length}
          onPageChange={setSignalPage}
        />
      </ManagerPanel>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
  tone: "primary" | "accent" | "warning" | "danger";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-brand-accent-soft text-brand-accent",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
  };
  return (
    <ManagerPanel className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 text-kpi font-bold tracking-tight text-primary">
            {value}
          </p>
        </div>
        <span
          className={`grid size-10 place-items-center rounded-xl ${colors[tone]}`}
        >
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">{hint}</p>
    </ManagerPanel>
  );
}

function Workspace({
  mode,
  data,
  notify,
}: {
  mode: Exclude<ManagerMode, "dashboard">;
  data: ManagerWorkspace;
  notify: Notify;
}) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const Icon = data.icon;
  const rows = [...data.rows, ...managerAdditionalRows[mode]];
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
      options: [...new Set(rows.map(([, , state]) => state))].map((state) => ({
        label: state,
        value: state,
      })),
    },
  ];
  const visibleRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const tableHead = managerWorkspaceTableHeads[mode];
  return (
    <div className="space-y-6">
      <ManagerTitle
        title={data.title}
        description={data.description}
        action={
          <>
            <Button
              variant="outline"
              onClick={() => notify(`Xuất dữ liệu ${data.title}`)}
            >
              <Download />
              Xuất dữ liệu
            </Button>
            <Button onClick={() => notify(data.action)}>
              <Plus />
              {data.action}
            </Button>
          </>
        }
      />
      <section className="grid gap-4 md:grid-cols-3">
        <ManagerPanel className="p-5">
          <div className="flex justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon size={20} />
            </span>
            <span className="text-xs font-semibold text-success">↑ 8,4%</span>
          </div>
          <strong className="mt-4 block text-2xl text-primary">
            {data.summary}
          </strong>
          <p className="mt-2 text-xs text-muted-foreground">
            So với chu kỳ vận hành trước
          </p>
        </ManagerPanel>
        <ManagerPanel className="p-5">
          <TimerReset className="text-warning" size={20} />
          <strong className="mt-4 block text-2xl text-primary">
            2 giờ 18 phút
          </strong>
          <p className="mt-2 text-xs text-muted-foreground">
            Thời gian xử lý trung bình · trong SLA
          </p>
        </ManagerPanel>
        <ManagerPanel className="p-5">
          <CheckCircle2 className="text-success" size={20} />
          <strong className="mt-4 block text-2xl text-primary">96,8%</strong>
          <p className="mt-2 text-xs text-muted-foreground">
            Tỷ lệ hoàn thành không cần mở lại
          </p>
        </ManagerPanel>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_300px]">
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
            <Table className="w-full min-w-[760px] text-left text-sm">
              <TableHeader className="bg-muted text-xs text-muted-foreground">
                <TableRow>
                  {tableHead.map((item) => (
                    <TableHead key={item} className="px-5 py-3">
                      {item}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleRows.map(([name, detail, state], index) => (
                  <TableRow key={name} className="border-t">
                    <TableCell className="px-5 py-5">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Building2 size={16} />
                        </span>
                        <strong className="text-primary">{name}</strong>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-5 text-muted-foreground">
                      {detail}
                    </TableCell>
                    <TableCell className="px-5 py-5">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${state.includes("Cần") || state === "Cảnh báo" ? "bg-warning-soft text-warning" : state.includes("Chờ") || state === "Kiểm tra" || state === "Theo dõi" ? "bg-brand-accent-soft text-brand-accent" : "bg-success-soft text-success"}`}
                      >
                        ● {state}
                      </span>
                    </TableCell>
                    <TableCell className="px-5 py-5 text-xs">
                      {index === 0 && page === 1 ? "Còn 01:42" : "Trong SLA"}
                    </TableCell>
                    <TableCell className="px-5 py-5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => notify(`Xử lý ${name}`)}
                        className="font-semibold text-primary"
                      >
                        Mở chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={page}
            pageSize={pageSize}
            total={filteredRows.length}
            onPageChange={setPage}
          />
        </ManagerPanel>
        <aside className="space-y-5">
          <ManagerPanel className="p-5">
            <h2 className="font-bold text-primary">Tổng quan hàng đợi</h2>
            <div className="mt-5 space-y-4">
              {managerQueueSummary.map(([label, value, tone]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-xl bg-muted p-3"
                >
                  <span className="text-sm">{label}</span>
                  <strong className={tone}>{value}</strong>
                </div>
              ))}
            </div>
          </ManagerPanel>
          <ManagerPanel className="p-5">
            <AlertTriangle className="text-warning" size={20} />
            <h2 className="mt-3 font-bold text-primary">Quy tắc điều hành</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Mọi thay đổi trạng thái phải có ghi chú, người phụ trách và dấu
              thời gian để đảm bảo truy vết.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => notify("Xem nhật ký kiểm toán")}
            >
              Xem nhật ký
            </Button>
          </ManagerPanel>
        </aside>
      </section>
    </div>
  );
}
