"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, Lock, X } from "lucide-react";
import { rejectContentSchema, type MarketingContent } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { contentStatusLabels, contentTypeLabels } from "@/features/staff/lib/marketing-labels";
import { validateWith } from "@/lib/api-error";
import * as marketingService from "@/services/marketing.service";
import { usePartnerMutation } from "../api/partner-queries";
import { FormField, StatusBadge, SubmitButton } from "../components";
import { formatDateTime } from "../lib/labels";
import { contentsOf } from "./approval-queries";

const quickReasons = [
  "Có thông tin chưa chính xác (giá, ngày, ưu đãi).",
  "Giọng văn chưa đúng thương hiệu.",
  "Ảnh chưa phù hợp hoặc chất lượng thấp.",
  "Nội dung dài, cần ngắn gọn hơn.",
];

export function ApprovalDetail({
  content,
  hotelId,
  canDecide,
  onDecided,
}: {
  content: MarketingContent;
  hotelId: string;
  canDecide: boolean;
  onDecided: (contentId: string) => void;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string>();
  const status = contentStatusLabels[content.status];
  const pending = content.status === "PENDING_APPROVAL";

  const approve = usePartnerMutation(() => marketingService.approveContent(content.id), {
    invalidate: () => [contentsOf(hotelId)],
    successMessage: "Đã duyệt bài. Nhân viên có thể lên lịch đăng.",
    onSuccess: () => onDecided(content.id),
  });
  const reject = usePartnerMutation((text: string) => marketingService.rejectContent(content.id, { reason: text }), {
    invalidate: () => [contentsOf(hotelId)],
    successMessage: "Đã trả bài về cho nhân viên kèm lý do.",
    onSuccess: () => onDecided(content.id),
  });
  const busy = approve.isPending || reject.isPending;

  function submitReject() {
    const result = validateWith(rejectContentSchema, { reason });
    if (result.errors) {
      setReasonError(result.errors.reason);
      return;
    }
    setReasonError(undefined);
    reject.mutate(result.data.reason);
  }

  return (
    <article className="flex min-h-full flex-col" aria-labelledby="approval-title">
      <header className="space-y-2 border-b p-5">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          <span className="text-xs font-semibold text-muted-foreground">{contentTypeLabels[content.contentType]}</span>
        </div>
        <h2 id="approval-title" className="text-lg font-bold text-primary">
          {content.title ?? "Bài không có tiêu đề"}
        </h2>
        <p className="text-xs text-muted-foreground">
          {content.authorName ? `Soạn bởi ${content.authorName}` : "Bạn soạn"} · {formatDateTime(content.createdAt)}
        </p>
      </header>

      <div className="flex-1 space-y-4 p-5">
        {content.status === "REJECTED" && content.rejectedReason && (
          <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">Lý do từ chối: {content.rejectedReason}</p>
        )}
        {!pending && content.status !== "REJECTED" && (
          <p className="flex items-center gap-2 rounded-xl bg-muted p-3 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" aria-hidden />
            Nội dung đã khoá từ lúc duyệt. Nhân viên lên lịch và đăng bài trong cổng nhân viên.
          </p>
        )}
        {content.mediaUrl && (
          <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-xl bg-muted">
            <Image
              src={content.mediaUrl}
              alt={content.title ?? "Ảnh bài viết"}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-foreground">{content.body}</div>
        <p className="text-xs text-muted-foreground">{content.body.length.toLocaleString("vi-VN")} ký tự</p>
      </div>

      {pending && canDecide && (
        <footer className="sticky bottom-0 border-t bg-card/95 p-4 backdrop-blur">
          {rejecting ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {quickReasons.map((text) => (
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
              <FormField label="Lý do từ chối (nhân viên sẽ thấy)" required error={reasonError}>
                <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setRejecting(false)} disabled={busy}>
                  Huỷ
                </Button>
                <SubmitButton type="button" variant="destructive" pending={reject.isPending} onClick={submitReject}>
                  Từ chối bài
                </SubmitButton>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-xs text-muted-foreground">
                Sau khi duyệt, nội dung được khoá và đăng đúng như bạn đang xem.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy}>
                  <X />
                  Từ chối
                </Button>
                <SubmitButton type="button" pending={approve.isPending} disabled={busy} onClick={() => approve.mutate()}>
                  <Check />
                  Duyệt bài
                </SubmitButton>
              </div>
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
