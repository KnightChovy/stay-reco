'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Info,
  Loader2,
  MapPin,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AppBreadcrumb from '@/components/common/breadcrumb/AppBreadcrumb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useBooking, useCancelBooking, useCancellationQuote } from '@/features/booking/api/booking-queries';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

const REASONS = [
  { value: 'schedule_change', label: 'Thay đổi lịch trình' },
  { value: 'found_other', label: 'Tìm được chỗ nghỉ khác phù hợp hơn' },
  { value: 'health', label: 'Vấn đề sức khỏe' },
  { value: 'weather', label: 'Thời tiết không thuận lợi' },
  { value: 'other', label: 'Lý do khác' },
];

export default function CancelBookingPage() {
  const params = useParams<{ id: string }>();
  const bookingQuery = useBooking(params.id);
  const booking = bookingQuery.data;
  const quoteQuery = useCancellationQuote(params.id, !!booking);
  const quote = quoteQuery.data;
  const cancelBooking = useCancelBooking();

  const [reason, setReason] = useState('schedule_change');
  const [feedback, setFeedback] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canCancel = booking?.status === 'CONFIRMED' && booking.paymentStatus === 'PAID';
  const reasonText = `${REASONS.find((item) => item.value === reason)?.label ?? 'Hủy đặt phòng'}${
    feedback.trim() ? `: ${feedback.trim()}` : ''
  }`.slice(0, 500);

  const submit = () => {
    setError(null);
    if (!confirmed) {
      setError('Vui lòng xác nhận bạn đã đọc chính sách hủy.');
      return;
    }
    cancelBooking.mutate(
      { bookingId: params.id, input: { reason: reasonText } },
      {
        onSuccess: () => setDone(true),
        onError: (err) => {
          const code = getApiErrorCode(err);
          if (code === 'CANCELLATION_NOT_ALLOWED') {
            setError('Đơn đã qua thời điểm check-in nên không thể hủy.');
            return;
          }
          if (code === 'BOOKING_STATUS_CONFLICT') {
            setError('Trạng thái đơn đã thay đổi. Vui lòng tải lại trang.');
            void bookingQuery.refetch();
            return;
          }
          setError(getApiErrorMessage(err, 'Không thể hủy đặt phòng. Vui lòng thử lại.'));
        },
      },
    );
  };

  if (bookingQuery.isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f9ff]">
        <Header />
        <div className="flex flex-1 items-center justify-center gap-2 py-24 text-sm text-slate-500">
          <Loader2 className="size-5 animate-spin" /> Đang tải đơn đặt phòng…
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

  if (done) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f9ff]">
        <Header />
        <div className="mx-auto max-w-xl flex-1 px-4 py-20 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#EDF4EE] text-[#35624A]">
            <CheckCircle2 className="size-9" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#202B36]">Đã gửi yêu cầu hủy</h1>
          <p className="mt-2 text-sm text-slate-500">
            {quote?.needsApproval
              ? 'Yêu cầu hoàn tiền đang chờ khách sạn duyệt. Bạn sẽ nhận email khi có kết quả.'
              : 'Đơn đã được hủy và phòng được nhả về kho.'}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href={`/account/bookings/${booking.id}`}>
              <Button className="bg-[#013758] text-white">Xem chi tiết</Button>
            </Link>
            <Link href="/account/bookings">
              <Button variant="outline">Chuyến đi của tôi</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!canCancel) {
    return (
      <div className="flex min-h-screen flex-col bg-[#f7f9ff]">
        <Header />
        <div className="mx-auto max-w-lg flex-1 px-4 py-20 text-center">
          <XCircle className="mx-auto size-10 text-slate-400" />
          <h1 className="mt-3 text-xl font-bold text-[#202B36]">Không thể hủy đơn này</h1>
          <p className="mt-1 text-sm text-slate-500">
            Chỉ đơn đã xác nhận và thanh toán mới hủy được. Trạng thái hiện tại: {booking.status} /{' '}
            {booking.paymentStatus}.
          </p>
          <Link href={`/account/bookings/${booking.id}`}>
            <Button className="mt-5 bg-[#013758] text-white">Về chi tiết đơn</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const image = booking.hotel.coverImageUrl ?? FALLBACK_IMAGE;

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9ff] font-sans text-[#202B36] antialiased">
      <Header />

      <main className="w-full flex-1 bg-[#f7f9ff] py-6 sm:py-10">
        <div className="mx-auto max-w-marketplace px-4 sm:px-6">
          <AppBreadcrumb
            items={[
              { label: 'Tài khoản', href: '/account/profile' },
              { label: 'Chuyến đi của tôi', href: '/account/bookings' },
              { label: `Chi tiết #${booking.code}`, href: `/account/bookings/${booking.id}` },
              { label: 'Hủy đặt phòng', active: true },
            ]}
          />

          <div className="mt-6 mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                <Info className="size-3.5" /> Thao tác không thể hoàn tác
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#202B36] sm:text-3xl">
                Hủy đặt phòng &amp; Yêu cầu hoàn tiền
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Kiểm tra số tiền hoàn lại và gửi lý do hủy cho khách sạn.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-slate-200/80 bg-white p-3.5 md:self-auto">
              <Clock className="size-5 text-[#865D23]" />
              <div>
                <span className="block text-[11px] text-slate-400">Hạn hủy miễn phí</span>
                <span className="text-xs font-bold text-[#202B36]">
                  {quote?.freeUntil ? formatDateTime(quote.freeUntil) : 'Không có'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <Card className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:flex-row">
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:w-40">
                  <Image src={image} alt={booking.hotel.name} fill className="object-cover" />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <h2 className="text-lg font-bold text-[#202B36]">{booking.hotel.name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-slate-500">
                    <MapPin className="size-3.5 text-[#013758]" /> {booking.hotel.city}
                  </p>
                  <p className="mt-2 font-semibold text-[#013758]">
                    {booking.code} · {booking.roomType.name}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-slate-600">
                    <Calendar className="size-3.5" /> {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ·{' '}
                    {booking.nights} đêm · {booking.rooms} phòng
                  </p>
                  <p className="mt-1 text-slate-600">
                    Tổng đã thanh toán: <strong className="text-[#202B36]">{formatMoney(booking.totalAmount)}</strong>
                  </p>
                </div>
              </Card>

              <Card className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="text-base font-bold text-[#202B36]">Lý do hủy</h2>
                <div className="space-y-2">
                  {REASONS.map((item) => (
                    <label
                      key={item.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-xs transition-colors ${
                        reason === item.value
                          ? 'border-[#234e70] bg-[#f1f3f9]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancel-reason"
                        value={item.value}
                        checked={reason === item.value}
                        onChange={() => setReason(item.value)}
                        className="size-4 text-[#234e70]"
                      />
                      <span className="font-medium text-[#202B36]">{item.label}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-1">
                  <label htmlFor="feedback" className="text-xs font-semibold text-[#202B36]">
                    Ghi chú thêm (không bắt buộc)
                  </label>
                  <textarea
                    id="feedback"
                    rows={3}
                    value={feedback}
                    maxLength={400}
                    onChange={(event) => setFeedback(event.target.value)}
                    className="w-full resize-none rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#013758]"
                    placeholder="Cho khách sạn biết thêm lý do…"
                  />
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs sm:p-6">
                <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#202B36]">
                  <ShieldCheck className="size-4 text-[#35624A]" /> Chính sách hoàn tiền
                </h2>
                {quoteQuery.isLoading ? (
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="size-4 animate-spin" /> Đang tính số tiền hoàn…
                  </p>
                ) : quote ? (
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Đã thanh toán</span>
                      <span className="font-semibold text-[#202B36]">{formatMoney(quote.paid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phí hủy ({quote.feePercent}%)</span>
                      <span className="font-semibold text-[#934a33]">-{formatMoney(quote.fee)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                      <span className="font-bold text-[#202B36]">Số tiền hoàn lại</span>
                      <span className="font-bold text-[#35624A]">{formatMoney(quote.refund)}</span>
                    </div>
                    <p className="pt-1 text-[11px] text-slate-500">
                      {quote.needsApproval
                        ? 'Yêu cầu sẽ được gửi tới khách sạn để duyệt. Đơn giữ nguyên phòng đến khi có kết quả.'
                        : 'Không có khoản hoàn tiền: đơn sẽ được hủy ngay và nhả phòng.'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Không tải được chính sách hủy.</p>
                )}
              </Card>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-4">
              <Card className="space-y-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-md">
                <h3 className="text-sm font-bold text-[#202B36]">Xác nhận hủy</h3>
                <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-slate-600">
                  <Checkbox
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(!!checked)}
                    className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#013758]"
                  />
                  <span>
                    Tôi hiểu rằng sau khi gửi, yêu cầu hủy không thể thu hồi và đồng ý với chính sách hoàn tiền của
                    khách sạn.
                  </span>
                </label>

                {error && (
                  <Alert variant="destructive" className="bg-red-50 p-3">
                    <AlertTitle className="text-xs">Không thể hủy</AlertTitle>
                    <AlertDescription className="mt-1 text-xs">{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={submit}
                  disabled={!confirmed || cancelBooking.isPending}
                  className="h-11 w-full bg-[#934a33] text-sm font-bold text-white hover:bg-[#7a3b28]"
                >
                  {cancelBooking.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang gửi…
                    </>
                  ) : quote?.needsApproval ? (
                    'Gửi yêu cầu hủy & hoàn tiền'
                  ) : (
                    'Hủy đặt phòng ngay'
                  )}
                </Button>
                <Link href={`/account/bookings/${booking.id}`} className="block">
                  <Button variant="outline" className="h-10 w-full gap-1.5 border-slate-300 text-xs font-semibold">
                    <ArrowLeft className="size-3.5" /> Giữ đơn, quay lại
                  </Button>
                </Link>
              </Card>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
