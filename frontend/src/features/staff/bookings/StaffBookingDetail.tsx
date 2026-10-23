"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  History,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import type { Booking } from "@stayreco/shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getApiErrorMessage } from "@/lib/api-error";
import { useBooking } from "../api/staff-queries";
import {
  bookingStatusLabels,
  formatCalendarDate,
  formatDateTime,
  formatMoney,
  paymentStatusLabels,
  toneClasses,
  weekdayLabel,
} from "../lib/labels";

function StatusBadge({ status }: { status: Booking["status"] }) {
  const { label, tone } = bookingStatusLabels[status];
  return (
    <Badge variant="outline" className={`text-xs font-semibold ${toneClasses[tone]}`}>
      {label}
    </Badge>
  );
}

function PaymentBadge({ status }: { status: Booking["paymentStatus"] }) {
  const { label, tone } = paymentStatusLabels[status];
  return (
    <Badge variant="outline" className={`text-xs font-semibold ${toneClasses[tone]}`}>
      {label}
    </Badge>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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

  if (!isRealId) {
    return (
      <Card className="mx-auto mt-10 max-w-xl space-y-4 border-border p-8 text-center shadow-2xs">
        <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-foreground">Đơn mẫu chưa có trên hệ thống</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách đặt phòng của staff đang dùng dữ liệu mẫu vì API danh sách
            (<code className="font-mono text-xs">GET /hotels/:hotelId/bookings</code>) chưa được
            phát hành. Trang chi tiết chỉ tải được đơn có id thật từ backend.
          </p>
        </div>
        <Link href="/staff/bookings">
          <Button className="gap-2">
            <ArrowLeft className="size-4" /> Quay lại danh sách
          </Button>
        </Link>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" /> Đang tải đặt phòng…
      </div>
    );
  }

  if (error || !booking) {
    return (
      <Card className="mx-auto mt-10 max-w-xl space-y-4 border-border p-8 text-center shadow-2xs">
        <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-foreground">Không tải được đặt phòng</h1>
          <p className="text-sm text-muted-foreground">
            {error
              ? getApiErrorMessage(error, "Đơn không tồn tại, không thuộc khách sạn của bạn, hoặc bạn thiếu quyền BOOKING/REFUND.")
              : "Không tìm thấy đơn đặt phòng."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" onClick={() => void refetch()} className="gap-2">
            <RefreshCw className="size-4" /> Thử lại
          </Button>
          <Link href="/staff/bookings">
            <Button className="gap-2">
              <ArrowLeft className="size-4" /> Danh sách đặt phòng
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const created = formatDateTime(booking.createdAt);

  return (
    <div className="space-y-6 pb-16">
      <Card className="space-y-4 rounded-2xl border border-border bg-white p-6 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/staff/dashboard" className="transition-colors hover:text-primary">
            Tác vụ vận hành
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
              <StatusBadge status={booking.status} />
              <PaymentBadge status={booking.paymentStatus} />
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

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => void refetch()}
              disabled={isFetching}
              className="h-11 gap-2 border-border bg-slate-50 text-xs font-semibold text-foreground hover:bg-slate-100"
            >
              <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> Làm mới
            </Button>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="h-11 gap-2 border-border bg-slate-50 text-xs font-semibold text-foreground hover:bg-slate-100"
            >
              <Printer className="size-4" /> In phiếu đăng ký
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col space-y-6 lg:col-span-8">
          <Card className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100 font-bold text-[#934a33]">
                <User className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Thông tin khách lưu trú</h2>
                <p className="text-xs text-muted-foreground">Liên hệ và yêu cầu đặc biệt của khách</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-slate-50 p-4 md:grid-cols-3">
              <Field label="Họ và tên khách" value={booking.guestName} />
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

            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-slate-50 p-4 text-xs md:grid-cols-4">
              <Field label="Số phòng đặt" value={`${booking.rooms} phòng`} />
              <Field label="Số khách" value={`${booking.guests} khách`} />
              <Field label="Số đêm" value={`${booking.nights} đêm`} />
              <Field label="Hạng phòng" value={booking.roomType.name} />
            </div>

            <div className="space-y-1 rounded-xl border border-orange-200/70 bg-orange-50/80 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#934a33]">
                <Sparkles className="size-3.5" /> Yêu cầu đặc biệt
              </div>
              <p className="pl-6 text-xs italic leading-relaxed text-foreground">
                {booking.specialRequests || "Khách không ghi yêu cầu đặc biệt."}
              </p>
            </div>
          </Card>

          <Card className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-2xs">
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
              <div className="relative min-h-[160px] overflow-hidden rounded-xl bg-slate-100 shadow-2xs md:col-span-5">
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
                  <span className="text-[11px] font-bold uppercase">{booking.roomType.name}</span>
                  <span className="text-xs font-semibold">{booking.hotel.name}</span>
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-4 md:col-span-7">
                <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-slate-50 p-3.5 text-xs">
                  <div className="space-y-0.5 border-r border-border pr-2">
                    <span className="block text-[10px] font-bold uppercase text-muted-foreground">
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
                    <span className="block text-[10px] font-bold uppercase text-muted-foreground">
                      Trả phòng
                    </span>
                    <span className="block text-sm font-bold text-[#934a33]">
                      {formatCalendarDate(booking.checkOut)}
                    </span>
                    <span className="block text-xs font-semibold capitalize text-foreground">
                      {weekdayLabel(booking.checkOut)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg border border-border bg-slate-100 p-2">
                    <span className="block text-[10px] font-semibold text-muted-foreground">Thời gian</span>
                    <span className="block font-bold text-foreground">{booking.nights} đêm</span>
                  </div>
                  <div className="rounded-lg border border-border bg-slate-100 p-2">
                    <span className="block text-[10px] font-semibold text-muted-foreground">Số khách</span>
                    <span className="block font-bold text-foreground">{booking.guests}</span>
                  </div>
                  <div className="rounded-lg border border-border bg-slate-100 p-2">
                    <span className="block text-[10px] font-semibold text-muted-foreground">Số phòng</span>
                    <span className="block font-bold text-foreground">{booking.rooms}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-2xs">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-100 font-bold text-emerald-800">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Quyết toán tài chính</h2>
                <p className="text-xs text-muted-foreground">Giá đã chốt tại thời điểm đặt phòng</p>
              </div>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border bg-slate-50 text-[10px] font-bold uppercase text-muted-foreground">
                    <th className="px-3 py-2.5">Đêm</th>
                    <th className="px-3 py-2.5">Ngày</th>
                    <th className="px-3 py-2.5 text-right">Giá mỗi đêm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {booking.nightlyPrices.map((night) => (
                    <tr key={night.date}>
                      <td className="px-3 py-3 font-semibold text-foreground">
                        {formatCalendarDate(night.date)}
                      </td>
                      <td className="px-3 py-3 capitalize text-muted-foreground">
                        {weekdayLabel(night.date)}
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-semibold text-foreground">
                        {formatMoney(night.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col items-center justify-between gap-4 rounded-xl bg-primary p-4 text-primary-foreground shadow-sm sm:flex-row">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-6 shrink-0 text-emerald-400" />
                <div>
                  <span className="block text-xs font-bold">
                    {booking.paymentStatus === "PAID"
                      ? `Đã thanh toán${booking.paidAt ? ` lúc ${formatDateTime(booking.paidAt)}` : ""}`
                      : paymentStatusLabels[booking.paymentStatus].label}
                  </span>
                  <span className="block text-[11px] text-white/80">
                    {booking.holdExpiresAt
                      ? `Giữ phòng đến ${formatDateTime(booking.holdExpiresAt)}`
                      : `${booking.rooms} phòng × ${booking.nights} đêm`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-semibold uppercase text-white/80">
                  Tổng thanh toán
                </span>
                <span className="block font-mono text-xl font-bold text-white">
                  {formatMoney(booking.totalAmount)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-col space-y-6 lg:col-span-4">
          <Card className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-2xs">
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
                <p className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-muted-foreground">
                  Lý do: {booking.cancelReason}
                </p>
              )}
            </div>
          </Card>

          <Card className="space-y-4 rounded-2xl border border-border bg-white p-5 shadow-2xs">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <History className="size-4 text-[#934a33]" /> Lịch sử đơn
            </h2>
            {booking.timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground">Chưa có cập nhật.</p>
            ) : (
              <ol className="space-y-3">
                {booking.timeline.map((entry, index) => (
                  <li key={`${entry.at}-${index}`} className="flex gap-3 text-xs">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{entry.event}</p>
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(entry.at)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-2xs">
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
    </div>
  );
}
