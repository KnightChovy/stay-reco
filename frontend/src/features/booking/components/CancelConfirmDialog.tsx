"use client";

import { AlertTriangle, BadgeCheck, CircleDollarSign, Loader2, type LucideIcon } from "lucide-react";
import type { Booking, CancellationQuote } from "@stayreco/shared";
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
import { cn } from "@/lib/utils";
import { formatDateTime, formatMoney } from "@/features/stays/lib/format";

type CancelCase = "FREE" | "PARTIAL" | "NO_REFUND";

/** The three outcomes the quote can describe; the backend has already fixed the fee and the refund. */
export function cancelCaseOf(quote: CancellationQuote): CancelCase {
  if (quote.refund <= 0) return "NO_REFUND";
  return quote.fee > 0 ? "PARTIAL" : "FREE";
}

const CASES: Record<CancelCase, { title: string; icon: LucideIcon; tone: string }> = {
  FREE: { title: "Bạn được hoàn toàn bộ tiền", icon: BadgeCheck, tone: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  PARTIAL: { title: "Bạn sẽ mất phí huỷ", icon: CircleDollarSign, tone: "border-amber-200 bg-amber-50 text-amber-900" },
  NO_REFUND: { title: "Bạn sẽ không được hoàn tiền", icon: AlertTriangle, tone: "border-red-200 bg-red-50 text-red-900" },
};

/**
 * The last step before cancelling (feedback B1): say plainly which case the customer is in (free, with a fee, or no
 * refund at all), what happens to the rooms, and when the money arrives, then ask once more.
 */
export function CancelConfirmDialog({
  open,
  onOpenChange,
  booking,
  quote,
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  quote: CancellationQuote;
  pending: boolean;
  onConfirm: () => void;
}) {
  const kind = cancelCaseOf(quote);
  const { title, icon: Icon, tone } = CASES[kind];
  const addOns = booking.invoice.addOnsTotal;

  const points: string[] = [];
  if (kind === "FREE") {
    points.push(
      quote.freeUntil
        ? `Bạn huỷ trước hạn miễn phí (${formatDateTime(quote.freeUntil)}), nên không mất phí.`
        : "Đơn của bạn không bị tính phí huỷ.",
    );
  }
  if (kind === "PARTIAL") {
    points.push(
      quote.freeUntil
        ? `Đã quá hạn huỷ miễn phí (${formatDateTime(quote.freeUntil)}).`
        : "Đơn này không có thời gian huỷ miễn phí.",
      `Phí huỷ ${quote.feePercent}%: ${formatMoney(quote.fee)}.`,
    );
  }
  if (kind === "NO_REFUND") {
    points.push(
      quote.freeUntil
        ? `Đã quá hạn huỷ miễn phí (${formatDateTime(quote.freeUntil)}), phí huỷ là ${quote.feePercent}% số tiền đã trả.`
        : `Đơn này không có thời gian huỷ miễn phí, phí huỷ là ${quote.feePercent}% số tiền đã trả.`,
      `Toàn bộ ${formatMoney(quote.paid)} sẽ không được hoàn lại.`,
      "Đơn được huỷ ngay và phòng được trả lại cho khách sạn. Không thể hoàn tác.",
    );
  } else {
    points.push(
      `Số tiền hoàn: ${formatMoney(quote.refund)} vào ví StayReco của bạn.`,
      "Khách sạn duyệt yêu cầu trước khi tiền về ví. Phòng vẫn được giữ trong lúc chờ duyệt.",
      "Nếu khách sạn chưa duyệt trước giờ nhận phòng, hệ thống tự duyệt.",
    );
  }
  if (addOns > 0 && kind !== "FREE") {
    points.push(`Dịch vụ đặt kèm (${formatMoney(addOns)}) không tính phí huỷ và được hoàn đủ.`);
  }

  return (
    <AlertDialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <AlertDialogContent className="data-[size=default]:sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Huỷ đặt phòng {booking.code}?</AlertDialogTitle>
          <AlertDialogDescription>Kiểm tra lại trước khi xác nhận.</AlertDialogDescription>
        </AlertDialogHeader>

        <div className={cn("space-y-2 rounded-lg border p-3 text-xs", tone)}>
          <p className="flex items-center gap-1.5 text-sm font-bold">
            <Icon className="size-4 shrink-0" /> {title}
          </p>
          <ul className="list-disc space-y-1 pl-5 leading-relaxed">
            {points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-muted p-2">
            <span className="block text-xs text-muted-foreground">Đã trả</span>
            <strong>{formatMoney(quote.paid)}</strong>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <span className="block text-xs text-muted-foreground">Phí huỷ</span>
            <strong>{formatMoney(quote.fee)}</strong>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <span className="block text-xs text-muted-foreground">Được hoàn</span>
            <strong>{formatMoney(quote.refund)}</strong>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Quay lại</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={onConfirm}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {kind === "NO_REFUND" ? "Huỷ, không hoàn tiền" : "Xác nhận huỷ"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
