'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { CalendarClock, FlaskConical, Loader2, MapPin, ShieldCheck, TimerOff, Users } from 'lucide-react';
import type { Booking } from '@stayreco/shared';
import { Button, buttonVariants } from '@/components/ui/button';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/StateViews';
import { cn } from '@/lib/utils';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { useBooking, useSimulatePayment } from '@/features/booking/api/booking-queries';
import { BookingInvoice } from '@/features/booking/components/BookingInvoice';
import { FALLBACK_HOTEL_IMAGE, freeCancelState } from '@/features/booking/lib/booking-status';
import { SupportCard } from '@/features/account/SupportCard';
import { HoldCountdown } from '@/features/booking/payment/HoldCountdown';
import { TransferPanel } from '@/features/booking/payment/TransferPanel';
import { WalletPayPanel } from '@/features/booking/payment/WalletPayPanel';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const PAID_STATUSES: Booking['status'][] = ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'];

/** Back to the same room and dates; the hotel page when the booking held several room types. */
function rebookHref(booking: Booking) {
  const stay = `checkIn=${booking.checkIn}&checkOut=${booking.checkOut}&guests=${booking.guests}&rooms=${booking.rooms}`;
  return booking.items.length === 1
    ? `/hotels/${booking.hotel.id}/rooms/${booking.items[0].roomType.id}?${stay}`
    : `/hotels/${booking.hotel.id}?${stay}`;
}

const primaryLink = cn(buttonVariants(), 'h-10 px-5 whitespace-nowrap');

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">{children}</div>;
}

/** The ticking clock lives here, in state set by an effect, so rendering stays pure. */
function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [active]);
  return now;
}

