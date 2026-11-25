"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { BookingStatus, PaymentStatus } from "@stayreco/shared";
import { CalendarDays, Download, Loader2, ReceiptText, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Pagination from "@/components/common/pagination/Pagination";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { StatusPill } from "@/features/booking/components/StatusPill";
import { BookingRowActions } from "@/features/staff/bookings/BookingRowActions";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import { useHotelBookings } from "@/features/staff/api/staff-queries";
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatMoney,
  paymentStatusLabels,
} from "@/features/staff/lib/labels";
import { todayInVietnam } from "@/features/booking/lib/stay-calendar";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type StatusTab = "all" | "arrivals" | "pending" | "confirmed" | "staying" | "completed" | "cancelled";

const STATUS_TABS: { id: StatusTab; label: string; statuses?: BookingStatus[]; today?: boolean }[] = [
  { id: "all", label: "Tất cả" },
  { id: "arrivals", label: "Đến hôm nay", statuses: ["CONFIRMED"], today: true },
  { id: "staying", label: "Đang lưu trú", statuses: ["CHECKED_IN"] },
  { id: "pending", label: "Chờ thanh toán", statuses: ["PENDING"] },
  { id: "confirmed", label: "Đã xác nhận", statuses: ["CONFIRMED"] },
  { id: "completed", label: "Đã hoàn tất", statuses: ["COMPLETED", "NO_SHOW"] },
  { id: "cancelled", label: "Đã huỷ", statuses: ["CANCELLED", "EXPIRED"] },
];

