'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  Clock,
  FileText,
  ListChecks,
  Loader2,
  Mail,
  MapPin,
  Moon,
  Navigation,
  Printer,
  QrCode,
  ReceiptText,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { useBooking, useBookingVoucher } from '@/features/booking/api/booking-queries';
import { CopyCodeButton, VoucherQr } from '@/features/booking/components/VoucherQr';
import { BookingInvoice } from '@/features/booking/components/BookingInvoice';
import {
  checkInCountdown,
  daysBetween,
  downloadStayCalendar,
  mapsSearchUrl,
  todayInVietnam,
} from '@/features/booking/lib/stay-calendar';
import { formatDate, formatDateTime, formatWeekday } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') ?? undefined;
  const user = useAuthStore((state) => state.user);
  const bookingQuery = useBooking(bookingId);
  const booking = bookingQuery.data;

  const canShowVoucher = booking?.status === 'CONFIRMED' || booking?.status === 'CHECKED_IN';
  const voucherQuery = useBookingVoucher(bookingId, !!canShowVoucher);
  const voucher = voucherQuery.data;
  const image = booking?.hotel.coverImageUrl ?? FALLBACK_IMAGE;
  // Read once when the page opens: the deadline badge does not need to tick.
  const [openedAt] = useState(() => Date.now());

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">Không tìm thấy đơn đặt phòng</h1>
        <Link href="/account/bookings">
          <Button className="mt-5 bg-[#013758] text-white">Chuyến đi của tôi</Button>
        </Link>
      </div>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="size-5 animate-spin" /> Đang tải xác nhận…
      </div>
    );
  }

  if (bookingQuery.error || !booking) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">Không tải được đơn đặt phòng</h1>
        <p className="mt-1 text-sm text-slate-500">
          {bookingQuery.error ? getApiErrorMessage(bookingQuery.error) : 'Đơn đặt phòng không tồn tại.'}
        </p>
        <Link href="/account/bookings">
          <Button className="mt-5 bg-[#013758] text-white">Chuyến đi của tôi</Button>
        </Link>
      </div>
    );
  }

  if (booking.status === 'PENDING') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">Đơn chưa được thanh toán</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hoàn tất chuyển khoản để nhận voucher điện tử. Đơn đang giữ chỗ đến{' '}
          {formatDateTime(booking.holdExpiresAt)}.
        </p>
        <Link href={`/booking/payment?id=${booking.id}`}>
          <Button className="mt-5 bg-[#013758] text-white">Đi tới thanh toán</Button>
        </Link>
      </div>
    );
  }

  if (booking.status === 'EXPIRED' || booking.status === 'CANCELLED') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">
          {booking.status === 'EXPIRED' ? 'Đơn đã hết hạn giữ chỗ' : 'Đơn đặt phòng đã hủy'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Vui lòng đặt lại nếu bạn vẫn muốn lưu trú.</p>
        <Link href="/search">
          <Button className="mt-5 bg-[#013758] text-white">Tìm chỗ nghỉ</Button>
        </Link>
      </div>
    );
  }

  const countdown = booking.status === 'CONFIRMED' ? checkInCountdown(booking.checkIn) : null;
  const today = todayInVietnam();
  const freeCancelOpen = !!booking.cancellation.freeUntil && Date.parse(booking.cancellation.freeUntil) > openedAt;
  const canCancel = booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';
  const stayStarted = booking.status === 'CHECKED_IN' || daysBetween(today, booking.checkIn) <= 0;

  const steps: { title: string; detail: string; done: boolean }[] = [
    {
      title: 'Thanh toán thành công',
      detail: booking.paidAt ? formatDateTime(booking.paidAt) : 'Đã xác nhận',
      done: true,
    },
    {
      title: 'Nhận email xác nhận',
      detail: `Gửi tới ${user?.email ?? 'email tài khoản của bạn'}, kèm voucher điện tử`,
      done: true,
    },
    {
      title: `Nhận phòng ${formatDate(booking.checkIn)}`,
      detail: 'Đưa mã QR cho lễ tân quét, kèm giấy tờ tuỳ thân của khách nhận phòng',
      done: booking.status === 'CHECKED_IN',
    },
    {
      title: `Trả phòng ${formatDate(booking.checkOut)}`,
      detail: 'Lễ tân quét lại mã QR; dịch vụ phát sinh (nếu có) thanh toán tại quầy',
      done: false,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
      <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-[#013758] to-[#234e70] px-5 py-7 text-white shadow-md sm:px-8 sm:py-9 print:bg-none print:text-[#202B36] print:shadow-none">
        <div className="pointer-events-none absolute -top-16 -right-16 size-56 rounded-full bg-white/5" aria-hidden />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-48 rounded-full bg-white/5" aria-hidden />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300 ring-4 ring-emerald-400/10 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:duration-500">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Đặt phòng thành công!</h1>
              <p className="mt-1 max-w-xl text-sm text-white/75 print:text-slate-600">
                Chúng tôi đã gửi email xác nhận và voucher điện tử tới{' '}
                <span className="font-semibold text-white print:text-[#202B36]">{user?.email ?? booking.contactPhone}</span>.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-base font-bold tracking-wider">
                  {booking.code}
                </span>
                <CopyCodeButton code={booking.code} className="text-white/80 hover:bg-white/10 hover:text-white print:hidden" />
              </div>
            </div>
          </div>
          {countdown && (
            <div className="flex items-center gap-3 self-start rounded-xl bg-white/10 px-4 py-3 md:self-auto">
              <CalendarClock className="size-6 text-amber-300" />
              <div>
                <span className="block text-[11px] text-white/70">Chuyến đi sắp tới</span>
                <span className="text-sm font-bold">{countdown}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <aside className="order-first space-y-4 lg:sticky lg:top-24 lg:order-last lg:col-span-4">
          <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md">
            <div className="border-b border-slate-200/60 bg-[#013758] p-4 text-center text-white">
              <QrCode className="mx-auto size-6" />
              <h2 className="mt-1 text-sm font-bold">E-Voucher check-in</h2>
              <p className="text-[11px] text-white/70">Bấm vào mã để phóng to khi đưa lễ tân quét</p>
            </div>
            <div className="flex flex-col items-center p-5">
              {voucher ? (
                <>
                  <VoucherQr token={voucher.qrToken} code={voucher.code} voucher={voucher} className="w-full" />
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    {voucher.hotelName} · {voucher.items.map((item) => item.roomTypeName).join(', ')}
                  </p>
                </>
              ) : voucherQuery.isLoading ? (
                <div className="flex items-center gap-2 py-10 text-xs text-slate-500">
                  <Loader2 className="size-4 animate-spin" /> Đang tạo voucher…
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <Mail className="mx-auto mb-2 size-6 text-slate-400" />
                  {voucherQuery.error
                    ? getApiErrorMessage(voucherQuery.error, 'Không tải được voucher. Vui lòng thử lại sau.')
                    : 'Voucher sẽ hiển thị khi đơn được xác nhận thanh toán.'}
                </div>
              )}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2 print:hidden">
            <Button
              variant="outline"
              onClick={() => downloadStayCalendar(booking)}
              className="h-auto flex-col gap-1 border-slate-200 bg-white py-3 text-xs font-semibold"
            >
              <CalendarPlus className="size-4 text-[#013758]" /> Thêm vào lịch
            </Button>
            <a
              href={mapsSearchUrl(booking)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-3 text-xs font-semibold text-[#202B36] transition-colors hover:bg-slate-50"
            >
              <Navigation className="size-4 text-[#013758]" /> Chỉ đường
            </a>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="h-auto flex-col gap-1 border-slate-200 bg-white py-3 text-xs font-semibold"
            >
              <Printer className="size-4 text-[#013758]" /> In xác nhận
            </Button>
            <Link
              href={`/account/bookings/${booking.id}`}
              className="flex flex-col items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white py-3 text-xs font-semibold text-[#202B36] transition-colors hover:bg-slate-50"
            >
              <FileText className="size-4 text-[#013758]" /> Chi tiết đơn
            </Link>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-xs text-slate-500 print:hidden">
            <p className="flex items-center gap-1.5 font-semibold text-[#202B36]">
              <Mail className="size-3.5 text-[#013758]" /> Cần hỗ trợ?
            </p>
            <p className="mt-1">
              Đổi tên khách hoặc giờ đến trong{' '}
              <Link href={`/account/bookings/${booking.id}`} className="font-semibold text-[#013758] hover:underline">
                chi tiết đơn
              </Link>
              . Email hỗ trợ: support@stayreco.vn
            </p>
            <Link
              href="/account/bookings"
              className="mt-3 inline-flex items-center gap-1 font-semibold text-[#013758] hover:underline"
            >
              Quản lý chuyến đi <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex flex-col gap-5 p-5 sm:flex-row">
              <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-auto sm:min-h-40 sm:w-52">
                <Image src={image} alt={booking.hotel.name} fill sizes="(min-width: 640px) 208px, 100vw" className="object-cover" />
                <Badge className="absolute top-2 left-2 border-none bg-white/90 text-[11px] font-semibold text-[#35624A]">
                  {booking.status === 'CHECKED_IN' ? 'Đang lưu trú' : 'Đã xác nhận'}
                </Badge>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <h2 className="text-lg font-bold text-[#202B36]">{booking.hotel.name}</h2>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <MapPin className="size-3.5 text-[#013758]" /> {booking.hotel.city}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#013758]">
                    {booking.items.map((item) => `${item.roomType.name} × ${item.rooms}`).join(', ')}
                  </p>
                </div>
                <div className="flex items-stretch overflow-hidden rounded-xl border border-slate-200 text-xs">
                  <div className="flex-1 bg-[#f1f3f9] p-3">
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Nhận phòng</span>
                    <span className="block text-sm font-bold text-[#202B36]">{formatDate(booking.checkIn)}</span>
                    <span className="capitalize text-slate-500">{formatWeekday(booking.checkIn)}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center border-x border-slate-200 bg-white px-3 text-center">
                    <Moon className="size-4 text-[#013758]" />
                    <span className="mt-0.5 font-bold text-[#202B36]">{booking.nights} đêm</span>
                  </div>
                  <div className="flex-1 bg-[#f1f3f9] p-3 text-right">
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Trả phòng</span>
                    <span className="block text-sm font-bold text-[#202B36]">{formatDate(booking.checkOut)}</span>
                    <span className="capitalize text-slate-500">{formatWeekday(booking.checkOut)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 size-4 shrink-0 text-[#013758]" />
                    <div className="min-w-0">
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">Khách nhận phòng</span>
                      <span className="block truncate font-semibold text-[#202B36]">{booking.guestName}</span>
                      <span className="text-slate-500">{booking.contactPhone}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BedDouble className="mt-0.5 size-4 shrink-0 text-[#013758]" />
                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">Phòng · khách</span>
                      <span className="font-semibold text-[#202B36]">
                        {booking.rooms} phòng · {booking.guests} khách
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 size-4 shrink-0 text-[#013758]" />
                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">Giờ đến dự kiến</span>
                      <span className="font-semibold text-[#202B36]">{booking.arrivalTime ?? 'Chưa chọn'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {booking.specialRequests && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-600">
                <span className="font-semibold text-[#202B36]">Yêu cầu đặc biệt:</span> {booking.specialRequests}
              </p>
            )}
          </Card>

          <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#202B36]">
              <ListChecks className="size-4 text-[#013758]" /> Các bước tiếp theo
            </h2>
            <ol className="relative space-y-5 border-l-2 border-slate-100 pl-6">
              {steps.map((step) => (
                <li key={step.title} className="relative">
                  <span
                    className={`absolute top-0 -left-[33px] flex size-5 items-center justify-center rounded-full ring-4 ring-white ${
                      step.done ? 'bg-[#35624A] text-white' : 'border-2 border-slate-300 bg-white'
                    }`}
                    aria-hidden
                  >
                    {step.done && <Check className="size-3" />}
                  </span>
                  <p className={`text-sm font-semibold ${step.done ? 'text-[#202B36]' : 'text-slate-600'}`}>{step.title}</p>
                  <p className="text-xs text-slate-500">{step.detail}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#202B36]">
              <ReceiptText className="size-4 text-[#013758]" /> Hoá đơn
            </h2>
            <BookingInvoice booking={booking} />
          </Card>

          <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-bold text-[#202B36]">
                <ShieldCheck className="size-4 text-[#35624A]" /> Chính sách hủy phòng
              </h2>
              {!stayStarted && (
                <Badge
                  className={`border-none text-[11px] font-semibold ${
                    freeCancelOpen ? 'bg-[#EDF4EE] text-[#35624A]' : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {freeCancelOpen ? 'Còn trong hạn huỷ miễn phí' : 'Đã qua hạn huỷ miễn phí'}
                </Badge>
              )}
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              {booking.cancellation.freeUntil
                ? `Miễn phí hủy trước ${formatDateTime(booking.cancellation.freeUntil)}. Sau thời điểm này, phí hủy là ${booking.cancellation.feePercent}% tiền phòng.`
                : `Đơn không hoàn hủy. Phí hủy là ${booking.cancellation.feePercent}% tiền phòng.`}
              {booking.invoice.addOnsTotal > 0 && ' Dịch vụ đặt kèm luôn được hoàn đủ.'}
            </p>
            {canCancel && !stayStarted && (
              <Link
                href={`/account/bookings/${booking.id}/cancel`}
                className="mt-3 inline-flex text-xs font-semibold text-[#934a33] hover:underline print:hidden"
              >
                Huỷ đặt phòng
              </Link>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin" /> Đang tải…
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
