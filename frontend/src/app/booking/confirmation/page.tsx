'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Download,
  Loader2,
  Mail,
  MapPin,
  Printer,
  QrCode,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/lib/auth-store';
import { useBooking, useBookingVoucher } from '@/features/booking/api/booking-queries';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

function qrImage(token: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(token)}`;
}

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

  return (
    <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-8 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EDF4EE] text-[#35624A]">
          <CheckCircle2 className="size-9" />
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#202B36] sm:text-3xl">
          Đặt phòng thành công!
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
          Mã đặt phòng của bạn là <strong className="font-bold text-[#013758]">{booking.code}</strong>. Email xác nhận
          và voucher điện tử đã được gửi tới{' '}
          <span className="font-semibold text-[#202B36]">{user?.email ?? booking.contactPhone}</span>.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 bg-[#f1f3f9] p-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Mã đặt phòng
                </span>
                <p className="font-mono text-xl font-bold text-[#013758]">{booking.code}</p>
              </div>
              <Badge className="border-none bg-[#EDF4EE] text-xs font-semibold text-[#35624A]">
                {booking.status === 'CHECKED_IN' ? 'Đang lưu trú' : 'Đã xác nhận'}
              </Badge>
            </div>

            <div className="flex flex-col gap-6 p-5 sm:flex-row">
              <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-48">
                <Image src={image} alt={booking.hotel.name} fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <h2 className="text-lg font-bold text-[#202B36]">{booking.hotel.name}</h2>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="size-3.5 text-[#013758]" /> {booking.hotel.city}
                </p>
                <p className="text-sm font-semibold text-[#013758]">{booking.roomType.name}</p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Nhận phòng</span>
                    <span className="font-bold text-[#202B36]">{formatDate(booking.checkIn)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Trả phòng</span>
                    <span className="font-bold text-[#202B36]">{formatDate(booking.checkOut)}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Số phòng</span>
                    <span className="font-bold text-[#202B36]">{booking.rooms}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Số đêm</span>
                    <span className="font-bold text-[#202B36]">{booking.nights}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-slate-100 p-5 text-xs sm:grid-cols-2">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 size-4 text-[#013758]" />
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">Khách nhận phòng</span>
                  <span className="font-semibold text-[#202B36]">{booking.guestName}</span>
                  <span className="block text-slate-500">{booking.contactPhone}</span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 size-4 text-[#013758]" />
                <div>
                  <span className="block text-[10px] font-semibold uppercase text-slate-400">Thanh toán</span>
                  <span className="font-semibold text-[#202B36]">{formatMoney(booking.totalAmount)}</span>
                  <span className="block text-slate-500">
                    {booking.paidAt ? formatDateTime(booking.paidAt) : 'Đã thanh toán'}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#202B36]">
              <ShieldCheck className="size-4 text-[#35624A]" /> Chính sách hủy phòng
            </h2>
            <p className="text-xs leading-relaxed text-slate-600">
              {booking.cancellation.freeUntil
                ? `Miễn phí hủy trước ${formatDateTime(booking.cancellation.freeUntil)}. Sau thời điểm này, phí hủy là ${booking.cancellation.feePercent}% giá trị đặt phòng.`
                : `Đơn không hoàn hủy. Phí hủy là ${booking.cancellation.feePercent}% giá trị đặt phòng.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/account/bookings/${booking.id}`}>
                <Button variant="outline" className="h-9 gap-1.5 text-xs font-semibold">
                  Chi tiết đặt phòng
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="h-9 gap-1.5 text-xs font-semibold"
              >
                <Printer className="size-3.5" /> In xác nhận
              </Button>
            </div>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
          <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md">
            <div className="border-b border-slate-200/60 bg-[#013758] p-4 text-center text-white">
              <QrCode className="mx-auto size-6" />
              <h3 className="mt-1 text-sm font-bold">E-Voucher Check-in</h3>
              <p className="text-[11px] text-white/70">Xuất trình mã này tại quầy lễ tân</p>
            </div>
            <div className="flex flex-col items-center p-5">
              {voucher ? (
                <>
                  <div className="rounded-xl border border-slate-200 bg-white p-2">
                    <Image
                      src={qrImage(voucher.qrToken)}
                      alt={`Mã QR voucher ${voucher.code}`}
                      width={208}
                      height={208}
                      unoptimized
                      className="size-52 object-contain"
                    />
                  </div>
                  <p className="mt-3 font-mono text-sm font-bold text-[#013758]">{voucher.code}</p>
                  <p className="mt-1 text-center text-[11px] text-slate-500">
                    {voucher.hotelName} · {voucher.roomTypeName}
                  </p>
                  <a
                    href={qrImage(voucher.qrToken)}
                    download={`stayreco-voucher-${voucher.code}.png`}
                    className="mt-4 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="size-3.5" /> Tải voucher
                  </a>
                </>
              ) : voucherQuery.isLoading ? (
                <div className="flex items-center gap-2 py-10 text-xs text-slate-500">
                  <Loader2 className="size-4 animate-spin" /> Đang tạo voucher…
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <Mail className="mx-auto mb-2 size-6 text-slate-400" />
                  Voucher sẽ hiển thị khi đơn được xác nhận thanh toán.
                </div>
              )}
            </div>
          </Card>

          <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-xs text-slate-500">
            <p className="flex items-center gap-1.5 font-semibold text-[#202B36]">
              <Mail className="size-3.5 text-[#013758]" /> Cần hỗ trợ?
            </p>
            <p className="mt-1">Liên hệ khách sạn hoặc StayReco nếu cần thay đổi thông tin khách lưu trú.</p>
            <Link
              href="/account/bookings"
              className="mt-3 inline-flex items-center gap-1 font-semibold text-[#013758] hover:underline"
            >
              Quản lý chuyến đi <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </aside>
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