const PAYMENT_OPTIONS: { value: "all" | PaymentStatus; label: string }[] = [
  { value: "all", label: "Tất cả thanh toán" },
  { value: "UNPAID", label: "Chưa thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "REFUND_PENDING", label: "Chờ hoàn tiền" },
  { value: "PARTIALLY_REFUNDED", label: "Đã hoàn một phần" },
  { value: "REFUNDED", label: "Đã hoàn tiền" },
  { value: "FAILED", label: "Thanh toán thất bại" },
];

const SORT_OPTIONS = [
  { value: "check-in-asc", label: "Check-in sớm nhất" },
  { value: "check-in-desc", label: "Check-in muộn nhất" },
  { value: "created-desc", label: "Mới đặt gần đây" },
] as const;
type Sort = (typeof SORT_OPTIONS)[number]["value"];

const PAGE_SIZE = 10;

export default function StaffBookingsPage() {
  return (
    <Suspense fallback={<LoadingState rows={4} />}>
      <StaffBookingsContent />
    </Suspense>
  );
}

/** Filters live in the URL (`tab`, `search`, `payment`, `sort`, `from`, `to`, `page`) so a reload or a shared link keeps them. */
function StaffBookingsContent() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const hotelId = hotel?.summary.id;
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams();

  const tabId = (query.get("tab") as StatusTab | null) ?? "all";
  const tab = STATUS_TABS.find((item) => item.id === tabId) ?? STATUS_TABS[0];
  const searchParam = query.get("search") ?? "";
  const paymentRaw = query.get("payment");
  const payment: "all" | PaymentStatus =
    PAYMENT_OPTIONS.find((item) => item.value === paymentRaw)?.value ?? "all";
  const sort: Sort = SORT_OPTIONS.find((item) => item.value === query.get("sort"))?.value ?? "check-in-asc";
  const checkInFrom = query.get("from") ?? "";
  const checkInTo = query.get("to") ?? "";
  const page = Math.max(1, Number(query.get("page")) || 1);

  const update = (patch: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(query.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!keepPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // The search box keeps its own text so typing is instant; the URL follows after a pause or when the header search changes it.
  const [searchText, setSearchText] = useState(searchParam);
  const [lastParam, setLastParam] = useState(searchParam);
  if (searchParam !== lastParam) {
    setLastParam(searchParam);
    setSearchText(searchParam);
  }
  const debouncedText = useDebounce(searchText);
  useEffect(() => {
    if (debouncedText.trim() !== searchParam.trim()) update({ search: debouncedText.trim() || null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText]);

  const [copied, setCopied] = useState<string | null>(null);
  const today = todayInVietnam();

  const params = useMemo(
    () => ({
      status: tab.statuses,
      paymentStatus: payment === "all" ? undefined : [payment],
      search: searchParam.trim() || undefined,
      checkInFrom: tab.today ? today : checkInFrom || undefined,
      checkInTo: tab.today ? today : checkInTo || undefined,
      sort,
      page,
      pageSize: PAGE_SIZE,
    }),
    [tab, payment, searchParam, checkInFrom, checkInTo, sort, page, today],
  );

  const { data, isLoading, isFetching, error, refetch } = useHotelBookings(hotelId, params);
  const bookings = data?.bookings ?? [];
  const meta = data?.meta;
  const loading = hotelLoading || isLoading;

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setCopied(code);
    window.setTimeout(() => setCopied(null), 1800);
  };

  const exportCsv = () => {
    const header = [
      "Mã đơn", "Khách lưu trú", "Số điện thoại", "Người đặt", "Hạng phòng", "Check-in", "Check-out",
      "Số đêm", "Phòng", "Khách", "Tổng tiền", "Thanh toán", "Trạng thái",
    ];
    const lines = bookings.map((booking) => [
      booking.code, booking.guestName, booking.contactPhone, booking.bookedBy.name, booking.roomType.name,
      booking.checkIn, booking.checkOut, booking.nights, booking.rooms, booking.guests, booking.totalAmount,
      paymentStatusLabels[booking.paymentStatus].label, bookingStatusLabels[booking.status].label,
    ]);
    const csv = [header, ...lines]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `stayreco-bookings-${hotelId ?? "hotel"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchText("");
    router.replace(pathname, { scroll: false });
  };

  const hasFilters = tab.id !== "all" || payment !== "all" || !!searchParam || !!checkInFrom || !!checkInTo;
  const fieldClass = "h-10 w-full bg-card text-sm";

  return (
    <div className="space-y-5 pb-16">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Danh sách đặt phòng</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {hotel?.summary.name ?? "Khách sạn của bạn"} · {meta ? `${meta.total} đơn khớp bộ lọc` : "Đang tải…"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={exportCsv}
          disabled={bookings.length === 0}
          className="h-10 gap-2 self-start text-sm font-semibold md:self-auto"
        >
          <Download className="size-4" /> Xuất CSV (trang này)
        </Button>
      </div>

      <Card className="space-y-3 rounded-xl border border-border p-4 shadow-2xs">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Tìm theo mã đơn hoặc tên khách…"
            aria-label="Tìm theo mã đơn hoặc tên khách"
            className="h-11 bg-card pl-10 text-sm"
          />
        </div>

        <div className="-mx-1 flex items-center gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Trạng thái">
          {STATUS_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab.id === item.id}
              onClick={() => update({ tab: item.id === "all" ? null : item.id })}
              className={cn(
                "h-10 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-sm font-semibold transition-colors",
                tab.id === item.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="date"
            aria-label="Check-in từ ngày"
            value={tab.today ? today : checkInFrom}
            disabled={tab.today}
            onChange={(event) => update({ from: event.target.value || null })}
            className={fieldClass}
          />
          <Input
            type="date"
            aria-label="Check-in đến ngày"
            min={checkInFrom || undefined}
            value={tab.today ? today : checkInTo}
            disabled={tab.today}
            onChange={(event) => update({ to: event.target.value || null })}
            className={fieldClass}
          />
          <Select
            value={payment}
            onValueChange={(value) => typeof value === "string" && update({ payment: value === "all" ? null : value })}
          >
            <SelectTrigger className={fieldClass} aria-label="Lọc theo thanh toán">
              <SelectValue>
                {(value) => PAYMENT_OPTIONS.find((item) => item.value === value)?.label ?? PAYMENT_OPTIONS[0].label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => typeof value === "string" && update({ sort: value === "check-in-asc" ? null : value })}
          >
            <SelectTrigger className={fieldClass} aria-label="Sắp xếp">
              <SelectValue>
                {(value) => SORT_OPTIONS.find((item) => item.value === value)?.label ?? SORT_OPTIONS[0].label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <div className="flex justify-end">
            <Button variant="ghost" onClick={clearFilters} className="h-10 gap-1.5 text-sm font-semibold text-primary">
              <X className="size-4" /> Xoá bộ lọc
            </Button>
          </div>
        )}
      </Card>

      {error ? (
        <ErrorState title="Không tải được danh sách đặt phòng" error={error} onRetry={() => void refetch()} />
      ) : loading ? (
        <LoadingState rows={5} label="Đang tải danh sách đặt phòng…" />
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={tab.today ? "Hôm nay chưa có khách đến" : "Không có đơn đặt phòng phù hợp"}
          description="Thử đổi trạng thái, ngày hoặc từ khoá tìm kiếm."
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters} className="h-10">
                Xoá bộ lọc
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden rounded-xl border border-border shadow-2xs">
          {/* Tablet and desktop: a table that scrolls inside its card. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="h-11 border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="pl-4 pr-3">Khách</th>
                  <th className="px-3">Lưu trú</th>
                  <th className="px-3">Phòng</th>
                  <th className="px-3 text-right">Tổng tiền</th>
                  <th className="px-3">Trạng thái</th>
                  <th className="pl-3 pr-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-muted/40">
                    <td className="py-3 pl-4 pr-3">
                      <Link
                        href={`/staff/bookings/${booking.id}`}
                        className="block font-semibold text-foreground hover:underline"
                      >
                        {booking.guestName}
                      </Link>
                      <span className="block font-mono text-xs text-muted-foreground">
                        {booking.code} · {booking.contactPhone}
                      </span>
                      {booking.bookedBy.name !== booking.guestName && (
                        <span className="block text-xs text-muted-foreground">Đặt bởi {booking.bookedBy.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className="block whitespace-nowrap font-medium text-foreground">
                        {formatCalendarDate(booking.checkIn)} → {formatCalendarDate(booking.checkOut)}
                      </span>
                      <span className="text-xs text-muted-foreground">{booking.nights} đêm</span>
                    </td>
                    <td className="px-3 py-3">
                      <span className="block font-medium text-foreground">{booking.roomType.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {booking.rooms} phòng · {booking.guests} khách
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-foreground">
                      {formatMoney(booking.totalAmount)}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill booking={booking} />
                    </td>
                    <td className="py-3 pl-3 pr-4">
                      <BookingRowActions booking={booking} today={today} onCopy={copyCode} className="justify-end" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone: one card per booking. */}
          <ul className="divide-y divide-border md:hidden">
            {bookings.map((booking) => (
              <li key={booking.id} className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link href={`/staff/bookings/${booking.id}`} className="block truncate font-semibold text-foreground">
                      {booking.guestName}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {booking.code} · {booking.contactPhone}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">{formatMoney(booking.totalAmount)}</span>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-foreground">
                  <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  {formatCalendarDate(booking.checkIn)} → {formatCalendarDate(booking.checkOut)} · {booking.nights} đêm
                </p>
                <p className="text-xs text-muted-foreground">
                  {booking.roomType.name} · {booking.rooms} phòng · {booking.guests} khách
                </p>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <StatusPill booking={booking} />
                  <BookingRowActions booking={booking} today={today} onCopy={copyCode} />
                </div>
              </li>
            ))}
          </ul>

          {copied && (
            <p role="status" className="border-t border-border py-2 text-center text-xs text-muted-foreground">
              Đã sao chép mã {copied}
            </p>
          )}
          {isFetching && (
            <div className="flex items-center justify-center gap-2 border-t border-border py-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Đang cập nhật…
            </div>
          )}

          <div className="flex flex-col items-center justify-between gap-3 border-t border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground sm:flex-row">
            <span>
              {meta && meta.total > 0
                ? `Hiển thị ${(meta.page - 1) * meta.pageSize + 1} - ${Math.min(meta.page * meta.pageSize, meta.total)} trên ${meta.total} đơn`
                : "Không có đơn nào"}
            </span>
            {meta && meta.totalPages > 1 && (
              <Pagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                onPageChange={(next) => update({ page: next > 1 ? String(next) : null }, true)}
              />
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
