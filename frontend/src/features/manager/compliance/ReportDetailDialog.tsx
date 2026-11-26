"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { EyeOff, Hand, ShieldCheck, Star, X } from "lucide-react";
import type { ContentReport, DecideReportInput } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import * as managerService from "@/services/manager.service";
import { managerKeys, useManagerMutation, useReportedReview } from "../api/manager-queries";
import { StatusBadge } from "../components";
import {
  formatDateTime,
  reporterRoleLabels,
  reportReasonLabels,
  violationStatusLabels,
} from "../lib/labels";

const ratingFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });

export function ReportDetailDialog({ report, onClose }: { report: ContentReport | undefined; onClose: () => void }) {
  return (
    <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{report?.imageUrl ? "Báo cáo ảnh đánh giá" : "Báo cáo đánh giá"}</DialogTitle>
          <DialogDescription>
            {report ? `${report.hotelName} · gửi ${formatDateTime(report.createdAt)}` : ""}
          </DialogDescription>
        </DialogHeader>
        {report && <ReportDetail key={`${report.id}-${report.status}`} report={report} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ReportDetail({ report, onDone }: { report: ContentReport; onDone: () => void }) {
  const [resolution, setResolution] = useState("");
  const review = useReportedReview(report.hotelId, report.reviewId);
  const status = violationStatusLabels[report.status];
  const open = report.status === "OPEN" || report.status === "INVESTIGATING";
  const isPhoto = !!report.imageUrl;

  const invalidate = () => [managerKeys.reportList(), managerKeys.reportedReview(report.reviewId), [...managerKeys.all, "overview"]];
  const decide = useManagerMutation(
    (input: DecideReportInput) => managerService.decideContentReport(report.id, input),
    {
      invalidate,
      successMessage: (_data, input) =>
        input.status === "INVESTIGATING"
          ? "Đã nhận xử lý báo cáo."
          : input.hide
            ? isPhoto
              ? "Đã ẩn ảnh bị báo cáo."
              : "Đã ẩn đánh giá bị báo cáo."
            : "Đã bác bỏ báo cáo, nội dung giữ nguyên.",
      onSuccess: (_data, input) => {
        if (input.status !== "INVESTIGATING") onDone();
      },
    },
  );
  const visibility = useManagerMutation(
    (isVisible: boolean) => managerService.setReviewVisibility(report.reviewId, isVisible),
    {
      invalidate,
      successMessage: (data) => (data.isVisible ? "Đánh giá đã hiện lại." : "Đã ẩn đánh giá."),
    },
  );
  const busy = decide.isPending || visibility.isPending;
  const note = resolution.trim() || undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
        <StatusBadge tone="danger">{reportReasonLabels[report.reason]}</StatusBadge>
      </div>

      <section className="space-y-1 rounded-xl bg-muted p-3 text-sm">
        <p>
          <span className="text-muted-foreground">Người báo cáo: </span>
          <strong>{report.reporterName}</strong> ({reporterRoleLabels[report.reporterRole] ?? report.reporterRole})
        </p>
        {report.note && <p className="whitespace-pre-line">“{report.note}”</p>}
      </section>

      {isPhoto && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-primary">Ảnh bị báo cáo</h3>
          <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-xl bg-muted">
            <Image src={report.imageUrl!} alt="Ảnh đánh giá bị báo cáo" fill sizes="448px" className="object-contain" />
          </div>
          {!report.reviewImageId && (
            <p className="text-xs text-muted-foreground">Tác giả đã gỡ ảnh này; ảnh được giữ làm bằng chứng của báo cáo.</p>
          )}
        </section>
      )}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-primary">{isPhoto ? "Đánh giá chứa ảnh" : "Đánh giá bị báo cáo"}</h3>
          <Link href={`/hotels/${report.hotelId}#reviews`} target="_blank" className="text-xs font-semibold text-primary hover:underline">
            Mở trang khách sạn
          </Link>
        </div>
        {review.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : review.data ? (
          <article className="space-y-2 rounded-xl border p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <strong>{review.data.authorName}</strong>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                {ratingFormat.format(review.data.overallRating)}
              </span>
              <span className="text-xs text-muted-foreground">Lưu trú {review.data.stayedAt}</span>
            </div>
            {review.data.title && <p className="font-semibold">{review.data.title}</p>}
            <p className="whitespace-pre-line text-foreground">{review.data.content}</p>
          </article>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Không thấy đánh giá trong danh sách công khai: đánh giá đang bị ẩn hoặc nằm ngoài 300 đánh giá mới nhất.
          </p>
        )}
        {!isPhoto && review.isFetched && (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => visibility.mutate(!review.data)}
          >
            {visibility.isPending ? <Spinner /> : review.data ? <EyeOff /> : <ShieldCheck />}
            {review.data ? "Ẩn đánh giá" : "Hiện lại đánh giá"}
          </Button>
        )}
      </section>

      {report.resolution && (
        <p className="rounded-xl bg-muted p-3 text-sm">
          Kết luận: {report.resolution}
          {report.resolvedAt && <span className="block text-xs text-muted-foreground">{formatDateTime(report.resolvedAt)}</span>}
        </p>
      )}

      {open && (
        <div className="sticky bottom-0 -mx-1 space-y-3 border-t bg-popover px-1 pt-4">
          <label className="grid gap-1.5 text-xs font-semibold">
            <span>Kết luận (không bắt buộc)</span>
            <Textarea
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Vì sao ẩn hoặc giữ nguyên nội dung…"
            />
          </label>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {report.status === "OPEN" && (
              <Button variant="ghost" disabled={busy} onClick={() => decide.mutate({ status: "INVESTIGATING" })}>
                <Hand />
                Nhận xử lý
              </Button>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => decide.mutate({ status: "DISMISSED", resolution: note })}
            >
              <X />
              Bác bỏ, giữ nội dung
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => decide.mutate({ status: "RESOLVED", hide: true, resolution: note })}
            >
              {decide.isPending ? <Spinner /> : <EyeOff />}
              {isPhoto ? "Ẩn ảnh" : "Ẩn đánh giá"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
