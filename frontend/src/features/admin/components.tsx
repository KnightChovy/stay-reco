"use client";

import { Fragment, useState, type ReactNode } from "react";
import type { AuditLogEntry, AuditSeverity, PageMeta } from "@stayreco/shared";
import { TableCommon, TablePagination, type CommonTableColumn } from "@/components/common/table";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog, DateInput, ErrorPanel, FormAlert, StatusBadge } from "@/features/partner/components";
import { getApiErrorMessage } from "@/lib/api-error";
import { Panel } from "./admin-primitives";
import { actionLabel, detailKeyLabels, formatDateTime, formatMoney, loginFailureLabels, roleLabels, severityLabels } from "./lib/labels";

type ListQuery<T> = {
  data?: { items: T[]; meta: PageMeta };
  error: unknown;
  isLoading: boolean;
  refetch: () => unknown;
};

/** The body every admin list shares: filters on top, then error or table, then pagination. */
export function ListPanel<T>({
  filters,
  query,
  columns,
  getRowId,
  emptyMessage,
  onPageChange,
}: {
  filters?: ReactNode;
  query: ListQuery<T>;
  columns: CommonTableColumn<T>[];
  getRowId: (row: T) => string;
  emptyMessage: string;
  onPageChange: (page: number) => void;
}) {
  const meta = query.data?.meta;
  return (
    <div className="space-y-5">
      {filters && <Panel className="flex flex-row flex-wrap items-end gap-3 px-5 py-5">{filters}</Panel>}
      <Panel className="gap-0 overflow-hidden p-0">
      <p className="border-b px-5 py-3 text-sm text-muted-foreground" aria-live="polite">
        {meta ? (
          <>
            <strong className="text-foreground">{meta.total}</strong> kết quả
          </>
        ) : query.error ? (
          "Không tải được dữ liệu"
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
            data={query.data?.items ?? []}
            columns={columns}
            getRowId={getRowId}
            isLoading={query.isLoading}
            emptyMessage={emptyMessage}
            className="rounded-none border-0"
            tableClassName="min-w-[760px] tabular-nums [&_td]:py-3.5 [&_th]:h-12 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground"
          />
        </div>
      )}
      {meta && meta.total > 0 && (
        <TablePagination page={meta.page} pageSize={meta.pageSize} total={meta.total} onPageChange={onPageChange} />
      )}
      </Panel>
    </div>
  );
}

/** A labelled filter control; the label is visible so a filter is never identified by its placeholder alone. */
export function Filter({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`grid gap-1.5 text-xs font-semibold text-foreground ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

/** "Từ ngày" and "Đến ngày": the API takes both or neither, so the hint says when only one is filled. */
export function PeriodFilter({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <>
      <Filter label="Từ ngày">
        <DateInput value={from} onChange={(value) => onChange(value, to)} max={to || undefined} clearable aria-label="Từ ngày" />
      </Filter>
      <Filter label="Đến ngày">
        <DateInput value={to} onChange={(value) => onChange(from, value)} min={from || undefined} clearable aria-label="Đến ngày" />
      </Filter>
      {!from !== !to && (
        <p className="basis-full text-xs text-warning">Chọn cả hai ngày để lọc theo khoảng thời gian.</p>
      )}
    </>
  );
}

/**
 * Every admin decision needs a reason (1–500 characters) that is written to the audit log and emailed. The dialog
 * stays open on failure and shows the server's message.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  /** Resolves when the action succeeded; the dialog then closes. */
  onSubmit: (reason: string) => Promise<unknown>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function confirm() {
    if (!reason.trim()) return setError("Vui lòng nhập lý do.");
    setError(undefined);
    setPending(true);
    try {
      await onSubmit(reason.trim());
      setReason("");
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(undefined);
        onOpenChange(next);
      }}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      destructive={destructive}
      pending={pending}
      onConfirm={() => void confirm()}
    >
      <label className="grid gap-1.5 text-sm font-semibold">
        Lý do
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={500}
          rows={3}
          aria-invalid={!!error}
          placeholder="Lý do được ghi vào nhật ký và gửi email cho người liên quan"
        />
      </label>
      <FormAlert message={error} />
    </ConfirmDialog>
  );
}

const MONEY_KEY = /amount|fee|total|price|commission|refund|balance/i;
const ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

function formatDetail(key: string, value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (typeof value === "number") return MONEY_KEY.test(key) ? formatMoney(value) : value.toLocaleString("vi-VN");
  if (typeof value === "string") return key === "reason" ? loginFailureLabels[value] ?? value : ISO_DATE_TIME.test(value) ? formatDateTime(value) : value;
  if (Array.isArray(value)) {
    if (value.length === 0) return "Không có";
    if (value.every((item) => typeof item !== "object" || item === null)) return value.join(", ");
    return (
      <div className="space-y-2">
        {value.map((item, i) => (
          <DetailsView key={i} data={item as Record<string, unknown>} nested />
        ))}
      </div>
    );
  }
  return <DetailsView data={value as Record<string, unknown>} nested />;
}

/**
 * The recorded data of an event (`details`) as labelled rows instead of raw JSON: money, dates and yes/no are
 * formatted, nested objects are indented. Renders nothing for an empty object.
 */
export function DetailsView({ data, nested = false }: { data: Record<string, unknown>; nested?: boolean }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return nested ? <>—</> : null;
  return (
    <dl
      className={
        nested
          ? "grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-l-2 border-border pl-3"
          : "grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-4 gap-y-1.5 rounded-lg bg-muted/60 px-3 py-2.5 text-sm"
      }
    >
      {entries.map(([key, value]) => (
        <Fragment key={key}>
          <dt className="text-muted-foreground">{detailKeyLabels[key] ?? key}</dt>
          <dd className="min-w-0 font-medium text-foreground [overflow-wrap:anywhere]">{formatDetail(key, value)}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

/** An action as people read it, with its code underneath for searching the log. */
export function ActionName({ action }: { action: string }) {
  const label = actionLabel(action);
  return (
    <span className="block">
      <strong className="font-semibold text-foreground">{label}</strong>
      {label !== action && <code className="block whitespace-nowrap text-[11px] text-muted-foreground">{action}</code>}
    </span>
  );
}

const dotClasses = { INFO: "bg-muted-foreground/40", WARNING: "bg-warning", CRITICAL: "bg-danger" } as const;

/** Severity as a pill with a dot, so it is not told apart by colour alone. */
export function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  return (
    <StatusBadge tone={severityLabels[severity].tone} className="gap-1.5">
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dotClasses[severity]}`} />
      {severityLabels[severity].label}
    </StatusBadge>
  );
}

