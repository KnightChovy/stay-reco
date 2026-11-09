"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarRange, ChevronLeft, ChevronRight, Tags } from "lucide-react";
import type { AvailabilityDay } from "@stayreco/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { addDays, dateInput } from "@/features/stays/lib/params";
import {
  useAvailability,
  useNightlyPrices,
  usePricingRules,
  useRoomTypes,
} from "@/features/staff/api/staff-queries";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import {
  adjustmentLabel,
  dayOfWeekLabels,
  formatCalendarDate,
  formatMoney,
  priceRuleTypeLabels,
} from "@/features/staff/lib/labels";

const DAYS = 14;

const compactMoney = new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 });

/**
 * Read-only view for the front desk (answering a guest on the phone): rooms still on sale per night
 * (`GET /hotels/:id/availability`), the nightly price a guest booking today pays (the search price engine) and the
 * pricing rules behind it (`GET /hotels/:id/pricing-rules`). Only the partner changes them.
 */
export default function StaffAvailabilityPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const today = dateInput(0);
  const [from, setFrom] = useState(today);
  const to = addDays(from, DAYS - 1);
  const dates = Array.from({ length: DAYS }, (_, index) => addDays(from, index));

  const roomTypes = useRoomTypes(hotelId);
  const availability = useAvailability(hotelId, { from, to });
  const types = roomTypes.data ?? [];
  // The listing takes a check-out date: the night of `to` ends the next morning.
  const prices = useNightlyPrices(
    types.map((type) => type.id),
    from,
    addDays(to, 1),
  );
  const rules = usePricingRules(hotelId);

  const cellOf = (roomTypeId: string, date: string): AvailabilityDay | undefined =>
    availability.data?.find((day) => day.roomTypeId === roomTypeId && day.date === date);
  const loading = hotelLoading || roomTypes.isLoading || availability.isLoading;
  const error = roomTypes.error ?? availability.error;
  const activeRules = (rules.data ?? []).filter((rule) => rule.isActive && rule.ruleType !== "BASE");
  const typeName = (id: string) => types.find((type) => type.id === id)?.name ?? "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
            <Link href="/staff/dashboard" className="hover:text-[#934a33]">Bàn làm việc</Link>
            <ChevronRight className="size-3" />
            <span className="font-medium text-slate-800">Phòng trống & Giá</span>
          </div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <CalendarRange className="size-7 text-[#934a33]" /> Phòng trống & Giá
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Số phòng còn bán và giá mỗi đêm cho khách đặt hôm nay. Chỉ xem; giá và số phòng mở bán do chủ khách sạn
            thiết lập.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => setFrom((value) => (addDays(value, -7) < today ? today : addDays(value, -7)))}
            disabled={from <= today}
            aria-label="Tuần trước"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-44 text-center text-xs font-semibold text-slate-700">
            {formatCalendarDate(from)} – {formatCalendarDate(to)}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-9"
            onClick={() => setFrom((value) => addDays(value, 7))}
            aria-label="Tuần sau"
          >
            <ChevronRight className="size-4" />
          </Button>
          {from !== today && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setFrom(today)}>
              Hôm nay
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Không tải được lịch phòng</AlertTitle>
          <AlertDescription className="mt-1 flex flex-col items-start gap-3">
            <span>{getApiErrorMessage(error, "Vui lòng thử lại sau.")}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void roomTypes.refetch();
                void availability.refetch();
              }}
            >
              Thử lại
            </Button>
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : types.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-10 text-center text-sm text-slate-500">
          Khách sạn chưa có hạng phòng nào.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
          {/* A CSS grid, not a <table>: the dense staff workspace forces tables to full width and a fixed layout. */}
          <div role="table" aria-label="Phòng trống và giá theo đêm" className="grid w-max min-w-full text-xs" style={{ gridTemplateColumns: `10rem repeat(${DAYS}, 4.5rem)` }}>
            <div role="row" className="contents">
              <div role="columnheader" className="sticky left-0 z-10 border-b border-slate-200 bg-slate-50 p-3 font-semibold text-slate-700">
                Hạng phòng
              </div>
              {dates.map((date) => {
                const weekday = new Date(`${date}T00:00:00`).getDay();
                const weekend = weekday === 0 || weekday === 6;
                return (
                  <div
                    key={date}
                    role="columnheader"
                    className={cn(
                      "border-b border-slate-200 bg-slate-50 p-2 text-center font-semibold",
                      weekend ? "text-[#934a33]" : "text-slate-600",
                    )}
                  >
                    <span className="block text-[10px] font-medium">
                      {format(new Date(`${date}T00:00:00`), "EEEEEE", { locale: vi })}
                    </span>
                    {formatCalendarDate(date).slice(0, 5)}
                  </div>
                );
              })}
            </div>
            {types.map((type, index) => {
              const nightly = prices[index]?.data ?? [];
              return (
                <div key={type.id} role="row" className="contents">
                  <div role="rowheader" className="sticky left-0 z-10 border-b border-slate-100 bg-white p-3">
                    <span className="block font-semibold text-slate-900">{type.name}</span>
                    <span className="text-[11px] text-slate-500">Giá gốc {formatMoney(type.basePrice)}</span>
                  </div>
                  {dates.map((date) => {
                    const day = cellOf(type.id, date);
                    const price = nightly.find((night) => night.date === date)?.price;
                    const base = type.basePrice;
                    const change = price != null && base ? Math.round(((price - base) / base) * 100) : 0;
                    const onSale = day?.onSale ?? 0;
                    return (
                      <div key={date} role="cell" className="border-b border-slate-100 p-1.5 text-center">
                        <div
                          className={cn(
                            "rounded-lg px-1 py-1.5",
                            onSale === 0 ? "bg-red-50" : onSale <= 2 ? "bg-amber-50" : "bg-emerald-50",
                          )}
                          title={
                            day
                              ? `Tổng ${day.totalRooms} · đã đặt ${day.booked} · giữ chỗ ${day.held} · đóng bán ${day.closed}`
                              : undefined
                          }
                        >
                          <span
                            className={cn(
                              "block text-sm font-bold",
                              onSale === 0 ? "text-red-700" : onSale <= 2 ? "text-amber-700" : "text-emerald-700",
                            )}
                          >
                            {day ? onSale : "—"}
                          </span>
                          <span className="block text-[10px] text-slate-500">còn</span>
                        </div>
                        <span className="mt-1 block whitespace-nowrap text-[11px] font-semibold text-slate-800">
                          {price != null ? compactMoney.format(price) : prices[index]?.isLoading ? "…" : "—"}
                        </span>
                        {change !== 0 && (
                          <span
                            className={cn(
                              "block text-[10px] font-semibold",
                              change < 0 ? "text-emerald-700" : "text-[#934a33]",
                            )}
                          >
                            {change > 0 ? "+" : ""}
                            {change}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
            Số lớn là số phòng còn bán mỗi đêm (rê chuột để xem chi tiết); dưới là giá một đêm cho một phòng và mức
            chênh so với giá gốc.
          </p>
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Tags className="size-4 text-[#934a33]" /> Quy tắc giá đang áp dụng
        </h2>
        {rules.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : rules.error ? (
          <p className="text-xs text-red-700">{getApiErrorMessage(rules.error, "Không tải được quy tắc giá.")}</p>
        ) : activeRules.length === 0 ? (
          <p className="text-xs text-slate-500">Không có quy tắc nào; mọi đêm tính theo giá gốc.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="p-2">Tên</th>
                  <th className="p-2">Hạng phòng</th>
                  <th className="p-2">Loại</th>
                  <th className="p-2 text-right">Điều chỉnh</th>
                  <th className="p-2">Áp dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="p-2 font-semibold text-slate-900">{rule.name}</td>
                    <td className="p-2 text-slate-600">{typeName(rule.roomTypeId)}</td>
                    <td className="p-2 text-slate-600">{priceRuleTypeLabels[rule.ruleType]}</td>
                    <td
                      className={cn(
                        "p-2 text-right font-semibold",
                        rule.adjustmentValue < 0 && rule.adjustmentType !== "SET_PRICE"
                          ? "text-emerald-700"
                          : "text-slate-900",
                      )}
                    >
                      {adjustmentLabel(rule)}
                    </td>
                    <td className="p-2 text-slate-600">
                      {[
                        rule.validFrom || rule.validTo
                          ? `${rule.validFrom ? formatCalendarDate(rule.validFrom) : "…"} – ${
                              rule.validTo ? formatCalendarDate(rule.validTo) : "…"
                            }`
                          : null,
                        rule.dayOfWeek ? dayOfWeekLabels[rule.dayOfWeek] : null,
                        rule.minDaysBefore != null ? `đặt trước ≥ ${rule.minDaysBefore} ngày` : null,
                        rule.maxDaysBefore != null ? `đặt trước ≤ ${rule.maxDaysBefore} ngày` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Mọi ngày"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
