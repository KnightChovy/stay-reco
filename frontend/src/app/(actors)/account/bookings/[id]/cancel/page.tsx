'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { Calendar, CheckCircle2, Clock, Info, Loader2, MapPin, ShieldCheck, Wallet, XCircle } from 'lucide-react';
import type { Booking, CancellationQuote } from '@stayreco/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState, ErrorState } from '@/components/common/StateViews';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useBooking, useCancelBooking, useCancellationQuote } from '@/features/booking/api/booking-queries';
import { CancelConfirmDialog, cancelCaseOf } from '@/features/booking/components/CancelConfirmDialog';
import { FALLBACK_HOTEL_IMAGE, bookingActions, bookingStatusText } from '@/features/booking/lib/booking-status';
import { SupportCard } from '@/features/account/SupportCard';
import {
  BookingBreadcrumb,
  BookingPageError,
  BookingPageLoading,
  linkButton,
} from '@/features/account/booking-detail/BookingPageParts';
import { formatDate, formatDateTime, formatMoney } from '@/features/stays/lib/format';

const REASONS = [
  { value: 'schedule_change', label: 'Thay đổi lịch trình' },
  { value: 'found_other', label: 'Tìm được chỗ nghỉ khác phù hợp hơn' },
  { value: 'health', label: 'Vấn đề sức khoẻ' },
  { value: 'weather', label: 'Thời tiết không thuận lợi' },
  { value: 'other', label: 'Lý do khác' },
];

const FEEDBACK_MAX = 400;

/** Why this booking cannot be cancelled here, and what to do instead; never the raw status codes. */
function notCancellableReason(booking: Booking): { text: string; action?: { label: string; href: string } } {
  if (booking.paymentStatus === 'REFUND_PENDING') {
    return { text: 'Bạn đã gửi yêu cầu huỷ đơn này. Khách sạn đang xem xét, kết quả sẽ báo qua email và thông báo.' };
  }
  switch (booking.status) {
    case 'PENDING':
      return {
        text: 'Đơn chưa được thanh toán nên không cần huỷ: nếu bạn không thanh toán, phòng sẽ tự được nhả khi hết thời gian giữ chỗ.',
        action: { label: 'Thanh toán đơn này', href: `/booking/payment?id=${booking.id}` },
      };
    case 'CHECKED_IN':
      return { text: 'Bạn đang lưu trú nên không thể huỷ trực tuyến. Vui lòng liên hệ lễ tân khách sạn.' };
    case 'COMPLETED':
    case 'NO_SHOW':
      return { text: 'Kỳ lưu trú của đơn này đã kết thúc nên không thể huỷ.' };
    case 'CANCELLED':
      return { text: 'Đơn này đã được huỷ trước đó.' };
    case 'EXPIRED':
      return { text: 'Đơn đã hết hạn giữ chỗ, không còn gì để huỷ.' };
    default:
      return { text: `Đơn đang ở trạng thái "${bookingStatusText(booking)}" nên không thể huỷ.` };
  }
}

/** Paid, fee and refund, the figures the backend fixed for a cancellation made now. */
function RefundFigures({ quote, compact = false }: { quote: CancellationQuote; compact?: boolean }) {
  return (
    <div className={cn('space-y-2 text-sm', compact && 'space-y-1.5')}>
      <div className="flex justify-between text-muted-foreground">
        <span>Đã thanh toán</span>
        <span className="font-semibold text-foreground">{formatMoney(quote.paid)}</span>
      </div>
      <div className="flex justify-between text-muted-foreground">
        {/* Before the deadline the fee is 0 whatever the percent: saying "100%" next to 0 ₫ only alarms. */}
        <span>{quote.fee > 0 ? `Phí huỷ (${quote.feePercent}%)` : 'Phí huỷ'}</span>
        <span className={cn('font-semibold', quote.fee > 0 ? 'text-red-700' : 'text-emerald-700')}>
          {quote.fee > 0 ? `−${formatMoney(quote.fee)}` : 'Miễn phí'}
        </span>
      </div>
      <div className="flex items-baseline justify-between border-t border-border pt-2">
        <span className="font-bold text-foreground">Bạn được hoàn</span>
        <span className="text-lg font-bold text-emerald-700">{formatMoney(quote.refund)}</span>
      </div>
    </div>
  );
}

