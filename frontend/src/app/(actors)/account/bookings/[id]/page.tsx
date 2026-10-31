'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Bed,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BookingStatus, PaymentStatus } from '@stayreco/shared';
import { getApiErrorMessage } from '@/lib/api-error';
import { useBooking } from '@/features/booking/api/booking-queries';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

const BOOKING_STATUS: Record<BookingStatus, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
  NO_SHOW: 'Không đến nhận phòng',
};

const PAYMENT_STATUS: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  REFUND_PENDING: 'Chờ hoàn tiền',
  PARTIALLY_REFUNDED: 'Đã hoàn một phần',
  REFUNDED: 'Đã hoàn tiền',
  FAILED: 'Thanh toán thất bại',
};

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const bookingQuery = useBooking(params.id);
  const booking = bookingQuery.data;

  if (bookingQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f9ff]">
        <Header />
        <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin" /> Đang tải chi tiết đặt phòng…
        </div>
        <Footer />
      </div>
    );
  }

  if (bookingQuery.error || !booking) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f9ff]">
        <Header />
        <div className="mx-auto max-w-lg flex-1 px-4 py-20 text-center">
          <AlertTriangle className="mx-auto size-10 text-amber-500" />
          <h1 className="mt-3 text-xl font-bold text-[#202B36]">Không tìm thấy đặt phòng</h1>
          <p className="mt-1 text-sm text-slate-500">
            {bookingQuery.error ? getApiErrorMessage(bookingQuery.error) : 'Đơn đặt phòng không tồn tại.'}
          </p>
          <Link href="/account/bookings">
            <Button className="mt-5 bg-[#013758] text-white">Chuyến đi của tôi</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const canVoucher = booking.status === 'CONFIRMED' || booking.status === 'CHECKED_IN';
  const canCancel = booking.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';
  const canPay = booking.status === 'PENDING';
  const image = booking.hotel.coverImageUrl ?? FALLBACK_IMAGE;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans text-[#202B36] antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff]">
        <section className="w-full border-b border-slate-200/60 bg-[#f1f3f9] py-3">
          <div className="mx-auto flex max-w-marketplace flex-wrap items-center justify-between gap-3 px-4 text-xs sm:px-6">
            <AppBreadcrumb
              items={[
                { label: 'Tài khoản', href: '/account/profile' },
                { label: 'Chuyến đi của tôi', href: '/account/bookings' },
                { label: `Chi tiết #${booking.code}`, active: true },
              ]}
            />
            <span className="text-slate-500">
              Khách: <strong className="text-[#202B36]">{booking.guestName}</strong>
            </span>
          </div>
        </section>

        <section className="w-full border-b border-slate-200/60 bg-white py-6 shadow-xs">
          <div className="mx-auto flex max-w-marketplace flex-col justify-between gap-4 px-4 sm:px-6 lg:flex-row lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[#013758] sm:text-3xl">
                  Chi tiết đặt phòng #{booking.code}
                </h1>
                <Badge className="gap-1 border-none bg-[#EDF4EE] text-xs font-semibold text-[#35624A]">
                  {booking.status === 'CANCELLED' || booking.status === 'EXPIRED' ? (
                    <XCircle className="size-3.5" />
                  ) : (
                    <CheckCircle2 className="size-3.5" />
                  )}
                  {BOOKING_STATUS[booking.status]}
                </Badge>
                <Badge className="border-none bg-[#EAF0F5] text-xs font-semibold text-[#013758]">
                  {PAYMENT_STATUS[booking.paymentStatus]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Tạo lúc {formatDateTime(booking.createdAt)} · {booking.nights} đêm · {booking.rooms} phòng ·{' '}
                {booking.guests} khách
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canPay && (
                <Link href={`/booking/payment?id=${booking.id}`}>
                  <Button className="h-10 gap-1.5 bg-[#013758] px-4 text-xs font-bold text-white hover:bg-[#193B56]">
                    Thanh toán ngay
                  </Button>
                </Link>
              )}
              {canVoucher && (
                <Link href={`/booking/confirmation?id=${booking.id}`}>
                  <Button className="h-10 gap-1.5 bg-[#013758] px-4 text-xs font-bold text-white hover:bg-[#193B56]">
                    <QrCode className="size-4" /> Xem QR Voucher
                  </Button>
                </Link>
              )}
              {canCancel && (
                <Link href={`/account/bookings/${booking.id}/cancel`}>
                  <Button
                    variant="outline"
                    className="h-10 border-slate-300 px-4 text-xs font-semibold text-[#934a33]"
                  >
                    Hủy đặt phòng
                  </Button>
                </Link>
              )}
              <Link href="/account/bookings">
                <Button variant="outline" className="h-10 gap-1.5 border-slate-300 px-4 text-xs font-semibold">
                  <ArrowLeft className="size-4" /> Danh sách
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <Card className="flex flex-col gap-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:p-6">
                <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-5/12">
                  <Image src={image} alt={booking.hotel.name} fill className="object-cover" />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h2 className="text-xl font-bold text-[#202B36]">{booking.hotel.name}</h2>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="size-3.5 text-[#013758]" /> {booking.hotel.city}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
                    <p className="flex items-center gap-1.5">
                      <Bed className="size-3.5 text-[#013758]" /> {booking.roomType.name}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Users className="size-3.5 text-[#013758]" /> {booking.rooms} phòng · {booking.guests} khách
                    </p>
                    {booking.assignedRooms.length > 0 && (
                      <p className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5 text-[#35624A]" /> Phòng:{' '}
                        {booking.assignedRooms.map((room) => room.roomNumber).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-[#f1f3f9] p-3 text-xs">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">Nhận phòng</span>
                      <span className="font-bold text-[#202B36]">{formatDate(booking.checkIn)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold uppercase text-slate-400">Trả phòng</span>
                      <span className="font-bold text-[#202B36]">{formatDate(booking.checkOut)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#202B36]">
                  <User className="size-4 text-[#013758]" /> Thông tin khách lưu trú
                </h2>
                <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Khách nhận phòng</span>
                    <span className="font-semibold text-[#202B36]">{booking.guestName}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Số điện thoại</span>
                    <span className="flex items-center gap-1 font-semibold text-[#202B36]">
                      <Phone className="size-3" /> {booking.contactPhone}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Giờ đến dự kiến</span>
                    <span className="flex items-center gap-1 font-semibold text-[#202B36]">
                      <Clock className="size-3" /> {booking.arrivalTime ?? '—'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] font-semibold uppercase text-slate-400">Yêu cầu đặc biệt</span>
                    <span className="text-slate-600">{booking.specialRequests ?? 'Không có'}</span>
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-[#202B36]">
                  <Calendar className="size-4 text-[#013758]" /> Lịch sử đơn đặt phòng
                </h2>
                <div className="space-y-3">
                  {booking.timeline.length === 0 && (
                    <p className="text-xs text-slate-500">Chưa có cập nhật.</p>
                  )}
                  {booking.timeline.map((event, index) => (
                    <div key={`${event.at}-${index}`} className="flex gap-3 text-xs">
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-[#35624A]" />
                      <div>
                        <p className="font-semibold text-[#202B36]">{event.event}</p>
                        <p className="text-slate-500">{formatDateTime(event.at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="mb-2 flex items-center gap-2 text-base font-bold text-[#202B36]">
                  <ShieldCheck className="size-4 text-[#35624A]" /> Chính sách hủy
                </h2>
                <p className="text-xs leading-relaxed text-slate-600">
                  {booking.cancellation.freeUntil
                    ? `Miễn phí hủy trước ${formatDateTime(booking.cancellation.freeUntil)}. Sau đó phí hủy là ${booking.cancellation.feePercent}% giá trị đặt phòng.`
                    : `Đơn không hoàn hủy. Phí hủy là ${booking.cancellation.feePercent}% giá trị đặt phòng.`}
                </p>
                {booking.cancelReason && (
                  <p className="mt-2 text-xs text-slate-500">Lý do hủy: {booking.cancelReason}</p>
                )}
                {booking.refund && (
                  <p className="mt-2 text-xs font-semibold text-[#865D23]">
                    Hoàn tiền: {PAYMENT_STATUS[booking.refund.status]} · {formatMoney(booking.refund.amount)}
                  </p>
                )}
              </Card>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-4">
              <Card className="space-y-5 rounded-xl border border-slate-200/80 bg-white p-6 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-[#202B36]">Chi tiết thanh toán</h3>
                  <Badge className="border-none bg-[#EDF4EE] px-2.5 py-0.5 text-xs font-bold text-[#35624A]">
                    {PAYMENT_STATUS[booking.paymentStatus]}
                  </Badge>
                </div>

                <div className="space-y-2 border-b border-slate-100 pb-3 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Phương thức</span>
                    <span className="font-semibold text-[#202B36]">SePay · VietQR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mã đặt phòng</span>
                    <span className="font-semibold text-[#202B36]">{booking.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Thanh toán lúc</span>
                    <span className="font-semibold text-[#202B36]">
                      {booking.paidAt ? formatDateTime(booking.paidAt) : '—'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {booking.nightlyPrices.map((night) => (
                    <div key={night.date} className="flex justify-between text-slate-600">
                      <span>Đêm {formatDate(night.date)}</span>
                      <span>{formatMoney(night.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-xl bg-[#f1f3f9] p-4">
                  <div>
                    <span className="block text-[10px] font-bold uppercase text-slate-500">Tổng thanh toán</span>
                    <span className="text-xs font-semibold text-[#35624A]">Đã bao gồm thuế &amp; phí</span>
                  </div>
                  <span className="text-xl font-bold text-[#013758]">{formatMoney(booking.totalAmount)}</span>
                </div>

                <div className="space-y-2 border-t border-slate-100 pt-2">
                  {canPay && (
                    <Link href={`/booking/payment?id=${booking.id}`} className="block">
                      <Button className="h-10 w-full bg-[#013758] text-xs font-bold text-white hover:bg-[#193B56]">
                        Thanh toán ngay
                      </Button>
                    </Link>
                  )}
                  {canVoucher && (
                    <Link href={`/booking/confirmation?id=${booking.id}`} className="block">
                      <Button className="h-10 w-full bg-[#013758] text-xs font-bold text-white hover:bg-[#193B56]">
                        Mở voucher điện tử
                      </Button>
                    </Link>
                  )}
                  <Link href="/account/bookings" className="block">
                    <Button variant="outline" className="h-10 w-full border-slate-300 text-xs font-semibold">
                      Quản lý chuyến đi
                    </Button>
                  </Link>
                </div>
              </Card>

              <div className="rounded-xl border border-slate-200/80 bg-white p-4 text-xs text-slate-500">
                <p className="flex items-center gap-1.5 font-semibold text-[#202B36]">
                  <Mail className="size-3.5 text-[#013758]" /> Cần hỗ trợ?
                </p>
                <p className="mt-1">Email hỗ trợ: support@stayreco.vn</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
