"use client";

import { useState } from "react";
import { ChevronDown, ReceiptText } from "lucide-react";
import type { Booking, BookingAddOn } from "@stayreco/shared";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime, formatMoney } from "@/features/stays/lib/format";
import { addOnTimingLabels, paymentMethodLabels } from "../lib/booking-labels";

function Row({
  label,
  value,
  hint,
  tone = "default",
  strong = false,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "minus" | "muted";
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <span className={cn("block", strong ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
        {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <span
        className={cn(
          "shrink-0 font-mono",
          tone === "minus" && "text-emerald-700",
          tone === "muted" && "text-muted-foreground",
          tone === "default" && "text-foreground",
          strong && "font-bold",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function AddOnLines({ lines }: { lines: BookingAddOn[] }) {
  return (
    <>
      {lines.map((line) => (
        <Row
          key={line.id}
          label={`${line.name} × ${line.quantity}`}
          hint={`${addOnTimingLabels[line.timing].label} · ${formatMoney(line.unitPrice)}/lần`}
          value={formatMoney(line.amount)}
        />
      ))}
    </>
  );
}

/**
 * The invoice of a booking (`Booking.invoice`, docs/api/customer.md): rooms, prepaid add-ons, the discount, the points,
 * the total charged, then what the front desk still collects. Every figure comes from the backend.
 */
export function BookingInvoice({ booking, className }: { booking: Booking; className?: string }) {
  const [showNights, setShowNights] = useState(false);
  const { invoice } = booking;
  const prepaid = booking.addOns.filter((line) => line.payment === "PREPAID");
  const atDesk = booking.addOns.filter((line) => line.payment === "FRONT_DESK");
  const roomsAmount = invoice.subtotal - invoice.addOnsTotal;
  const lateFee = booking.lateCheckout?.fee ?? 0;
  const paid = booking.paidAt !== null;

  return (
    <div className={cn("space-y-4 text-xs", className)}>
      <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
        <Row label="Số hoá đơn" value={invoice.number} strong />
        <Row label="Phương thức" value={paymentMethodLabels[invoice.paymentMethod]} />
        <Row label="Thanh toán lúc" value={paid ? formatDateTime(booking.paidAt) : "Chưa thanh toán"} />
        <Row label="Đặt lúc" value={formatDateTime(booking.createdAt)} />
      </div>

      <div className="space-y-2">
        <div>
          <Row
            label={`Tiền phòng (${booking.rooms} phòng × ${booking.nights} đêm)`}
            value={formatMoney(roomsAmount)}
          />
          {booking.nightlyPrices.length > 0 && (
            <button
              type="button"
              onClick={() => setShowNights((open) => !open)}
              className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary"
              aria-expanded={showNights}
            >
              {showNights ? "Ẩn giá từng đêm" : "Xem giá từng đêm"}
              <ChevronDown className={cn("size-3 transition-transform", showNights && "rotate-180")} />
            </button>
          )}
          {showNights && (
            <div className="mt-2 space-y-1 border-l-2 border-border pl-3">
              {booking.nightlyPrices.map((night) => (
                <Row key={night.date} label={`Đêm ${formatDate(night.date)} (1 phòng)`} value={formatMoney(night.price)} tone="muted" />
              ))}
            </div>
          )}
        </div>

        {prepaid.length > 0 && (
          <div className="space-y-2 border-t border-dashed border-border pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Dịch vụ đặt kèm</p>
            <AddOnLines lines={prepaid} />
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-2">
          <Row label="Tạm tính" value={formatMoney(invoice.subtotal)} />
          {invoice.discount && (
            <Row
              label={invoice.discount.kind === "VOUCHER" ? "Voucher" : "Khuyến mãi"}
              hint={invoice.discount.code ? `${invoice.discount.name} · mã ${invoice.discount.code}` : invoice.discount.name}
              value={`−${formatMoney(invoice.discount.amount)}`}
              tone="minus"
            />
          )}
          {invoice.points && (
            <Row
              label="Điểm StayMiles"
              hint={`${invoice.points.used.toLocaleString("vi-VN")} điểm`}
              value={`−${formatMoney(invoice.points.amount)}`}
              tone="minus"
            />
          )}
          <Row
            label="Thuế"
            hint={invoice.tax === 0 ? "Giá đã bao gồm thuế" : undefined}
            value={formatMoney(invoice.tax)}
            tone="muted"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2.5">
          <span className="text-sm font-bold text-foreground">{paid ? "Đã thanh toán" : "Tổng cần thanh toán"}</span>
          <span className="font-mono text-base font-bold text-primary">{formatMoney(invoice.total)}</span>
        </div>
        {(invoice.discount || invoice.points) && invoice.addOnsTotal > 0 && (
          <p className="text-[11px] text-muted-foreground">Giảm giá và điểm chỉ trừ vào tiền phòng, không trừ vào dịch vụ.</p>
        )}
      </div>

      {(atDesk.length > 0 || lateFee > 0) && (
        <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/70 p-3">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-900">
            <ReceiptText className="size-3.5" /> Thu tại quầy khi trả phòng
          </p>
          <AddOnLines lines={atDesk} />
          {lateFee > 0 && (
            <Row
              label="Phí trả phòng muộn"
              hint={booking.lateCheckout ? `Trễ ${booking.lateCheckout.minutesLate} phút` : undefined}
              value={formatMoney(lateFee)}
            />
          )}
          <div className="border-t border-amber-200 pt-2">
            <Row label="Tổng thu tại quầy" value={formatMoney(invoice.frontDeskDue + lateFee)} strong />
          </div>
        </div>
      )}

      {booking.refund && (
        <Row
          label="Hoàn tiền về ví StayReco"
          hint={booking.refund.status === "REFUND_PENDING" ? "Đang chờ khách sạn duyệt" : undefined}
          value={formatMoney(booking.refund.amount)}
          strong
        />
      )}
    </div>
  );
}