export type TimelineEvent = {
  key: string;
  action: string;
  at: string;
  severity?: AuditSeverity;
  /** Who did it and from where; omitted when the event carries no actor. */
  meta?: ReactNode;
  details: Record<string, unknown> | null;
};

/** A vertical timeline: one dot per event, coloured by severity, with the recorded data under the event. */
export function Timeline({ events, emptyMessage }: { events: TimelineEvent[]; emptyMessage: string }) {
  if (events.length === 0) return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  return (
    <ol className="ml-1.5 border-l border-border text-sm">
      {events.map((event) => (
        <li key={event.key} className="relative pb-4 pl-5 last:pb-0">
          <span
            aria-hidden="true"
            className={`absolute -left-[5px] top-1.5 size-2.5 rounded-full ring-4 ring-card ${dotClasses[event.severity ?? "INFO"]}`}
          />
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <div>
              <ActionName action={event.action} />
              {event.meta && <span className="text-xs text-muted-foreground">{event.meta}</span>}
            </div>
            <div className="flex items-center gap-2">
              {event.severity && event.severity !== "INFO" && (
                <SeverityBadge severity={event.severity} />
              )}
              <time className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(event.at)}</time>
            </div>
          </div>
          {event.details && Object.keys(event.details).length > 0 && (
            <div className="mt-2">
              <DetailsView data={event.details} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Who acted, for a timeline entry or a table cell. */
export function actorText(entry: Pick<AuditLogEntry, "actor" | "ip">) {
  const who = entry.actor ? `${entry.actor.fullName} • ${roleLabels[entry.actor.role]}` : "Không xác định / Hệ thống";
  return entry.ip ? `${who} • IP ${entry.ip}` : who;
}

/** Audit events, newest first: the dashboard's security events and an account's timeline. */
export function AuditEventList({ events, emptyMessage }: { events: AuditLogEntry[]; emptyMessage: string }) {
  return (
    <Timeline
      emptyMessage={emptyMessage}
      events={events.map((event) => ({
        key: event.id,
        action: event.action,
        at: event.at,
        severity: event.severity,
        meta: actorText(event),
        details: event.details,
      }))}
    />
  );
}

/** A filter select whose first option is "Tất cả" (empty value: the filter is not sent). */
export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [value: string, label: string][];
}) {
  return (
    <Filter label={label} className="sm:w-48">
      <NativeSelect value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full">
        <NativeSelectOption value="">Tất cả</NativeSelectOption>
        {options.map(([optionValue, optionLabel]) => (
          <NativeSelectOption key={optionValue} value={optionValue}>
            {optionLabel}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Filter>
  );
}
