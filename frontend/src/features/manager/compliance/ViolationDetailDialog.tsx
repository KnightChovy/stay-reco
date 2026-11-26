"use client";

import { useState, type ReactNode } from "react";
import { ExternalLink, FilePen, UserX } from "lucide-react";
import {
  suspensionRequestSchema,
  updateViolationSchema,
  VIOLATION_SEVERITIES,
  type PolicyViolation,
} from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorCode, validateWith } from "@/lib/api-error";
import * as managerService from "@/services/manager.service";
import {
  getManagerErrorMessage,
  managerKeys,
  useManagerMutation,
  useViolation,
} from "../api/manager-queries";
import { ErrorPanel, StatusBadge, useManagerActions } from "../components";
import {
  formatDateTime,
  partnerStatusLabels,
  suspensionStatusLabels,
  violationSeverityLabels,
  violationStatusLabels,
  violationTypeLabels,
  type ViolationSeverity,
  type ViolationStatus,
} from "../lib/labels";

const nextStatuses: Record<ViolationStatus, ViolationStatus[]> = {
  OPEN: ["INVESTIGATING", "RESOLVED", "DISMISSED"],
  INVESTIGATING: ["RESOLVED", "DISMISSED"],
  RESOLVED: [],
  DISMISSED: [],
};

const timelineLabels: Record<string, string> = {
  VIOLATION_OPENED: "Mở hồ sơ",
  VIOLATION_UPDATED: "Cập nhật hồ sơ",
  SUSPENSION_REQUESTED: "Gửi đề nghị tạm ngưng",
  SUSPENSION_APPROVED: "Admin tạm ngưng đối tác",
  SUSPENSION_REJECTED: "Admin từ chối tạm ngưng",
};

type Panel = "none" | "update" | "suspend";

