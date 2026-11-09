"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgePercent,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Search,
  Send,
} from "lucide-react";
import { BOOKING_LIMITS, forwardRefundSchema, type BookingSummary, type PaymentStatus } from "@stayreco/shared";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useDebounce } from "@/hooks/use-debounce";
import { getApiErrorMessage, validateWith } from "@/lib/api-error";
import { cn } from "@/lib/utils";
import { useBooking, useForwardRefund, useHotelBookings } from "@/features/staff/api/staff-queries";
import { useStaffHotel } from "@/features/staff/components/StaffHotelProvider";
import {
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
  toneClasses,
} from "@/features/staff/lib/labels";

const PAGE_SIZE = 10;

const TABS: { key: string; label: string; paymentStatus: PaymentStatus[] }[] = [
  { key: "pending", label: "Chờ hoàn tiền", paymentStatus: ["REFUND_PENDING"] },
  { key: "done", label: "Đã hoàn tiền", paymentStatus: ["REFUNDED", "PARTIALLY_REFUNDED"] },
];

/**
 * UC refund queue for staff with the REFUND permission: `GET /hotels/:id/bookings?paymentStatus=REFUND_PENDING`, then
 * `POST /bookings/:id/forward-refund` with what was checked. The amount is fixed by the cancellation policy; only the
 * partner approves or rejects it.
 */
