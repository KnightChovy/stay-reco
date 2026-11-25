"use client";

import { useState } from "react";
import { Eye, ScrollText, ShieldAlert, TriangleAlert } from "lucide-react";
import { AUDIT_SEVERITIES, type AuditLogEntry, type AuditSeverity, type Role } from "@stayreco/shared";
import type { CommonTableColumn } from "@/components/common/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { Initials, PageTitle, StatCard, Tile } from "../admin-primitives";
import { useAuditLogs } from "../api/admin-queries";
import { ActionName, DetailsView, Filter, ListPanel, PeriodFilter, SelectFilter, SeverityBadge } from "../components";
import { actionLabel, auditDescription, formatDateTime, oneOf, periodParams, roleLabels, severityLabels } from "../lib/labels";

/** One log entry in full: the table keeps the columns people scan, the dialog has room for the recorded data. */
function LogDetailDialog({ entry, onOpenChange }: { entry: AuditLogEntry | undefined; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{entry ? actionLabel(entry.action) : "Chi tiết sự kiện"}</DialogTitle>
          <DialogDescription>
            {entry ? `${entry.action} • ${formatDateTime(entry.at)}` : "Chi tiết một sự kiện trong nhật ký."}
          </DialogDescription>
        </DialogHeader>
        {entry && (
          <div className="space-y-4 text-sm">
            <SeverityBadge severity={entry.severity} />
            {auditDescription(entry) && (
              <p className="rounded-xl border-l-4 border-warning bg-warning-soft p-4 leading-6">{auditDescription(entry)}</p>
            )}
            <dl className="grid gap-3 sm:grid-cols-2">
              <Tile label="Người thực hiện">
                {entry.actor ? `${entry.actor.fullName} (${roleLabels[entry.actor.role]})` : entry.action === "LOGIN_FAILED" ? "Chưa xác định" : "Hệ thống"}
              </Tile>
              <Tile label="Địa chỉ IP">{entry.ip ?? "—"}</Tile>
              <Tile label="Đối tượng">{entry.entity?.type ?? "—"}</Tile>
              <Tile label="Mã đối tượng">
                <span className="font-mono text-xs">{entry.entity?.id ?? "—"}</span>
              </Tile>
            </dl>
            <section className="space-y-2">
              <h3 className="font-bold text-primary">Dữ liệu ghi nhận</h3>
              {entry.details && Object.keys(entry.details).length > 0 ? (
                <DetailsView data={entry.details} />
              ) : (
                <p className="text-muted-foreground">Sự kiện này không ghi thêm dữ liệu.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** UC80: the audit log, read-only, newest first (`GET /admin/audit-logs`). */
export default function AdminLogs() {
  const [severity, setSeverity] = useState("");
  const [role, setRole] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const debouncedAction = useDebounce(action.trim());
  const logs = useAuditLogs({
    ...periodParams(from, to),
    severity: oneOf<AuditSeverity>(severity),
    role: oneOf<Role>(role),
    action: oneOf(debouncedAction),
    page,
    pageSize: 20,
  });

  // The figures follow the chosen period only, not the other filters, so they stay comparable while filtering.
  const period = periodParams(from, to);
  const total = useAuditLogs({ ...period, page: 1, pageSize: 1 }).data?.meta.total;
  const warnings = useAuditLogs({ ...period, severity: ["WARNING"], page: 1, pageSize: 1 }).data?.meta.total;
  const criticals = useAuditLogs({ ...period, severity: ["CRITICAL"], page: 1, pageSize: 1 }).data?.meta.total;
  const periodHint = from && to ? "Trong khoảng thời gian đã chọn" : "Trong 7 ngày gần nhất";

  const [open, setOpen] = useState<AuditLogEntry>();

  const columns: CommonTableColumn<AuditLogEntry>[] = [
    { id: "at", header: "Thời điểm", className: "whitespace-nowrap", cell: (entry) => formatDateTime(entry.at) },
    {
      id: "severity",
      header: "Mức độ",
      cell: (entry) => <SeverityBadge severity={entry.severity} />,
    },
    { id: "action", header: "Hành động & mô tả", className: "min-w-64 max-w-sm whitespace-normal", cell: (entry) => (
      <div>
        <ActionName action={entry.action} />
        {auditDescription(entry) && <p className="mt-1 text-xs leading-5 text-muted-foreground">{auditDescription(entry)}</p>}
      </div>
    ) },
    {
      id: "actor",
      header: "Người thực hiện",
      cell: (entry) => (
        <div className="flex items-center gap-2.5">
          <Initials name={entry.actor?.fullName ?? (entry.action === "LOGIN_FAILED" ? "Chưa xác định" : "Hệ thống")} />
          <div>
            <strong className="font-semibold text-foreground">{entry.actor?.fullName ?? (entry.action === "LOGIN_FAILED" ? "Chưa xác định" : "Hệ thống")}</strong>
            <span className="block text-xs text-muted-foreground">{entry.actor ? roleLabels[entry.actor.role] : entry.action === "LOGIN_FAILED" ? "Chưa xác thực" : "Tự động"}</span>
          </div>
        </div>
      ),
    },
    {
      id: "entity",
      header: "Đối tượng",
      cell: (entry) =>
        entry.entity ? <code className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-foreground">{entry.entity.type}</code> : "—",
    },
    { id: "ip", header: "IP", className: "font-mono text-xs", cell: (entry) => entry.ip ?? "—" },
    {
      id: "actions",
      header: <span className="sr-only">Thao tác</span>,
      align: "right",
      cell: (entry) => (
        <Button variant="outline" size="sm" onClick={() => setOpen(entry)}>
          <Eye />
          Chi tiết
        </Button>
      ),
    },
  ];

  const update = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Audit trail • An toàn hệ thống"
        title="Nhật ký hoạt động & Sự kiện bảo mật"
        description="Nhật ký thao tác và sự kiện bảo mật, chỉ đọc. Không chọn khoảng thời gian thì hiển thị 7 ngày gần nhất; tối đa 92 ngày."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng sự kiện" value={total} hint={periodHint} icon={ScrollText} />
        <StatCard label="Cảnh báo" value={warnings} hint={periodHint} icon={TriangleAlert} tone="warning" />
        <StatCard label="Nghiêm trọng" value={criticals} hint={periodHint} icon={ShieldAlert} tone="danger" />
      </div>
      <ListPanel
        filters={
          <>
            <SelectFilter
              label="Mức độ"
              value={severity}
              onChange={update(setSeverity)}
              options={AUDIT_SEVERITIES.map((value) => [value, severityLabels[value].label])}
            />
            <SelectFilter label="Vai trò người thực hiện" value={role} onChange={update(setRole)} options={Object.entries(roleLabels)} />
            <Filter label="Mã hành động" className="sm:w-56">
              <Input
                value={action}
                onChange={(event) => update(setAction)(event.target.value.toUpperCase())}
                placeholder="VD: LOGIN_FAILED"
                className="h-10"
                maxLength={100}
              />
            </Filter>
            <PeriodFilter
              from={from}
              to={to}
              onChange={(nextFrom, nextTo) => {
                setFrom(nextFrom);
                setTo(nextTo);
                setPage(1);
              }}
            />
          </>
        }
        query={logs}
        columns={columns}
        getRowId={(entry) => entry.id}
        emptyMessage="Không có sự kiện nào trong khoảng thời gian và bộ lọc này."
        onPageChange={setPage}
      />
      <LogDetailDialog entry={open} onOpenChange={(next) => !next && setOpen(undefined)} />
    </div>
  );
}
