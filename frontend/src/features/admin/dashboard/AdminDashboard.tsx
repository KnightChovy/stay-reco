"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ChevronRight,
  Clock,
  Lock,
  MailPlus,
  RotateCcw,
  ShieldAlert,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { AdminOverview } from "@stayreco/shared";
import { TableCommon, type CommonTableColumn } from "@/components/common/table";
import { ErrorPanel, LoadingPanel } from "@/features/partner/components";
import { Initials, PageTitle, Panel, StatCard } from "../admin-primitives";
import { useAdminOverview, useAuditLogs } from "../api/admin-queries";
import { AuditEventList, SeverityBadge } from "../components";
import { actionLabel, auditDescription, formatDateTime, roleLabels } from "../lib/labels";

type AccountRow = AdminOverview["accounts"][number];

const accountColumns: CommonTableColumn<AccountRow>[] = [
  { id: "role", header: "Vai trò", cell: (row) => <strong className="text-primary">{roleLabels[row.role]}</strong> },
  { id: "total", header: "Tổng", align: "right", cell: (row) => row.total.toLocaleString("vi-VN") },
  { id: "active", header: "Hoạt động", align: "right", cell: (row) => row.active.toLocaleString("vi-VN") },
  { id: "suspended", header: "Bị khóa", align: "right", cell: (row) => row.suspended.toLocaleString("vi-VN") },
  { id: "invited", header: "Đã mời", align: "right", cell: (row) => row.invited.toLocaleString("vi-VN") },
  {
    id: "new",
    header: "Mới trong kỳ",
    align: "right",
    cell: (row) => (
      <>
        {(row.new.value ?? 0).toLocaleString("vi-VN")}
        {row.new.deltaPercent != null && (
          <span className={`ml-2 text-xs ${row.new.deltaPercent < 0 ? "text-danger" : "text-success"}`}>
            {row.new.deltaPercent > 0 ? "+" : ""}
            {row.new.deltaPercent.toLocaleString("vi-VN")}%
          </span>
        )}
      </>
    ),
  },
];

const sum = (rows: AccountRow[], pick: (row: AccountRow) => number) => rows.reduce((total, row) => total + pick(row), 0);

function PanelHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
      <h2 className="text-base font-bold text-primary">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function QueueItem({ icon: Icon, label, hint, count, href, alert }: { icon: LucideIcon; label: string; hint: string; count: number; href: string; alert?: boolean }) {
  const waiting = count > 0;
  return (
    <li>
      <Link href={href} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${waiting && alert ? "bg-danger-soft text-danger" : waiting ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>
          <Icon size={18} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block font-semibold text-foreground">{label}</strong>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold tabular-nums ${waiting && alert ? "bg-danger-soft text-danger" : waiting ? "bg-warning-soft text-warning" : "bg-muted text-muted-foreground"}`}>
          {count.toLocaleString("vi-VN")}
        </span>
        <ChevronRight size={16} className="text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

/** The latest audit-log entries, whatever their severity (`GET /admin/audit-logs`, last 7 days). */
function RecentLogs() {
  const logs = useAuditLogs({ page: 1, pageSize: 6 });
  return (
    <Panel className="gap-0 p-0">
      <PanelHeader title="Nhật ký quản trị gần đây" href="/admin/logs" linkLabel="Xem tất cả" />
      {logs.error ? (
        <div className="p-5">
          <ErrorPanel error={logs.error} onRetry={() => void logs.refetch()} />
        </div>
      ) : !logs.data ? (
        <LoadingPanel />
      ) : logs.data.items.length === 0 ? (
        <p className="p-5 text-sm text-muted-foreground">Chưa có sự kiện nào trong 7 ngày gần nhất.</p>
      ) : (
        <ul className="divide-y">
          {logs.data.items.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 px-5 py-3">
              <Initials name={entry.actor?.fullName ?? "Hệ thống"} />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-foreground">
                  <strong className="font-semibold">{entry.actor?.fullName ?? "Hệ thống"}</strong>{" "}
                  <span className="text-muted-foreground">• {actionLabel(entry.action)}</span>
                </p>
                <time className="text-xs text-muted-foreground">{formatDateTime(entry.at)}</time>
                {auditDescription(entry) && <p className="mt-1 text-xs leading-5 text-muted-foreground">{auditDescription(entry)}</p>}
              </div>
              {entry.severity !== "INFO" && <SeverityBadge severity={entry.severity} />}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/** UC77: accounts per role, what waits for the admin, and the latest log entries (`GET /admin/stats`). */
export default function AdminDashboard() {
  const overview = useAdminOverview();
  const data = overview.data;

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Bảng điều khiển • StayReco Admin"
        title="Tổng quan vận hành hệ thống StayReco"
        description={
          data
            ? `Số liệu ${data.period.days} ngày gần nhất, cập nhật lúc ${formatDateTime(data.generatedAt)}.`
            : "Số liệu vận hành toàn nền tảng."
        }
      />
      {overview.error ? (
        <ErrorPanel error={overview.error} onRetry={() => void overview.refetch()} />
      ) : !data ? (
        <LoadingPanel />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Tổng tài khoản"
              value={sum(data.accounts, (row) => row.total)}
              hint={`${sum(data.accounts, (row) => row.active).toLocaleString("vi-VN")} đang hoạt động`}
              icon={Users}
              href="/admin/users"
            />
            <StatCard
              label="Tài khoản mới"
              value={sum(data.accounts, (row) => row.new.value ?? 0)}
              hint={`Trong ${data.period.days} ngày gần nhất`}
              icon={UserPlus}
              tone="success"
            />
            <StatCard
              label="Tài khoản bị khóa"
              value={sum(data.accounts, (row) => row.suspended)}
              hint="Không đăng nhập được"
              icon={Lock}
              tone="danger"
            />
            <StatCard
              label="Lời mời chưa nhận"
              value={sum(data.accounts, (row) => row.invited)}
              hint="Tài khoản đã mời, chưa kích hoạt"
              icon={MailPlus}
              tone="warning"
            />
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Panel className="gap-0 p-0">
              <PanelHeader title="Hàng đợi cần xử lý" />
              <ul className="divide-y">
                <QueueItem
                  icon={ShieldAlert}
                  label="Yêu cầu tạm ngưng đối tác"
                  hint={
                    data.suspensionRequests.oldestRequestedAt
                      ? `Cũ nhất gửi lúc ${formatDateTime(data.suspensionRequests.oldestRequestedAt)}`
                      : "Chờ quản trị viên quyết định"
                  }
                  count={data.suspensionRequests.pending}
                  href="/admin/users?tab=suspensions"
                  alert
                />
                <QueueItem
                  icon={ArrowLeftRight}
                  label="Chuyển khoản chưa khớp"
                  hint="Không tìm thấy đơn đặt phòng tương ứng"
                  count={data.payments.unmatchedTransfers}
                  href="/admin/transactions?tab=unmatched"
                  alert
                />
                <QueueItem
                  icon={Clock}
                  label="Chuyển khoản đến muộn"
                  hint="Tiền về sau khi đơn đã hết hạn giữ phòng"
                  count={data.payments.lateTransfers}
                  href="/admin/transactions?tab=unmatched"
                />
                <QueueItem
                  icon={RotateCcw}
                  label="Hóa đơn chờ hoàn tiền"
                  hint="Đang chờ hoàn về ví khách"
                  count={data.payments.refundsPending}
                  href="/admin/transactions?status=REFUND_PENDING"
                />
              </ul>
            </Panel>
            <RecentLogs />
          </div>

          <Panel className="gap-0 p-0">
            <PanelHeader title="Tài khoản theo vai trò" href="/admin/users" linkLabel="Quản lý tài khoản" />
            <div className="overflow-x-auto">
              <TableCommon
                data={data.accounts}
                columns={accountColumns}
                getRowId={(row) => row.role}
                emptyMessage="Chưa có tài khoản nào."
                className="rounded-none border-0"
                tableClassName="min-w-[640px] tabular-nums [&_td]:py-3.5 [&_th]:h-12 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground"
              />
            </div>
          </Panel>

          <Panel className="gap-0 p-0">
            <PanelHeader title="Sự kiện bảo mật gần đây" href="/admin/logs" linkLabel="Xem nhật ký" />
            <div className="p-5">
              <AuditEventList events={data.securityEvents} emptyMessage="Không có cảnh báo bảo mật nào trong kỳ." />
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
