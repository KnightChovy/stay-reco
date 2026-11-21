"use client";

import { useState } from "react";
import { Flag, Loader2 } from "lucide-react";
import { ReportReason, reportReviewSchema } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { getApiErrorCode, getApiErrorMessage, validateWith } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useReportReview } from "@/features/account/api/rewards-queries";

const REASONS: Array<{ value: ReportReason; label: string; hint: string }> = [
  { value: ReportReason.OFFENSIVE, label: "Xúc phạm, thô tục", hint: "Ngôn từ lăng mạ, phản cảm" },
  { value: ReportReason.NOT_A_STAY, label: "Không phải khách đã ở", hint: "Người viết có vẻ chưa từng lưu trú" },
  { value: ReportReason.PERSONAL_DATA, label: "Lộ thông tin cá nhân", hint: "Khuôn mặt, tên, số điện thoại, giấy tờ" },
  { value: ReportReason.SPAM_OR_ADVERT, label: "Spam hoặc quảng cáo", hint: "Nội dung rác, chèn liên kết, quảng cáo" },
  { value: ReportReason.WRONG_HOTEL, label: "Sai khách sạn", hint: "Đánh giá về một nơi khác" },
  { value: ReportReason.AI_GENERATED, label: "Ảnh hoặc nội dung do AI tạo", hint: "Trông như được tạo ra, không phải ảnh chụp thật" },
  { value: ReportReason.OTHER, label: "Lý do khác", hint: "Mô tả ở ô ghi chú" },
];

export type ReportTarget = { reviewId: string; reviewImageId?: string; authorName: string };

/**
 * The flag under a review (R11): any signed-in account may ask a StayReco manager to look at a review or one photo.
 * Reporting changes nothing by itself, and the dialog says so.
 */
export function ReviewReportDialog({ target, onClose }: { target: ReportTarget | null; onClose: () => void }) {
  return (
    <Dialog open={!!target} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
        {target && <ReportForm key={`${target.reviewId}-${target.reviewImageId ?? ""}`} target={target} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ReportForm({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const report = useReportReview();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const isPhoto = !!target.reviewImageId;

  const submit = () => {
    setError(null);
    if (!reason) {
      setError("Chọn một lý do báo cáo.");
      return;
    }
    if (reason === ReportReason.OTHER && !note.trim()) {
      setError("Mô tả ngắn lý do ở ô ghi chú.");
      return;
    }
    const result = validateWith(reportReviewSchema, {
      reason,
      note: note.trim() || undefined,
      reviewImageId: target.reviewImageId,
    });
    if (result.errors) {
      setError(Object.values(result.errors)[0] ?? "Thông tin chưa hợp lệ.");
      return;
    }
    report.mutate(
      { reviewId: target.reviewId, input: result.data },
      {
        onSuccess: () => setDone(true),
        onError: (err) => {
          if (getApiErrorCode(err) === "REPORT_ALREADY_RAISED") {
            setDone(true);
            return;
          }
          setError(getApiErrorMessage(err, "Không gửi được báo cáo. Vui lòng thử lại."));
        },
      },
    );
  };

  if (done) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Đã nhận báo cáo</DialogTitle>
          <DialogDescription>
            Quản lý StayReco sẽ xem xét {isPhoto ? "ảnh" : "đánh giá"} này. Nội dung vẫn hiển thị cho tới khi có quyết định;
            bạn không cần báo cáo lại.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="h-10">
            Đóng
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Flag className="size-4 text-red-600" aria-hidden /> Báo cáo {isPhoto ? "ảnh" : "đánh giá"}
        </DialogTitle>
        <DialogDescription>
          {isPhoto ? "Ảnh" : "Đánh giá"} của {target.authorName}. Quản lý StayReco xem xét trước khi ẩn; báo cáo không tự
          gỡ nội dung.
        </DialogDescription>
      </DialogHeader>

      <fieldset className="space-y-1.5">
        <legend className="mb-1 text-sm font-semibold text-foreground">Lý do</legend>
        {REASONS.map((item) => (
          <label
            key={item.value}
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
              reason === item.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
            )}
          >
            <input
              type="radio"
              name="report-reason"
              value={item.value}
              checked={reason === item.value}
              onChange={() => setReason(item.value)}
              aria-label={item.label}
              aria-describedby={`report-hint-${item.value}`}
              className="mt-1 size-4 accent-[var(--primary)]"
            />
            <span>
              <span className="block font-semibold text-foreground">{item.label}</span>
              <span id={`report-hint-${item.value}`} className="block text-xs text-muted-foreground">
                {item.hint}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="space-y-1">
        <label htmlFor="report-note" className="text-sm font-semibold text-foreground">
          Ghi chú <span className="font-normal text-muted-foreground">{reason === ReportReason.OTHER ? "(bắt buộc)" : "(không bắt buộc)"}</span>
        </label>
        <Textarea
          id="report-note"
          value={note}
          maxLength={1000}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Điều gì khiến bạn thấy nội dung này vi phạm?"
          className="text-base sm:text-sm"
        />
        <p className="text-right text-xs text-muted-foreground">{note.length}/1000</p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      <DialogFooter className="gap-2">
        <Button variant="ghost" onClick={onClose} disabled={report.isPending} className="h-10">
          Huỷ
        </Button>
        <Button variant="destructive" onClick={submit} disabled={report.isPending} className="h-10 gap-1.5">
          {report.isPending && <Loader2 className="size-4 animate-spin" />}
          Gửi báo cáo
        </Button>
      </DialogFooter>
    </>
  );
}
