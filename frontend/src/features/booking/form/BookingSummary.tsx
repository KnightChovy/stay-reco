"use client";

import Image from "next/image";
import { CalendarDays, Loader2, MapPin, RefreshCw } from "lucide-react";
import type { AddOnLineInput, DiscountQuote, HotelAddOn } from "@stayreco/shared";

type NightlyPrice = { date: string; price: number };
import { cn } from "@/lib/utils";
import { getApiErrorMessage } from "@/lib/api-error";
import { formatDate, formatMoney, formatWeekday } from "@/features/stays/lib/format";
import { formatPoints } from "@/features/account/lib/rewards-labels";

type Props = {
  image: string;
  hotelName: string;
  hotelAddress: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  rooms: number;
  available: number;
  /** Price of one room per night, from the room type listing. */
  nightlyPrices: NightlyPrice[];
  quote: DiscountQuote | undefined;
  /** True while a new quote is on its way: the figures shown belong to the previous inputs. */
  requoting: boolean;
  quoteError: unknown;
  onRetryQuote: () => void;
  addOnLines: AddOnLineInput[];
  addOns: HotelAddOn[];
};

function Line({
  label,
  hint,
  value,
  tone = "default",
}: {
  label: string;
  hint?: string;
  value: string;
  tone?: "default" | "minus" | "muted";
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="min-w-0">
        <span className={cn("block", tone === "muted" ? "text-muted-foreground" : "text-foreground")}>{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <span
        className={cn(
          "shrink-0 font-semibold whitespace-nowrap",
          tone === "minus" && "text-emerald-700",
          tone === "muted" && "font-normal text-muted-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * The trip and its price, every figure from the backend's discount quote: rooms, add-ons, the discount, the points
 * and the total. While a new quote loads the old figures fade so nobody reads a stale total as the final one.
 */
export function BookingSummary(props: Props) {
  const { quote, requoting } = props;
  const saving = (quote?.discount?.amount ?? 0) + (quote?.points?.amount ?? 0);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
      <div className="border-b border-border bg-muted/60 p-5">
        <h2 className="text-base font-bold tracking-tight text-foreground">Tóm tắt chuyến đi</h2>
        <p className="text-xs text-muted-foreground">Giá đã bao gồm thuế và phí dịch vụ</p>
      </div>

      <div className="space-y-4 p-5 text-sm">
        <div className="flex items-start gap-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={props.image} alt={props.hotelName} fill sizes="80px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <p className="line-clamp-2 font-bold text-foreground">{props.hotelName}</p>
            <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <span className="line-clamp-2">{props.hotelAddress}</span>
            </p>
            <p className="mt-1 text-xs font-semibold text-primary">{props.roomTypeName}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          <div className="grid grid-cols-2 divide-x divide-border bg-muted/40">
            <div className="p-3">
              <span className="block text-xs text-muted-foreground">Nhận phòng</span>
              <span className="block font-bold text-foreground">{formatDate(props.checkIn)}</span>
              <span className="text-xs capitalize text-muted-foreground">{formatWeekday(props.checkIn)}</span>
            </div>
            <div className="p-3">
              <span className="block text-xs text-muted-foreground">Trả phòng</span>
              <span className="block font-bold text-foreground">{formatDate(props.checkOut)}</span>
              <span className="text-xs capitalize text-muted-foreground">{formatWeekday(props.checkOut)}</span>
            </div>
          </div>
          <p className="flex items-center gap-1.5 border-t border-border px-3 py-2 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5 text-primary" aria-hidden />
            {props.nights} đêm · {props.guests} khách · {props.rooms} phòng
            <span className="ml-auto font-semibold text-emerald-700">Còn {props.available} phòng trống</span>
          </p>
        </div>

        <div className={cn("space-y-2 transition-opacity", requoting && "opacity-60")} aria-busy={requoting}>
          <details className="group">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3">
              <span className="text-foreground">
                Tiền phòng ({props.rooms} phòng × {props.nights} đêm)
                <span className="block text-xs text-primary group-open:hidden">Xem giá từng đêm</span>
              </span>
              <span className="font-semibold">{quote ? formatMoney(quote.subtotal) : "—"}</span>
            </summary>
            <div className="mt-1 space-y-1 border-l-2 border-border pl-3 text-xs">
              {props.nightlyPrices.map((night) => (
                <Line
                  key={night.date}
                  label={`Đêm ${formatDate(night.date)}`}
                  value={`${formatMoney(night.price)} / phòng`}
                  tone="muted"
                />
              ))}
            </div>
          </details>

          {quote?.discount && (
            <Line
              label={quote.discount.kind === "VOUCHER" ? `Voucher ${quote.discount.code ?? ""}`.trim() : "Khuyến mãi của khách sạn"}
              hint={quote.discount.name}
              value={`−${formatMoney(quote.discount.amount)}`}
              tone="minus"
            />
          )}
          {quote?.points && quote.points.amount > 0 && (
            <Line
              label="Điểm StayMiles"
              hint={formatPoints(quote.points.pointsUsed)}
              value={`−${formatMoney(quote.points.amount)}`}
              tone="minus"
            />
          )}

          {props.addOnLines.length > 0 && (
            <div className="space-y-1.5 border-t border-dashed border-border pt-2">
              {props.addOnLines.map((line) => {
                const addOn = props.addOns.find((item) => item.id === line.addOnId);
                return (
                  <Line
                    key={line.addOnId}
                    label={`${addOn?.name ?? "Dịch vụ"} × ${line.quantity}`}
                    value={`${formatMoney(addOn?.price)}/lần`}
                    tone="muted"
                  />
                );
              })}
              <Line label="Dịch vụ thêm" value={quote ? `+${formatMoney(quote.addOnsTotal)}` : "—"} />
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3 border-t border-border pt-3">
            <span className="flex items-center gap-1.5 font-bold text-foreground">
              Tổng thanh toán
              {requoting && <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Đang tính lại giá" />}
            </span>
            <span className="text-2xl font-bold text-primary">{quote ? formatMoney(quote.expectedTotal) : "—"}</span>
          </div>
          {saving > 0 && (
            <p className="text-right text-xs font-semibold text-emerald-700">Bạn tiết kiệm {formatMoney(saving)}</p>
          )}
          {props.quoteError && !quote ? (
            <div role="alert" className="flex items-center justify-between gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {getApiErrorMessage(props.quoteError, "Không tính được tổng tiền.")}
              <button
                type="button"
                onClick={props.onRetryQuote}
                className="inline-flex min-h-10 shrink-0 items-center gap-1 font-semibold underline"
              >
                <RefreshCw className="size-3.5" /> Thử lại
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