export default function CancelBookingPage() {
  const params = useParams<{ id: string }>();
  const bookingQuery = useBooking(params.id);
  const booking = bookingQuery.data;
  const quoteQuery = useCancellationQuote(params.id, !!booking);
  const quote = quoteQuery.data;
  const cancelBooking = useCancelBooking();

  const [reason, setReason] = useState('schedule_change');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<CancellationQuote | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const reasonText = `${REASONS.find((item) => item.value === reason)?.label ?? 'Huỷ đặt phòng'}${
    feedback.trim() ? `: ${feedback.trim()}` : ''
  }`.slice(0, 500);

  /** The button only opens the recap of the case (free, with a fee, no refund); the dialog sends. */
  const review = () => {
    setError(null);
    if (!quote) {
      setError('Chưa tính được số tiền hoàn. Vui lòng tải lại trang.');
      return;
    }
    setReviewing(true);
  };

  const submit = () => {
    cancelBooking.mutate(
      { bookingId: params.id, input: { reason: reasonText } },
      {
        onSuccess: () => {
          setReviewing(false);
          setDone(quote ?? null);
        },
        onError: (err) => {
          setReviewing(false);
          const code = getApiErrorCode(err);
          if (code === 'CANCELLATION_NOT_ALLOWED') {
            setError('Đơn đã qua thời điểm nhận phòng nên không thể huỷ.');
            return;
          }
          if (code === 'BOOKING_STATUS_CONFLICT') {
            setError('Trạng thái đơn vừa thay đổi. Trang đã được tải lại, vui lòng kiểm tra.');
            void bookingQuery.refetch();
            return;
          }
          setError(getApiErrorMessage(err, 'Không thể huỷ đặt phòng. Vui lòng thử lại.'));
        },
      },
    );
  };

  if (bookingQuery.isLoading) return <BookingPageLoading label="Đang tải đơn đặt phòng…" />;
  if (bookingQuery.error || !booking) {
    return <BookingPageError error={bookingQuery.error} onRetry={() => void bookingQuery.refetch()} />;
  }

  const breadcrumb = (
    <BookingBreadcrumb
      items={[
        { label: 'Tài khoản', href: '/account/profile' },
        { label: 'Chuyến đi của tôi', href: '/account/bookings' },
        { label: `Chi tiết #${booking.code}`, href: `/account/bookings/${booking.id}` },
        { label: 'Huỷ đặt phòng', active: true },
      ]}
    />
  );

  if (done) {
    const refunded = done.refund > 0;
    return (
      <>
        {breadcrumb}
        <div className="mx-auto max-w-xl px-4 py-14 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="size-9" aria-hidden />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground">
            {done.needsApproval ? 'Đã gửi yêu cầu huỷ' : 'Đơn đã được huỷ'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {done.needsApproval
              ? `Khách sạn sẽ xem xét yêu cầu. Khi được duyệt, ${formatMoney(done.refund)} được hoàn về Ví StayReco của bạn; bạn sẽ nhận email và thông báo. Phòng vẫn được giữ trong lúc chờ.`
              : refunded
                ? `${formatMoney(done.refund)} đã được hoàn về Ví StayReco của bạn.`
                : 'Đơn đã được huỷ và phòng được trả lại cho khách sạn. Đơn này không có khoản hoàn tiền.'}
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link href={`/account/bookings/${booking.id}`} className={linkButton('default')}>
              Xem đơn
            </Link>
            {refunded && (
              <Link href="/account/wallet" className={linkButton('outline')}>
                <Wallet className="size-4" /> Xem ví
              </Link>
            )}
          </div>
        </div>
      </>
    );
  }

  if (!bookingActions(booking).canCancel) {
    const { text, action } = notCancellableReason(booking);
    return (
      <>
        {breadcrumb}
        <div className="mx-auto max-w-lg px-4 py-14">
          <EmptyState
            icon={XCircle}
            title="Không thể huỷ đơn này"
            description={text}
            action={
              <Link
                href={action?.href ?? `/account/bookings/${booking.id}`}
                className={linkButton('default')}
              >
                {action?.label ?? 'Về chi tiết đơn'}
              </Link>
            }
          />
        </div>
      </>
    );
  }

  const image = booking.hotel.coverImageUrl ?? FALLBACK_HOTEL_IMAGE;
  const kind = quote ? cancelCaseOf(quote) : null;
  const confirmLabel = quote?.needsApproval ? 'Gửi yêu cầu huỷ' : 'Huỷ đặt phòng ngay';
  const confirmButton = (className?: string) => (
    <Button
      variant="destructive"
      onClick={review}
      disabled={!quote || cancelBooking.isPending}
      className={cn('h-11 w-full bg-red-600 text-sm font-bold text-white hover:bg-red-700', className)}
    >
      {cancelBooking.isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Đang gửi…
        </>
      ) : (
        confirmLabel
      )}
    </Button>
  );

  return (
    <>
      {breadcrumb}
      <div className="mx-auto w-full max-w-marketplace px-4 pt-6 pb-32 sm:px-6 sm:pt-8 lg:pb-10">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
              <Info className="size-3.5" aria-hidden /> Thao tác không thể hoàn tác
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Huỷ đặt phòng</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Kiểm tra số tiền được hoàn, chọn lý do rồi gửi cho khách sạn.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-border bg-card p-3.5 md:self-auto">
            <Clock className="size-5 text-amber-700" aria-hidden />
            <div>
              <span className="block text-xs text-muted-foreground">Hạn huỷ miễn phí</span>
              <span className="text-sm font-bold text-foreground">
                {booking.cancellation.freeUntil ? formatDateTime(booking.cancellation.freeUntil) : 'Không có'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 lg:col-span-8">
            <Card className="rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-foreground">
                <ShieldCheck className="size-4 text-emerald-700" aria-hidden /> Số tiền được hoàn
              </h2>
              {quoteQuery.isLoading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" /> Đang tính số tiền hoàn…
                </p>
              ) : quote ? (
                <>
                  <RefundFigures quote={quote} />
                  <p
                    className={cn(
                      'mt-3 rounded-lg p-3 text-sm',
                      kind === 'NO_REFUND' ? 'bg-red-50 text-red-800' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {quote.needsApproval
                      ? 'Khách sạn duyệt yêu cầu trước khi tiền về Ví StayReco. Phòng vẫn được giữ trong lúc chờ; nếu khách sạn chưa duyệt trước giờ nhận phòng, hệ thống tự duyệt.'
                      : 'Đơn không có khoản hoàn tiền: đơn được huỷ ngay và phòng được trả lại cho khách sạn.'}
                    {booking.invoice.addOnsTotal > 0 &&
                      ` Phí huỷ chỉ tính trên tiền phòng; dịch vụ đặt kèm (${formatMoney(booking.invoice.addOnsTotal)}) được hoàn đủ.`}
                  </p>
                </>
              ) : (
                <ErrorState
                  title="Không tính được số tiền hoàn"
                  error={quoteQuery.error}
                  onRetry={() => void quoteQuery.refetch()}
                />
              )}
            </Card>

            <Card className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-xs sm:flex-row">
              <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-lg bg-muted sm:w-40">
                <Image src={image} alt={booking.hotel.name} fill sizes="(min-width: 640px) 160px, 100vw" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <h2 className="text-lg font-bold text-foreground">{booking.hotel.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                  <MapPin className="size-4 text-primary" aria-hidden /> {booking.hotel.city}
                </p>
                <p className="mt-2 font-semibold text-primary">
                  {booking.code} · {booking.items.map((item) => item.roomType.name).join(', ')}
                </p>
                <p className="mt-1 flex items-center gap-1 text-muted-foreground">
                  <Calendar className="size-4" aria-hidden /> {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)} ·{' '}
                  {booking.nights} đêm · {booking.rooms} phòng
                </p>
              </div>
            </Card>

            <Card className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6">
              <h2 className="text-base font-bold text-foreground">Lý do huỷ</h2>
              <div className="space-y-2" role="radiogroup" aria-label="Lý do huỷ">
                {REASONS.map((item) => (
                  <label
                    key={item.value}
                    className={cn(
                      'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                      reason === item.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                    )}
                  >
                    <input
                      type="radio"
                      name="cancel-reason"
                      value={item.value}
                      checked={reason === item.value}
                      onChange={() => setReason(item.value)}
                      className="size-4 accent-primary"
                    />
                    <span className="font-medium text-foreground">{item.label}</span>
                  </label>
                ))}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="feedback" className="text-sm font-semibold text-foreground">
                    Ghi chú thêm (không bắt buộc)
                  </label>
                  <span id="feedback-count" className="text-xs text-muted-foreground">
                    {feedback.length}/{FEEDBACK_MAX}
                  </span>
                </div>
                <textarea
                  id="feedback"
                  rows={3}
                  value={feedback}
                  maxLength={FEEDBACK_MAX}
                  aria-describedby="feedback-count"
                  onChange={(event) => setFeedback(event.target.value)}
                  className="w-full resize-none rounded-lg border border-input bg-background p-3 text-base focus:ring-2 focus:ring-ring focus:outline-none sm:text-sm"
                  placeholder="Cho khách sạn biết thêm lý do…"
                />
              </div>
            </Card>

            {error && (
              <Alert variant="destructive" className="bg-red-50 p-3 lg:hidden">
                <AlertTitle className="text-sm">Không thể huỷ</AlertTitle>
                <AlertDescription className="mt-1 text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:col-span-4 lg:block">
            <Card className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-md">
              <h2 className="text-sm font-bold text-foreground">Xác nhận huỷ</h2>
              {quote && <RefundFigures quote={quote} compact />}
              {error && (
                <Alert variant="destructive" className="bg-red-50 p-3">
                  <AlertTitle className="text-sm">Không thể huỷ</AlertTitle>
                  <AlertDescription className="mt-1 text-sm">{error}</AlertDescription>
                </Alert>
              )}
              {confirmButton()}
              <Link href={`/account/bookings/${booking.id}`} className={linkButton('ghost', 'w-full')}>
                Giữ đơn, quay lại
              </Link>
            </Card>
            <SupportCard />
          </aside>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 px-4 py-3 shadow-[0_-4px_16px_rgb(0_0_0/8%)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-marketplace items-center gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-xs text-muted-foreground">Bạn được hoàn</span>
            <span className="text-base font-bold text-emerald-700">{quote ? formatMoney(quote.refund) : '—'}</span>
          </div>
          <div className="w-44 shrink-0">{confirmButton()}</div>
        </div>
      </div>

      {quote && (
        <CancelConfirmDialog
          open={reviewing}
          onOpenChange={setReviewing}
          booking={booking}
          quote={quote}
          pending={cancelBooking.isPending}
          onConfirm={submit}
        />
      )}
    </>
  );
}
