"use client";

import { useState, type ReactNode } from "react";
import { Check, ExternalLink, FilePenLine, RotateCcw, X } from "lucide-react";
import { verificationDecisionSchema, type VerificationRequest } from "@stayreco/shared";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { validateWith } from "@/lib/api-error";
import * as managerService from "@/services/manager.service";
import {
  getManagerErrorMessage,
  managerKeys,
  useManagerMutation,
  useVerificationRequest,
} from "../api/manager-queries";
import { ErrorPanel, StatusBadge, useManagerActions } from "../components";
import {
  documentTypeLabels,
  formatDateTime,
  formatWaiting,
  legalFieldLabels,
  propertyFieldLabels,
  verificationStatusLabels,
  verificationTypeLabels,
} from "../lib/labels";

/** Same limit as `reasonSchema` in @stayreco/shared. */
const REASON_MAX = 2000;

type ReasonAction = "reject" | "request-changes" | "reverification";

const reasonActions: Record<ReasonAction, { title: string; label: string; confirm: string; hint: string }> = {
  reject: {
    title: "Từ chối hồ sơ",
    label: "Lý do từ chối (gửi cho đối tác)",
    confirm: "Xác nhận từ chối",
    hint: "Hồ sơ xác minh lần đầu bị từ chối thì khách sạn quay về bản nháp.",
  },
  "request-changes": {
    title: "Yêu cầu bổ sung",
    label: "Nội dung cần bổ sung (gửi cho đối tác)",
    confirm: "Gửi yêu cầu bổ sung",
    hint: "Đối tác chỉnh sửa và gửi một hồ sơ mới.",
  },
  reverification: {
    title: "Yêu cầu tái xác minh",
    label: "Lý do tái xác minh (gửi cho đối tác)",
    confirm: "Gửi yêu cầu tái xác minh",
    hint: "Ví dụ giấy phép hết hạn. Khách sạn vẫn hoạt động trong lúc đối tác chuẩn bị hồ sơ.",
  },
};

