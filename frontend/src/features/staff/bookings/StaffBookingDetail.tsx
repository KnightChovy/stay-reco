"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Printer as PrintIcon,
  Ban,
  BedDouble,
  CalendarClock,
  Clock,
  ConciergeBell,
  CreditCard,
  History,
  Loader2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  UserCog,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ActionMenu, type ActionMenuItem } from "@/components/common/ActionBar";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/StateViews";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { StatusPill } from "@/features/booking/components/StatusPill";
import { todayInVietnam } from "@/features/booking/lib/stay-calendar";
import { getApiErrorMessage } from "@/lib/api-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { BookingInvoice } from "@/features/booking/components/BookingInvoice";
import { BookingTimeline } from "@/features/booking/components/BookingTimeline";
import { FrontDeskAddOns } from "@/features/booking/components/FrontDeskAddOns";
import {
  useAcceptChange,
  useBooking,
  useForwardRefund,
  useNoShow,
  useRejectChange,
} from "../api/staff-queries";
import {
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
  weekdayLabel,
} from "../lib/labels";

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="mt-0.5 block text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function StaffBookingDetail({ bookingId }: { bookingId: string }) {
  // `GET /bookings/:id` accepts the booking UUID only; the mock list still links with sample codes.
  const isRealId = UUID_PATTERN.test(bookingId);
  const { data: booking, isLoading, error, refetch, isFetching } = useBooking(
    isRealId ? bookingId : undefined,
  );

  const [changeReason, setChangeReason] = useState("");
  const [refundNote, setRefundNote] = useState("");
  const [noShowOpen, setNoShowOpen] = useState(false);
  const noShow = useNoShow();
  const acceptChange = useAcceptChange();
  const rejectChange = useRejectChange();
  const forwardRefund = useForwardRefund();

  if (!isRealId) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Không tìm thấy đơn này"
        description="Đường dẫn không phải một mã đơn hợp lệ. Hãy mở đơn từ danh sách đặt phòng."
        action={
          <Link href="/staff/bookings" className={cn(buttonVariants(), "h-10")}>
            Danh sách đặt phòng
          </Link>
        }
        className="mx-auto mt-10 max-w-xl"
      />
    );
  }

  if (isLoading) return <LoadingState rows={4} label="Đang tải đặt phòng…" />;

  if (error || !booking) {
    return (
      <ErrorState
        title="Không tải được đặt phòng"
        error={error}
        fallback="Đơn không tồn tại, không thuộc khách sạn của bạn, hoặc bạn thiếu quyền BOOKING/REFUND."
        onRetry={() => void refetch()}
        action={
          <Link href="/staff/bookings" className={cn(buttonVariants({ variant: "outline" }), "h-10")}>
            Danh sách đặt phòng
          </Link>
        }
        className="mx-auto mt-10 max-w-xl"
      />
    );
  }

  const created = formatDateTime(booking.createdAt);
  const pendingChange = booking.changeRequest?.status === "PENDING";
  const refundPending = booking.paymentStatus === "REFUND_PENDING";
  const today = todayInVietnam();
  const canNoShow =
    booking.status === "CONFIRMED" && booking.paymentStatus === "PAID" && booking.checkIn < today;
  const canCheckIn =
    booking.status === "CONFIRMED" && booking.paymentStatus === "PAID" && booking.checkIn <= today && booking.checkOut > today;
  const code = encodeURIComponent(booking.code);

  const primary = pendingChange
    ? { label: "Xử lý yêu cầu đổi thông tin", href: "#change-request", icon: UserCog }
    : refundPending
      ? { label: "Chuyển hoàn tiền", href: "#refund-request", icon: Send }
      : canCheckIn
        ? { label: "Nhận phòng", href: `/staff/check-in?code=${code}`, icon: BedDouble }
        : booking.status === "CHECKED_IN"
          ? { label: "Trả phòng", href: `/staff/check-out?code=${code}`, icon: LogOut }
          : null;

  const menu: ActionMenuItem[] = [
    { label: "Làm mới", description: "Tải lại đơn từ hệ thống", icon: RefreshCw, onSelect: () => void refetch(), disabled: isFetching },
    { label: "In phiếu đăng ký", icon: PrintIcon, onSelect: () => window.print() },
    ...(canNoShow
      ? [{
          label: "Đánh dấu khách không đến",
          description: "Khách sạn giữ tiền, các đêm còn lại được giải phóng. Không hoàn tác được.",
          icon: Ban,
          destructive: true,
          onSelect: () => setNoShowOpen(true),
        }]
      : []),
  ];

  return (
    <div className="space-y-6 pb-16">
      <Card className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/staff/dashboard" className="transition-colors hover:text-primary">
            Bàn làm việc
          </Link>
          <span>›</span>
          <Link href="/staff/bookings" className="transition-colors hover:text-primary">
            Danh sách đặt phòng
          </Link>
          <span>›</span>
          <span className="font-bold text-foreground">Đơn #{booking.code}</span>
        </div>

        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                Chi tiết đặt phòng{" "}
                <span className="font-mono font-bold text-primary">#{booking.code}</span>
              </h1>
              <StatusPill booking={booking} />
            </div>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5" /> {booking.hotel.name}, {booking.hotel.city}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" /> Tạo lúc {created}
              </span>
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {primary && (
              <a
                href={primary.href}
                className={cn(buttonVariants(), "h-11 flex-1 gap-2 whitespace-nowrap px-4 text-sm font-semibold lg:flex-none")}
              >
                <primary.icon className="size-4" aria-hidden /> {primary.label}
              </a>
            )}
            <ActionMenu items={menu} className="h-11" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col space-y-6 lg:col-span-8">
          <Card className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                <User className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Thông tin khách lưu trú</h2>
                <p className="text-xs text-muted-foreground">Liên hệ và yêu cầu đặc biệt của khách</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/50 p-4 md:grid-cols-3">
              <Field label="Họ và tên khách" value={booking.guestName} />
              <Field
                label="Người đặt"
                value={
                  booking.bookedBy.name === booking.guestName
                    ? "Chính khách lưu trú"
                    : `${booking.bookedBy.name}${booking.bookedBy.phone ? ` · ${booking.bookedBy.phone}` : ""}`
                }
              />
              <Field
                label="Số điện thoại"
                value={
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Phone className="size-3.5 text-muted-foreground" /> {booking.contactPhone}
                  </span>
                }
              />
              <Field
                label="Giờ đến dự kiến"
                value={
                  booking.arrivalTime ? (
                    <span className="font-mono">{booking.arrivalTime}</span>
                  ) : (
                    "Chưa cung cấp"
                  )
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/50 p-4 text-xs md:grid-cols-4">
              <Field label="Số phòng đặt" value={`${booking.rooms} phòng`} />
              <Field label="Số khách" value={`${booking.guests} khách`} />
              <Field label="Số đêm" value={`${booking.nights} đêm`} />
              <Field label="Hạng phòng" value={booking.roomType.name} />
            </div>

            <div className="space-y-1 rounded-xl border border-orange-200/70 bg-orange-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <Sparkles className="size-3.5" /> Yêu cầu đặc biệt
              </div>
              <p className="pl-6 text-xs italic leading-relaxed text-foreground">
                {booking.specialRequests || "Khách không ghi yêu cầu đặc biệt."}
              </p>
            </div>
          </Card>

          <Card className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary">
                <BedDouble className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Thông tin kỳ nghỉ</h2>
                <p className="text-xs text-muted-foreground">Thời gian lưu trú và hạng phòng đã đặt</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
              <div className="relative min-h-[160px] overflow-hidden rounded-xl bg-muted shadow-2xs md:col-span-5">
                {booking.hotel.coverImageUrl ? (
                  <Image
                    src={booking.hotel.coverImageUrl}
                    alt={booking.roomType.name}
                    fill
                    sizes="(min-width: 1024px) 320px, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <BedDouble className="size-8" />
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-3 text-white">
                  <span className="text-xs font-bold uppercase">{booking.roomType.name}</span>
                  <span className="text-xs font-semibold">{booking.hotel.name}</span>
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-4 md:col-span-7">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/50 p-3.5 text-xs">
                  <div className="space-y-0.5 border-r border-border pr-2">
                    <span className="block text-xs font-bold uppercase text-muted-foreground">
                      Nhận phòng
                    </span>
                    <span className="block text-sm font-bold text-primary">
                      {formatCalendarDate(booking.checkIn)}
                    </span>
                    <span className="block text-xs font-semibold capitalize text-foreground">
                      {weekdayLabel(booking.checkIn)}
                    </span>
                  </div>
                  <div className="space-y-0.5 pl-2">
                    <span className="block text-xs font-bold uppercase text-muted-foreground">
                      Trả phòng
                    </span>
                    <span className="block text-sm font-bold text-primary">
                      {formatCalendarDate(booking.checkOut)}
                    </span>
                    <span className="block text-xs font-semibold capitalize text-foreground">
                      {weekdayLabel(booking.checkOut)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-border bg-muted p-2">
                    <span className="block text-xs font-semibold text-muted-foreground">Thời gian</span>
                    <span className="block font-bold text-foreground">{booking.nights} đêm</span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted p-2">
                    <span className="block text-xs font-semibold text-muted-foreground">Số khách</span>
                    <span className="block font-bold text-foreground">{booking.guests}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-muted p-2">
                    <span className="block text-xs font-semibold text-muted-foreground">Số phòng</span>
                    <span className="block font-bold text-foreground">{booking.rooms}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-800">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Hoá đơn &amp; thanh toán</h2>
                <p className="text-xs text-muted-foreground">Giá đã chốt lúc đặt; dịch vụ phát sinh thu tại quầy</p>
              </div>
            </div>

            {booking.holdExpiresAt && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                Đang giữ phòng chờ thanh toán đến {formatDateTime(booking.holdExpiresAt)}
              </p>
            )}
            <BookingInvoice booking={booking} />
          </Card>

          <Card className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-sky-100 font-bold text-sky-800">
                <ConciergeBell className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Dịch vụ thêm</h2>
                <p className="text-xs text-muted-foreground">Đặt kèm khi đặt phòng, hoặc phát sinh trong kỳ lưu trú</p>
              </div>
            </div>
            <FrontDeskAddOns booking={booking} />
          </Card>
        </div>

        <div className="flex flex-col space-y-6 lg:col-span-4">
          {pendingChange && (
            <Card id="change-request" className="scroll-mt-24 space-y-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 shadow-none">
              <h2 className="flex items-center gap-2 text-sm font-bold text-amber-900">
                <UserCog className="size-4" /> Yêu cầu đổi thông tin khách
              </h2>
              <div className="space-y-2 rounded-lg bg-card p-3 text-xs">
                {booking.changeRequest?.changes.guestName && (
                  <p><span className="text-muted-foreground">Họ tên:</span> <strong>{booking.changeRequest.changes.guestName}</strong></p>
                )}
                {booking.changeRequest?.changes.contactPhone && (
                  <p><span className="text-muted-foreground">SĐT:</span> <strong>{booking.changeRequest.changes.contactPhone}</strong></p>
                )}
                {booking.changeRequest?.changes.arrivalTime !== undefined && (
                  <p><span className="text-muted-foreground">Giờ đến:</span> <strong>{booking.changeRequest.changes.arrivalTime ?? "Xoá"}</strong></p>
                )}
                {booking.changeRequest?.changes.specialRequests !== undefined && (
                  <p><span className="text-muted-foreground">Yêu cầu:</span> <strong>{booking.changeRequest.changes.specialRequests ?? "Xoá"}</strong></p>
                )}
                <p className="text-xs text-muted-foreground">
                  Gửi lúc {formatDateTime(booking.changeRequest?.requestedAt)}
                </p>
              </div>

              {(acceptChange.error || rejectChange.error) && (
                <Alert variant="destructive" className="bg-red-50 p-3">
                  <AlertDescription className="text-xs">
                    {getApiErrorMessage(acceptChange.error ?? rejectChange.error, "Không xử lý được yêu cầu.")}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => acceptChange.mutate(booking.id)}
                  disabled={acceptChange.isPending || rejectChange.isPending}
                  className="h-10 flex-1 gap-1.5 text-sm font-semibold"
                >
                  <ThumbsUp className="size-3.5" /> Chấp nhận
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!changeReason.trim()) return;
                    rejectChange.mutate({ bookingId: booking.id, reason: changeReason.trim() });
                  }}
                  disabled={!changeReason.trim() || acceptChange.isPending || rejectChange.isPending}
                  className="h-10 flex-1 gap-1.5 text-sm font-semibold text-destructive"
                >
                  <ThumbsDown className="size-3.5" /> Từ chối
                </Button>
              </div>
              <Input
                value={changeReason}
                onChange={(event) => setChangeReason(event.target.value)}
                aria-label="Lý do từ chối"
                placeholder="Lý do từ chối (bắt buộc khi từ chối)…"
                className="h-10 bg-card text-sm"
              />
            </Card>
          )}

          {refundPending && (
            <Card id="refund-request" className="scroll-mt-24 space-y-3 rounded-2xl border border-sky-200 bg-sky-50/60 p-5 shadow-none">
              <h2 className="flex items-center gap-2 text-sm font-bold text-sky-900">
                <Send className="size-4" /> Yêu cầu hoàn tiền
              </h2>
              <p className="text-xs text-sky-900">
                Khách yêu cầu hoàn <strong>{formatMoney(booking.refund?.amount ?? 0)}</strong>. Chuyển yêu cầu này
                tới chủ khách sạn để quyết định; ghi chú là bắt buộc.
              </p>
              {forwardRefund.error && (
                <p className="text-xs text-destructive">
                  {getApiErrorMessage(forwardRefund.error, "Không chuyển được yêu cầu.")}
                </p>
              )}
              {forwardRefund.isSuccess ? (
                <p className="rounded-lg bg-card p-3 text-xs font-semibold text-emerald-700">
                  Đã chuyển yêu cầu cho chủ khách sạn. Chủ khách sạn sẽ duyệt hoặc từ chối.
                </p>
              ) : (
                <>
                  <Input
                    value={refundNote}
                    onChange={(event) => setRefundNote(event.target.value)}
                    aria-label="Ghi chú cho chủ khách sạn (bắt buộc)"
                    placeholder="Ghi chú đã kiểm tra, gửi chủ khách sạn (bắt buộc)…"
                    className="h-10 bg-card text-sm"
                  />
                  <Button
                    onClick={() => {
                      if (!refundNote.trim()) return;
                      forwardRefund.mutate({ bookingId: booking.id, note: refundNote.trim() });
                    }}
                    disabled={!refundNote.trim() || forwardRefund.isPending}
                    className="h-10 w-full gap-1.5 text-sm font-semibold"
                  >
                    <Send className="size-3.5" /> Chuyển cho chủ khách sạn
                  </Button>
                </>
              )}
            </Card>
          )}

          <Card className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <ShieldCheck className="size-4 text-primary" /> Chính sách huỷ
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Miễn phí huỷ trước</span>
                <span className="text-right font-semibold text-foreground">
                  {booking.cancellation.freeUntil
                    ? formatDateTime(booking.cancellation.freeUntil)
                    : "Không có thời gian miễn phí"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Phí huỷ sau hạn</span>
                <span className="font-semibold text-foreground">{booking.cancellation.feePercent}%</span>
              </div>
              {booking.refund && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Yêu cầu hoàn tiền</span>
                  <span className="font-semibold text-foreground">
                    {paymentStatusLabels[booking.refund.status].label} ·{" "}
                    {formatMoney(booking.refund.amount)}
                  </span>
                </div>
              )}
              {booking.cancelledAt && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">Đã huỷ lúc</span>
                  <span className="font-semibold text-foreground">{formatDateTime(booking.cancelledAt)}</span>
                </div>
              )}
              {booking.cancelReason && (
                <p className="rounded-lg bg-muted/50 p-2.5 text-xs text-muted-foreground">
                  Lý do: {booking.cancelReason}
                </p>
              )}
            </div>
          </Card>

          <Card className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <History className="size-4 text-primary" /> Lịch sử đơn
            </h2>
            <BookingTimeline timeline={booking.timeline} />
          </Card>

          <Card className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-2xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarClock className="size-4 text-primary" /> Thông tin khác
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="size-3.5" /> Khách nhận e-voucher qua email đã đăng ký.
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-3.5" /> Đơn đặt cho {booking.guests} khách.
              </div>
            </div>
          </Card>
        </div>
      </div>

      <AlertDialog open={noShowOpen} onOpenChange={setNoShowOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Đánh dấu khách không đến?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn {booking.code} của {booking.guestName} sẽ chuyển sang &quot;Khách không đến&quot;. Khách sạn giữ
              tiền và các đêm còn lại được giải phóng. Không hoàn tác được.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {noShow.error && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(noShow.error, "Không thể đánh dấu khách không đến.")}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">Giữ nguyên</AlertDialogCancel>
            <Button
              variant="destructive"
              className="h-10 gap-2"
              disabled={noShow.isPending}
              onClick={() => noShow.mutate(booking.id, { onSuccess: () => setNoShowOpen(false) })}
            >
              {noShow.isPending && <Loader2 className="size-4 animate-spin" />} Xác nhận không đến
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
