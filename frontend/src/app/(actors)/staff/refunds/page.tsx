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
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import { StatusPill } from "@/features/booking/components/StatusPill";
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
    <div className="mx-auto w-full max-w-7xl space-y-5 pb-16 text-foreground">
      <div>
        <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/staff/dashboard" className="hover:text-primary">Bàn làm việc</Link>
          <ChevronRight className="size-3" />
          <span className="font-medium text-foreground">Yêu cầu hoàn tiền</span>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <BadgePercent className="size-7 text-primary" /> Yêu cầu hoàn tiền
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Đây là hàng đợi cần chuyển cho chủ khách sạn. Số tiền hoàn được tính tự động theo chính sách huỷ. Bạn kiểm tra
          yêu cầu, ghi chú (bắt buộc) rồi chuyển đi; chủ khách sạn là người duyệt hoặc từ chối, khách được hoàn tiền sau
          khi chủ duyệt. Cần quyền <strong>REFUND</strong>.
        </p>
      </div>

      <section className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-2xs sm:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-center">
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
                  "h-10 rounded-lg px-3.5 text-sm font-semibold transition",
                  tab.key === item.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {tab.key === item.key && meta ? ` (${meta.total})` : ""}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Tìm mã đơn, tên khách…"
              aria-label="Tìm mã đơn hoặc tên khách"
              className="h-10 bg-card pl-9 text-sm"
            />
          </div>
        </div>

        {error ? (
          <ErrorState title="Không tải được yêu cầu hoàn tiền" error={error} onRetry={() => void refetch()} />
        ) : loading ? (
          <LoadingState rows={3} label="Đang tải yêu cầu hoàn tiền…" />
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={
              debouncedSearch
                ? "Không có yêu cầu khớp với từ khoá"
                : tab.key === "pending"
                  ? "Không còn yêu cầu nào cần chuyển"
                  : "Chưa có đơn nào đã hoàn tiền"
            }
            description={
              debouncedSearch
                ? "Thử mã đơn hoặc tên khách khác."
                : tab.key === "pending"
                  ? "Khi khách huỷ đơn đã thanh toán, yêu cầu hoàn tiền sẽ hiện ở đây."
                  : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3">Mã đơn</th>
                  <th className="p-3">Hạng phòng / Kỳ nghỉ</th>
                  <th className="p-3 text-right">Tổng đơn</th>
                  <th className="p-3">Trạng thái</th>
                  <th className="p-3">Tạo lúc</th>
                  <th className="p-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.map((booking) => (
                  <RefundRow key={booking.id} booking={booking} onOpen={() => setSelectedId(booking.id)} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
            <span>
              Trang {meta.page}/{meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={meta.page <= 1}
              onClick={() => setPage((value) => value - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-10"
              disabled={meta.page >= meta.totalPages}
              onClick={() => setPage((value) => value + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        )}
        {isFetching && !loading && <p className="text-center text-xs text-muted-foreground">Đang cập nhật…</p>}
      </section>

      <RefundDialog bookingId={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  );
}

function RefundRow({ booking, onOpen }: { booking: BookingSummary; onOpen: () => void }) {
  const pending = booking.paymentStatus === "REFUND_PENDING";
  return (
    <tr className="transition hover:bg-muted/40">
      <td className="p-3">
        <Link href={`/staff/bookings/${booking.id}`} className="font-mono font-semibold text-primary hover:underline">
          {booking.code}
        </Link>
        <div className="text-xs text-muted-foreground">{booking.guestName}</div>
      </td>
      <td className="p-3">
        <div className="font-semibold text-foreground">{booking.roomType.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatCalendarDate(booking.checkIn)} – {formatCalendarDate(booking.checkOut)} · {booking.nights} đêm ·{" "}
          {booking.rooms} phòng
        </div>
      </td>
      <td className="whitespace-nowrap p-3 text-right font-semibold text-foreground">{formatMoney(booking.totalAmount)}</td>
      <td className="p-3">
        <StatusPill booking={booking} />
      </td>
      <td className="whitespace-nowrap p-3 text-muted-foreground">{formatDateTime(booking.createdAt)}</td>
      <td className="p-3 text-right">
        <Button
          size="sm"
          variant={pending ? "default" : "outline"}
          className="h-10 whitespace-nowrap px-3 text-sm"
          onClick={onOpen}
        >
          {pending ? "Kiểm tra & chuyển" : "Xem"}
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
          <Button variant="outline" className="h-10" onClick={onClose}>Đóng</Button>
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

      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Hạng phòng</dt>
          <dd className="font-semibold text-foreground">{booking.roomType.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kỳ nghỉ</dt>
          <dd className="font-semibold text-foreground">
            {formatCalendarDate(booking.checkIn)} – {formatCalendarDate(booking.checkOut)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Khách đã trả</dt>
          <dd className="font-semibold text-foreground">{formatMoney(booking.totalAmount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Số tiền hoàn (theo chính sách)</dt>
          <dd className="text-sm font-bold text-emerald-700">{formatMoney(booking.refund?.amount)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Miễn phí huỷ đến</dt>
          <dd className="font-semibold text-foreground">
            {booking.cancellation.freeUntil ? formatDateTime(booking.cancellation.freeUntil) : "Không có"}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phí huỷ sau hạn</dt>
          <dd className="font-semibold text-foreground">{booking.cancellation.feePercent}%</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Lý do huỷ của khách</dt>
          <dd className="font-medium text-foreground">{booking.cancelReason || "Khách không ghi lý do."}</dd>
          {booking.cancelledAt && (
            <dd className="text-xs text-muted-foreground">Gửi lúc {formatDateTime(booking.cancelledAt)}</dd>
          )}
        </div>
      </dl>

      {forwardedAt && (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
          Đã chuyển cho chủ khách sạn lúc {formatDateTime(forwardedAt)}.
          {pending && " Có thể chuyển lại với ghi chú mới."}
        </p>
      )}

      {pending ? (
        forward.isSuccess ? (
          <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
            <CheckCircle2 className="size-4" /> Đã chuyển yêu cầu cho chủ khách sạn. Chủ sẽ duyệt hoặc từ chối; khách được hoàn tiền sau khi chủ duyệt.
          </p>
        ) : (
          <div className="space-y-1.5">
            <label htmlFor="refund-note" className="text-sm font-semibold text-foreground">
              Ghi chú cho chủ khách sạn (bắt buộc)
            </label>
            <Textarea
              id="refund-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={BOOKING_LIMITS.refundNoteMax}
              placeholder="Ví dụ: Khách huỷ trước hạn miễn phí, đã gọi xác nhận qua điện thoại."
              aria-invalid={!!noteError}
              className="min-h-24 text-sm"
            />
            <div className="flex justify-between text-xs">
              <span className="text-destructive">{noteError}</span>
              <span className="text-muted-foreground">
                {note.length}/{BOOKING_LIMITS.refundNoteMax}
              </span>
            </div>
            {forward.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive" role="alert">
                {getApiErrorMessage(forward.error, "Không chuyển được yêu cầu.")}
              </p>
            )}
          </div>
        )
      ) : (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Yêu cầu đã được xử lý: {paymentStatusLabels[booking.paymentStatus].label.toLowerCase()}.
        </p>
      )}

      <DialogFooter className="gap-2">
        <Link href={`/staff/bookings/${booking.id}`} className="sm:mr-auto">
          <Button variant="outline" className="h-10 w-full gap-1.5 text-sm">
            <ExternalLink className="size-3.5" /> Mở chi tiết đơn
          </Button>
        </Link>
        {pending && !forward.isSuccess && (
          <Button
            className="h-10 gap-1.5 text-sm"
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
