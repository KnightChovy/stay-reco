'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  FlaskConical,
  CreditCard,
  Loader2,
  Lock,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Timer,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getApiErrorMessage } from '@/lib/api-error';
import { useBooking, useSimulatePayment } from '@/features/booking/api/booking-queries';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang lưu trú',
  COMPLETED: 'Đã hoàn tất',
  CANCELLED: 'Đã hủy',
  EXPIRED: 'Hết hạn giữ chỗ',
  NO_SHOW: 'Không đến nhận phòng',
};

function formatCountdown(milliseconds: number) {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') ?? undefined;
  const bookingQuery = useBooking(bookingId, { poll: true });
  const booking = bookingQuery.data;
  const simulatePayment = useSimulatePayment();

  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState<string | null>(null);
  const [devError, setDevError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const confirmed =
    booking && ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'].includes(booking.status);

  useEffect(() => {
    if (booking && confirmed) {
      router.replace(`/booking/confirmation?id=${booking.id}`);
    }
  }, [booking, confirmed, router]);

  const copy = (value: string, key: string) => {
    void navigator.clipboard.writeText(value);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1_800);
  };

  if (!bookingId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">Không tìm thấy đơn đặt phòng</h1>
        <p className="mt-1 text-sm text-slate-500">Mở trang thanh toán từ đơn đặt phòng của bạn.</p>
        <Link href="/account/bookings">
          <Button className="mt-5 bg-[#013758] text-white">Chuyến đi của tôi</Button>
        </Link>
      </div>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
        <Loader2 className="size-5 animate-spin" /> Đang tải đơn đặt phòng…
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

  const expired = booking.status === 'EXPIRED' || booking.status === 'CANCELLED';
  const payment = booking.payment;
  const remaining = payment ? new Date(payment.expiresAt).getTime() - now : 0;
  const image = booking.hotel.coverImageUrl ?? FALLBACK_IMAGE;

  if (expired) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <h1 className="mt-3 text-xl font-bold text-[#202B36]">
          {booking.status === 'EXPIRED' ? 'Đã hết thời gian giữ chỗ' : 'Đơn đặt phòng đã hủy'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Phòng đã được nhả về kho. Vui lòng đặt lại nếu bạn vẫn muốn lưu trú.
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Link href={`/hotels/${booking.hotel.id}?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&guests=${booking.guests}&rooms=${booking.rooms}`}>
            <Button className="bg-[#013758] text-white">Đặt lại</Button>
          </Link>
          <Link href="/account/bookings">
            <Button variant="outline">Chuyến đi của tôi</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-col justify-between gap-2 rounded-xl border border-[#f3e3c8] bg-[#FBF2E3] px-4 py-2.5 text-[#865D23] sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <Timer className="size-4 shrink-0 animate-pulse" />
          <p>
            Đơn đang giữ chỗ trong{' '}
            <span className="rounded bg-white/60 px-1.5 py-0.5 font-mono font-bold">
              {formatCountdown(remaining)}
            </span>
            . Vui lòng chuyển khoản trước khi hết hạn.
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs font-semibold">
          <Lock className="size-3.5" />
          <span>Cam kết không tăng giá</span>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Card className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row sm:items-center">
            <div>
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Mã đơn đặt phòng
              </span>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-[#202B36]">{booking.code}</span>
                <button
                  type="button"
                  onClick={() => copy(booking.code, 'code')}
                  className="rounded p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#013758]"
                  title="Sao chép mã đơn"
                >
                  {copied === 'code' ? <CheckCircle2 className="size-4 text-[#35624A]" /> : <Copy className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-1 sm:items-end">
              <Badge className="w-fit border-none bg-[#FBF2E3] text-xs font-semibold text-[#865D23]">
                <span className="mr-1.5 inline-block size-2 animate-ping rounded-full bg-[#865D23]" />
                {STATUS_LABELS[booking.status] ?? booking.status}
              </Badge>
              <span className="text-[11px] text-slate-400">Khởi tạo {formatDateTime(booking.createdAt)}</span>
            </div>
          </Card>

          <Card className="space-y-6 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-7">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold text-[#202B36]">
                <CreditCard className="size-5 text-[#013758]" /> Thanh toán bằng chuyển khoản VietQR
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Quét mã bằng ứng dụng ngân hàng, giữ nguyên số tiền và nội dung chuyển khoản. Hệ thống tự xác nhận
                trong vài giây.
              </p>
            </div>

            {payment ? (
              <>
                <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-[#234e70]/20 bg-[#f1f3f9] p-5 sm:flex-row">
                  <div className="shrink-0 rounded-xl border border-slate-200 bg-white p-2">
                    <Image
                      src={payment.qrImageUrl}
                      alt={`VietQR ${booking.code}`}
                      width={190}
                      height={190}
                      unoptimized
                      className="size-44 object-contain"
                    />
                  </div>
                  <div className="w-full space-y-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-slate-500">Ngân hàng</span>
                      <span className="text-right font-semibold text-[#202B36]">{payment.bankName}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-slate-500">Số tài khoản</span>
                      <button
                        type="button"
                        onClick={() => copy(payment.accountNumber, 'account')}
                        className="inline-flex items-center gap-1 font-mono font-bold text-[#013758] hover:underline"
                      >
                        {payment.accountNumber}
                        {copied === 'account' ? <CheckCircle2 className="size-3.5 text-[#35624A]" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-slate-500">Chủ tài khoản</span>
                      <span className="text-right font-semibold uppercase text-[#202B36]">{payment.accountName}</span>
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-xs text-slate-500">Số tiền</span>
                      <button
                        type="button"
                        onClick={() => copy(String(payment.amount), 'amount')}
                        className="inline-flex items-center gap-1 font-bold text-[#013758] hover:underline"
                      >
                        {formatMoney(payment.amount)}
                        {copied === 'amount' ? <CheckCircle2 className="size-3.5 text-[#35624A]" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-start justify-between gap-3 rounded-lg bg-amber-50 p-2">
                      <span className="text-xs font-semibold text-amber-800">Nội dung CK</span>
                      <button
                        type="button"
                        onClick={() => copy(payment.transferContent, 'content')}
                        className="inline-flex items-center gap-1 font-mono font-bold text-[#934a33] hover:underline"
                      >
                        {payment.transferContent}
                        {copied === 'content' ? <CheckCircle2 className="size-3.5 text-[#35624A]" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-[#EDF4EE] p-3 text-xs text-[#35624A]">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Chuyển đúng <strong>{formatMoney(payment.amount)}</strong> với nội dung{' '}
                    <strong>{payment.transferContent}</strong>. Sai số tiền hoặc nội dung sẽ không được xác nhận tự
                    động.
                  </p>
                </div>

                {remaining <= 0 && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    <RefreshCw className="size-4 animate-spin" /> Đang kiểm tra trạng thái thanh toán…
                  </div>
                )}

                {process.env.NODE_ENV !== 'production' && booking.status === 'PENDING' && (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3">
                    <p className="mb-2 text-[11px] font-semibold text-slate-500">
                      Chế độ dev · mô phỏng SePay (không cần chuyển khoản thật)
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        simulatePayment.mutate(booking.id, {
                          onError: (error) =>
                            setDevError(getApiErrorMessage(error, 'Chưa bật PAYMENT_SIMULATOR ở backend.')),
                        })
                      }
                      disabled={simulatePayment.isPending}
                      className="h-9 gap-1.5 border-slate-300 text-xs font-semibold"
                    >
                      {simulatePayment.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <FlaskConical className="size-3.5" />
                      )}
                      Giả lập thanh toán
                    </Button>
                    {devError && <p className="mt-2 text-[11px] text-red-600">{devError}</p>}
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Đơn này không còn chờ thanh toán. Trạng thái hiện tại: {STATUS_LABELS[booking.status] ?? booking.status}.
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" /> Tự động cập nhật mỗi 4 giây
              </span>
              <button
                type="button"
                onClick={() => void bookingQuery.refetch()}
                className="inline-flex items-center gap-1 font-semibold text-[#013758] hover:underline"
              >
                <RefreshCw className={`size-3.5 ${bookingQuery.isFetching ? 'animate-spin' : ''}`} /> Kiểm tra ngay
              </button>
            </div>
          </Card>

          <Link
            href={`/hotels/${booking.hotel.id}?checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&guests=${booking.guests}&rooms=${booking.rooms}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#013758]"
          >
            <ArrowLeft className="size-3.5" /> Quay lại chỗ nghỉ
          </Link>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-5">
          <Card className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-md">
            <div className="border-b border-slate-200/60 bg-[#f1f3f9] p-5">
              <h3 className="text-base font-bold tracking-tight text-[#202B36]">Chi tiết đơn đặt phòng</h3>
            </div>
            <div className="space-y-4 p-5">
              <div className="flex items-start gap-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  <Image src={image} alt={booking.hotel.name} fill className="object-cover" />
                </div>
                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-[#202B36]">{booking.hotel.name}</h4>
                  <p className="mt-0.5 text-xs text-slate-500">{booking.hotel.city}</p>
                  <p className="mt-1 text-xs font-semibold text-[#013758]">{booking.roomType.name}</p>
                </div>
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
                <div className="col-span-2 flex items-center gap-1.5 border-t border-slate-200/60 pt-2 text-slate-600">
                  <User className="size-3.5 text-[#013758]" />
                  <span>
                    {booking.guests} khách · {booking.rooms} phòng · {booking.nights} đêm
                  </span>
                </div>
                <div className="col-span-2 text-slate-600">
                  <span className="text-[10px] font-semibold uppercase text-slate-400">Khách nhận phòng</span>
                  <p className="font-semibold text-[#202B36]">{booking.guestName}</p>
                  <p>{booking.contactPhone}</p>
                </div>
              </div>

              <div className="space-y-1.5 border-t border-slate-200 pt-3 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    {booking.rooms} phòng × {booking.nights} đêm
                  </span>
                  <span>{formatMoney(booking.totalAmount)}</span>
                </div>
                <div className="my-2 h-px w-full bg-slate-200" />
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-[#202B36]">TỔNG THANH TOÁN</span>
                  <span className="text-2xl font-bold text-[#013758]">{formatMoney(booking.totalAmount)}</span>
                </div>
              </div>

              <div className="space-y-1 rounded-lg bg-[#EDF4EE] p-3 text-[11px] text-[#35624A]">
                <p className="flex items-center gap-1.5 font-semibold">
                  <Building2 className="size-3.5" /> Hệ thống tự xác nhận thanh toán
                </p>
                <p>Voucher điện tử sẽ xuất hiện ngay khi giao dịch khớp mã đơn và số tiền.</p>
              </div>

              {booking.status === 'PENDING' && remaining > 0 && (
                <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-500">
                  <QrCode className="size-3.5" /> Giữ chỗ còn lại {formatCountdown(remaining)}
                </p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin" /> Đang tải…
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
