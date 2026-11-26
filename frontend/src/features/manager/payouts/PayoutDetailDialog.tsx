"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, Landmark, X } from "lucide-react";
import { payoutPaidSchema, payoutRejectSchema, type ManagerPayout } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorCode, validateWith } from "@/lib/api-error";
import * as managerService from "@/services/manager.service";
import { getManagerErrorMessage, managerKeys, useManagerMutation, usePayout } from "../api/manager-queries";
import { ErrorPanel, StatusBadge } from "../components";
import { formatDateTime, formatMoney, formatWaiting, partnerStatusLabels, payoutStatusLabels } from "../lib/labels";

type Mode = "view" | "paid" | "reject";

const rejectTemplates = [
  "Tài khoản thụ hưởng không nhận được tiền (sai số tài khoản hoặc đã đóng).",
  "Đối tác đang có hồ sơ vi phạm cần xử lý trước khi rút tiền.",
  "Số dư cần đối soát lại với các booking hoàn tiền gần đây.",
];

export function PayoutDetailDialog({
  payoutId,
  onOpenChange,
}: {
  payoutId: string | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const query = usePayout(payoutId);
  const payout = query.data;

  return (
    <Dialog open={!!payoutId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Yêu cầu rút tiền{payout ? ` · ${payout.hotel.name}` : ""}</DialogTitle>
          <DialogDescription>
            Mỗi lần mở chi tiết, số tài khoản đầy đủ được ghi vào nhật ký kiểm toán.
          </DialogDescription>
        </DialogHeader>
        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : query.error || !payout ? (
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        ) : (
          <PayoutDetail key={`${payout.id}-${payout.status}`} payout={payout} onDone={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PayoutDetail({ payout, onDone }: { payout: ManagerPayout; onDone: () => void }) {
  const [mode, setMode] = useState<Mode>("view");
  const [bankReference, setBankReference] = useState("");
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [conflict, setConflict] = useState<string>();
  const status = payoutStatusLabels[payout.status];
  const partnerStatus = partnerStatusLabels[payout.partner.status];
  const pending = payout.status === "PENDING";

  const invalidate = () => [managerKeys.payoutQueue(), managerKeys.payout(payout.id)];
  const onError = (error: unknown) => {
    if (getApiErrorCode(error) === "PAYOUT_STATUS_CONFLICT") setConflict(getManagerErrorMessage(error));
  };
  const markPaid = useManagerMutation(
    (reference: string) => managerService.markPayoutPaid(payout.id, { bankReference: reference }),
    {
      invalidate,
      successMessage: (data) => `Đã ghi nhận chuyển ${formatMoney(data.amount)} cho ${data.hotel.name}.`,
      onSuccess: onDone,
    },
  );
  const reject = useManagerMutation((text: string) => managerService.rejectPayout(payout.id, { reason: text }), {
    invalidate,
    successMessage: (data) => `Đã từ chối yêu cầu rút tiền của ${data.hotel.name}. Số tiền đã về số dư khả dụng.`,
    onSuccess: onDone,
  });
  const busy = markPaid.isPending || reject.isPending;

  function submitPaid() {
    const result = validateWith(payoutPaidSchema, { bankReference });
    if (result.errors) {
      setFieldError("Nhập mã giao dịch ngân hàng (1–50 ký tự).");
      return;
    }
    setFieldError(undefined);
    markPaid.mutate(result.data.bankReference, { onError });
  }

  function submitReject() {
    const result = validateWith(payoutRejectSchema, { reason });
    if (result.errors) {
      setFieldError("Nhập lý do gửi cho đối tác (1–500 ký tự).");
      return;
    }
    setFieldError(undefined);
    reject.mutate(result.data.reason, { onError });
  }

  function changeMode(next: Mode) {
    setMode(next);
    setFieldError(undefined);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-muted p-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Số tiền rút</p>
          <p className="text-2xl font-bold tabular-nums text-primary">{formatMoney(payout.amount)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          {payout.overdue && <StatusBadge tone="danger">Quá hạn xử lý</StatusBadge>}
        </div>
      </div>

      {conflict && (
        <p role="alert" className="rounded-xl bg-warning-soft p-3 text-sm text-warning">
          {conflict}
        </p>
      )}

      <section className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <Row label="Khách sạn">{payout.hotel.name}</Row>
        <Row label="Đối tác">
          <span className="flex flex-wrap items-center justify-end gap-2">
            {payout.partner.name}
            <StatusBadge tone={partnerStatus.tone}>{partnerStatus.label}</StatusBadge>
          </span>
        </Row>
        <Row label="Yêu cầu lúc">{formatDateTime(payout.requestedAt)}</Row>
        <Row label="Hạn xử lý">
          {formatDateTime(payout.dueBy)}
          {pending && <span className="block text-xs text-muted-foreground">Đã chờ {formatWaiting(payout.requestedAt)}</span>}
        </Row>
        {payout.decidedAt && <Row label="Xử lý lúc">{formatDateTime(payout.decidedAt)}</Row>}
        {payout.decidedBy && <Row label="Người xử lý">{payout.decidedBy.fullName}</Row>}
        {payout.bankReference && <Row label="Mã giao dịch">{payout.bankReference}</Row>}
        {payout.reason && <Row label="Lý do từ chối">{payout.reason}</Row>}
      </section>

      <section className="space-y-2 rounded-xl border p-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-primary">
          <Landmark className="size-4" aria-hidden />
          Tài khoản nhận tiền
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Ngân hàng</dt>
            <dd className="font-semibold">{payout.beneficiary.bankName}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Số tài khoản</dt>
            <dd className="flex items-center gap-1 font-mono font-semibold">
              {payout.beneficiary.accountNumber}
              <CopyButton value={payout.beneficiary.accountNumber} label="Sao chép số tài khoản" />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Chủ tài khoản</dt>
            <dd className="flex items-center gap-1 font-semibold">
              {payout.beneficiary.accountHolder}
              <CopyButton value={payout.beneficiary.accountHolder} label="Sao chép tên chủ tài khoản" />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Số tiền</dt>
            <dd className="flex items-center gap-1 font-semibold tabular-nums">
              {formatMoney(payout.amount)}
              <CopyButton value={String(payout.amount)} label="Sao chép số tiền" />
            </dd>
          </div>
        </dl>
      </section>

      {pending && !conflict && (
        <div className="sticky bottom-0 -mx-1 space-y-3 border-t bg-popover px-1 pt-4">
          {mode === "paid" ? (
            <>
              <p className="text-xs text-muted-foreground">
                Chuyển khoản trong ứng dụng ngân hàng trước, rồi nhập mã giao dịch của lần chuyển đó.
              </p>
              <label className="grid gap-1.5 text-xs font-semibold">
                <span>
                  Mã giao dịch ngân hàng <span className="text-danger">*</span>
                </span>
                <Input
                  value={bankReference}
                  onChange={(event) => setBankReference(event.target.value)}
                  maxLength={50}
                  aria-required
                  aria-invalid={!!fieldError}
                  placeholder="FT26330123456789"
                />
              </label>
              {fieldError && <p role="alert" className="text-xs text-danger">{fieldError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => changeMode("view")} disabled={busy}>
                  Huỷ
                </Button>
                <Button onClick={submitPaid} disabled={busy}>
                  {markPaid.isPending && <Spinner />}
                  Xác nhận đã chuyển
                </Button>
              </div>
            </>
          ) : mode === "reject" ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {rejectTemplates.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setReason(text)}
                    className="rounded-full border px-2.5 py-1 text-xs hover:bg-muted"
                  >
                    {text}
                  </button>
                ))}
              </div>
              <label className="grid gap-1.5 text-xs font-semibold">
                <span>
                  Lý do từ chối (gửi cho đối tác) <span className="text-danger">*</span>
                </span>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={500}
                  rows={3}
                  aria-required
                  aria-invalid={!!fieldError}
                />
              </label>
              {fieldError && <p role="alert" className="text-xs text-danger">{fieldError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => changeMode("view")} disabled={busy}>
                  Huỷ
                </Button>
                <Button variant="destructive" onClick={submitReject} disabled={busy}>
                  {reject.isPending && <Spinner />}
                  Xác nhận từ chối
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => changeMode("reject")}>
                <X />
                Từ chối
              </Button>
              <Button onClick={() => changeMode("paid")}>
                <Check />
                Đã chuyển tiền
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="ghost" size="icon" className="size-8" aria-label={label} onClick={() => void copy()}>
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}