export function ViolationDetailDialog({
  violationId,
  onOpenChange,
}: {
  violationId: string | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const query = useViolation(violationId);
  const violation = query.data;

  return (
    <Dialog open={!!violationId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{violation ? violationTypeLabels[violation.type] : "Hồ sơ vi phạm"}</DialogTitle>
          <DialogDescription>
            {violation
              ? `${violation.hotel ? `${violation.hotel.name} · ` : ""}${violation.partner.name} · mở ${formatDateTime(violation.createdAt)}`
              : "Đang tải..."}
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : query.error || !violation ? (
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <ViolationDetail key={`${violation.id}-${violation.timeline.length}`} violation={violation} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ViolationDetail({ violation }: { violation: PolicyViolation }) {
  const [panel, setPanel] = useState<Panel>("none");
  const severity = violationSeverityLabels[violation.severity];
  const status = violationStatusLabels[violation.status];
  const partnerStatus = partnerStatusLabels[violation.partner.status];
  const closed = nextStatuses[violation.status].length === 0;
  const suspension = violation.suspensionRequest;
  const canSuspend = !closed && violation.partner.status !== "SUSPENDED" && suspension?.status !== "PENDING";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={severity.tone}>Mức độ: {severity.label}</StatusBadge>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        {violation.partner.status !== "APPROVED" && (
          <StatusBadge tone={partnerStatus.tone}>Đối tác: {partnerStatus.label}</StatusBadge>
        )}
      </div>

      <section className="grid gap-x-6 sm:grid-cols-2">
        <Row label="Đối tác">{violation.partner.name}</Row>
        <Row label="Khách sạn">{violation.hotel?.name ?? "Cả đối tác"}</Row>
        <Row label="Người mở">{violation.openedBy?.fullName ?? "—"}</Row>
        <Row label="Đóng lúc">{formatDateTime(violation.resolvedAt)}</Row>
      </section>

      <section className="space-y-1">
        <h3 className="text-sm font-bold text-primary">Mô tả</h3>
        <p className="whitespace-pre-line rounded-xl bg-muted p-3 text-sm">{violation.description}</p>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-primary">Bằng chứng</h3>
        {violation.evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground">Không có tệp bằng chứng.</p>
        ) : (
          <ul className="divide-y rounded-xl border text-sm">
            {violation.evidence.map((file) => (
              <li key={file.index} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="truncate">{file.fileName}</span>
                <EvidenceButton violationId={violation.id} index={file.index} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {suspension && (
        <section className="space-y-2 rounded-xl border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-primary">Đề nghị tạm ngưng</h3>
            <StatusBadge tone={suspensionStatusLabels[suspension.status].tone}>
              {suspensionStatusLabels[suspension.status].label}
            </StatusBadge>
          </div>
          <p className="text-sm">{suspension.reason}</p>
          <p className="text-xs text-muted-foreground">
            {suspension.requestedBy?.fullName ?? "—"} gửi lúc {formatDateTime(suspension.requestedAt)}
            {suspension.decidedAt &&
              ` · ${suspension.decidedBy?.fullName ?? "Admin"} quyết định lúc ${formatDateTime(suspension.decidedAt)}`}
          </p>
          {suspension.decisionReason && <p className="text-sm text-muted-foreground">Lý do: {suspension.decisionReason}</p>}
        </section>
      )}

      <section className="space-y-2">
        <h3 className="text-sm font-bold text-primary">Lịch sử xử lý</h3>
        <ol className="space-y-3 border-l-2 pl-4">
          {violation.timeline.map((entry, index) => (
            <li key={`${entry.action}-${entry.at}-${index}`} className="text-sm">
              <p>
                <strong>{timelineLabels[entry.action] ?? entry.action}</strong>
                <span className="ml-2 text-xs text-muted-foreground">
                  {formatDateTime(entry.at)}
                  {entry.by && ` · ${entry.by.fullName}`}
                </span>
              </p>
              {(entry.status || entry.severity) && (
                <p className="text-xs text-muted-foreground">
                  {entry.status && `Trạng thái → ${violationStatusLabels[entry.status].label}`}
                  {entry.status && entry.severity && " · "}
                  {entry.severity && `Mức độ → ${violationSeverityLabels[entry.severity].label}`}
                </p>
              )}
              {entry.note && <p className="mt-0.5 whitespace-pre-line text-foreground">{entry.note}</p>}
            </li>
          ))}
        </ol>
      </section>

      {!closed && (
        <div className="sticky bottom-0 -mx-1 space-y-3 border-t bg-popover px-1 pt-4">
          {panel === "update" ? (
            <UpdatePanel violation={violation} onClose={() => setPanel("none")} />
          ) : panel === "suspend" ? (
            <SuspendPanel violation={violation} onClose={() => setPanel("none")} />
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
              {canSuspend && (
                <Button variant="outline" className="text-danger" onClick={() => setPanel("suspend")}>
                  <UserX />
                  Đề nghị tạm ngưng đối tác
                </Button>
              )}
              <Button onClick={() => setPanel("update")}>
                <FilePen />
                Cập nhật hồ sơ
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function UpdatePanel({ violation, onClose }: { violation: PolicyViolation; onClose: () => void }) {
  const [status, setStatus] = useState<ViolationStatus>(violation.status);
  const [severity, setSeverity] = useState<ViolationSeverity>(violation.severity);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();
  const options = [violation.status, ...nextStatuses[violation.status]];

  const mutation = useManagerMutation(
    (input: Parameters<typeof managerService.updateViolation>[1]) => managerService.updateViolation(violation.id, input),
    {
      invalidate: () => [managerKeys.violationList(), managerKeys.violation(violation.id), [...managerKeys.all, "overview"]],
      successMessage: "Đã cập nhật hồ sơ.",
      onSuccess: onClose,
    },
  );

  function submit() {
    const result = validateWith(updateViolationSchema, {
      status: status !== violation.status ? status : undefined,
      severity: severity !== violation.severity ? severity : undefined,
      note,
    });
    if (result.errors) {
      setError("Nhập ghi chú cho lần cập nhật này.");
      return;
    }
    setError(undefined);
    mutation.mutate(result.data);
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-semibold">
          <span>Trạng thái</span>
          <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as ViolationStatus)} className="w-full">
            {options.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {violationStatusLabels[value].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 text-xs font-semibold">
          <span>Mức độ</span>
          <NativeSelect
            value={severity}
            onChange={(event) => setSeverity(event.target.value as ViolationSeverity)}
            className="w-full"
          >
            {VIOLATION_SEVERITIES.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {violationSeverityLabels[value].label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
      </div>
      {(status === "RESOLVED" || status === "DISMISSED") && (
        <p className="text-xs text-warning">Hồ sơ đã đóng thì không thay đổi được nữa.</p>
      )}
      <label className="grid gap-1.5 text-xs font-semibold">
        <span>
          Ghi chú <span className="text-danger">*</span>
        </span>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          maxLength={2000}
          aria-required
          aria-invalid={!!error}
          placeholder="Đã làm gì, kết luận ra sao…"
        />
      </label>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
          Huỷ
        </Button>
        <Button onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Lưu cập nhật
        </Button>
      </div>
    </>
  );
}

function SuspendPanel({ violation, onClose }: { violation: PolicyViolation; onClose: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const mutation = useManagerMutation((text: string) => managerService.requestSuspension(violation.id, { reason: text }), {
    invalidate: () => [managerKeys.violationList(), managerKeys.violation(violation.id), [...managerKeys.all, "overview"]],
    successMessage: `Đã gửi đề nghị tạm ngưng ${violation.partner.name} cho admin.`,
    errorNotice: false,
    onSuccess: onClose,
  });

  function submit() {
    const result = validateWith(suspensionRequestSchema, { reason });
    if (result.errors) {
      setError("Nhập lý do gửi admin.");
      return;
    }
    setError(undefined);
    mutation.mutate(result.data.reason, {
      onError: (failure) =>
        setError(
          getApiErrorCode(failure) === "PARTNER_SUSPENDED"
            ? "Đối tác đã bị tạm ngưng rồi."
            : getManagerErrorMessage(failure),
        ),
    });
  }

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Manager không tự tạm ngưng được đối tác: đề nghị này được gửi cho admin quyết định. Mỗi đối tác chỉ có một đề nghị
        đang chờ.
      </p>
      <label className="grid gap-1.5 text-xs font-semibold">
        <span>
          Lý do đề nghị <span className="text-danger">*</span>
        </span>
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          maxLength={2000}
          aria-required
          aria-invalid={!!error}
        />
      </label>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
          Huỷ
        </Button>
        <Button variant="destructive" onClick={submit} disabled={mutation.isPending}>
          {mutation.isPending && <Spinner />}
          Gửi đề nghị
        </Button>
      </div>
    </>
  );
}

function EvidenceButton({ violationId, index }: { violationId: string; index: number }) {
  const { showNotice } = useManagerActions();
  const [opening, setOpening] = useState(false);

  async function open() {
    const tab = window.open("", "_blank");
    setOpening(true);
    try {
      const link = await managerService.getViolationEvidenceLink(violationId, index);
      if (tab) tab.location.href = link.url;
      else window.location.assign(link.url);
    } catch (error) {
      tab?.close();
      showNotice(getManagerErrorMessage(error), "error");
    } finally {
      setOpening(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={() => void open()} disabled={opening}>
      {opening ? <Spinner /> : <ExternalLink />}
      Mở
    </Button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{children}</span>
    </div>
  );
}