export default function StaffRefundsPage() {
  const { hotel, isLoading: hotelLoading } = useStaffHotel();
  const [tab, setTab] = useState(TABS[0]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search.trim());

  const { data, isLoading, isFetching, error, refetch } = useHotelBookings(hotel?.summary.id, {
    paymentStatus: tab.paymentStatus,
    search: debouncedSearch || undefined,
    sort: "created-desc",
    page,
    pageSize: PAGE_SIZE,
  });
  const bookings = data?.bookings ?? [];
  const meta = data?.meta;
  const loading = hotelLoading || isLoading;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 font-sans text-foreground antialiased sm:p-8">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
          <Link href="/staff/dashboard" className="hover:text-[#934a33]">Bàn làm việc</Link>
          <ChevronRight className="size-3" />
          <span className="font-medium text-slate-800">Yêu cầu hoàn tiền</span>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <BadgePercent className="size-7 text-[#934a33]" /> Yêu cầu hoàn tiền
        </h1>
        <p className="mt-1 max-w-3xl text-xs text-slate-500">
          Số tiền hoàn được tính tự động theo chính sách huỷ của khách sạn. Bạn kiểm tra yêu cầu rồi chuyển cho chủ
          khách sạn kèm ghi chú; chủ khách sạn là người duyệt hoặc từ chối. Cần quyền <strong>REFUND</strong>.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={tab.key === item.key}
                onClick={() => {
                  setTab(item);
                  setPage(1);
                }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                  tab.key === item.key ? "bg-[#934a33] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {item.label}
                {tab.key === item.key && meta ? ` (${meta.total})` : ""}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm mã đơn, tên khách…"
              aria-label="Tìm mã đơn hoặc tên khách"
              className="h-9 bg-slate-50 pl-9 text-xs"
            />
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Không tải được yêu cầu hoàn tiền</AlertTitle>
            <AlertDescription className="mt-1 flex flex-col items-start gap-3">
              <span>{getApiErrorMessage(error, "Vui lòng thử lại sau.")}</span>
              <Button size="sm" variant="outline" onClick={() => void refetch()}>
                Thử lại
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-700">
                <tr>
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Hạng phòng / Kỳ nghỉ</th>
                  <th className="p-3 text-right">Tổng đơn</th>
                  <th className="p-3 text-center">Thanh toán</th>
                  <th className="p-3">Tạo lúc</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading &&
                  [0, 1, 2].map((row) => (
                    <tr key={row}>
                      <td colSpan={6} className="p-3">
                        <Skeleton className="h-8 w-full" />
                      </td>
                    </tr>
                  ))}
                {!loading &&
                  bookings.map((booking) => (
                    <RefundRow key={booking.id} booking={booking} onOpen={() => setSelectedId(booking.id)} />
                  ))}
              </tbody>
            </table>
            {!loading && bookings.length === 0 && (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
                <p className="text-sm font-semibold text-slate-800">
                  {debouncedSearch ? "Không có yêu cầu khớp với từ khoá" : `Không có đơn nào ở mục "${tab.label}"`}
                </p>
              </div>
            )}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 text-xs text-slate-500">
            <span>
              Trang {meta.page}/{meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={meta.page <= 1}
              onClick={() => setPage((value) => value - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-8"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((value) => value + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
        {isFetching && !loading && <p className="text-center text-[11px] text-slate-400">Đang cập nhật…</p>}
      </section>

      <RefundDialog bookingId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function RefundRow({ booking, onOpen }: { booking: BookingSummary; onOpen: () => void }) {
  const payment = paymentStatusLabels[booking.paymentStatus];
  return (
    <tr className="transition hover:bg-slate-50">
      <td className="p-3">
        <Link
          href={`/staff/bookings/${booking.id}`}
          className="font-mono font-semibold text-[#934a33] hover:underline"
        >
          {booking.code}
        </Link>
      </td>
      <td className="p-3">
        <div className="font-semibold text-slate-900">{booking.roomType.name}</div>
        <div className="text-[11px] text-slate-500">
          {formatCalendarDate(booking.checkIn)} – {formatCalendarDate(booking.checkOut)} · {booking.nights} đêm ·{" "}
          {booking.rooms} phòng
        </div>
      </td>
      <td className="p-3 text-right font-semibold text-slate-900">{formatMoney(booking.totalAmount)}</td>
      <td className="p-3 text-center">
        <Badge variant="outline" className={cn("text-[10px] font-semibold", toneClasses[payment.tone])}>
          {payment.label}
        </Badge>
      </td>
      <td className="p-3 text-slate-500">{formatDateTime(booking.createdAt)}</td>
      <td className="p-3 text-right">
        <Button size="sm" className="h-8 bg-[#934a33] text-xs text-white hover:bg-[#7b3e2b]" onClick={onOpen}>
          {booking.paymentStatus === "REFUND_PENDING" ? "Kiểm tra & chuyển" : "Xem"}
        </Button>
      </td>
    </tr>
  );
}

function RefundDialog({ bookingId, onClose }: { bookingId: string | null; onClose: () => void }) {
  return (
    <Dialog open={!!bookingId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {/* Keyed so the note and the mutation state start fresh for every booking. */}
        {bookingId && <RefundDetail key={bookingId} bookingId={bookingId} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function RefundDetail({ bookingId, onClose }: { bookingId: string; onClose: () => void }) {
  const { data: booking, isLoading, error } = useBooking(bookingId);
  const forward = useForwardRefund();
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string>();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải đơn…
      </div>
    );
  }
  if (error || !booking) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Không tải được đơn</DialogTitle>
          <DialogDescription>{getApiErrorMessage(error, "Đơn không tồn tại hoặc bạn thiếu quyền.")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </>
    );
  }

  const pending = booking.paymentStatus === "REFUND_PENDING";
  const forwardedAt = booking.timeline.findLast((entry) => entry.event === "REFUND_FORWARDED")?.at;

  const submit = () => {
    const parsed = validateWith(forwardRefundSchema, { note });
    if (parsed.errors) {
      setNoteError(parsed.errors.note ?? "Ghi chú không hợp lệ.");
      return;
    }
    setNoteError(undefined);
    forward.mutate({ bookingId: booking.id, note: parsed.data.note });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Yêu cầu hoàn tiền · {booking.code}</DialogTitle>
        <DialogDescription>
          {booking.guestName} · {booking.contactPhone}
        </DialogDescription>
      </DialogHeader>

      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-xs">
        <div>
          <dt className="text-slate-500">Hạng phòng</dt>
          <dd className="font-semibold text-slate-900">{booking.roomType.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Kỳ nghỉ</dt>
          <dd className="font-semibold text-slate-900">
            {formatCalendarDate(booking.checkIn)} – {formatCalendarDate(booking.checkOut)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Khách đã trả</dt>
          <dd className="font-semibold text-slate-900">{formatMoney(booking.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Số tiền hoàn (theo chính sách)</dt>
          <dd className="text-sm font-bold text-emerald-700">{formatMoney(booking.refund?.amount)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Miễn phí huỷ đến</dt>
          <dd className="font-semibold text-slate-900">
            {booking.cancellation.freeUntil ? formatDateTime(booking.cancellation.freeUntil) : "Không có"}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Phí huỷ sau hạn</dt>
          <dd className="font-semibold text-slate-900">{booking.cancellation.feePercent}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500">Lý do huỷ của khách</dt>
          <dd className="font-medium text-slate-900">{booking.cancelReason || "Khách không ghi lý do."}</dd>
          {booking.cancelledAt && (
            <dd className="text-[11px] text-slate-500">Gửi lúc {formatDateTime(booking.cancelledAt)}</dd>
          )}
        </div>
      </dl>

      {forwardedAt && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Đã chuyển cho chủ khách sạn lúc {formatDateTime(forwardedAt)}.
          {pending && " Có thể chuyển lại với ghi chú mới."}
        </p>
      )}

      {pending ? (
        forward.isSuccess ? (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 className="size-4" /> Đã chuyển yêu cầu cho chủ khách sạn.
          </p>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="refund-note" className="text-xs font-semibold text-slate-700">
              Ghi chú cho chủ khách sạn
            </label>
            <Textarea
              id="refund-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={BOOKING_LIMITS.refundNoteMax}
              placeholder="Ví dụ: Khách huỷ trước hạn miễn phí, đã gọi xác nhận qua điện thoại."
              aria-invalid={!!noteError}
              className="min-h-24 text-xs"
            />
            <div className="flex justify-between text-[11px]">
              <span className="text-red-600">{noteError}</span>
              <span className="text-slate-400">
                {note.length}/{BOOKING_LIMITS.refundNoteMax}
              </span>
            </div>
            {forward.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700" role="alert">
                {getApiErrorMessage(forward.error, "Không chuyển được yêu cầu.")}
              </p>
            )}
          </div>
        )
      ) : (
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Yêu cầu đã được xử lý: {paymentStatusLabels[booking.paymentStatus].label.toLowerCase()}.
        </p>
      )}

      <DialogFooter className="gap-2">
        <Link href={`/staff/bookings/${booking.id}`} className="sm:mr-auto">
          <Button variant="outline" className="w-full gap-1.5 text-xs">
            <ExternalLink className="size-3.5" /> Mở chi tiết đơn
          </Button>
        </Link>
        {pending && !forward.isSuccess && (
          <Button
            className="gap-1.5 bg-[#934a33] text-xs text-white hover:bg-[#7b3e2b]"
            onClick={submit}
            disabled={forward.isPending}
          >
            {forward.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Chuyển cho chủ khách sạn
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
