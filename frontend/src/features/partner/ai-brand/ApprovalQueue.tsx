"use client";

import { useState } from "react";
import Image from "next/image";
import { Check, X } from "lucide-react";
import { rejectContentSchema, type MarketingContent } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { marketingKeys, useContents } from "@/features/staff/api/marketing-queries";
import { contentTypeLabels } from "@/features/staff/lib/marketing-labels";
import { validateWith } from "@/lib/api-error";
import * as marketingService from "@/services/marketing.service";
import { usePartnerMutation } from "../api/partner-queries";
import { ErrorPanel, FormField, PartnerPanel, SubmitButton, usePartnerHotel } from "../components";
import { formatDateTime } from "../lib/labels";

export function ApprovalQueue({ hotelId }: { hotelId: string }) {
  const { canEdit } = usePartnerHotel();
  const query = useContents(hotelId, { status: ["PENDING_APPROVAL"], pageSize: 50 });
  const [rejecting, setRejecting] = useState<MarketingContent>();
  const contents = query.data?.contents ?? [];

  const approve = usePartnerMutation((content: MarketingContent) => marketingService.approveContent(content.id), {
    invalidate: () => [[...marketingKeys.all, "contents", hotelId]],
    successMessage: (data) => `Đã duyệt "${data.title ?? "bài viết"}". Nhân viên có thể lên lịch đăng.`,
  });

  return (
    <PartnerPanel className="p-5">
      <h2 className="font-bold text-primary">Bài chờ duyệt</h2>
      <p className="text-xs text-muted-foreground">
        Nhân viên viết, bạn duyệt. Nội dung được khoá khi duyệt nên bài đăng lên đúng như bạn đã đọc.
      </p>
      {query.isLoading ? (
        <Skeleton className="mt-4 h-32 w-full" />
      ) : query.error ? (
        <div className="mt-4">
          <ErrorPanel error={query.error} onRetry={() => void query.refetch()} />
        </div>
      ) : contents.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">Không có bài nào chờ duyệt.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {contents.map((content) => (
            <li key={content.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row">
              {content.mediaUrl && (
                <Image
                  src={content.mediaUrl}
                  alt={content.title ?? "Ảnh bài viết"}
                  width={160}
                  height={120}
                  className="h-28 w-full shrink-0 rounded-lg object-cover sm:w-40"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs text-muted-foreground">
                  {contentTypeLabels[content.contentType]} · {content.authorName ?? "Bạn"} ·{" "}
                  {formatDateTime(content.createdAt)}
                </p>
                {content.title && <p className="font-semibold text-foreground">{content.title}</p>}
                <p className="line-clamp-6 whitespace-pre-line text-sm text-foreground">{content.body}</p>
              </div>
              {canEdit && (
                <div className="flex shrink-0 gap-2 sm:flex-col">
                  <Button onClick={() => approve.mutate(content)} disabled={approve.isPending}>
                    <Check />
                    Duyệt
                  </Button>
                  <Button variant="outline" onClick={() => setRejecting(content)} disabled={approve.isPending}>
                    <X />
                    Từ chối
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <RejectDialog hotelId={hotelId} content={rejecting} onClose={() => setRejecting(undefined)} />
    </PartnerPanel>
  );
}

function RejectDialog({
  hotelId,
  content,
  onClose,
}: {
  hotelId: string;
  content: MarketingContent | undefined;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  const reject = usePartnerMutation(
    ({ id, text }: { id: string; text: string }) => marketingService.rejectContent(id, { reason: text }),
    {
      invalidate: () => [[...marketingKeys.all, "contents", hotelId]],
      successMessage: "Đã trả bài về cho nhân viên kèm lý do.",
      onSuccess: () => {
        setReason("");
        onClose();
      },
    },
  );

  function submit() {
    if (!content) return;
    const result = validateWith(rejectContentSchema, { reason });
    if (result.errors) {
      setError(result.errors.reason);
      return;
    }
    setError(undefined);
    reject.mutate({ id: content.id, text: result.data.reason });
  }

  return (
    <Dialog open={!!content} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Từ chối bài viết</DialogTitle>
          <DialogDescription>Nhân viên thấy lý do này và sửa lại trước khi gửi duyệt lần nữa.</DialogDescription>
        </DialogHeader>
        <FormField label="Lý do" required error={error}>
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} />
        </FormField>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={reject.isPending}>
            Huỷ
          </Button>
          <SubmitButton type="button" variant="destructive" pending={reject.isPending} onClick={submit}>
            Từ chối bài
          </SubmitButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