function StaySummary({ booking, now }: { booking: Booking; now: number }) {
  const cancel = freeCancelState(booking.cancellation, now);
  return (
    <section aria-labelledby="summary-title" className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="flex items-start gap-3 border-b border-border p-4">
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          <Image src={booking.hotel.coverImageUrl ?? FALLBACK_HOTEL_IMAGE} alt="" fill sizes="64px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <h2 id="summary-title" className="truncate text-base font-bold text-foreground">
            {booking.hotel.name}
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" aria-hidden /> {booking.hotel.city}
          </p>
          <p className="mt-1 text-sm font-semibold text-primary">
            {booking.items.map((item) => `${item.roomType.name} × ${item.rooms}`).join(', ')}
          </p>
        </div>
      </div>

      <div className="space-y-3 p-4 text-sm">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-3">
          <div>
            <span className="block text-xs text-muted-foreground">Nhận phòng</span>
            <span className="font-bold text-foreground">{formatDate(booking.checkIn)}</span>
          </div>
          <div>
            <span className="block text-xs text-muted-foreground">Trả phòng</span>
            <span className="font-bold text-foreground">{formatDate(booking.checkOut)}</span>
          </div>
          <p className="col-span-2 flex items-center gap-1.5 border-t border-border pt-2 text-muted-foreground">
            <Users className="size-4" aria-hidden /> {booking.nights} đêm · {booking.rooms} phòng · {booking.guests} khách ·{' '}
            {booking.guestName}
          </p>
        </div>

        <BookingInvoice booking={booking} />

        <p className={cn('flex items-start gap-2 rounded-lg p-3', cancel.open ? 'bg-emerald-50 text-emerald-900' : 'bg-muted text-foreground')}>
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{cancel.label}</span>
        </p>
      </div>
    </section>
  );
}

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('id') ?? undefined;
  const bookingQuery = useBooking(bookingId, { poll: true });
  const booking = bookingQuery.data;
  const simulatePayment = useSimulatePayment();
  const [devError, setDevError] = useState<string | null>(null);

  const waiting = booking?.status === 'PENDING';
  const now = useNow(waiting);
  const paid = !!booking && PAID_STATUSES.includes(booking.status);

  useEffect(() => {
    if (booking && paid) router.replace(`/booking/confirmation?id=${booking.id}`);
  }, [booking, paid, router]);

  if (!bookingId) {
    return (
      <Centered>
        <EmptyState
          title="Không tìm thấy đơn đặt phòng"
          description="Mở trang thanh toán từ đơn đặt phòng của bạn."
          action={
            <Link href="/account/bookings" className={primaryLink}>
              Chuyến đi của tôi
            </Link>
          }
        />
      </Centered>
    );
  }

  if (bookingQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-marketplace px-4 py-8 sm:px-6">
        <LoadingState rows={3} label="Đang tải đơn đặt phòng…" />
      </div>
    );
  }

  if (bookingQuery.error || !booking) {
    const notFound = ['BOOKING_NOT_FOUND', 'NOT_FOUND'].includes(getApiErrorCode(bookingQuery.error) ?? '');
    return (
      <Centered>
        {notFound ? (
          <EmptyState
            title="Không tìm thấy đơn đặt phòng"
            description="Đơn không tồn tại hoặc thuộc tài khoản khác."
            action={
              <Link href="/account/bookings" className={primaryLink}>
                Chuyến đi của tôi
              </Link>
            }
          />
        ) : (
          <ErrorState
            title="Không tải được đơn đặt phòng"
            error={bookingQuery.error}
            onRetry={() => void bookingQuery.refetch()}
          />
        )}
      </Centered>
    );
  }

  if (paid) {
    return (
      <Centered>
        <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground" role="status">
          <Loader2 className="size-5 animate-spin" aria-hidden /> Đã nhận thanh toán, đang mở voucher…
        </p>
      </Centered>
    );
  }

  const payment = booking.payment;
  const remaining = payment ? Date.parse(payment.expiresAt) - now : 0;
  const holdOver = booking.status !== 'PENDING' || !payment || remaining <= 0;

  if (holdOver) {
    const cancelled = booking.status === 'CANCELLED';
    const stillChecking = booking.status === 'PENDING';
    return (
      <Centered>
        <EmptyState
          icon={TimerOff}
          title={cancelled ? 'Đơn đặt phòng đã huỷ' : 'Đã hết thời gian giữ phòng'}
          description={
            stillChecking
              ? 'Nếu bạn vừa chuyển khoản, đợi vài giây để hệ thống kiểm tra. Tiền chuyển đến sau khi hết hạn sẽ được hoàn lại cho bạn.'
              : 'Phòng đã được mở bán lại. Bạn có thể đặt lại cùng ngày nếu còn phòng.'
          }
          action={
            <div className="flex flex-col items-center gap-2">
              <Link href={rebookHref(booking)} className={primaryLink}>
                Đặt lại {formatDate(booking.checkIn)} – {formatDate(booking.checkOut)}
              </Link>
              <Link href="/account/bookings" className="text-sm font-semibold text-primary hover:underline">
                Chuyến đi của tôi
              </Link>
            </div>
          }
        />
        {stillChecking && (
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground" role="status">
            <Loader2 className="size-3.5 animate-spin" aria-hidden /> Đang kiểm tra giao dịch cuối cùng…
          </p>
        )}
      </Centered>
    );
  }

  const total = payment.amount;

  return (
    <>
      <HoldCountdown remaining={remaining} expiresAtLabel={formatDateTime(payment.expiresAt)} />

      <div className="mx-auto w-full max-w-marketplace px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Thanh toán đơn {booking.code}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Chuyển {formatMoney(total)} để giữ chắc phòng
            </h1>
          </div>
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarClock className="size-4" aria-hidden /> Giá đã chốt, không tăng trong lúc giữ phòng
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-5 lg:col-span-7">
            <TransferPanel
              payment={payment}
              bookingCode={booking.code}
              checking={bookingQuery.isFetching}
              onCheckNow={() => void bookingQuery.refetch()}
            />

            {booking.paymentStatus === 'UNPAID' && <WalletPayPanel bookingId={booking.id} total={total} />}

            {process.env.NODE_ENV !== 'production' && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  Chế độ dev · mô phỏng SePay (không cần chuyển khoản thật)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    simulatePayment.mutate(booking.id, {
                      onError: (error) => setDevError(getApiErrorMessage(error, 'Chưa bật PAYMENT_SIMULATOR ở backend.')),
                    })
                  }
                  disabled={simulatePayment.isPending}
                  className="h-10 gap-1.5"
                >
                  {simulatePayment.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <FlaskConical className="size-4" aria-hidden />
                  )}
                  Giả lập thanh toán
                </Button>
                {devError && <p className="mt-2 text-xs text-red-700">{devError}</p>}
              </div>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-36 lg:col-span-5">
            <StaySummary booking={booking} now={now} />
            <SupportCard note="Chuyển khoản rồi mà trang chưa cập nhật sau vài phút? Gọi hoặc gửi email kèm mã đơn." />
            <Link href={rebookHref(booking)} className="inline-flex min-h-10 items-center text-sm font-semibold text-muted-foreground hover:text-primary">
              ‹ Quay lại chọn phòng
            </Link>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-marketplace px-4 py-8 sm:px-6">
          <LoadingState rows={3} />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