export function VerificationDetailDialog({
  requestId,
  onOpenChange,
}: {
  requestId: string | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  const requestQuery = useVerificationRequest(requestId);
  const request = requestQuery.data;

  return (
    <Dialog open={!!requestId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{request?.hotelName ?? "Hồ sơ xác minh"}</DialogTitle>
          <DialogDescription>
            {request
              ? `${verificationTypeLabels[request.requestType]} · gửi ${formatDateTime(request.submittedAt)}`
              : "Đang tải..."}
          </DialogDescription>
        </DialogHeader>
        {requestQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : requestQuery.error || !request ? (
          <ErrorPanel error={requestQuery.error} onRetry={() => void requestQuery.refetch()} />
        ) : (
          <VerificationDetail key={request.id} request={request} onDecided={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="wrap-break-word text-right font-medium">{children}</span>
    </div>
  );
}

/** Known keys first, in the wizard's order; anything else the backend sends is still shown. */
function FieldRows({ values, labels }: { values: Record<string, string>; labels: Record<string, string> }) {
  const keys = [
    ...Object.keys(labels).filter((key) => values[key]),
    ...Object.keys(values).filter((key) => !(key in labels) && values[key]),
  ];
  if (keys.length === 0) return <p className="py-1.5 text-sm text-muted-foreground">Không có thông tin.</p>;
  return keys.map((key) => (
    <Row key={key} label={labels[key] ?? key}>
      {values[key]}
    </Row>
  ));
}

function VerificationDetail({ request, onDecided }: { request: VerificationRequest; onDecided: () => void }) {
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [reasonAction, setReasonAction] = useState<ReasonAction>();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const status = verificationStatusLabels[request.status];
  const isPending = request.status === "PENDING";

  const invalidate = () => [managerKeys.verificationQueue(), managerKeys.verification(request.id)];
  const approve = useManagerMutation(() => managerService.approveVerification(request.id), {
    invalidate,
    successMessage: (result) => `Đã duyệt hồ sơ ${result.hotelName}. Đối tác nhận kết quả qua email.`,
    onSuccess: onDecided,
  });
  const decide = useManagerMutation(
    ({ action, text }: { action: ReasonAction; text: string }) =>
      action === "reject"
        ? managerService.rejectVerification(request.id, text)
        : action === "request-changes"
          ? managerService.requestVerificationChanges(request.id, text)
          : managerService.requestReverification(request.hotelId, text),
    {
      invalidate,
      successMessage: (result, { action }) =>
        action === "reject"
          ? `Đã từ chối hồ sơ ${result.hotelName}. Đối tác nhận lý do qua email.`
          : action === "request-changes"
            ? `Đã yêu cầu ${result.hotelName} bổ sung hồ sơ.`
            : `Đã yêu cầu ${result.hotelName} tái xác minh.`,
      onSuccess: onDecided,
    },
  );
  const busy = approve.isPending || decide.isPending;

  function openReason(action: ReasonAction) {
    setReasonAction(action);
    setReason("");
    setReasonError(undefined);
  }

  function submitReason() {
    if (!reasonAction) return;
    const result = validateWith(verificationDecisionSchema, { reason });
    if (result.errors) {
      setReasonError(result.errors.reason);
      return;
    }
    setReasonError(undefined);
    decide.mutate({ action: reasonAction, text: result.data.reason });
  }

  const reasonForm = reasonAction && reasonActions[reasonAction];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        {isPending ? (
          <span className="text-xs text-muted-foreground">Đã chờ {formatWaiting(request.submittedAt)}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Xử lý lúc {formatDateTime(request.reviewedAt)}</span>
        )}
      </div>

      {request.reason && (
        <div className="rounded-xl bg-muted p-3 text-sm">
          <p className="font-semibold">Lý do đã gửi đối tác</p>
          <p className="mt-1 whitespace-pre-line">{request.reason}</p>
        </div>
      )}

      {(isPending || request.status === "APPROVED") && (
        <div className="space-y-3 rounded-xl border p-4">
          {isPending ? (
            <>
              <p className="text-sm text-muted-foreground">
                {request.requestType === "INITIAL"
                  ? "Duyệt hồ sơ lần đầu sẽ kích hoạt khách sạn và cho phép mở bán."
                  : "Hồ sơ cập nhật hoặc tái xác minh không làm thay đổi trạng thái khách sạn, dù kết quả thế nào."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setConfirmApprove(true)} disabled={busy}>
                  <Check />
                  Duyệt hồ sơ
                </Button>
                <Button variant="outline" onClick={() => openReason("request-changes")} disabled={busy}>
                  <FilePenLine />
                  Yêu cầu bổ sung
                </Button>
                <Button variant="outline" onClick={() => openReason("reject")} disabled={busy}>
                  <X />
                  Từ chối
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-muted-foreground">
                Khách sạn đang hoạt động cần thẩm định lại (ví dụ giấy phép hết hạn)?
              </p>
              <Button variant="outline" onClick={() => openReason("reverification")} disabled={busy}>
                <RotateCcw />
                Yêu cầu tái xác minh
              </Button>
            </div>
          )}

          {reasonForm && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-3">
              <p className="text-sm font-semibold text-primary">{reasonForm.title}</p>
              <label className="grid gap-1.5 text-xs font-semibold text-foreground">
                <span>
                  {reasonForm.label}
                  <span className="text-danger"> *</span>
                </span>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={REASON_MAX}
                  rows={4}
                  aria-invalid={!!reasonError}
                />
              </label>
              {reasonError ? (
                <p role="alert" className="text-xs text-danger">
                  {reasonError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{reasonForm.hint}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setReasonAction(undefined)} disabled={decide.isPending}>
                  Huỷ
                </Button>
                <Button
                  variant={reasonAction === "reject" ? "destructive" : "default"}
                  onClick={submitReason}
                  disabled={decide.isPending}
                >
                  {decide.isPending && <Spinner />}
                  {reasonForm.confirm}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-bold text-primary">Pháp nhân</h3>
          <div className="divide-y">
            <FieldRows values={request.legal} labels={legalFieldLabels} />
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <h3 className="mb-1 text-sm font-bold text-primary">Tài khoản thụ hưởng</h3>
            {request.beneficiary ? (
              <div className="divide-y">
                <Row label="Ngân hàng">{request.beneficiary.bankName}</Row>
                <Row label="Số tài khoản">{request.beneficiary.accountNumber}</Row>
                <Row label="Chủ tài khoản">{request.beneficiary.accountHolder}</Row>
              </div>
            ) : (
              <p className="py-1.5 text-sm text-muted-foreground">Không có thông tin.</p>
            )}
          </div>
          <div>
            <h3 className="mb-1 text-sm font-bold text-primary">Tài liệu</h3>
            {request.documents.length === 0 ? (
              <p className="py-1.5 text-sm text-muted-foreground">Không có tài liệu.</p>
            ) : (
              <ul className="space-y-1.5">
                {request.documents.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3 text-sm">
                    <DocumentLink documentId={document.id} label={documentTypeLabels[document.documentType]} />
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDateTime(document.uploadedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-bold text-primary">Cơ sở lưu trú</h3>
        <div className="divide-y">
          <FieldRows values={request.property} labels={propertyFieldLabels} />
        </div>
      </section>

      <AlertDialog open={confirmApprove} onOpenChange={setConfirmApprove}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyệt hồ sơ {request.hotelName}?</AlertDialogTitle>
            <AlertDialogDescription>
              {request.requestType === "INITIAL"
                ? "Khách sạn chuyển sang Đang hoạt động và hiển thị với khách. Đối tác nhận kết quả qua email."
                : "Hồ sơ được ghi nhận là đã duyệt; trạng thái khách sạn không đổi. Đối tác nhận kết quả qua email."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approve.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction disabled={approve.isPending} onClick={() => approve.mutate(undefined, { onSettled: () => setConfirmApprove(false) })}
            >
              {approve.isPending && <Spinner />}
              Duyệt hồ sơ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Private file: ask for a fresh 5-minute signed link on every click. */
function DocumentLink({ documentId, label }: { documentId: string; label: string }) {
  const { showNotice } = useManagerActions();
  const [opening, setOpening] = useState(false);

  async function open() {
    // Open the tab inside the click handler, before awaiting, so the popup is not blocked.
    const tab = window.open("", "_blank");
    setOpening(true);
    try {
      const link = await managerService.getVerificationDocumentLink(documentId);
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
    <button
      type="button"
      onClick={() => void open()}
      disabled={opening}
      className="inline-flex items-center gap-1.5 text-left font-semibold text-primary hover:underline disabled:opacity-60"
    >
      {opening ? <Spinner className="size-3" /> : <ExternalLink size={14} />}
      {label}
    </button>
  );
}
